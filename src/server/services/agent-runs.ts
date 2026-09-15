import "server-only";
import { and, asc, count, desc, eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { agentMessages, agentRuns, agentSteps, approvals, toolCalls } from "@/server/db/schema";

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
  return { run, steps, messages, toolCalls: calls, approvals: runApprovals };
}

export type RunDetail = NonNullable<Awaited<ReturnType<typeof getRun>>>;
