import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { approvals, toolCalls } from "@/server/db/schema";
import { DomainError, isDomainError } from "@/server/domain/errors";
import { evaluatePolicy } from "@/server/domain/governance/policy";
import type { PolicyDecision } from "@/server/domain/types";
import { getGovernance } from "@/server/services/policy-store";
import { recordAudit } from "@/server/services/audit";
import { newId } from "@/lib/ids";
import type { ToolContext } from "./tool-types";
import { getTool } from "./tools";

export interface InvokeOptions {
  /** Why the agent (or user) wants this action. Shown on approvals and in the audit trail. */
  reason: string;
  dryRun?: boolean;
  stepId?: string | null;
  experimentId?: string | null;
  /** Present when executing an action a human already approved. */
  approved?: { approvalId: string; toolCallId: string; decidedBy: string };
}

export type InvokeResult =
  | { status: "succeeded"; toolCallId: string; output: Record<string, unknown>; isDemo: boolean; cached: boolean }
  | { status: "awaiting_approval"; toolCallId: string; approvalId: string; decision: PolicyDecision }
  | { status: "blocked"; toolCallId: string; decision: PolicyDecision }
  | { status: "failed"; toolCallId: string; error: string };

/**
 * The only path from an intention to an action. Order matters:
 * validate → idempotency → governance (policy, approvals) → execute → persist → audit.
 * Governance runs in code on every call, including approved ones, so an
 * approval can never push an action past a hard guardrail.
 */
export async function invokeTool(name: string, rawInput: unknown, ctx: ToolContext, opts: InvokeOptions): Promise<InvokeResult> {
  const tool = getTool(name);
  const parsed = tool.input.safeParse(rawInput);
  if (!parsed.success) {
    throw new DomainError("validation", `Invalid input for ${name}: ${parsed.error.issues.map((i) => i.message).join("; ")}`);
  }
  const input = parsed.data;
  const dryRun = Boolean(opts.dryRun && tool.supportsDryRun);
  const isWrite = tool.risk !== "R0";
  const identity = tool.idempotencyKey(input);
  const idempotencyKey = isWrite ? `${tool.name}:${identity}${dryRun ? `:dry:${ctx.runId}` : ""}` : `${ctx.runId}:${tool.name}:${identity}`;

  // Idempotency: a completed action with the same identity is never repeated.
  const existing = await db.query.toolCalls.findFirst({
    where: and(eq(toolCalls.workspaceId, ctx.workspaceId), eq(toolCalls.idempotencyKey, idempotencyKey)),
  });
  if (existing && existing.status === "succeeded") {
    return { status: "succeeded", toolCallId: existing.id, output: (existing.output ?? {}) as Record<string, unknown>, isDemo: existing.isDemo, cached: true };
  }
  if (existing && existing.status === "awaiting_approval" && !opts.approved) {
    const pending = await db.query.approvals.findFirst({ where: and(eq(approvals.toolCallId, existing.id), eq(approvals.status, "pending")) });
    if (pending) return { status: "awaiting_approval", toolCallId: existing.id, approvalId: pending.id, decision: pending.policyDecision };
  }

  const { mode, policy } = await getGovernance(ctx.workspaceId);
  const extra = tool.policy ? await tool.policy(input, ctx) : {};
  const decision = evaluatePolicy({ tool: tool.name, capability: tool.capability, risk: tool.risk, ...extra }, mode, policy, ctx.now);

  const toolCallId = opts.approved?.toolCallId ?? existing?.id ?? newId("tc");
  const base = {
    id: toolCallId,
    workspaceId: ctx.workspaceId,
    runId: ctx.runId,
    stepId: opts.stepId ?? null,
    tool: tool.name,
    capability: tool.capability,
    risk: tool.risk,
    input: input as Record<string, unknown>,
    dryRun,
    idempotencyKey,
  };

  const upsert = async (values: Partial<typeof toolCalls.$inferInsert> & { status: string }) => {
    await db
      .insert(toolCalls)
      .values({ ...base, ...values })
      .onConflictDoUpdate({ target: toolCalls.id, set: { ...values } });
  };

  if (decision.outcome === "block") {
    await upsert({ status: "blocked", output: { decision }, error: decision.reasons.join("; ") });
    await recordAudit(db, {
      workspaceId: ctx.workspaceId,
      actorType: ctx.actor.type,
      actorId: ctx.actor.id,
      action: "tool.blocked",
      targetType: "tool_call",
      targetId: toolCallId,
      toolCallId,
      approvalId: opts.approved?.approvalId,
      payload: { tool: tool.name, reasons: decision.reasons },
    });
    return { status: "blocked", toolCallId, decision };
  }

  if (decision.outcome === "require_approval" && !opts.approved && !dryRun) {
    const described = tool.describe(input);
    const approvalId = newId("apr");
    await upsert({ status: "awaiting_approval" });
    await db.insert(approvals).values({
      id: approvalId,
      workspaceId: ctx.workspaceId,
      runId: ctx.runId,
      toolCallId,
      experimentId: opts.experimentId ?? null,
      title: described.title,
      change: described.change ?? null,
      reason: opts.reason,
      risk: tool.risk,
      tool: tool.name,
      toolInput: input as Record<string, unknown>,
      policyDecision: decision,
      createdAt: ctx.now,
    });
    await recordAudit(db, {
      workspaceId: ctx.workspaceId,
      actorType: ctx.actor.type,
      actorId: ctx.actor.id,
      action: "approval.requested",
      targetType: "approval",
      targetId: approvalId,
      toolCallId,
      approvalId,
      payload: { tool: tool.name, reasons: decision.reasons },
    });
    return { status: "awaiting_approval", toolCallId, approvalId, decision };
  }

  const started = performance.now();
  try {
    const result = await tool.run(input, ctx, { dryRun, idempotencyKey });
    const durationMs = Math.round(performance.now() - started);
    await upsert({
      status: "succeeded",
      output: result.output,
      adapter: result.adapter ?? null,
      isDemo: result.isDemo ?? false,
      durationMs,
      error: null,
    });
    if (tool.external && !dryRun) {
      await recordAudit(db, {
        workspaceId: ctx.workspaceId,
        actorType: ctx.actor.type,
        actorId: ctx.actor.id,
        action: `external.${tool.capability.toLowerCase()}`,
        targetType: result.targetType ?? "tool_call",
        targetId: result.targetId ?? toolCallId,
        toolCallId,
        approvalId: opts.approved?.approvalId,
        isExternalMutation: true,
        payload: { tool: tool.name, adapter: result.adapter, demo: result.isDemo ?? false, input, output: result.output, approvedBy: opts.approved?.decidedBy },
      });
    }
    return { status: "succeeded", toolCallId, output: result.output, isDemo: result.isDemo ?? false, cached: false };
  } catch (error) {
    const message = isDomainError(error) ? error.message : "The action failed unexpectedly.";
    await upsert({ status: "failed", error: message, durationMs: Math.round(performance.now() - started) });
    await recordAudit(db, {
      workspaceId: ctx.workspaceId,
      actorType: ctx.actor.type,
      actorId: ctx.actor.id,
      action: "tool.failed",
      targetType: "tool_call",
      targetId: toolCallId,
      toolCallId,
      payload: { tool: tool.name, error: message },
    });
    if (!isDomainError(error)) console.error(JSON.stringify({ level: "error", msg: "tool_failed", tool: tool.name, error: String(error) }));
    return { status: "failed", toolCallId, error: message };
  }
}
