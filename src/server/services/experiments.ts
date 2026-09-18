import "server-only";
import { and, asc, desc, eq, inArray, max, sql } from "drizzle-orm";
import { db, type Db, type Tx } from "@/server/db/client";
import {
  approvals,
  campaigns,
  channelAssessments,
  creativeAssets,
  experimentVariants,
  experiments,
  goals,
  learnings,
  strategies,
  strategyVersions,
} from "@/server/db/schema";
import { DomainError } from "@/server/domain/errors";
import { evaluateExperiment, type Evaluation } from "@/server/domain/experiments/evaluation";
import { assertTransition, QUEUE_STATUSES } from "@/server/domain/experiments/lifecycle";
import { rankExperiments, type RankedExperiment } from "@/server/domain/experiments/ranking";
import type { ExperimentStatus, PrimaryMetric } from "@/server/domain/types";
import { experimentKey } from "@/lib/format";
import { stableId } from "@/lib/ids";
import { recordAudit } from "./audit";
import { listLearnings, recordLearning, toSignals, type LearningRow } from "./learnings";

export type ExperimentRow = typeof experiments.$inferSelect;
export type VariantRow = typeof experimentVariants.$inferSelect;

export interface Actor {
  type: "user" | "agent" | "system";
  id: string;
}

export async function listExperiments(workspaceId: string, productId: string, statuses?: ExperimentStatus[]) {
  return db
    .select()
    .from(experiments)
    .where(
      and(
        eq(experiments.workspaceId, workspaceId),
        eq(experiments.productId, productId),
        statuses ? inArray(experiments.status, statuses) : undefined,
      ),
    )
    .orderBy(desc(experiments.number));
}

export async function getExperimentDetail(workspaceId: string, number: number) {
  const experiment = await db.query.experiments.findFirst({
    where: and(eq(experiments.workspaceId, workspaceId), eq(experiments.number, number)),
  });
  if (!experiment) return null;
  const [variants, assets, linkedCampaigns, learning, experimentApprovals] = await Promise.all([
    db.select().from(experimentVariants).where(eq(experimentVariants.experimentId, experiment.id)).orderBy(desc(experimentVariants.isControl)),
    db.select().from(creativeAssets).where(eq(creativeAssets.experimentId, experiment.id)),
    db.select().from(campaigns).where(eq(campaigns.experimentId, experiment.id)),
    findLearningForExperiment(workspaceId, experiment.id),
    db.select().from(approvals).where(and(eq(approvals.experimentId, experiment.id), eq(approvals.workspaceId, workspaceId))).orderBy(desc(approvals.createdAt)),
  ]);
  return { experiment, variants, assets, campaigns: linkedCampaigns, learning: learning ?? null, approvals: experimentApprovals };
}

async function findLearningForExperiment(workspaceId: string, experimentId: string): Promise<LearningRow | undefined> {
  const rows = await db
    .select()
    .from(learnings)
    .where(and(eq(learnings.workspaceId, workspaceId), sql`${learnings.evidenceExperimentIds} ? ${experimentId}`));
  return rows[0];
}

/** Channel scores from the current strategy version. */
export async function currentChannelScores(workspaceId: string, productId: string): Promise<Record<string, number>> {
  const strategy = await db.query.strategies.findFirst({
    where: and(eq(strategies.workspaceId, workspaceId), eq(strategies.productId, productId)),
  });
  if (!strategy) return {};
  const version = await db.query.strategyVersions.findFirst({
    where: and(eq(strategyVersions.strategyId, strategy.id), eq(strategyVersions.version, strategy.currentVersion)),
  });
  if (!version) return {};
  const rows = await db.select().from(channelAssessments).where(eq(channelAssessments.strategyVersionId, version.id));
  return Object.fromEntries(rows.map((r) => [r.channel, r.score]));
}

