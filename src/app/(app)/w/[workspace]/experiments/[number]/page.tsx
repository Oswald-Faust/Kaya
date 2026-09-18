import type { Metadata } from "next";
import { getI18n } from "@/i18n/server";
import { fmt } from "@/i18n/format";
import { translateDomainText } from "@/i18n/domain-text";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { ApprovalCard } from "@/components/product/approval-card";
import { EvaluationSignal } from "@/components/product/experiment-bits";
import { formatMetricValue, metricLabel, thresholdLabel } from "@/components/product/experiment-format";
import { RecordResultButton } from "@/components/product/run-result-button";
import { Badge, ChannelBadge, ConfidenceBadge, StatusBadge } from "@/components/ui/badge";
import { RunActionButton } from "@/components/product/run-action-button";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Notice } from "@/components/ui/states";
import { cn } from "@/lib/cn";
import { experimentKey, formatDate, formatDelta, formatNumber, formatPct, formatUsd } from "@/lib/format";
import { requireWorkspace } from "@/server/context";
import { currentChannelFit, evaluateRow, getExperimentDetail, rankQueue } from "@/server/services/experiments";
import { buildExperimentBrief } from "@/server/domain/experiments/brief";
import { channelLabel } from "@/server/domain/channels";
import { latestMetricDay } from "@/server/services/metrics";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.app.experiment.metaTitle };
}

const LIFECYCLE = ["proposed", "awaiting_approval", "running", "evaluating", "completed"] as const;

const STAGE_INDEX: Record<string, number> = { idea: 0, proposed: 0, suppressed: 0, awaiting_approval: 1, scheduled: 2, running: 2, evaluating: 3, completed: 4, archived: 4 };

