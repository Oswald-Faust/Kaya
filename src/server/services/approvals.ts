import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { ORCHESTRATOR_ID } from "@/server/agent/runtime";
import { invokeTool } from "@/server/agent/executor";
import { RunRecorder } from "@/server/agent/recorder";
import type { WorkspaceContext } from "@/server/context";
import { db } from "@/server/db/client";
import { agentRuns, agentSteps, approvals, experiments, products, toolCalls } from "@/server/db/schema";
import { DomainError } from "@/server/domain/errors";
import { experimentKey } from "@/lib/format";
import { recordAudit } from "./audit";
import { transitionExperiment } from "./experiments";

export type ApprovalRow = typeof approvals.$inferSelect;

export async function listApprovals(workspaceId: string, status: ApprovalRow["status"] = "pending") {
  const rows = await db
    .select({ approval: approvals, experimentNumber: experiments.number, experimentName: experiments.name, runGoal: agentRuns.goal })
    .from(approvals)
    .leftJoin(experiments, eq(experiments.id, approvals.experimentId))
    .leftJoin(agentRuns, eq(agentRuns.id, approvals.runId))
    .where(and(eq(approvals.workspaceId, workspaceId), eq(approvals.status, status)))
    .orderBy(desc(approvals.createdAt));
  return rows.map((r) => ({
    ...r.approval,
    experimentKey: r.experimentNumber ? experimentKey(r.experimentNumber) : null,
    experimentName: r.experimentName,
    runGoal: r.runGoal,
  }));
}

export type ApprovalView = Awaited<ReturnType<typeof listApprovals>>[number];

/**
 * Records a human decision and, on approval, executes the exact action that
 * was requested. Policy is re-evaluated at execution time: an approval does not
 * bypass hard guardrails that changed since the request.
 */
export async function decideApproval(ctx: WorkspaceContext & { productId: string }, approvalId: string, decision: "approved" | "rejected", note?: string) {
  if (ctx.role === "viewer" || ctx.role === "member") {
    throw new DomainError("forbidden", "Only workspace owners and admins can approve actions.");
  }

  const claimed = await db.transaction(async (tx) => {
    // Serialize approval claims with experiment resets before any external action.
    await tx.select({ id: products.id }).from(products).where(and(eq(products.id, ctx.productId), eq(products.workspaceId, ctx.workspaceId))).for("update");
    const [row] = await tx.update(approvals)
      .set({ status: decision, decidedBy: ctx.userId, decidedAt: new Date(), decisionNote: note ?? null })
      .where(and(eq(approvals.id, approvalId), eq(approvals.workspaceId, ctx.workspaceId), eq(approvals.status, "pending")))
      .returning();
    if (row?.runId) await tx.update(agentRuns).set({ status: "running", updatedAt: new Date() }).where(and(eq(agentRuns.id, row.runId), eq(agentRuns.workspaceId, ctx.workspaceId)));
    return row;
  });
  if (!claimed) throw new DomainError("conflict", "This approval was already decided or no longer exists.");

  await recordAudit(db, {
    workspaceId: ctx.workspaceId,
    actorType: "user",
    actorId: ctx.userId,
    action: `approval.${decision}`,
    targetType: "approval",
    targetId: claimed.id,
    approvalId: claimed.id,
    toolCallId: claimed.toolCallId,
    payload: { tool: claimed.tool, note: note ?? null },
  });

  const rec = claimed.runId ? await RunRecorder.open(ctx.workspaceId, claimed.runId) : null;
  const waitingSteps = claimed.runId
    ? await db.select().from(agentSteps).where(and(eq(agentSteps.runId, claimed.runId), eq(agentSteps.status, "waiting")))
    : [];

  if (decision === "rejected") {
    if (claimed.toolCallId) {
      await db.update(toolCalls).set({ status: "rejected" }).where(and(eq(toolCalls.id, claimed.toolCallId), eq(toolCalls.workspaceId, ctx.workspaceId)));
    }
    if (claimed.experimentId) {
      const exp = await db.query.experiments.findFirst({ where: and(eq(experiments.id, claimed.experimentId), eq(experiments.workspaceId, ctx.workspaceId)) });
      if (exp?.status === "awaiting_approval") {
        await transitionExperiment(db, ctx.workspaceId, exp, "proposed", { type: "user", id: ctx.userId });
      }
    }
    if (rec) {
      for (const s of waitingSteps) await rec.finish(s.id, "skipped");
      await rec.step("observation", "Founder rejected the action", { status: "done", detail: note || undefined });
      await rec.message("agent", `Understood, I won't ${claimed.title.toLowerCase()}.${note ? ` Noted: “${note}”.` : ""} I'll keep this in mind for the next recommendation.`);
      await rec.setRun({ status: "completed", finishedAt: new Date(), result: { rejected: claimed.id } });
    }
    return { status: "rejected" as const };
  }

  if (!claimed.runId || !claimed.toolCallId) {
    throw new DomainError("validation", "This approval is not linked to an executable action.");
  }

  const result = await invokeTool(
    claimed.tool,
    claimed.toolInput,
    {
      workspaceId: ctx.workspaceId,
      productId: ctx.productId,
      runId: claimed.runId,
      actor: { type: "agent", id: ORCHESTRATOR_ID },
      isDemo: ctx.isDemo,
      now: new Date(),
    },
    { reason: claimed.reason, experimentId: claimed.experimentId, approved: { approvalId: claimed.id, toolCallId: claimed.toolCallId, decidedBy: ctx.userId } },
  );

  if (rec) {
    for (const s of waitingSteps) await rec.finish(s.id, result.status === "succeeded" ? "done" : "failed");
    if (result.status === "succeeded") {
      await rec.step("tool", `Executed after approval: ${claimed.title}`, {
        status: "done",
        detail: result.isDemo ? "Executed against a demo connection; no external system was changed." : undefined,
        output: { toolCallId: result.toolCallId },
      });
      await rec.message("agent", `Done: ${claimed.title}${claimed.change ? ` (${claimed.change})` : ""}. I'll watch the results and report back in the Growth Brief.`);
    } else {
      const why = result.status === "blocked" ? result.decision.reasons.join("; ") : result.status === "failed" ? result.error : "unexpected state";
      await rec.step("observation", "Could not execute the approved action", { status: "failed", detail: why });
      await rec.message("agent", `I could not complete “${claimed.title}”: ${why}.`);
    }
    await rec.setRun({ status: result.status === "succeeded" ? "completed" : "failed", finishedAt: new Date() });
  }
  return { status: result.status };
}
