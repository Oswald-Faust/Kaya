import "server-only";
import { and, desc, eq } from "drizzle-orm";
import type { Db, Tx } from "@/server/db/client";
import { db } from "@/server/db/client";
import { experiments, learnings } from "@/server/db/schema";
import type { Evaluation } from "@/server/domain/experiments/evaluation";
import type { LearningSignal } from "@/server/domain/experiments/ranking";
import { experimentKey } from "@/lib/format";
import { stableId } from "@/lib/ids";

export type LearningRow = typeof learnings.$inferSelect;
type ExperimentRow = typeof experiments.$inferSelect;

/**
 * Learning Engine V1: converts a completed experiment into reusable evidence.
 * Statements are built from the hypothesis and the deterministic evaluation,
 * never from free-form model output, so a learning is always traceable.
 */
export function buildLearning(experiment: ExperimentRow, evaluation: Evaluation) {
  const outcome = evaluation.decision;
  const hypothesis = experiment.hypothesis.replace(/\.$/, "");
  const statement =
    outcome === "winner"
      ? `Confirmed: ${lowerFirst(hypothesis)}.`
      : outcome === "loser"
        ? `Disproved: ${lowerFirst(hypothesis)}.`
        : `Unresolved: ${lowerFirst(hypothesis)}.`;
  return {
    statement,
    kind: outcome === "winner" ? "winner" : outcome === "loser" ? "loser" : "insight",
    confidence: outcome === "inconclusive" ? Math.min(0.6, evaluation.confidence) : evaluation.confidence,
    impact: experiment.impact >= 4 ? "high" : experiment.impact === 3 ? "medium" : "low",
    metricLabel: evaluation.summary,
  } as const;
}

export async function recordLearning(conn: Db | Tx, experiment: ExperimentRow, evaluation: Evaluation, at: Date = new Date()): Promise<LearningRow> {
  const built = buildLearning(experiment, evaluation);
  const [row] = await conn
    .insert(learnings)
    .values({
      id: stableId("lrn", experiment.id),
      workspaceId: experiment.workspaceId,
      productId: experiment.productId,
      statement: built.statement,
      kind: built.kind,
      channel: experiment.channel,
      similarityKey: experiment.similarityKey,
      confidence: built.confidence,
      impact: built.impact,
      evidenceExperimentIds: [experiment.id],
      metricLabel: built.metricLabel,
      createdAt: at,
    })
    .onConflictDoUpdate({
      target: learnings.id,
      set: { statement: built.statement, kind: built.kind, confidence: built.confidence, metricLabel: built.metricLabel },
    })
    .returning();
  return row;
}

export interface LearningView extends LearningRow {
  evidence: { id: string; number: number; name: string }[];
}

export async function listLearnings(workspaceId: string, productId: string): Promise<LearningView[]> {
  const [rows, exps] = await Promise.all([
    db
      .select()
      .from(learnings)
      .where(and(eq(learnings.workspaceId, workspaceId), eq(learnings.productId, productId)))
      .orderBy(desc(learnings.createdAt)),
    db
      .select({ id: experiments.id, number: experiments.number, name: experiments.name })
      .from(experiments)
      .where(eq(experiments.workspaceId, workspaceId)),
  ]);
  const byId = new Map(exps.map((e) => [e.id, e]));
  return rows.map((r) => ({
    ...r,
    evidence: r.evidenceExperimentIds.map((id) => byId.get(id)).filter((e): e is NonNullable<typeof e> => Boolean(e)),
  }));
}

export function toSignals(rows: LearningView[]): LearningSignal[] {
  return rows
    .filter((r) => r.status === "active" && (r.kind === "winner" || r.kind === "loser" || r.kind === "insight"))
    .map((r) => ({
      id: r.id,
      statement: r.evidence[0] ? `${experimentKey(r.evidence[0].number)} · ${r.statement}` : r.statement,
      kind: r.kind as LearningSignal["kind"],
      similarityKey: r.similarityKey,
      confidence: r.confidence,
    }));
}

function lowerFirst(s: string): string {
  return /^[A-Z][a-z]/.test(s) ? s[0].toLowerCase() + s.slice(1) : s;
}
