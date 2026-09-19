import "server-only";
import { and, asc, count, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/server/db/client";
import { agentMessages, agentRuns, agentSteps, approvals, toolCalls, creativeAssets, experiments } from "@/server/db/schema";

export async function listRuns(workspaceId: string, limit = 30) {
  const runs = await db
    .select()
    .from(agentRuns)
    .where(eq(agentRuns.workspaceId, workspaceId))
    .orderBy(desc(agentRuns.createdAt))
    .limit(limit);
  const stepCounts = await db
    .select({ runId: agentSteps.runId, n: count() })
    .from(agentSteps)
    .where(eq(agentSteps.workspaceId, workspaceId))
    .groupBy(agentSteps.runId);
  const byRun = new Map(stepCounts.map((s) => [s.runId, s.n]));
  return runs.map((r) => ({ ...r, stepCount: byRun.get(r.id) ?? 0 }));
}

export async function getRun(workspaceId: string, runId: string) {
  const run = await db.query.agentRuns.findFirst({ where: and(eq(agentRuns.id, runId), eq(agentRuns.workspaceId, workspaceId)) });
  if (!run) return null;
  const [steps, messages, calls, runApprovals] = await Promise.all([
    db.select().from(agentSteps).where(and(eq(agentSteps.runId, runId), eq(agentSteps.workspaceId, workspaceId))).orderBy(asc(agentSteps.seq)),
    db.select().from(agentMessages).where(and(eq(agentMessages.runId, runId), eq(agentMessages.workspaceId, workspaceId))).orderBy(asc(agentMessages.createdAt)),
    db.select().from(toolCalls).where(and(eq(toolCalls.runId, runId), eq(toolCalls.workspaceId, workspaceId))).orderBy(asc(toolCalls.createdAt)),
    db.select().from(approvals).where(and(eq(approvals.runId, runId), eq(approvals.workspaceId, workspaceId))).orderBy(desc(approvals.createdAt)),
  ]);
  // Resolve only artifacts referenced by successful calls in this run, including drafts reused from an
  // earlier run (their tool call belongs to that run, so the reference is kept on this run's step).
  const fromCalls = calls.flatMap((call) => {
    const assetId = call.output && typeof call.output === "object" && "assetId" in call.output ? call.output.assetId : null;
    return call.status === "succeeded" && !call.dryRun && typeof assetId === "string" ? [assetId] : [];
  });
  const fromSteps = steps.flatMap((step) => {
    const output = step.output as Record<string, unknown> | null;
    return output && typeof output.assetId === "string" && output.reusedToolCallId ? [output.assetId] : [];
  });
  const fromApprovals = runApprovals.flatMap((a) => (typeof a.toolInput?.assetId === "string" ? [a.toolInput.assetId] : []));
  const assetIds = [...new Set([...fromCalls, ...fromSteps, ...fromApprovals])];
  const assets = assetIds.length > 0
    ? await db.select().from(creativeAssets).where(and(eq(creativeAssets.workspaceId, workspaceId), inArray(creativeAssets.id, assetIds)))
    : [];
  // The experiment this run worked on, so the run page can move it to Approval or Running.
  const experimentId =
    runApprovals.find((a) => a.experimentId)?.experimentId ??
    calls.map((c) => (c.input as Record<string, unknown> | null)?.experimentId).find((id): id is string => typeof id === "string") ??
    assets.find((a) => a.experimentId)?.experimentId ??
    null;
  const experiment = experimentId
    ? ((await db.query.experiments.findFirst({ where: and(eq(experiments.id, experimentId), eq(experiments.workspaceId, workspaceId)) })) ?? null)
    : null;
  return { run, steps, messages, toolCalls: calls, approvals: runApprovals, assets, experiment };
}

export type RunDetail = NonNullable<Awaited<ReturnType<typeof getRun>>>;