/** The full Channel Fit row for one channel, with its rationale and objections. */
export async function currentChannelFit(workspaceId: string, productId: string, channel: string) {
  const strategy = await db.query.strategies.findFirst({ where: and(eq(strategies.workspaceId, workspaceId), eq(strategies.productId, productId)) });
  if (!strategy) return null;
  const version = await db.query.strategyVersions.findFirst({
    where: and(eq(strategyVersions.strategyId, strategy.id), eq(strategyVersions.version, strategy.currentVersion)),
  });
  if (!version) return null;
  const row = await db.query.channelAssessments.findFirst({
    where: and(eq(channelAssessments.strategyVersionId, version.id), eq(channelAssessments.channel, channel)),
  });
  return row ? { score: row.score, rationale: row.rationale, reasonsAgainst: row.evidence ?? [] } : null;
}

export async function monthlyBudgetFor(workspaceId: string, productId: string): Promise<number> {
  const goal = await db.query.goals.findFirst({
    where: and(eq(goals.workspaceId, workspaceId), eq(goals.productId, productId), eq(goals.status, "active")),
    orderBy: desc(goals.createdAt),
  });
  return goal?.monthlyBudget ?? 0;
}

export async function rankQueue(workspaceId: string, productId: string): Promise<RankedExperiment<ExperimentRow>[]> {
  const [queue, learningRows, channelScores, monthlyBudget] = await Promise.all([
    listExperiments(workspaceId, productId, [...QUEUE_STATUSES]),
    listLearnings(workspaceId, productId),
    currentChannelScores(workspaceId, productId),
    monthlyBudgetFor(workspaceId, productId),
  ]);
  return rankExperiments(queue, { monthlyBudget, channelScores, learnings: toSignals(learningRows) });
}

/**
 * Keeps experiment status aligned with memory: anything disproved by an
 * active learning is suppressed (with the reason), and suppression is lifted
 * if the learning no longer applies.
 */
export async function syncSuppression(workspaceId: string, productId: string, actor: Actor): Promise<void> {
  const ranked = await rankQueue(workspaceId, productId);
  for (const r of ranked) {
    const exp = r.experiment;
    if (r.suppressedBy && exp.status === "proposed") {
      await db
        .update(experiments)
        .set({ status: "suppressed", suppressedReason: r.suppressedBy.statement, updatedAt: new Date() })
        .where(and(eq(experiments.id, exp.id), eq(experiments.workspaceId, workspaceId)));
      await recordAudit(db, {
        workspaceId,
        actorType: actor.type,
        actorId: actor.id,
        action: "experiment.suppressed",
        targetType: "experiment",
        targetId: exp.id,
        payload: { learningId: r.suppressedBy.id },
      });
    } else if (!r.suppressedBy && exp.status === "suppressed") {
      await db
        .update(experiments)
        .set({ status: "proposed", suppressedReason: null, updatedAt: new Date() })
        .where(and(eq(experiments.id, exp.id), eq(experiments.workspaceId, workspaceId)));
    }
  }
}

export async function transitionExperiment(
  conn: Db | Tx,
  workspaceId: string,
  experiment: ExperimentRow,
  to: ExperimentStatus,
  actor: Actor,
  patch: Partial<typeof experiments.$inferInsert> = {},
): Promise<void> {
  assertTransition(experiment.status, to);
  await conn
    .update(experiments)
    .set({ ...patch, status: to, updatedAt: new Date() })
    .where(and(eq(experiments.id, experiment.id), eq(experiments.workspaceId, workspaceId)));
  await recordAudit(conn, {
    workspaceId,
    actorType: actor.type,
    actorId: actor.id,
    action: `experiment.${to}`,
    targetType: "experiment",
    targetId: experiment.id,
    payload: { from: experiment.status, to },
  });
}

export async function nextExperimentNumber(conn: Db | Tx, workspaceId: string): Promise<number> {
  const [row] = await conn.select({ n: max(experiments.number) }).from(experiments).where(eq(experiments.workspaceId, workspaceId));
  return (row?.n ?? 0) + 1;
}

