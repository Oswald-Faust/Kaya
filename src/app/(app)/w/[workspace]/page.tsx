import Link from "next/link";
import { ArrowUpRight, PlugZap } from "lucide-react";
import { ApprovalCard } from "@/components/product/approval-card";
import { EffortDots, ScoreBar } from "@/components/product/experiment-bits";
import { RunningTasksHub } from "@/components/product/running-tasks-hub";
import { RunActionButton } from "@/components/product/run-action-button";
import { Badge, ChannelBadge, ConfidenceBadge, StatusBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { AreaChart, Sparkline } from "@/components/ui/chart";
import { Metric, MetricGroup } from "@/components/ui/metric";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { EmptyState, Notice } from "@/components/ui/states";
import { canWrite, requireWorkspace } from "@/server/context";
import { getCommandCenter } from "@/server/services/command-center";
import { cn } from "@/lib/cn";
import { experimentKey, formatDate, formatNumber, formatPct, formatUsd, relativeTime } from "@/lib/format";
import type { Metadata } from "next";
import { getI18n } from "@/i18n/server";
import { fmt } from "@/i18n/format";
import { translateServerText } from "@/i18n/server-text";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.app.command.metaTitle };
}

export default async function CommandCenterPage({ params }: PageProps<"/w/[workspace]">) {
  const { workspace } = await params;
  const ctx = await requireWorkspace(workspace);
  const [data, { t, locale }] = await Promise.all([getCommandCenter(ctx), getI18n()]);
  const c = t.app.command;
  const usd = (v: number | null | undefined, o: { compact?: boolean; cents?: boolean } = {}) => formatUsd(v, o, locale);
  const date = (v: string | Date, o?: Intl.DateTimeFormatOptions) => formatDate(v, o, locale);
  const slug = ctx.workspaceSlug;
  const base = `/w/${slug}`;
  const canRun = canWrite(ctx);

  if (!data) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-16">
        <EmptyState
          title={c.noProductTitle}
          description={c.noProductBody}
          action={<ButtonLink href="/start" variant="primary">{c.analyze}</ButtonLink>}
        />
      </div>
    );
  }

  const { strip, brief } = data;

  return (
    <div className="mx-auto max-w-[1400px] space-y-5 px-3 py-5 sm:px-5 lg:py-6">
      <div data-tour="cc-header" className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{c.title}</h1>
          <p className="mt-1 text-sm text-muted">
            {data.shell.product?.name} · {data.asOf ? fmt(c.dataThrough, { date: date(data.asOf, { month: "long", day: "numeric" }) }) : c.noData} · {c.window}
          </p>
        </div>
        <ButtonLink href={`${base}/agent`} size="sm" variant="secondary">
          {c.askAgent}
        </ButtonLink>
      </div>

      {data.asOf ? (
        <MetricGroup tour="cc-metrics">
          <Metric label={c.mrr} value={usd(strip.mrr.value)} delta={strip.mrr.delta} formula={strip.mrr.formula} footer={<Sparkline values={data.sparks.mrr} className="mt-1.5" />} />
          <Metric label={c.netNewMrr} value={usd(strip.netNewMrr.value)} delta={strip.netNewMrr.delta} formula={strip.netNewMrr.formula} hint={c.newMinusChurned} />
          <Metric label={c.signups} value={formatNumber(strip.signups.value, locale)} delta={strip.signups.delta} formula={strip.signups.formula} footer={<Sparkline values={data.sparks.signups} className="mt-1.5" />} />
          <Metric label={c.signupRate} value={formatPct(strip.signupRate.value)} delta={strip.signupRate.delta} formula={strip.signupRate.formula} />
          <Metric label={c.newCustomers} value={formatNumber(strip.newCustomers.value, locale)} delta={strip.newCustomers.delta} formula={strip.newCustomers.formula} />
          <Metric label={c.blendedCac} value={usd(strip.cac.value)} delta={strip.cac.delta} invert formula={strip.cac.formula} hint={fmt(c.spendHint, { amount: usd(strip.cac.spend) })} />
        </MetricGroup>
      ) : (
        <Notice tone="disconnected" title={c.noDataTitle} action={<ButtonLink href={`${base}/integrations`} size="sm">{c.connectData}</ButtonLink>}>
          {c.noDataBody}
        </Notice>
      )}

      {data.running.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-agent-line/70 bg-agent-soft/40 px-3.5 py-2 text-xs transition-colors hover:bg-agent-soft/60">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="relative flex size-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-agent opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-agent" />
            </span>
            <span className="font-mono text-2xs font-semibold uppercase tracking-wider text-agent">{c.liveTicker}</span>
            <span className="text-line-strong" aria-hidden>|</span>
            <span className="truncate font-medium text-ink">
              <span className="font-mono text-muted mr-1.5">{data.running[0].key}</span>
              {data.running[0].experiment.name}
            </span>
            <span className="hidden text-muted sm:inline" aria-hidden>·</span>
            <span className="hidden text-muted tabular md:inline">
              {fmt(t.app.common.days, { count: data.running[0].daysLeft })} {c.timeLeft.toLowerCase()} · {Math.round((data.running[0].sampleProgress ?? 0) * 100)}% {c.sampleProgress.toLowerCase()}
            </span>
          </div>
          <a href="#now-running" className="inline-flex shrink-0 items-center gap-1 font-medium text-agent hover:underline text-xs">
            {c.jumpToRunning} <ArrowUpRight className="size-3" />
          </a>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,380px)]">
        <div className="min-w-0 space-y-5">
          {brief && (
            <Panel tour="cc-brief" className="overflow-hidden">
              <div className="border-l-2 border-agent px-4 pt-3.5 pb-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="flex items-center gap-2 text-xs font-medium text-agent">
                    <span className="size-1.5 rounded-full bg-agent" aria-hidden />
                    {fmt(c.brief, { date: date(data.asOf!, { weekday: "long", month: "short", day: "numeric" }) })}
                  </p>
                  <Link href={`${base}/analytics`} className="inline-flex items-center gap-1 text-xs text-muted hover:text-ink">
                    {c.reviewAnalysis} <ArrowUpRight className="size-3" />
                  </Link>
                </div>
                <h2 className="mt-2 text-xl font-semibold tracking-tight">{brief.headline}</h2>
                <dl className="mt-3 grid gap-x-6 gap-y-3 text-sm md:grid-cols-2">
                  <BriefItem label={c.whatChanged}>{brief.whatChanged}</BriefItem>
                  <BriefItem label={c.whyItMatters}>{brief.whyItMatters}</BriefItem>
                  <BriefItem label={c.opportunity}>{brief.opportunity}</BriefItem>
                  <BriefItem label={c.risk}>{brief.risk}</BriefItem>
                </dl>
                <div className="mt-4 rounded-md bg-agent-soft px-3 py-2.5">
                  <p className="text-2xs font-medium text-agent">{c.recommendedNext}</p>
                  <p className="mt-0.5 text-sm text-ink">{brief.recommendation}</p>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {brief.approvalId && (
                    <a href="#approvals" className="inline-flex h-7 items-center rounded-md bg-ink px-2.5 text-xs font-medium text-white hover:bg-ink-hover">
                      {c.reviewApproval}
                    </a>
                  )}
                  <ButtonLink href={`${base}/agent`} size="sm" variant="secondary">
                    {c.askAgent}
                  </ButtonLink>
                  <span className="ml-auto flex flex-wrap gap-x-4 gap-y-1 text-2xs text-muted">
                    {brief.evidence.map((e) => (
                      <span key={e.label} className="tabular">
                        {e.label}: <span className="text-ink">{e.value}</span>
                      </span>
                    ))}
                  </span>
                </div>
              </div>
            </Panel>
          )}

          <RunningTasksHub slug={slug} running={data.running} activeRuns={data.activeRuns} isDemo={ctx.isDemo} locale={locale} t={t} />

          <Panel tour="cc-actions">
            <PanelHeader
              title={c.nextActions}
              description={canRun ? c.runHint : c.nextActionsHint}
              actions={<ButtonLink href={`${base}/experiments`} size="sm" variant="ghost">{c.allExperiments}</ButtonLink>}
            />
            {data.nextActions.length === 0 ? (
              <EmptyState title={c.nothingQueued} description={c.nothingQueuedHint} />
            ) : (
              <ol className="divide-y divide-line border-t border-line">
                {data.nextActions.map((r, i) => (
                  <li key={r.experiment.id} className={cn("grid grid-cols-[20px_minmax(0,1fr)] gap-3 px-4 py-4 sm:grid-cols-[20px_minmax(0,1fr)_auto]", i === 0 && "bg-agent-soft/40")}>
                    <span className="pt-1 text-sm text-subtle tabular">{i + 1}</span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {i === 0 && <Badge tone="agent">{c.topAction}</Badge>}
                        <Link href={`${base}/experiments/${r.experiment.number}`} className="truncate text-base font-medium text-ink hover:underline">
                          {r.experiment.name}
                        </Link>
                        {r.experiment.status === "awaiting_approval" && <StatusBadge status="awaiting_approval" />}
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-muted">{r.experiment.rationale}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
                        <ChannelBadge channel={r.experiment.channel} />
                        <span className="tabular">{experimentKey(r.experiment.number)}</span>
                        <span>{c.impact} <span className="text-ink">{r.experiment.impact}/5</span></span>
                        <ConfidenceBadge value={r.adjustedConfidence} />
                        <span className="inline-flex items-center gap-1">{c.effort} <EffortDots effort={r.experiment.effort} /></span>
                        <span>{c.cost} <span className="text-ink">{r.experiment.budget > 0 ? usd(r.experiment.budget) : t.app.common.organic}</span></span>
                        <span>{c.signalIn} <span className="text-ink">{fmt(t.app.common.days, { count: r.experiment.timeToSignalDays })}</span></span>
                      </div>
                      {r.boostedBy[0] && <p className="mt-1.5 text-xs text-positive">{fmt(c.backedBy, { statement: r.boostedBy[0].statement })}</p>}
                    </div>
                    <div className="col-start-2 flex items-center gap-3 sm:col-start-auto sm:flex-col sm:items-end sm:gap-2">
                      <ScoreBar score={r.score} />
                      {canRun && <RunActionButton slug={slug} experimentId={r.experiment.id} variant={i === 0 ? "primary" : "secondary"} />}
                    </div>
                  </li>
                ))}
              </ol>
            )}
            {data.suppressed.length > 0 && (
              <div className="border-t border-line bg-raised px-4 py-2.5 text-xs text-muted">
                <span className="font-medium text-ink">{c.notRecommended}</span>{" "}
                {data.suppressed.map((s) => (
                  <span key={s.experiment.id}>
                    <Link href={`${base}/experiments/${s.experiment.number}`} className="underline decoration-line-strong underline-offset-2 hover:text-ink">
                      {experimentKey(s.experiment.number)}
                    </Link>{" "}
                    {fmt(c.disprovedBy, { statement: s.suppressedBy!.statement.split(" · ")[0] })}{" "}
                  </span>
                ))}
              </div>
            )}
          </Panel>

          {data.mrrSeries.length > 0 && (
            <Panel className="px-4 py-4">
              <PanelHeader className="px-0 pt-0" title={c.mrrChart} description={c.mrrChartHint} />
              <AreaChart data={data.mrrSeries} markers={data.markers} height={180} />
            </Panel>
          )}
        </div>

        <aside className="min-w-0 space-y-5">
          <Panel tour="cc-decisions">
            <div id="approvals" className="scroll-mt-20">
              <PanelHeader title={c.decisions} count={data.approvals.length} description={c.decisionsHint} />
            </div>
            <div className="space-y-2.5 border-t border-line p-3">
              {data.approvals.length === 0 ? (
                <p className="px-1 py-3 text-sm text-muted">{c.nothingWaiting}</p>
              ) : (
                data.approvals.map((a) => (
                  <ApprovalCard
                    key={a.id}
                    slug={slug}
                    compact
                    approval={{
                      id: a.id,
                      tool: a.tool,
                      title: a.title,
                      change: a.change,
                      reason: a.reason,
                      risk: a.risk,
                      experimentKey: a.experimentKey,
                      policyDecision: a.policyDecision,
                      createdAt: a.createdAt.toISOString(),
                    }}
                  />
                ))
              )}
            </div>
          </Panel>

          <Panel tour="cc-learned">
            <PanelHeader title={c.learned} actions={<ButtonLink href={`${base}/learnings`} size="sm" variant="ghost">{t.app.common.all}</ButtonLink>} />
            {data.learnings.length === 0 && (
              <p className="border-t border-line px-4 py-4 text-sm text-muted">
                {c.nothingLearned}
              </p>
            )}
            <ul className="divide-y divide-line border-t border-line">
              {data.learnings.map((l) => (
                <li key={l.id} className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Badge tone={l.kind === "winner" ? "positive" : l.kind === "loser" ? "negative" : "neutral"}>
                      {l.kind === "winner" ? t.app.common.winner : l.kind === "loser" ? t.app.common.loser : t.app.common.learning}
                    </Badge>
                    {l.evidence[0] && (
                      <Link href={`${base}/experiments/${l.evidence[0].number}`} className="text-2xs text-muted tabular hover:text-ink">
                        {experimentKey(l.evidence[0].number)}
                      </Link>
                    )}
                    <span className="ml-auto text-2xs text-subtle">{relativeTime(l.createdAt, new Date(), locale)}</span>
                  </div>
                  <p className="mt-1.5 text-sm text-ink">{l.statement}</p>
                  {l.metricLabel && <p className="mt-0.5 text-xs text-muted">{l.metricLabel}</p>}
                </li>
              ))}
            </ul>
          </Panel>

          {data.issues.length > 0 && (
            <Panel>
              <PanelHeader title={c.health} />
              <ul className="space-y-2 border-t border-line p-3">
                {data.issues.map((i) => (
                  <li key={i.provider}>
                    <Notice tone="warning" title={i.name} action={<ButtonLink href={`${base}/integrations`} size="sm">{c.fix}</ButtonLink>}>
                      {translateServerText(i.detail, locale)}
                    </Notice>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
          {data.issues.length === 0 && (
            <p className="flex items-center gap-2 px-1 text-xs text-muted">
              <PlugZap className="size-3.5" /> {c.healthy}
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}

function BriefItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-2xs font-medium text-muted">{label}</dt>
      <dd className="mt-0.5 text-ink">{children}</dd>
    </div>
  );
}
