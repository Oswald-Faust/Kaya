import "server-only";
import { and, eq } from "drizzle-orm";
import { invokeTool } from "@/server/agent/executor";
import { ORCHESTRATOR_ID } from "@/server/agent/runtime";
import type { WorkspaceContext } from "@/server/context";
import { db } from "@/server/db/client";
import { agentRuns, approvals, creativeAssets, experiments } from "@/server/db/schema";
import { DomainError } from "@/server/domain/errors";
import { measurementContext } from "./measurement";
import { decideApproval } from "./approvals";
import { transitionExperiment } from "./experiments";

/**
 * Moves the experiment a run worked on to Approval or Running from the run
 * page. Both paths reuse the founder hand-off tool, so policy, the approval
 * record, URL verification and the audit trail are the same as in the agent's own flow.
 */
export async function advanceExperiment(
  ctx: WorkspaceContext & { productId: string },
  input: { runId: string; experimentId: string; target: "approval" | "running"; url?: string },
): Promise<{ status: string; message: string }> {
  if (ctx.role !== "owner" && ctx.role !== "admin") throw new DomainError("forbidden", "Only owners and admins can launch experiments.");
  const run = await db.query.agentRuns.findFirst({ where: and(eq(agentRuns.id, input.runId), eq(agentRuns.workspaceId, ctx.workspaceId)) });
  const exp = await db.query.experiments.findFirst({ where: and(eq(experiments.id, input.experimentId), eq(experiments.workspaceId, ctx.workspaceId)) });
  if (!run || !exp) throw new DomainError("not_found", "This run or experiment no longer exists.");
  if (!["proposed", "awaiting_approval"].includes(exp.status)) throw new DomainError("invalid_transition", "This experiment has already started.");

  let pending = await db.query.approvals.findFirst({ where: and(eq(approvals.experimentId, exp.id), eq(approvals.workspaceId, ctx.workspaceId), eq(approvals.status, "pending")) });

  if (!pending) {
    const m = await measurementContext(ctx.workspaceId, exp);
    const asset = await db.query.creativeAssets.findFirst({ where: and(eq(creativeAssets.experimentId, exp.id), eq(creativeAssets.workspaceId, ctx.workspaceId)) });
    const steps = m.plan.founderSteps.map((s, i) => `${i + 1}. ${s}`).join(" ");
    const result = await invokeTool(
      "experiments.founder_launch",
      { experimentId: exp.id, ...(asset ? { assetId: asset.id } : {}), ...(m.trackedLink ? { trackedLink: m.trackedLink } : {}) },
      { workspaceId: ctx.workspaceId, productId: ctx.productId, runId: run.id, actor: { type: "user", id: ctx.userId }, isDemo: ctx.isDemo, now: new Date() },
      { reason: m.trackedLink ? `${steps} Tracked link: ${m.trackedLink}` : steps, experimentId: exp.id },
    );
    if (result.status !== "awaiting_approval") throw new DomainError("validation", result.status === "failed" ? result.error : "Policy didn't allow this hand-off.");
    if (exp.status === "proposed") await transitionExperiment(db, ctx.workspaceId, exp, "awaiting_approval", { type: "user", id: ctx.userId });
    await db.update(agentRuns).set({ status: "awaiting_approval", updatedAt: new Date() }).where(eq(agentRuns.id, run.id));
    pending = await db.query.approvals.findFirst({ where: eq(approvals.id, result.approvalId) });
  }

  if (input.target === "approval") return { status: "awaiting_approval", message: "Moved to Approval. It's waiting in your approvals." };

  const decided = await decideApproval(ctx, pending!.id, "approved", input.url?.trim() || undefined);
  if (decided.status !== "succeeded") throw new DomainError("validation", "Couldn't start the experiment. See the run for details.");
  if (input.url) return { status: "running", message: "Verified and running. Measurement has started." };
  const { plan, readiness } = await measurementContext(ctx.workspaceId, (await db.query.experiments.findFirst({ where: eq(experiments.id, exp.id) }))!);
  const needsUrl = plan.proof.kind === "page_url" || plan.proof.kind === "post_url" || plan.proof.kind === "affiliate_link";
  if (needsUrl) return { status: "running", message: `Running. Add the ${plan.proof.label.toLowerCase()} on the experiment page so measurement can start.` };
  return { status: "running", message: readiness.measurable ? "Running. Measurement has started." : `Running. Connect a measurement source to judge it: ${plan.requires.why}` };
}
