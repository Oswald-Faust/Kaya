/**
 * Ranked experiment queue. Deterministic, explainable, and memory-aware:
 * experiments that previous evidence already disproved are suppressed, and
 * tactics that already won elsewhere get a confidence boost.
 *
 * similarityKey format: `<channel>:<tactic>:<target>`
 *   e.g. `meta_ads:broad_interest:developers`, `seo_content:comparison_page:cronitor`
 */

export interface RankableExperiment {
  id: string;
  channel: string;
  similarityKey: string;
  impact: number; // 1–5
  priorConfidence: number; // 0–1
  effort: number; // 1–5
  informationGain: number; // 1–5
  budget: number;
  timeToSignalDays: number;
}

export interface LearningSignal {
  id: string;
  statement: string;
  kind: "winner" | "loser" | "insight";
  similarityKey: string | null;
  confidence: number;
}

export interface RankContext {
  monthlyBudget: number;
  channelScores: Record<string, number | undefined>;
  learnings: LearningSignal[];
}

export interface RankFactor {
  label: string;
  value: string;
  effect: "positive" | "negative" | "neutral";
}

export interface RankedExperiment<T extends RankableExperiment> {
  experiment: T;
  score: number; // 0–100
  adjustedConfidence: number;
  suppressedBy: LearningSignal | null;
  boostedBy: LearningSignal[];
  factors: RankFactor[];
}

const SUPPRESSION_CONFIDENCE = 0.7;

export function keyParts(key: string): { channel: string; tactic: string; target: string } {
  const [channel = "", tactic = "", target = ""] = key.split(":");
  return { channel, tactic, target };
}

export function rankExperiments<T extends RankableExperiment>(
  experiments: T[],
  context: RankContext,
): RankedExperiment<T>[] {
  const ranked = experiments.map((experiment) => rankOne(experiment, context));
  return ranked.sort((a, b) => {
    if (Boolean(a.suppressedBy) !== Boolean(b.suppressedBy)) return a.suppressedBy ? 1 : -1;
    return b.score - a.score;
  });
}

function rankOne<T extends RankableExperiment>(experiment: T, context: RankContext): RankedExperiment<T> {
  const parts = keyParts(experiment.similarityKey);

  const suppressedBy =
    context.learnings.find((l) => {
      if (l.kind !== "loser" || !l.similarityKey || l.confidence < SUPPRESSION_CONFIDENCE) return false;
      const lp = keyParts(l.similarityKey);
      return lp.channel === parts.channel && lp.tactic === parts.tactic;
    }) ?? null;

  const boostedBy = context.learnings.filter((l) => {
    if (l.kind !== "winner" || !l.similarityKey) return false;
    const lp = keyParts(l.similarityKey);
    return lp.tactic === parts.tactic && l.similarityKey !== experiment.similarityKey;
  });

  const boost = boostedBy.reduce((sum, l) => sum + 0.15 * l.confidence, 0);
  const adjustedConfidence = Math.min(0.95, experiment.priorConfidence + boost);
  const channelFit = context.channelScores[experiment.channel] ?? 50;
  const costPenalty = 1 + experiment.budget / Math.max(context.monthlyBudget, 1);
  const speed = 1 / (1 + experiment.timeToSignalDays / 14);

  const raw =
    (experiment.impact * adjustedConfidence * experiment.informationGain * (0.5 + channelFit / 100) * speed) /
    (experiment.effort * costPenalty);
  // Realistic strong bets produce raw ≈ 2–4 (fast, cheap, well-evidenced); scale so they land at 50–100.
  const score = suppressedBy ? 0 : Math.min(100, Math.round((raw / 4) * 100));

  const factors: RankFactor[] = [
    { label: "Impact", value: `${experiment.impact}/5`, effect: experiment.impact >= 4 ? "positive" : "neutral" },
    {
      label: "Confidence",
      value: `${Math.round(adjustedConfidence * 100)}%`,
      effect: boostedBy.length ? "positive" : adjustedConfidence < 0.4 ? "negative" : "neutral",
    },
    {
      label: "Information gain",
      value: `${experiment.informationGain}/5`,
      effect: experiment.informationGain >= 4 ? "positive" : "neutral",
    },
    { label: "Channel fit", value: `${channelFit}`, effect: channelFit >= 70 ? "positive" : channelFit < 45 ? "negative" : "neutral" },
    { label: "Effort", value: `${experiment.effort}/5`, effect: experiment.effort >= 4 ? "negative" : "neutral" },
    {
      label: "Cost",
      value: experiment.budget > 0 ? `$${Math.round(experiment.budget)}` : "Organic",
      effect: experiment.budget > context.monthlyBudget * 0.3 ? "negative" : "neutral",
    },
    {
      label: "Time to signal",
      value: `${experiment.timeToSignalDays}d`,
      effect: experiment.timeToSignalDays <= 7 ? "positive" : experiment.timeToSignalDays > 21 ? "negative" : "neutral",
    },
  ];

  return { experiment, score, adjustedConfidence, suppressedBy, boostedBy, factors };
}