export async function getExperimentById(workspaceId: string, id: string): Promise<ExperimentRow> {
  const exp = await db.query.experiments.findFirst({ where: and(eq(experiments.id, id), eq(experiments.workspaceId, workspaceId)) });
  if (!exp) throw new DomainError("not_found", "Experiment not found in this workspace.");
  return exp;
}

function plannedEnd(exp: ExperimentRow): Date | null {
  if (!exp.startedAt) return null;
  return new Date(exp.startedAt.getTime() + exp.durationDays * 86_400_000);
}

export function evaluateRow(exp: ExperimentRow, variants: VariantRow[], now: Date = new Date()): Evaluation {
  const end = plannedEnd(exp);
  return evaluateExperiment({
    primaryMetric: exp.primaryMetric as PrimaryMetric,
    successThreshold: exp.successThreshold,
    budget: exp.budget,
    durationElapsed: end ? now >= end : false,
    variants: variants.map((v) => ({ name: v.name, isControl: v.isControl, exposures: v.exposures, conversions: v.conversions, spend: v.spend })),
  });
}

/**
 * Rate experiments need two arms before their measurements can be evaluated.
 * Experiments created by the strategy planner often start without explicit
 * variants because the actual task (for example, a comparison page) defines
 * the treatment later. Create the measurement slots once the experiment is
 * launched, while keeping all counters at zero until real traffic is recorded.
 */
export async function ensureRateExperimentVariants(conn: Db | Tx, experiment: ExperimentRow): Promise<VariantRow[]> {
  const variants = await conn
    .select()
    .from(experimentVariants)
    .where(and(eq(experimentVariants.workspaceId, experiment.workspaceId), eq(experimentVariants.experimentId, experiment.id)))
    .orderBy(desc(experimentVariants.isControl), asc(experimentVariants.name));

  if (experiment.primaryMetric === "cac") return variants;

  const control = variants.find((variant) => variant.isControl);
  const treatment = variants.find((variant) => !variant.isControl);
  const values = [];

  if (!control) {
    values.push({
      id: stableId("var", experiment.id, "control"),
      workspaceId: experiment.workspaceId,
      experimentId: experiment.id,
      name: experiment.type === "seo_page" || experiment.type === "landing_page" ? "Current page" : "Current experience",
      isControl: true,
      description: "The existing experience used as the baseline.",
      exposures: 0,
      conversions: 0,
      spend: 0,
    });
  }

  if (!treatment) {
    values.push({
      id: stableId("var", experiment.id, "treatment"),
      workspaceId: experiment.workspaceId,
      experimentId: experiment.id,
      name: experiment.name,
      isControl: false,
      description: "The experience prepared for this experiment.",
      exposures: 0,
      conversions: 0,
      spend: 0,
    });
  }

  if (values.length > 0) await conn.insert(experimentVariants).values(values).onConflictDoNothing();

  return conn
    .select()
    .from(experimentVariants)
    .where(and(eq(experimentVariants.workspaceId, experiment.workspaceId), eq(experimentVariants.experimentId, experiment.id)))
    .orderBy(desc(experimentVariants.isControl), asc(experimentVariants.name));
}

/**
 * Evaluates a running experiment and, when the evidence supports a decision,
 * completes it and writes the resulting learning back into memory.
 */
