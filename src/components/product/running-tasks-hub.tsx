import Link from "next/link";
import { Activity, ArrowUpRight, Clock, Sparkles, Bot } from "lucide-react";
import { EvaluationSignal } from "@/components/product/experiment-bits";
import { metricLabel } from "@/components/product/experiment-format";
import { RecordResultButton } from "@/components/product/run-result-button";
import { Badge, ChannelBadge, ConfidenceBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { formatUsd, relativeTime } from "@/lib/format";
import { fmt } from "@/i18n/format";
import type { Evaluation } from "@/server/domain/experiments/evaluation";
import type { ExperimentRow, VariantRow } from "@/server/services/experiments";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";

export interface RunningExperimentItem {
  experiment: ExperimentRow;
  key: string;
  evaluation: Evaluation;
  daysLeft: number;
  elapsed: number;
  totalExposures: number;
  targetExposures: number;
  sampleProgress: number;
  variants: VariantRow[];
}

export interface ActiveAgentRunItem {
  id: string;
  kind: string;
  goal: string;
  status: string;
  startedAt: Date | null;
  createdAt: Date;
}

export function RunningTasksHub({
  slug,
  running,
  activeRuns = [],
  isDemo = false,
  locale = "en",
  t,
}: {
  slug: string;
  running: RunningExperimentItem[];
  activeRuns?: ActiveAgentRunItem[];
  isDemo?: boolean;
  locale?: Locale;
  t: Dictionary;
}) {
  const c = t.app.command;
  const base = `/w/${slug}`;
  const totalActive = running.length + activeRuns.length;

  if (totalActive === 0) {
    return (
      <Panel id="now-running" className="border-line/80 bg-raised/40 p-4 transition-all scroll-mt-20">
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2.5 text-muted">
            <span className="size-2 rounded-full bg-line-strong" aria-hidden />
            <span className="font-medium text-ink">{c.noneRunning}</span>
            <span className="hidden sm:inline text-xs text-subtle">· {c.noneRunningHint}</span>
          </div>
          <ButtonLink href={`${base}/experiments`} size="sm" variant="ghost">
            {c.allExperiments}
          </ButtonLink>
        </div>
      </Panel>
    );
  }

  return (
    <div id="now-running" className="space-y-3 scroll-mt-20">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2.5">
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-agent opacity-75" />
            <span className="relative inline-flex size-2.5 rounded-full bg-agent" />
          </span>
          <h2 className="text-base font-semibold tracking-tight text-ink">
            {c.nowRunning}
          </h2>
          <span className="inline-flex items-center rounded-full border border-agent-line/70 bg-agent-soft px-2 py-0.5 text-2xs font-semibold tabular text-agent">
            {fmt(c.activeTasks, { count: totalActive })}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <ButtonLink href={`${base}/experiments`} size="sm" variant="ghost">
            {c.allExperiments}
          </ButtonLink>
        </div>
      </div>

      {/* List of active tasks */}
      <div className="space-y-3">
        {/* Active Agent Workflows */}
        {activeRuns.map((run) => (
          <Panel key={run.id} className="border-agent-line/60 bg-agent-soft/20 p-4 transition-all">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="grid size-8 shrink-0 place-items-center rounded-md bg-agent text-white shadow-xs">
                  <Bot className="size-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="agent">{c.agentRunLive}</Badge>
                    <span className="text-2xs font-mono text-muted uppercase tracking-wider">{run.kind}</span>
                  </div>
                  <h3 className="mt-1 font-medium text-ink truncate text-sm">
                    {run.goal}
                  </h3>
                  <p className="mt-0.5 text-2xs text-muted">
                    {run.startedAt ? relativeTime(run.startedAt, new Date(), locale) : relativeTime(run.createdAt, new Date(), locale)}
                  </p>
                </div>
              </div>
              <ButtonLink href={`${base}/agent/${run.id}`} size="sm" variant="secondary">
                {c.inspectRun} <ArrowUpRight className="size-3" />
              </ButtonLink>
            </div>
          </Panel>
        ))}

        {/* Active Running Experiments */}
        {running.map((r) => {
          const samplePct = Math.max(0, Math.min(1, r.sampleProgress));
          const isCac = r.experiment.primaryMetric === "cac";
          const progressLabel = isCac
            ? fmt(c.budgetSpent, { spent: formatUsd(r.experiment.spend, {}, locale), budget: formatUsd(r.experiment.budget, {}, locale) })
            : fmt(c.visitorsCollected, { collected: r.totalExposures.toLocaleString(locale), target: r.targetExposures.toLocaleString(locale) });

          return (
            <Panel
              key={r.experiment.id}
              className="border-line overflow-hidden transition-all hover:border-line-strong hover:shadow-xs"
            >
              <div className="p-4 sm:p-4.5 space-y-3.5">
                {/* Header row */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-agent-soft px-2 py-0.5 text-2xs font-medium text-agent">
                        <span className="size-1.5 rounded-full bg-agent animate-pulse-dot" aria-hidden />
                        {c.nowRunning}
                      </span>
                      <ChannelBadge channel={r.experiment.channel} />
                      <span className="font-mono text-xs tabular font-medium text-subtle">
                        {r.key}
                      </span>
                      {r.experiment.status === "evaluating" && (
                        <Badge tone="warning">{t.ui.status.evaluating}</Badge>
                      )}
                    </div>
                    <Link
                      href={`${base}/experiments/${r.experiment.number}`}
                      className="inline-block text-base font-semibold tracking-tight text-ink hover:text-agent hover:underline transition-colors"
                    >
                      {r.experiment.name}
                    </Link>
                  </div>

                  {/* Actions & Timing */}
                  <div className="flex flex-wrap items-center gap-2 ml-auto">
                    <div className="flex items-center gap-1 text-xs text-muted tabular mr-1">
                      <Clock className="size-3.5 text-subtle" />
                      <span>{fmt(c.daysLeftValue, { days: fmt(t.app.common.days, { count: r.daysLeft }) })}</span>
                      <span className="text-subtle">({fmt(c.daysElapsedValue, { days: fmt(t.app.common.days, { count: r.elapsed }) })})</span>
                    </div>
                    {isDemo ? (
                      <RecordResultButton slug={slug} experimentId={r.experiment.id} mode="simulate" label={c.simulate} />
                    ) : (
                      <RecordResultButton slug={slug} experimentId={r.experiment.id} mode="evaluate" label={c.evaluate} />
                    )}
                    <ButtonLink href={`${base}/experiments/${r.experiment.number}`} size="sm" variant="ghost">
                      {c.inspectRun}
                    </ButtonLink>
                  </div>
                </div>

                {/* Progress bar row */}
                <div className="space-y-1.5 rounded-md bg-sunken/40 p-2.5 border border-line/50">
                  <div className="flex items-center justify-between text-2xs">
                    <span className="flex items-center gap-1.5 font-medium text-muted">
                      <Activity className="size-3 text-agent" />
                      <span>{c.sampleProgress}</span>
                      <span className="tabular font-semibold text-agent">
                        {Math.round(samplePct * 100)}%
                      </span>
                    </span>
                    <span className="font-mono text-muted tabular text-2xs">
                      {progressLabel}
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-sunken">
                    <div
                      className="h-full rounded-full bg-agent transition-all duration-500 ease-out"
                      style={{ width: `${Math.max(4, Math.min(100, samplePct * 100))}%` }}
                    />
                  </div>
                </div>

                {/* Live Signal & Agent Evaluation summary */}
                <div className="grid gap-3 sm:grid-cols-[auto_minmax(0,1fr)] items-center rounded-md bg-raised p-3 border border-line/60">
                  <div className="flex flex-wrap items-center gap-2.5 border-b sm:border-b-0 sm:border-r border-line pb-2 sm:pb-0 sm:pr-3">
                    <div className="space-y-0.5">
                      <p className="text-2xs font-medium text-subtle uppercase tracking-wider">
                        {metricLabel(r.experiment.primaryMetric, t)}
                      </p>
                      <EvaluationSignal evaluation={r.evaluation} metric={r.experiment.primaryMetric} />
                    </div>
                    <ConfidenceBadge value={r.evaluation.confidence} />
                  </div>

                  <div className="flex items-start gap-2 text-xs text-muted min-w-0">
                    <Sparkles className="size-3.5 text-agent shrink-0 mt-0.5" />
                    <p className="line-clamp-2 text-ink/85">
                      {r.evaluation.summary}
                    </p>
                  </div>
                </div>
              </div>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}
