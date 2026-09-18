import "server-only";
import { and, asc, count, desc, eq, inArray } from "drizzle-orm";
import { cache } from "react";
import { getLocale } from "@/i18n/server";
import type { WorkspaceContext } from "@/server/context";
import { db } from "@/server/db/client";
import { approvals, businessFacts, experiments, goals, learnings, products, strategies } from "@/server/db/schema";
import { goalProgress } from "@/server/domain/analytics/metrics";
import { localizedGoalTitle } from "@/server/domain/strategy/goals";
import { backfillFromLastSync } from "./live-metrics";
import { getBlendedRows, latestMetricDay, shiftDay } from "./metrics";

export const getPrimaryProduct = cache(async (workspaceId: string) => {
  return db.query.products.findFirst({ where: eq(products.workspaceId, workspaceId), orderBy: asc(products.createdAt) });
});

export const getActiveGoal = cache(async (workspaceId: string, productId: string) => {
  return db.query.goals.findFirst({
    where: and(eq(goals.workspaceId, workspaceId), eq(goals.productId, productId), eq(goals.status, "active")),
    orderBy: desc(goals.createdAt),
  });
});

export type LoopStage = "understand" | "decide" | "experiment" | "execute" | "measure" | "learn";

export interface ShellData {
  product: NonNullable<Awaited<ReturnType<typeof getPrimaryProduct>>> | null;
  goal: {
    title: string;
    /** The title in the viewer's language; `title` stays as stored (English prompts use it). */
    displayTitle: string;
    current: number;
    target: number;
    unit: string;
    deadline: string | null;
    progress: number;
    expectedProgress: number;
    onTrack: boolean;
    daysLeft: number;
    weeklyPace: number | null;
    requiredPerWeek: number | null;
  } | null;
  asOf: string | null;
  counts: {
    confirmedFacts: number;
    proposedFacts: number;
    strategyVersion: number | null;
    queued: number;
    running: number;
    pendingApprovals: number;
    learnings: number;
  };
  attention: LoopStage | null;
}

/** Everything the app chrome needs: goal, growth-loop counters and what needs attention. */
export const getShellData = cache(async (ctx: WorkspaceContext): Promise<ShellData> => {
  const product = await getPrimaryProduct(ctx.workspaceId);
  // A connection synced before metrics were recorded still has its payload: replay it once.
  if (product && !(await latestMetricDay(ctx.workspaceId, product.id))) await backfillFromLastSync(ctx.workspaceId).catch(() => 0);
  const empty: ShellData = {
    product: product ?? null,
    goal: null,
    asOf: null,
    counts: { confirmedFacts: 0, proposedFacts: 0, strategyVersion: null, queued: 0, running: 0, pendingApprovals: 0, learnings: 0 },
    attention: "understand",
  };
  if (!product) return empty;

  const W = ctx.workspaceId;
  const [goal, asOf, facts, strategy, expCounts, approvalCount, learningCount] = await Promise.all([
    getActiveGoal(W, product.id),
    latestMetricDay(W, product.id),
    db
      .select({ status: businessFacts.status, n: count() })
      .from(businessFacts)
      .where(and(eq(businessFacts.workspaceId, W), eq(businessFacts.productId, product.id)))
      .groupBy(businessFacts.status),
    db.query.strategies.findFirst({ where: and(eq(strategies.workspaceId, W), eq(strategies.productId, product.id)) }),
    db
      .select({ status: experiments.status, n: count() })
      .from(experiments)
      .where(and(eq(experiments.workspaceId, W), eq(experiments.productId, product.id), inArray(experiments.status, ["proposed", "awaiting_approval", "running", "evaluating"])))
      .groupBy(experiments.status),
    db.select({ n: count() }).from(approvals).where(and(eq(approvals.workspaceId, W), eq(approvals.status, "pending"))),
    db.select({ n: count() }).from(learnings).where(and(eq(learnings.workspaceId, W), eq(learnings.productId, product.id), eq(learnings.status, "active"))),
  ]);

  const byStatus = (s: string) => expCounts.find((e) => e.status === s)?.n ?? 0;
  const counts = {
    confirmedFacts: facts.find((f) => f.status === "confirmed")?.n ?? 0,
    proposedFacts: facts.find((f) => f.status === "proposed")?.n ?? 0,
    strategyVersion: strategy?.currentVersion ?? null,
    queued: byStatus("proposed") + byStatus("awaiting_approval"),
    running: byStatus("running") + byStatus("evaluating"),
    pendingApprovals: approvalCount[0]?.n ?? 0,
    learnings: learningCount[0]?.n ?? 0,
  };

  let goalView: ShellData["goal"] = null;
  if (goal && goal.baselineValue !== null && goal.targetValue !== null) {
    let current = goal.baselineValue;
    let weeklyPace: number | null = null;
    if (asOf && goal.metric === "mrr") {
      const recent = await getBlendedRows(W, product.id, shiftDay(asOf, -7), asOf);
      const last = recent.at(-1);
      if (last) current = last.mrr;
      if (recent.length >= 8) weeklyPace = recent[recent.length - 1].mrr - recent[0].mrr;
    }
    const today = asOf ?? new Date().toISOString().slice(0, 10);
    const p = goalProgress({
      baseline: goal.baselineValue,
      target: goal.targetValue,
      current,
      startDate: goal.createdAt.toISOString().slice(0, 10),
      deadline: goal.deadline ?? today,
      today,
      weeklyPace,
    });
    goalView = {
      title: goal.title,
      displayTitle: localizedGoalTitle(goal, await getLocale()),
      current,
      target: goal.targetValue,
      unit: goal.unit,
      deadline: goal.deadline,
      progress: p.progress,
      expectedProgress: p.expectedProgress,
      onTrack: p.onTrack,
      daysLeft: p.daysLeft,
      weeklyPace,
      requiredPerWeek: p.requiredPerWeek,
    };
  }

  const attention: LoopStage | null =
    counts.confirmedFacts === 0
      ? "understand"
      : counts.strategyVersion === null
        ? "decide"
        : counts.pendingApprovals > 0
          ? "execute"
          : counts.running === 0 && counts.queued > 0
            ? "experiment"
            : null;

  return { product, goal: goalView, asOf, counts, attention };
});
