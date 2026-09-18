"use client";

import { cn } from "@/lib/cn";
import { useI18n } from "@/i18n/client";
import { fmt, plural } from "@/i18n/format";

export function ProgressBar({ value, expected, className }: { value: number; expected?: number; className?: string }) {
  const { t } = useI18n();
  return (
    <div className={cn("relative h-1.5 w-full overflow-hidden rounded-full bg-sunken", className)} role="progressbar" aria-valuenow={Math.round(value * 100)} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full bg-ink transition-[width] duration-500" style={{ width: `${Math.min(100, value * 100)}%` }} />
      {expected !== undefined && (
        <div
          className="absolute top-0 h-full w-px bg-muted"
          style={{ left: `${Math.min(100, expected * 100)}%` }}
          title={fmt(t.ui.goal.expectedByToday, { pct: Math.round(expected * 100) })}
        />
      )}
    </div>
  );
}

export function GoalProgress({
  title,
  current,
  target,
  progress,
  expectedProgress,
  onTrack,
  daysLeft,
}: {
  title: string;
  current: string;
  target: string;
  progress: number;
  expectedProgress: number;
  onTrack: boolean;
  daysLeft: number;
}) {
  const { t, locale } = useI18n();
  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-3">
        <span className="truncate text-sm font-medium text-ink">{title}</span>
        <span className={cn("shrink-0 text-xs font-medium", onTrack ? "text-positive" : "text-warning")}>
          {onTrack ? t.ui.goal.onTrack : t.ui.goal.behindPlan}
        </span>
      </div>
      <ProgressBar value={progress} expected={expectedProgress} className="mt-2" />
      <div className="mt-1.5 flex justify-between text-2xs text-muted tabular">
        <span>{fmt(t.ui.goal.of, { current, target })}</span>
        <span>{plural(locale, daysLeft, t.ui.goal.daysLeft)}</span>
      </div>
    </div>
  );
}
