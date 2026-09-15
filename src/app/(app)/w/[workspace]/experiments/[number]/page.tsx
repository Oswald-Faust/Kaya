import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { ApprovalCard } from "@/components/product/approval-card";
import { EvaluationSignal, formatMetricValue, metricLabel, thresholdLabel } from "@/components/product/experiment-bits";
import { RecordResultButton } from "@/components/product/run-result-button";
import { Badge, ChannelBadge, ConfidenceBadge, StatusBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Notice } from "@/components/ui/states";
import { cn } from "@/lib/cn";
import { experimentKey, formatDate, formatDelta, formatNumber, formatPct, formatUsd } from "@/lib/format";
import { requireWorkspace } from "@/server/context";
import { evaluateRow, getExperimentDetail, rankQueue } from "@/server/services/experiments";

export const metadata = { title: "Experiment" };

const LIFECYCLE = [
  { id: "proposed", label: "Proposed" },
  { id: "awaiting_approval", label: "Approval" },
  { id: "running", label: "Running" },
  { id: "evaluating", label: "Evaluating" },
  { id: "completed", label: "Result" },
] as const;

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

  const live = e.status === "running" || e.status === "evaluating" ? evaluateRow(e, variants) : null;
  const ranked = e.status === "proposed" || e.status === "awaiting_approval" || e.status === "suppressed" ? (await rankQueue(ctx.workspaceId, e.productId)).find((r) => r.experiment.id === e.id) : null;
  const control = variants.find((v) => v.isControl);
  const controlRate = control && control.exposures > 0 ? control.conversions / control.exposures : null;
  const stage = STAGE_INDEX[e.status] ?? 0;
  const pending = approvals.filter((a) => a.status === "pending");

  return (
    <div className="mx-auto max-w-[1200px] space-y-5 px-3 py-5 sm:px-5 lg:py-6">
      <div>
        <Link href={`${base}/experiments`} className="inline-flex items-center gap-1 text-xs text-muted hover:text-ink">
          <ArrowLeft className="size-3" /> Experiments
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
            {live && (ctx.isDemo ? <RecordResultButton slug={ctx.workspaceSlug} experimentId={e.id} mode="simulate" label="Simulate to end" /> : <RecordResultButton slug={ctx.workspaceSlug} experimentId={e.id} mode="evaluate" label="Evaluate now" />)}
            {(e.status === "proposed" || e.status === "awaiting_approval") && (
              <ButtonLink href={`${base}/agent?ask=${encodeURIComponent(`What should we launch next?`)}`} size="sm" variant="secondary">
                Ask the agent to launch
              </ButtonLink>
            )}
          </div>
        </div>
      </div>

      <ol aria-label="Lifecycle" className="flex overflow-x-auto rounded-lg border border-line bg-surface">
        {LIFECYCLE.map((s, i) => {
          const done = i < stage || (i === stage && e.status === "completed");
          const current = i === stage && e.status !== "completed";
          return (
            <li key={s.id} className={cn("flex min-w-[120px] flex-1 items-center gap-2 border-r border-line px-3 py-2.5 text-xs last:border-r-0", current ? "bg-agent-soft font-medium text-agent" : done ? "text-ink" : "text-subtle")}>
              <span className={cn("grid size-4 place-items-center rounded-full text-[10px]", done ? "bg-ink text-white" : current ? "bg-agent text-white" : "border border-line-strong")}>{done ? <Check className="size-2.5" strokeWidth={3} /> : i + 1}</span>
              {i === 4 && e.outcome ? (e.outcome === "winner" ? "Winner" : e.outcome === "loser" ? "Loser" : "Inconclusive") : s.label}
            </li>
          );
        })}
      </ol>

      {e.status === "suppressed" && e.suppressedReason && (
        <Notice tone="warning" title="Not recommended: past evidence already disproved this tactic">
          {e.suppressedReason}
        </Notice>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-5">
          <Panel className="p-5">
            <p className="text-2xs font-medium text-subtle">Hypothesis</p>
            <p className="mt-1 text-lg font-medium text-ink">{e.hypothesis}.</p>
            <p className="mt-2 text-sm text-muted">{e.rationale}</p>
          </Panel>

          <Panel>
            <PanelHeader title={e.status === "completed" ? "Result" : live ? "Live result" : "Success criteria"} />
            <div className="grid gap-px border-t border-line bg-line sm:grid-cols-4">
              <Stat label="Primary metric" value={metricLabel(e.primaryMetric)} />
              <Stat label="Success if" value={thresholdLabel(e.primaryMetric, e.successThreshold)} />
              <Stat
                label="Observed"
                value={e.status === "completed" ? formatMetricValue(e.primaryMetric, e.observedValue) : live ? formatMetricValue(e.primaryMetric, live.observedValue) : "—"}
                tone={e.outcome === "winner" ? "positive" : e.outcome === "loser" ? "negative" : undefined}
              />
              <Stat label="Confidence" value={e.status === "completed" && e.confidence !== null ? formatPct(e.confidence, 0) : live ? formatPct(live.confidence, 0) : "—"} />
            </div>
            {(e.resultSummary || live) && <p className="border-t border-line px-4 py-3 text-sm text-ink">{e.status === "completed" ? e.resultSummary : live?.summary}</p>}
            {live && (
              <div className="border-t border-line px-4 py-2.5">
                <EvaluationSignal evaluation={live} metric={e.primaryMetric} />
              </div>
            )}
          </Panel>

          {variants.length > 0 && (
            <Panel className="overflow-hidden">
              <PanelHeader title="Variants" description="Rates, lift and CAC are computed from the raw counts below." />
              <div className="overflow-x-auto border-t border-line">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-line text-left text-2xs text-subtle">
                      <th className="px-4 py-2 font-medium">Variant</th>
                      <th className="px-3 py-2 text-right font-medium">{e.primaryMetric === "cac" ? "Visitors" : "Exposed"}</th>
                      <th className="px-3 py-2 text-right font-medium">{e.primaryMetric === "cac" ? "Customers" : "Converted"}</th>
                      <th className="px-3 py-2 text-right font-medium">{e.primaryMetric === "cac" ? "CAC" : "Rate"}</th>
                      <th className="px-3 py-2 text-right font-medium">Lift</th>
                      <th className="px-4 py-2 text-right font-medium">Spend</th>
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
                            {v.isControl && <Badge className="ml-2">Control</Badge>}
                            <p className="text-2xs text-muted">{v.description}</p>
                          </td>
                          <td className="px-3 py-2.5 text-right tabular">{formatNumber(v.exposures)}</td>
                          <td className="px-3 py-2.5 text-right tabular">{formatNumber(v.conversions)}</td>
                          <td className="px-3 py-2.5 text-right font-medium tabular">{e.primaryMetric === "cac" ? (v.conversions > 0 ? formatUsd(v.spend / v.conversions) : "—") : formatPct(rate)}</td>
                          <td className={cn("px-3 py-2.5 text-right tabular", lift !== null && (lift > 0 ? "text-positive" : "text-negative"))}>{v.isControl ? "—" : formatDelta(lift)}</td>
                          <td className="px-4 py-2.5 text-right tabular">{v.spend > 0 ? formatUsd(v.spend) : "—"}</td>
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
              <p className="text-2xs font-medium text-positive">Saved to memory</p>
              <p className="mt-1 text-base font-medium text-ink">{learning.statement}</p>
              {learning.metricLabel && <p className="mt-1 text-sm text-muted">{learning.metricLabel}</p>}
              <div className="mt-2 flex items-center gap-3">
                <ConfidenceBadge value={learning.confidence} />
                <Link href={`${base}/learnings`} className="text-xs text-muted hover:text-ink">
                  How it changes future recommendations →
                </Link>
              </div>
            </Panel>
          )}

          {assets.length > 0 && (
            <Panel>
              <PanelHeader title="Creative assets" count={assets.length} />
              <ul className="divide-y divide-line border-t border-line">
                {assets.map((a) => (
                  <li key={a.id} className="px-4 py-3">
                    <details>
                      <summary className="flex cursor-pointer list-none items-center gap-2 [&::-webkit-details-marker]:hidden">
                        <span className="text-sm font-medium text-ink">{a.title}</span>
                        <Badge tone={a.status === "published" ? "positive" : "outline"}>{a.status}</Badge>
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
            <PanelHeader title="Design" />
            <dl className="divide-y divide-line border-t border-line text-sm">
              <Row k="Audience">{e.audience}</Row>
              <Row k="Channel">
                <ChannelBadge channel={e.channel} />
              </Row>
              <Row k="Budget">{e.budget > 0 ? `${formatUsd(e.budget)}${e.dailySpendCap ? ` · ${formatUsd(e.dailySpendCap)}/day cap` : ""}` : "Organic"}</Row>
              <Row k="Spent">{e.spend > 0 ? formatUsd(e.spend) : "—"}</Row>
              <Row k="Duration">{e.durationDays} days · signal in ~{e.timeToSignalDays}d</Row>
              <Row k="Started">{e.startedAt ? formatDate(e.startedAt, { month: "short", day: "numeric", year: "numeric" }) : "Not started"}</Row>
              {e.endedAt && <Row k="Ended">{formatDate(e.endedAt, { month: "short", day: "numeric", year: "numeric" })}</Row>}
              <Row k="Memory key">
                <code className="text-2xs">{e.similarityKey}</code>
              </Row>
            </dl>
          </Panel>

          {ranked && (
            <Panel>
              <PanelHeader title="Why it's ranked here" description={ranked.suppressedBy ? "Suppressed by memory" : `Priority score ${ranked.score}/100`} />
              <ul className="divide-y divide-line border-t border-line text-sm">
                {ranked.factors.map((f) => (
                  <li key={f.label} className="flex items-center justify-between px-4 py-2">
                    <span className="text-muted">{f.label}</span>
                    <span className={cn("tabular", f.effect === "positive" ? "text-positive" : f.effect === "negative" ? "text-negative" : "text-ink")}>{f.value}</span>
                  </li>
                ))}
              </ul>
              {ranked.boostedBy.map((l) => (
                <p key={l.id} className="border-t border-line px-4 py-2 text-2xs text-positive">
                  Confidence raised by {l.statement}
                </p>
              ))}
            </Panel>
          )}

          {campaigns.length > 0 && (
            <Panel>
              <PanelHeader title="Campaigns" />
              <ul className="divide-y divide-line border-t border-line">
                {campaigns.map((c) => (
                  <li key={c.id} className="px-4 py-2.5 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-ink">{c.name}</span>
                      <Badge tone={c.status === "active" ? "agent" : "neutral"}>{c.status}</Badge>
                    </div>
                    <p className="text-2xs text-muted tabular">
                      {c.dailyBudget ? `${formatUsd(c.dailyBudget)}/day · ` : ""}
                      {formatUsd(c.spend)} spent{c.isDemo ? " · demo connection" : ""}
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