export async function evaluateAndComplete(
  workspaceId: string,
  experimentId: string,
  actor: Actor,
  opts: { force?: boolean; now?: Date } = {},
): Promise<{ evaluation: Evaluation; completed: boolean; learning: LearningRow | null }> {
  const exp = await getExperimentById(workspaceId, experimentId);
  if (exp.status !== "running" && exp.status !== "evaluating") {
    throw new DomainError("invalid_transition", `${experimentKey(exp.number)} is not running.`);
  }
  let evaluationExp = exp;
  const variants = await db.transaction(async (tx) => {
    const ensured = await ensureRateExperimentVariants(tx, exp);
    if (exp.status === "running") {
      await transitionExperiment(tx, workspaceId, exp, "evaluating", actor);
      evaluationExp = { ...exp, status: "evaluating" };
    }
    return ensured;
  });
  const evaluation = evaluateRow(evaluationExp, variants, opts.now);
  const decided = evaluation.decision !== "continue";
  if (!decided && !opts.force) return { evaluation, completed: false, learning: null };

  const finalEvaluation: Evaluation = decided ? evaluation : { ...evaluation, decision: "inconclusive", summary: `Stopped early. ${evaluation.summary}` };
  const outcome = finalEvaluation.decision as "winner" | "loser" | "inconclusive";
  const spend = variants.reduce((s, v) => s + v.spend, 0);

  const learning = await db.transaction(async (tx) => {
    await transitionExperiment(tx, workspaceId, evaluationExp, "completed", actor, {
      outcome,
      observedValue: finalEvaluation.observedValue,
      lift: finalEvaluation.lift,
      confidence: finalEvaluation.confidence,
      resultSummary: finalEvaluation.summary,
      spend,
      endedAt: opts.now ?? new Date(),
    });
    // Stop spend attached to a finished experiment unless it was scaled into an always-on campaign.
    if (outcome !== "winner") {
      await tx.update(campaigns).set({ status: "ended" }).where(and(eq(campaigns.experimentId, exp.id), eq(campaigns.workspaceId, workspaceId)));
    }
    const row = await recordLearning(tx, { ...exp, outcome }, finalEvaluation, opts.now);
    await recordAudit(tx, {
      workspaceId,
      actorType: actor.type,
      actorId: actor.id,
      action: "learning.created",
      targetType: "learning",
      targetId: row.id,
      payload: { experimentId: exp.id, outcome },
    });
    return row;
  });

  await syncSuppression(workspaceId, exp.productId, actor);
  return { evaluation: finalEvaluation, completed: true, learning };
}

/**
 * Demo workspaces only: fast-forwards a running experiment to the end of its
 * planned duration by extrapolating the observed per-variant rates. Real
 * workspaces never fabricate results; they complete from ingested data.
 */
export async function simulateToCompletion(workspaceId: string, experimentId: string, actor: Actor, isDemo: boolean) {
  if (!isDemo) throw new DomainError("forbidden", "Simulated results are only available in demo workspaces.");
  const exp = await getExperimentById(workspaceId, experimentId);
  const variants = await db.transaction((tx) => ensureRateExperimentVariants(tx, exp));
  const elapsedDays = exp.startedAt ? Math.max(1, (Date.now() - exp.startedAt.getTime()) / 86_400_000) : 1;
  const factor = Math.max(1, exp.durationDays / elapsedDays);

  await db.transaction(async (tx) => {
    for (const v of variants) {
      const exposures = Math.max(Math.round(v.exposures * factor), exp.primaryMetric === "cac" ? v.exposures : 800);
      const scale = v.exposures > 0 ? exposures / v.exposures : 1;
      await tx
        .update(experimentVariants)
        .set({
          exposures,
          conversions: Math.round(v.conversions * scale),
          spend: exp.budget > 0 ? Math.min(exp.budget, Math.round(v.spend * factor * 100) / 100) : v.spend,
        })
        .where(eq(experimentVariants.id, v.id));
    }
    await recordAudit(tx, {
      workspaceId,
      actorType: actor.type,
      actorId: actor.id,
      action: "experiment.simulated_completion",
      targetType: "experiment",
      targetId: exp.id,
      payload: { factor, demo: true },
    });
  });

  const end = exp.startedAt ? new Date(exp.startedAt.getTime() + exp.durationDays * 86_400_000 + 1000) : new Date();
  return evaluateAndComplete(workspaceId, experimentId, actor, { force: true, now: end });
}
