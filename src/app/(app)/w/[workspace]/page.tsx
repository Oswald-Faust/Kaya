import Link from "next/link";
import { ArrowUpRight, PlugZap } from "lucide-react";
import { ApprovalCard } from "@/components/product/approval-card";
import { EffortDots, EvaluationSignal, metricLabel, ScoreBar, thresholdLabel } from "@/components/product/experiment-bits";
import { RecordResultButton } from "@/components/product/run-result-button";
import { Badge, ChannelBadge, ConfidenceBadge, StatusBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { AreaChart, Sparkline } from "@/components/ui/chart";
import { Metric, MetricGroup } from "@/components/ui/metric";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { EmptyState, Notice } from "@/components/ui/states";
import { requireWorkspace } from "@/server/context";
import { getCommandCenter } from "@/server/services/command-center";
import { experimentKey, formatDate, formatNumber, formatPct, formatUsd, relativeTime } from "@/lib/format";
import { askAgentAction } from "./actions";

export const metadata = { title: "Command Center" };

export default async function CommandCenterPage({ params }: PageProps<"/w/[workspace]">) {
  const { workspace } = await params;
  const ctx = await requireWorkspace(workspace);
  const data = await getCommandCenter(ctx);
  const slug = ctx.workspaceSlug;
  const base = `/w/${slug}`;

  if (!data) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-16">
        <EmptyState
          title="This workspace has no product yet"
          description="Paste your product URL and Kaya will build the business model, strategy and first experiments."
          action={<ButtonLink href="/start" variant="primary">Analyze a product</ButtonLink>}
        />
      </div>
    );
  }

  const { strip, brief } = data;

  return (
    <div className="mx-auto max-w-[1400px] space-y-5 px-3 py-5 sm:px-5 lg:py-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Command Center</h1>
          <p className="mt-0.5 text-sm text-muted">
            {data.shell.product?.name} · {data.asOf ? `data through ${formatDate(data.asOf, { month: "long", day: "numeric" })}` : "no business data yet"} · last 30 days vs previous 30
          </p>
        </div>
        <form action={askAgentAction.bind(null, slug)} className="flex w-full max-w-md items-center gap-2 sm:w-auto">
          <label htmlFor="ask" className="sr-only">Ask the agent</label>
          <input
            id="ask"
            name="goal"
            placeholder="Ask the agent: Why did signups change this week?"
            className="h-8 min-w-0 flex-1 rounded-md border border-line-strong bg-surface px-3 text-sm outline-none placeholder:text-subtle focus:border-agent sm:w-80"
          />
          <button type="submit" className="h-8 shrink-0 rounded-md bg-agent px-3 text-sm font-medium text-white hover:bg-[#2238ad]">
            Ask
          </button>
        </form>
      </div>

      {data.asOf ? (
        <MetricGroup>
          <Metric label="MRR" value={formatUsd(strip.mrr.value)} delta={strip.mrr.delta} formula={strip.mrr.formula} footer={<Sparkline values={data.sparks.mrr} className="mt-1.5" />} />
          <Metric label="Net new MRR" value={formatUsd(strip.netNewMrr.value)} delta={strip.netNewMrr.delta} formula={strip.netNewMrr.formula} hint="New minus churned" />
          <Metric label="Signups" value={formatNumber(strip.signups.value)} delta={strip.signups.delta} formula={strip.signups.formula} footer={<Sparkline values={data.sparks.signups} className="mt-1.5" />} />
          <Metric label="Signup rate" value={formatPct(strip.signupRate.value)} delta={strip.signupRate.delta} formula={strip.signupRate.formula} />
          <Metric label="New customers" value={formatNumber(strip.newCustomers.value)} delta={strip.newCustomers.delta} formula={strip.newCustomers.formula} />
          <Metric label="Blended CAC" value={formatUsd(strip.cac.value)} delta={strip.cac.delta} invert formula={strip.cac.formula} hint={`${formatUsd(strip.cac.spend)} spend`} />
        </MetricGroup>
      ) : (
        <Notice tone="disconnected" title="No revenue or analytics data connected" action={<ButtonLink href={`${base}/integrations`} size="sm">Connect data</ButtonLink>}>
          Recommendations use your product analysis only until revenue and analytics are connected.
        </Notice>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,380px)]">
        <div className="min-w-0 space-y-5">
          {brief && (
            <Panel className="overflow-hidden">
              <div className="border-l-2 border-agent px-4 pt-3.5 pb-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="flex items-center gap-2 text-xs font-medium text-agent">
                    <span className="size-1.5 rounded-full bg-agent" aria-hidden />
                    Growth brief · {formatDate(data.asOf!, { weekday: "long", month: "short", day: "numeric" })}
                  </p>
                  <Link href={`${base}/analytics`} className="inline-flex items-center gap-1 text-xs text-muted hover:text-ink">
                    Review analysis <ArrowUpRight className="size-3" />
                  </Link>
                </div>
                <h2 className="mt-2 text-xl font-semibold tracking-tight">{brief.headline}</h2>
                <dl className="mt-3 grid gap-x-6 gap-y-3 text-sm md:grid-cols-2">
                  <BriefItem label="What changed">{brief.whatChanged}</BriefItem>
                  <BriefItem label="Why it matters">{brief.whyItMatters}</BriefItem>
                  <BriefItem label="Biggest opportunity">{brief.opportunity}</BriefItem>
                  <BriefItem label="Biggest risk">{brief.risk}</BriefItem>
                </dl>
                <div className="mt-4 rounded-md bg-agent-soft px-3 py-2.5">
                  <p className="text-2xs font-medium text-agent">Recommended next</p>
                  <p className="mt-0.5 text-sm text-ink">{brief.recommendation}</p>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {brief.approvalId && (
                    <a href="#approvals" className="inline-flex h-7 items-center rounded-md bg-ink px-2.5 text-xs font-medium text-white hover:bg-ink-hover">
                      Review approval
                    </a>
                  )}
                  <ButtonLink href={`${base}/agent`} size="sm" variant="secondary">
                    Ask agent
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

          <Panel>
            <PanelHeader
              title="Next best actions"
              description="Ranked by impact, confidence, information gain, channel fit, effort, cost and time to signal."
              actions={<ButtonLink href={`${base}/experiments`} size="sm" variant="ghost">All experiments</ButtonLink>}
            />
            {data.nextActions.length === 0 ? (
              <EmptyState title="Nothing queued" description="Ask the agent to propose experiments from your strategy." />
            ) : (
              <ol className="divide-y divide-line border-t border-line">
                {data.nextActions.map((r, i) => (
                  <li key={r.experiment.id} className="grid grid-cols-[20px_minmax(0,1fr)] gap-3 px-4 py-3 sm:grid-cols-[20px_minmax(0,1fr)_auto]">
                    <span className="pt-0.5 text-xs text-subtle tabular">{i + 1}</span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={`${base}/experiments/${r.experiment.number}`} className="truncate text-sm font-medium text-ink hover:underline">
                          {r.experiment.name}
                        </Link>
                        {r.experiment.status === "awaiting_approval" && <StatusBadge status="awaiting_approval" />}
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted">{r.experiment.rationale}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-2xs text-muted">
                        <ChannelBadge channel={r.experiment.channel} />
                        <span className="tabular">{experimentKey(r.experiment.number)}</span>
                        <span>Impact <span className="text-ink">{r.experiment.impact}/5</span></span>
                        <ConfidenceBadge value={r.adjustedConfidence} />
                        <span className="inline-flex items-center gap-1">Effort <EffortDots effort={r.experiment.effort} /></span>
                        <span>Cost <span className="text-ink">{r.experiment.budget > 0 ? formatUsd(r.experiment.budget) : "Organic"}</span></span>
                        <span>Signal in <span className="text-ink">{r.experiment.timeToSignalDays}d</span></span>
                      </div>
                      {r.boostedBy[0] && <p className="mt-1.5 text-2xs text-positive">Backed by {r.boostedBy[0].statement}</p>}
                    </div>
                    <div className="col-start-2 sm:col-start-auto sm:pt-0.5">
                      <ScoreBar score={r.score} />
                    </div>
                  </li>
                ))}
              </ol>
            )}
            {data.suppressed.length > 0 && (
              <div className="border-t border-line bg-raised px-4 py-2.5 text-xs text-muted">
                <span className="font-medium text-ink">Not recommended:</span>{" "}
                {data.suppressed.map((s) => (
                  <span key={s.experiment.id}>
                    <Link href={`${base}/experiments/${s.experiment.number}`} className="underline decoration-line-strong underline-offset-2 hover:text-ink">
                      {experimentKey(s.experiment.number)}
                    </Link>{" "}
                    — disproved by {s.suppressedBy!.statement.split(" · ")[0]}.{" "}
                  </span>
                ))}
              </div>
            )}
          </Panel>

          <Panel>
            <PanelHeader title="Running experiments" count={data.running.length} />
            {data.running.length === 0 ? (
              <EmptyState title="No experiments running" description="The business isn't learning anything this week. Approve the top action to start one." />
            ) : (
              <div className="overflow-x-auto border-t border-line">
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="text-left text-2xs text-subtle">
                      <th className="px-4 py-2 font-medium">Experiment</th>
                      <th className="px-3 py-2 font-medium">Metric · threshold</th>
                      <th className="px-3 py-2 font-medium">Current result</th>
                      <th className="px-3 py-2 font-medium">Confidence</th>
                      <th className="px-3 py-2 font-medium">Spend</th>
                      <th className="px-3 py-2 font-medium">Time left</th>
                      <th className="px-4 py-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {data.running.map((r) => (
                      <tr key={r.experiment.id} className="align-top">
                        <td className="px-4 py-3">
                          <Link href={`${base}/experiments/${r.experiment.number}`} className="font-medium text-ink hover:underline">
                            {r.experiment.name}
                          </Link>
                          <div className="mt-1 flex items-center gap-3 text-2xs text-muted">
                            <span className="tabular">{r.key}</span>
                            <ChannelBadge channel={r.experiment.channel} />
                          </div>
                          <p className="mt-1 max-w-sm text-2xs text-muted">{r.evaluation.summary}</p>
                        </td>
                        <td className="px-3 py-3 text-xs text-muted">
                          {metricLabel(r.experiment.primaryMetric)} · {thresholdLabel(r.experiment.primaryMetric, r.experiment.successThreshold)}
                        </td>
                        <td className="px-3 py-3">
                          <EvaluationSignal evaluation={r.evaluation} metric={r.experiment.primaryMetric} />
                        </td>
                        <td className="px-3 py-3">
                          <ConfidenceBadge value={r.evaluation.confidence} />
                        </td>
                        <td className="px-3 py-3 text-xs tabular">
                          {r.experiment.budget > 0 ? `${formatUsd(r.experiment.spend)} / ${formatUsd(r.experiment.budget)}` : "—"}
                        </td>
                        <td className="px-3 py-3 text-xs tabular">{r.daysLeft}d</td>
                        <td className="px-4 py-3 text-right">
                          {ctx.isDemo ? (
                            <RecordResultButton slug={slug} experimentId={r.experiment.id} mode="simulate" label="Simulate to end" />
                          ) : (
                            <RecordResultButton slug={slug} experimentId={r.experiment.id} mode="evaluate" label="Evaluate" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>

          {data.mrrSeries.length > 0 && (
            <Panel className="px-4 py-4">
              <PanelHeader className="px-0 pt-0" title="MRR, last 90 days" description="Markers show when each experiment started." />
              <AreaChart data={data.mrrSeries} markers={data.markers} height={180} />
            </Panel>
          )}
        </div>

        <aside className="min-w-0 space-y-5">
          <Panel>
            <div id="approvals" className="scroll-mt-20">
              <PanelHeader title="Needs your decision" count={data.approvals.length} description="High-risk actions wait here. Hard budget limits apply even after approval." />
            </div>
            <div className="space-y-2.5 border-t border-line p-3">
              {data.approvals.length === 0 ? (
                <p className="px-1 py-3 text-sm text-muted">Nothing waiting. The agent acts only within your autonomy settings.</p>
              ) : (
                data.approvals.map((a) => (
                  <ApprovalCard
                    key={a.id}
                    slug={slug}
                    compact
                    approval={{
                      id: a.id,
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

          <Panel>
            <PanelHeader title="What we've learned" actions={<ButtonLink href={`${base}/learnings`} size="sm" variant="ghost">All</ButtonLink>} />
            {data.learnings.length === 0 && (
              <p className="border-t border-line px-4 py-4 text-sm text-muted">
                Nothing learned yet. Every finished experiment writes a winner, loser or insight here, and the next recommendations use it.
              </p>
            )}
            <ul className="divide-y divide-line border-t border-line">
              {data.learnings.map((l) => (
                <li key={l.id} className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Badge tone={l.kind === "winner" ? "positive" : l.kind === "loser" ? "negative" : "neutral"}>
                      {l.kind === "winner" ? "Winner" : l.kind === "loser" ? "Loser" : "Learning"}
                    </Badge>
                    {l.evidence[0] && (
                      <Link href={`${base}/experiments/${l.evidence[0].number}`} className="text-2xs text-muted tabular hover:text-ink">
                        {experimentKey(l.evidence[0].number)}
                      </Link>
                    )}
                    <span className="ml-auto text-2xs text-subtle">{relativeTime(l.createdAt)}</span>
                  </div>
                  <p className="mt-1.5 text-sm text-ink">{l.statement}</p>
                  {l.metricLabel && <p className="mt-0.5 text-xs text-muted">{l.metricLabel}</p>}
                </li>
              ))}
            </ul>
          </Panel>

          {data.issues.length > 0 && (
            <Panel>
              <PanelHeader title="Integration health" />
              <ul className="space-y-2 border-t border-line p-3">
                {data.issues.map((i) => (
                  <li key={i.provider}>
                    <Notice tone="warning" title={i.name} action={<ButtonLink href={`${base}/integrations`} size="sm">Fix</ButtonLink>}>
                      {i.detail}
                    </Notice>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
          {data.issues.length === 0 && (
            <p className="flex items-center gap-2 px-1 text-xs text-muted">
              <PlugZap className="size-3.5" /> All connected integrations are healthy.
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