export default async function ExperimentDetailPage({ params }: PageProps<"/w/[workspace]/experiments/[number]">) {
  const { workspace, number } = await params;
  const ctx = await requireWorkspace(workspace);
  const n = Number(number);
  if (!Number.isInteger(n)) notFound();
  const detail = await getExperimentDetail(ctx.workspaceId, n);
  if (!detail) notFound();
  const { experiment: e, variants, assets, campaigns, learning, approvals } = detail;
  const base = `/w/${ctx.workspaceSlug}`;
  const key = experimentKey(e.number);
  const { t: dict, locale } = await getI18n();
  const x = dict.app.experiment;
  const usd = (v: number | null | undefined) => formatUsd(v, {}, locale);
  const date = (v: Date) => formatDate(v, { month: "short", day: "numeric", year: "numeric" }, locale);

  const live = e.status === "running" || e.status === "evaluating" ? evaluateRow(e, variants) : null;
  const ranked = e.status === "proposed" || e.status === "awaiting_approval" || e.status === "suppressed" ? (await rankQueue(ctx.workspaceId, e.productId)).find((r) => r.experiment.id === e.id) : null;
  const control = variants.find((v) => v.isControl);
  const controlRate = control && control.exposures > 0 ? control.conversions / control.exposures : null;
  const stage = STAGE_INDEX[e.status] ?? 0;
  const pending = approvals.filter((a) => a.status === "pending");

  const [channelFit, asOf] = await Promise.all([
    currentChannelFit(ctx.workspaceId, e.productId, e.channel),
    latestMetricDay(ctx.workspaceId, e.productId),
  ]);
  const brief = buildExperimentBrief({
    experiment: { ...e, rationale: translateDomainText(e.rationale, locale) },
    // Channel Fit sentences are composed in English on the server; translate before composing.
    channelFit: channelFit && {
      ...channelFit,
      rationale: translateDomainText(channelFit.rationale, locale),
      reasonsAgainst: channelFit.reasonsAgainst.map((r) => translateDomainText(r, locale)),
    },
    boostedBy: (ranked?.boostedBy ?? []).map((l) => translateDomainText(l.statement, locale)),
    suppressedBy: ranked?.suppressedBy?.statement ?? e.suppressedReason ?? null,
    hasRevenueData: Boolean(asOf),
    assetKind: assets[0]?.kind ?? null,
    formatUsd: (v) => usd(v),
    formatThreshold: (metric, threshold) => thresholdLabel(metric as typeof e.primaryMetric, threshold, dict, locale),
    metricLabel: (metric) => metricLabel(metric as typeof e.primaryMetric, dict),
    channelLabel: dict.common.channels[e.channel] ?? channelLabel(e.channel),
    locale,
  });

  return (
    <div className="mx-auto max-w-[1200px] space-y-5 px-3 py-5 sm:px-5 lg:py-6">
      <div>
        <Link href={`${base}/experiments`} className="inline-flex items-center gap-1 text-xs text-muted hover:text-ink">
          <ArrowLeft className="size-3" /> {x.back}
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
              <span className="tabular">{key}</span>
              <ChannelBadge channel={e.channel} />
              <StatusBadge status={e.status} outcome={e.outcome} />
            </div>
            <h1 className="mt-1.5 text-2xl font-semibold tracking-tight">{e.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            {live && (ctx.isDemo ? <RecordResultButton slug={ctx.workspaceSlug} experimentId={e.id} mode="simulate" label={dict.app.command.simulate} /> : <RecordResultButton slug={ctx.workspaceSlug} experimentId={e.id} mode="evaluate" label={x.evaluateNow} />)}
            {(e.status === "proposed" || e.status === "awaiting_approval") && (
              <RunActionButton slug={ctx.workspaceSlug} experimentId={e.id} label={x.askLaunch} />
            )}
          </div>
        </div>
      </div>

      <ol aria-label={x.lifecycle} className="flex overflow-x-auto rounded-lg border border-line bg-surface">
        {LIFECYCLE.map((s, i) => {
          const done = i < stage || (i === stage && e.status === "completed");
          const current = i === stage && e.status !== "completed";
          return (
            <li key={s} className={cn("flex min-w-[120px] flex-1 items-center gap-2 border-r border-line px-3 py-2.5 text-xs last:border-r-0", current ? "bg-agent-soft font-medium text-agent" : done ? "text-ink" : "text-subtle")}>
              <span className={cn("grid size-4 place-items-center rounded-full text-[10px]", done ? "bg-ink text-white" : current ? "bg-agent text-white" : "border border-line-strong")}>{done ? <Check className="size-2.5" strokeWidth={3} /> : i + 1}</span>
              {i === 4 && e.outcome ? (e.outcome === "winner" ? dict.app.common.winner : e.outcome === "loser" ? dict.app.common.loser : dict.app.common.inconclusive) : x.stages[s]}
            </li>
          );
        })}
      </ol>

      {e.status === "suppressed" && e.suppressedReason && (
        <Notice tone="warning" title={x.suppressedTitle}>
          {e.suppressedReason}
        </Notice>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-5">
          <Panel className="p-5">
            <p className="text-xs font-medium text-subtle">{x.hypothesis}</p>
            <p className="mt-1.5 text-xl leading-snug font-medium text-ink">{e.hypothesis}.</p>
            <dl className="mt-4 grid gap-x-6 gap-y-2 border-t border-line pt-3 text-sm sm:grid-cols-2">
              <div className="flex gap-2">
                <dt className="shrink-0 text-muted">{x.audience}</dt>
                <dd className="min-w-0 text-ink">{e.audience}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="shrink-0 text-muted">{x.primaryMetric}</dt>
                <dd className="min-w-0 text-ink">
                  {metricLabel(e.primaryMetric, dict)} · {thresholdLabel(e.primaryMetric, e.successThreshold, dict, locale)}
                </dd>
              </div>
            </dl>
          </Panel>

          <Panel>
            <PanelHeader title={dict.app.brief.title} description={dict.app.brief.hint} />
            <div className="divide-y divide-line border-t border-line">
              {brief.map((section) => (
                <section key={section.id} className="px-5 py-4">
                  <h3 className="text-sm font-semibold text-ink">{section.title}</h3>
                  <ul className="mt-2 space-y-1.5">
                    {section.lines.map((line) => (
                      <li key={line} className="flex gap-2 text-sm leading-relaxed text-muted">
                        <span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-line-strong" />
                        <span className="min-w-0">{translateDomainText(line, locale)}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </Panel>

          <Panel>
            <PanelHeader title={e.status === "completed" ? x.result : live ? x.liveResult : x.criteria} />
            <div className="grid gap-px border-t border-line bg-line sm:grid-cols-4">
              <Stat label={x.primaryMetric} value={metricLabel(e.primaryMetric, dict)} />
              <Stat label={x.successIf} value={thresholdLabel(e.primaryMetric, e.successThreshold, dict, locale)} />
              <Stat
                label={x.observed}
                value={e.status === "completed" ? formatMetricValue(e.primaryMetric, e.observedValue, locale) : live ? formatMetricValue(e.primaryMetric, live.observedValue, locale) : "—"}
                tone={e.outcome === "winner" ? "positive" : e.outcome === "loser" ? "negative" : undefined}
              />
              <Stat label={dict.app.common.confidence} value={e.status === "completed" && e.confidence !== null ? formatPct(e.confidence, 0) : live ? formatPct(live.confidence, 0) : "—"} />
            </div>
            {(e.resultSummary || live) && <p className="border-t border-line px-4 py-3 text-sm text-ink">{e.status === "completed" ? translateDomainText(e.resultSummary ?? "", locale) : live ? translateDomainText(live.summary, locale) : null}</p>}
            {live && (
              <div className="border-t border-line px-4 py-2.5">
                <EvaluationSignal evaluation={live} metric={e.primaryMetric} />
              </div>
            )}
          </Panel>

          {variants.length > 0 && (
            <Panel className="overflow-hidden">
              <PanelHeader title={x.variants} description={x.variantsHint} />
              <div className="overflow-x-auto border-t border-line">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-line text-left text-2xs text-subtle">
                      <th className="px-4 py-2 font-medium">{x.variant}</th>
                      <th className="px-3 py-2 text-right font-medium">{e.primaryMetric === "cac" ? x.visitors : x.exposed}</th>
                      <th className="px-3 py-2 text-right font-medium">{e.primaryMetric === "cac" ? x.customers : x.converted}</th>
                      <th className="px-3 py-2 text-right font-medium">{e.primaryMetric === "cac" ? "CAC" : x.rate}</th>
                      <th className="px-3 py-2 text-right font-medium">{dict.app.common.lift}</th>
                      <th className="px-4 py-2 text-right font-medium">{dict.app.common.spend}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {variants.map((v) => {
                      const rate = v.exposures > 0 ? v.conversions / v.exposures : null;
                      const lift = !v.isControl && rate !== null && controlRate ? (rate - controlRate) / controlRate : null;
                      return (
                        <tr key={v.id}>
                          <td className="px-4 py-2.5">
                            <span className="font-medium text-ink">{v.name}</span>
                            {v.isControl && <Badge className="ml-2">{x.control}</Badge>}
                            <p className="text-2xs text-muted">{v.description}</p>
                          </td>
                          <td className="px-3 py-2.5 text-right tabular">{formatNumber(v.exposures, locale)}</td>
                          <td className="px-3 py-2.5 text-right tabular">{formatNumber(v.conversions, locale)}</td>
                          <td className="px-3 py-2.5 text-right font-medium tabular">{e.primaryMetric === "cac" ? (v.conversions > 0 ? usd(v.spend / v.conversions) : "—") : formatPct(rate)}</td>
                          <td className={cn("px-3 py-2.5 text-right tabular", lift !== null && (lift > 0 ? "text-positive" : "text-negative"))}>{v.isControl ? "—" : formatDelta(lift)}</td>
                          <td className="px-4 py-2.5 text-right tabular">{v.spend > 0 ? usd(v.spend) : "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Panel>
          )}

          {learning && (
            <Panel className="border-l-2 border-l-positive p-5">
              <p className="text-2xs font-medium text-positive">{x.savedToMemory}</p>
              <p className="mt-1 text-base font-medium text-ink">{learning.statement}</p>
              {learning.metricLabel && <p className="mt-1 text-sm text-muted">{learning.metricLabel}</p>}
              <div className="mt-2 flex items-center gap-3">
                <ConfidenceBadge value={learning.confidence} />
                <Link href={`${base}/learnings`} className="text-xs text-muted hover:text-ink">
                  {x.howItChanges}
                </Link>
              </div>
            </Panel>
          )}

          {assets.length > 0 && (
            <Panel>
              <PanelHeader title={x.assets} count={assets.length} />
              <ul className="divide-y divide-line border-t border-line">
                {assets.map((a) => (
                  <li key={a.id} className="px-4 py-3">
                    <details>
                      <summary className="flex cursor-pointer list-none items-center gap-2 [&::-webkit-details-marker]:hidden">
                        <span className="text-sm font-medium text-ink">{a.title}</span>
                        <Badge tone={a.status === "published" ? "positive" : "outline"}>{dict.app.statusValues[a.status] ?? a.status}</Badge>
                        <span className="text-2xs text-muted">{a.kind.replace(/_/g, " ")}</span>
                      </summary>
                      <pre className="mt-2 max-h-72 overflow-auto rounded-md bg-raised p-3 font-sans text-sm whitespace-pre-wrap text-ink">{a.body}</pre>
                    </details>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>

        <aside className="space-y-5">
          {pending.map((a) => (
            <ApprovalCard
              key={a.id}
              slug={ctx.workspaceSlug}
              approval={{ id: a.id, title: a.title, change: a.change, reason: a.reason, risk: a.risk, experimentKey: key, policyDecision: a.policyDecision, createdAt: a.createdAt.toISOString() }}
            />
          ))}

          <Panel>
            <PanelHeader title={x.design} />
            <dl className="divide-y divide-line border-t border-line text-sm">
              <Row k={x.audience}>{e.audience}</Row>
              <Row k={dict.app.common.channel}>
                <ChannelBadge channel={e.channel} />
              </Row>
              <Row k={x.budget}>{e.budget > 0 ? `${usd(e.budget)}${e.dailySpendCap ? fmt(x.dailyCap, { amount: usd(e.dailySpendCap) }) : ""}` : dict.app.common.organic}</Row>
              <Row k={x.spent}>{e.spend > 0 ? usd(e.spend) : "—"}</Row>
              <Row k={x.duration}>{fmt(x.durationValue, { days: e.durationDays, signal: e.timeToSignalDays })}</Row>
              <Row k={dict.app.common.started}>{e.startedAt ? date(e.startedAt) : x.notStarted}</Row>
              {e.endedAt && <Row k={x.ended}>{date(e.endedAt)}</Row>}
            </dl>
          </Panel>

          {ranked && (
            <Panel>
              <PanelHeader title={x.whyRanked} description={ranked.suppressedBy ? x.suppressedByMemory : fmt(dict.app.metrics.priority, { score: ranked.score })} />
              <ul className="divide-y divide-line border-t border-line text-sm">
                {ranked.factors.map((f) => (
                  <li key={f.label} className="flex items-center justify-between px-4 py-2">
                    <span className="text-muted">{translateDomainText(f.label, locale)}</span>
                    <span className={cn("tabular", f.effect === "positive" ? "text-positive" : f.effect === "negative" ? "text-negative" : "text-ink")}>{translateDomainText(f.value, locale)}</span>
                  </li>
                ))}
              </ul>
              {ranked.boostedBy.map((l) => (
                <p key={l.id} className="border-t border-line px-4 py-2 text-2xs text-positive">
                  {fmt(x.raisedBy, { statement: l.statement })}
                </p>
              ))}
            </Panel>
          )}

          {campaigns.length > 0 && (
            <Panel>
              <PanelHeader title={x.campaigns} />
              <ul className="divide-y divide-line border-t border-line">
                {campaigns.map((c) => (
                  <li key={c.id} className="px-4 py-2.5 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-ink">{c.name}</span>
                      <Badge tone={c.status === "active" ? "agent" : "neutral"}>{dict.app.statusValues[c.status] ?? c.status}</Badge>
                    </div>
                    <p className="text-2xs text-muted tabular">
                      {c.dailyBudget ? `${fmt(dict.app.common.perDay, { amount: usd(c.dailyBudget) })} · ` : ""}
                      {fmt(x.spentValue, { amount: usd(c.spend) })}
                      {c.isDemo ? ` · ${dict.app.common.demoConnection}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </aside>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "positive" | "negative" }) {
  return (
    <div className="bg-surface px-4 py-3">
      <p className="text-2xs text-muted">{label}</p>
      <p className={cn("mt-0.5 text-base font-semibold tabular", tone === "positive" ? "text-positive" : tone === "negative" ? "text-negative" : "text-ink")}>{value}</p>
    </div>
  );
}

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-3 px-4 py-2">
      <dt className="text-muted">{k}</dt>
      <dd className="min-w-0 text-ink">{children}</dd>
    </div>
  );
}
