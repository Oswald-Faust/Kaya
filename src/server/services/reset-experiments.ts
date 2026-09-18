import "server-only";
import { and, asc, eq, inArray, ne, or, sql } from "drizzle-orm";
import type { WorkspaceContext } from "@/server/context";
import { db } from "@/server/db/client";
import * as t from "@/server/db/schema";
import { localizedError } from "@/i18n/errors";
import { newId } from "@/lib/ids";
import { recordAudit } from "./audit";
import { nextExperimentNumber } from "./experiments";

/** Archive attempts and restore the original proposals with fresh execution identities. */
export async function resetExperiments(ctx: WorkspaceContext, productId: string, confirmation: string) {
  if (ctx.isGuest || (ctx.role !== "owner" && ctx.role !== "admin")) throw localizedError("forbidden", "resetExperimentsRole");
  if (confirmation.trim() !== ctx.workspaceName) throw localizedError("validation", "resetExperimentsConfirm");

  return db.transaction(async (tx) => {
    // Run creation references this product; its FK lock waits until the reset commits.
    const [product] = await tx.select().from(t.products).where(and(eq(t.products.id, productId), eq(t.products.workspaceId, ctx.workspaceId))).for("update");
    if (!product) throw localizedError("not_found", "resetExperimentsEmpty");
    const activeRun = await tx.select({ id: t.agentRuns.id }).from(t.agentRuns).where(and(
      eq(t.agentRuns.workspaceId, ctx.workspaceId), eq(t.agentRuns.productId, productId),
      inArray(t.agentRuns.status, ["queued", "planning", "running"]),
    )).limit(1);
    if (activeRun.length) throw localizedError("conflict", "resetExperimentsBusy");

    const all = await tx.select().from(t.experiments).where(and(eq(t.experiments.workspaceId, ctx.workspaceId), eq(t.experiments.productId, productId))).orderBy(asc(t.experiments.number));
    if (!all.length) throw localizedError("validation", "resetExperimentsEmpty");
    const ids = all.map((e) => e.id);
    const [liveCampaign] = await tx.select().from(t.campaigns).where(and(
      eq(t.campaigns.workspaceId, ctx.workspaceId), inArray(t.campaigns.experimentId, ids),
      eq(t.campaigns.isDemo, false), inArray(t.campaigns.status, ["active", "scheduled"]),
    )).limit(1);
    if (liveCampaign) throw localizedError("conflict", "resetExperimentsLiveCampaign");

    // Persist the initial selection in the audit record so repeated resets never
    // mistake a previous reset's copies for additional initial experiments.
    const [previous] = await tx.select().from(t.auditLogs).where(and(
      eq(t.auditLogs.workspaceId, ctx.workspaceId), eq(t.auditLogs.targetId, productId), eq(t.auditLogs.action, "experiments.reset"),
    )).orderBy(asc(t.auditLogs.createdAt)).limit(1);
    const savedIds = previous?.payload.initialExperimentIds;
    const initialIds = Array.isArray(savedIds) ? new Set(savedIds) : null;
    const initial = initialIds
      ? all.filter((e) => initialIds.has(e.id))
      : all.filter((e) => e.strategyVersionId === all[0].strategyVersionId);
    if (!initial.length) throw localizedError("validation", "resetExperimentsEmpty");
    const now = new Date();
    const waitingRuns = await tx.select({ id: t.agentRuns.id }).from(t.agentRuns).where(and(
      eq(t.agentRuns.workspaceId, ctx.workspaceId), eq(t.agentRuns.productId, productId), eq(t.agentRuns.status, "awaiting_approval"),
    ));
    const runIds = waitingRuns.map((r) => r.id);
    await tx.update(t.approvals).set({ status: "expired", decidedBy: ctx.userId, decidedAt: now, decisionNote: "Experiments reset by the user." }).where(and(
      eq(t.approvals.workspaceId, ctx.workspaceId), eq(t.approvals.status, "pending"),
      or(inArray(t.approvals.experimentId, ids), runIds.length ? inArray(t.approvals.runId, runIds) : undefined),
    ));
    if (runIds.length) {
      await tx.update(t.toolCalls).set({ status: "rejected" }).where(and(eq(t.toolCalls.workspaceId, ctx.workspaceId), inArray(t.toolCalls.runId, runIds), eq(t.toolCalls.status, "awaiting_approval")));
      await tx.update(t.agentSteps).set({ status: "skipped" }).where(and(eq(t.agentSteps.workspaceId, ctx.workspaceId), inArray(t.agentSteps.runId, runIds), inArray(t.agentSteps.status, ["waiting", "pending"])));
      await tx.update(t.agentRuns).set({ status: "cancelled", finishedAt: now, updatedAt: now }).where(and(eq(t.agentRuns.workspaceId, ctx.workspaceId), inArray(t.agentRuns.id, runIds)));
    }
    await tx.update(t.experiments).set({ status: "archived", updatedAt: now }).where(and(eq(t.experiments.workspaceId, ctx.workspaceId), inArray(t.experiments.id, ids), ne(t.experiments.status, "archived")));
    await tx.update(t.campaigns).set({ status: "ended" }).where(and(eq(t.campaigns.workspaceId, ctx.workspaceId), inArray(t.campaigns.experimentId, ids), eq(t.campaigns.isDemo, true)));
    await tx.update(t.learnings).set({ status: "expired", expiresAt: now }).where(and(
      eq(t.learnings.workspaceId, ctx.workspaceId), eq(t.learnings.productId, productId), eq(t.learnings.status, "active"),
      sql`${t.learnings.evidenceExperimentIds} ?| array[${sql.join(ids.map((id) => sql`${id}`), sql`, `)}]::text[]`,
    ));

    let number = await nextExperimentNumber(tx, ctx.workspaceId);
    const restored = initial.map((e) => ({
      ...e, id: newId("exp"), number: number++, status: "proposed" as const,
      spend: 0, outcome: null, observedValue: null, lift: null, confidence: null,
      resultSummary: null, suppressedReason: null, startedAt: null, endedAt: null,
      createdAt: now, updatedAt: now,
    }));
    await tx.insert(t.experiments).values(restored);
    await recordAudit(tx, {
      workspaceId: ctx.workspaceId, actorType: "user", actorId: ctx.userId,
      action: "experiments.reset", targetType: "product", targetId: productId,
      payload: { initialExperimentIds: initial.map((e) => e.id), restoredExperimentIds: restored.map((e) => e.id), archivedExperimentIds: all.filter((e) => e.status !== "archived").map((e) => e.id) },
    });
    return { count: restored.length };
  });
}
