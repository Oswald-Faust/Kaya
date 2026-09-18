"use client";

import { cn } from "@/lib/cn";
import type { Evaluation } from "@/server/domain/experiments/evaluation";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n/format";
import { formatMetricValue } from "./experiment-format";

/** Visual verdict of a live evaluation: where the result sits relative to its success threshold. */
export function EvaluationSignal({ evaluation, metric }: { evaluation: Evaluation; metric: string }) {
  const { t, locale } = useI18n();
  const tone =
    evaluation.decision === "winner"
      ? "text-positive"
      : evaluation.decision === "loser"
        ? "text-negative"
        : evaluation.lift !== null && evaluation.lift > 0
          ? "text-ink"
          : "text-muted";
  const liftText = evaluation.lift === null ? "—" : `${evaluation.lift >= 0 ? "+" : "−"}${Math.abs(Math.round(evaluation.lift * 100))}%`;
  return (
    <span className={cn("inline-flex items-baseline gap-1.5 tabular", tone)}>
      <span className="text-sm font-semibold">{formatMetricValue(metric, evaluation.observedValue, locale)}</span>
      <span className="text-2xs">{metric === "cac" ? fmt(t.app.metrics.vsTarget, { lift: liftText }) : liftText}</span>
    </span>
  );
}

/** 0–100 score as a thin bar with the number, for ranked queues. */
export function ScoreBar({ score }: { score: number }) {
  const { t } = useI18n();
  return (
    <span className="inline-flex items-center gap-2" title={fmt(t.app.metrics.priority, { score })}>
      <span className="h-1 w-12 overflow-hidden rounded-full bg-sunken">
        <span className="block h-full rounded-full bg-ink" style={{ width: `${score}%` }} />
      </span>
      <span className="w-6 text-right text-xs font-medium text-ink tabular">{score}</span>
    </span>
  );
}

export function EffortDots({ effort }: { effort: number }) {
  const { t } = useI18n();
  return (
    <span className="inline-flex gap-0.5" title={fmt(t.app.metrics.effort, { effort })} aria-label={fmt(t.app.metrics.effortOf, { effort })}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={cn("size-1.5 rounded-full", i < effort ? "bg-muted" : "bg-line")} />
      ))}
    </span>
  );
}
