import { cn } from "@/lib/cn";
import { formatPct, formatUsd } from "@/lib/format";
import type { Evaluation } from "@/server/domain/experiments/evaluation";

const METRIC_LABEL: Record<string, string> = {
  signup_rate: "Signup rate",
  activation_rate: "Activation rate",
  trial_to_paid: "Trial → paid",
  ctr: "CTR",
  cac: "CAC",
};

export function metricLabel(metric: string): string {
  return METRIC_LABEL[metric] ?? metric;
}

export function formatMetricValue(metric: string, value: number | null): string {
  if (value === null) return "—";
  return metric === "cac" ? formatUsd(value) : formatPct(value);
}

export function thresholdLabel(metric: string, threshold: number): string {
  return metric === "cac" ? `< ${formatUsd(threshold)}` : `+${Math.round(threshold * 100)}% lift`;
}

/** Visual verdict of a live evaluation: where the result sits relative to its success threshold. */
export function EvaluationSignal({ evaluation, metric }: { evaluation: Evaluation; metric: string }) {
  const tone =
    evaluation.decision === "winner"
      ? "text-positive"
      : evaluation.decision === "loser"
        ? "text-negative"
        : evaluation.lift !== null && evaluation.lift > 0
          ? "text-ink"
          : "text-muted";
  const liftText =
    evaluation.lift === null ? "—" : `${evaluation.lift >= 0 ? "+" : "−"}${Math.abs(Math.round(evaluation.lift * 100))}%`;
  return (
    <span className={cn("inline-flex items-baseline gap-1.5 tabular", tone)}>
      <span className="text-sm font-semibold">{formatMetricValue(metric, evaluation.observedValue)}</span>
      <span className="text-2xs">{metric === "cac" ? `${liftText} vs target` : liftText}</span>
    </span>
  );
}

/** 0–100 score as a thin bar with the number, for ranked queues. */
export function ScoreBar({ score }: { score: number }) {
  return (
    <span className="inline-flex items-center gap-2" title={`Priority score ${score}/100`}>
      <span className="h-1 w-12 overflow-hidden rounded-full bg-sunken">
        <span className="block h-full rounded-full bg-ink" style={{ width: `${score}%` }} />
      </span>
      <span className="w-6 text-right text-xs font-medium text-ink tabular">{score}</span>
    </span>
  );
}

export function EffortDots({ effort }: { effort: number }) {
  return (
    <span className="inline-flex gap-0.5" title={`Effort ${effort}/5`} aria-label={`Effort ${effort} of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={cn("size-1.5 rounded-full", i < effort ? "bg-muted" : "bg-line")} />
      ))}
    </span>
  );
}
