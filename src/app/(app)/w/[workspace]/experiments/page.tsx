import Link from "next/link";
import { EffortDots, EvaluationSignal, metricLabel, ScoreBar, thresholdLabel } from "@/components/product/experiment-bits";
import { ChannelBadge, ConfidenceBadge, StatusBadge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { EmptyState } from "@/components/ui/states";
import { cn } from "@/lib/cn";
import { experimentKey, formatDelta, formatUsd } from "@/lib/format";
import { requireWorkspace } from "@/server/context";
import { db } from "@/server/db/client";
import { experimentVariants } from "@/server/db/schema";
import type { ExperimentStatus } from "@/server/domain/types";
import { evaluateRow, listExperiments, rankQueue } from "@/server/services/experiments";
import { getPrimaryProduct } from "@/server/services/workspace";
import { inArray } from "drizzle-orm";

export const metadata = { title: "Experiments" };

const VIEWS = [
  { id: "queue", label: "Queue", statuses: ["proposed", "awaiting_approval"] },
  { id: "running", label: "Running", statuses: ["scheduled", "running", "evaluating"] },
  { id: "completed", label: "Completed", statuses: ["completed"] },
  { id: "suppressed", label: "Not recommended", statuses: ["suppressed", "archived"] },
] as const satisfies readonly { id: string; label: string; statuses: readonly ExperimentStatus[] }[];

export default async function ExperimentsPage({ params, searchParams }: PageProps<"/w/[workspace]/experiments">) {
  const { workspace } = await params;
  const { view: rawView } = await searchParams;
  const ctx = await requireWorkspace(workspace);
  const product = await getPrimaryProduct(ctx.workspaceId);
  const base = `/w/${ctx.workspaceSlug}`;
  if (!product) return <EmptyState title="No product yet" className="mx-auto max-w-3xl" />;

  const all = await listExperiments(ctx.workspaceId, product.id);
  const view = VIEWS.find((v) => v.id === rawView) ?? VIEWS[0];
  const counts = Object.fromEntries(VIEWS.map((v) => [v.id, all.filter((e) => (v.statuses as readonly string[]).includes(e.status)).length]));
  const rows = all.filter((e) => (view.statuses as readonly string[]).includes(e.status));

  const ranked = view.id === "queue" || view.id === "suppressed" ? await rankQueue(ctx.workspaceId, product.id) : [];
  const rankById = new Map(ranked.map((r, i) => [r.experiment.id, { ...r, position: i + 1 }]));
  const variants = view.id === "running" && rows.length ? await db.select().from(experimentVariants).where(inArray(experimentVariants.experimentId, rows.map((r) => r.id))) : [];
  if (view.id === "queue") rows.sort((a, b) => (rankById.get(a.id)?.position ?? 99) - (rankById.get(b.id)?.position ?? 99));

  const winners = all.filter((e) => e.outcome === "winner").length;
  const completed = all.filter((e) => e.status === "completed").length;

  return (
    <div className="mx-auto max-w-[1400px] space-y-5 px-3 py-5 sm:px-5 lg:py-6">
      <PageHeader
        title="Experiments"
        description="The atomic unit of growth: hypothesis, audience, channel, budget, metric, threshold, result and learning."
        meta={
          <span className="text-xs text-muted tabular">
            {completed} completed · {winners} winner{winners === 1 ? "" : "s"} · win rate {completed ? Math.round((winners / completed) * 100) : 0}%
          </span>
        }
      />

      <nav aria-label="Experiment views" className="flex gap-1 border-b border-line">
        {VIEWS.map((v) => (
          <Link
            key={v.id}
            href={`${base}/experiments?view=${v.id}`}
            aria-current={v.id === view.id ? "page" : undefined}
            className={cn("-mb-px flex h-9 items-center gap-1.5 border-b-2 px-3 text-sm", v.id === view.id ? "border-ink font-medium text-ink" : "border-transparent text-muted hover:text-ink")}
          >
            {v.label}
            <span className="text-xs text-subtle tabular">{counts[v.id]}</span>
          </Link>
        ))}
      </nav>

      <Panel className="overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState
            title={view.id === "running" ? "Nothing running" : view.id === "completed" ? "No completed experiments yet" : view.id === "suppressed" ? "Nothing suppressed" : "The queue is empty"}
            description={view.id === "queue" ? "Ask the agent to design experiments from the strategy." : view.id === "suppressed" ? "Experiments disproved by past learnings appear here instead of being recommended again." : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-2xs text-subtle">
                  {view.id === "queue" && <th className="w-10 px-4 py-2 font-medium">#</th>}
                  <th className="px-4 py-2 font-medium">Experiment</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Metric · success if</th>
                  {view.id === "queue" && (
                    <>
                      <th className="px-3 py-2 font-medium">Confidence</th>
                      <th className="px-3 py-2 font-medium">Effort</th>
                      <th className="px-3 py-2 text-right font-medium">Cost</th>
                      <th className="px-4 py-2 font-medium">Priority</th>
                    </>
                  )}
                  {view.id === "running" && (
                    <>
                      <th className="px-3 py-2 font-medium">Current result</th>
                      <th className="px-3 py-2 font-medium">Confidence</th>
                      <th className="px-4 py-2 text-right font-medium">Spend</th>
                    </>
                  )}
                  {view.id === "completed" && (
                    <>
                      <th className="px-3 py-2 font-medium">Result</th>
                      <th className="px-3 py-2 font-medium">Lift</th>
                      <th className="px-4 py-2 text-right font-medium">Spend</th>
                    </>
                  )}
                  {view.id === "suppressed" && <th className="px-4 py-2 font-medium">Why not</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((e) => {
                  const r = rankById.get(e.id);
                  return (
                    <tr key={e.id} className="align-top hover:bg-raised">
                      {view.id === "queue" && <td className="px-4 py-3 text-xs text-subtle tabular">{r?.position}</td>}
                      <td className="px-4 py-3">
                        <Link href={`${base}/experiments/${e.number}`} className="font-medium text-ink hover:underline">
                          {e.name}
                        </Link>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-2xs text-muted">
                          <span className="tabular">{experimentKey(e.number)}</span>
                          <ChannelBadge channel={e.channel} />
                        </div>
                        {view.id === "queue" && r?.boostedBy[0] && <p className="mt-1 text-2xs text-positive">Backed by {r.boostedBy[0].statement}</p>}
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge status={e.status} outcome={e.outcome} />
                      </td>
                      <td className="px-3 py-3 text-xs text-muted">
                        {metricLabel(e.primaryMetric)} · {thresholdLabel(e.primaryMetric, e.successThreshold)}
                      </td>
                      {view.id === "queue" && r && (
                        <>
                          <td className="px-3 py-3">
                            <ConfidenceBadge value={r.adjustedConfidence} />
                          </td>
                          <td className="px-3 py-3">
                            <EffortDots effort={e.effort} />
                          </td>
                          <td className="px-3 py-3 text-right text-xs tabular">{e.budget > 0 ? formatUsd(e.budget) : "Organic"}</td>
                          <td className="px-4 py-3">
                            <ScoreBar score={r.score} />
                          </td>
                        </>
                      )}
                      {view.id === "running" &&
                        (() => {
                          const ev = evaluateRow(e, variants.filter((v) => v.experimentId === e.id));
                          return (
                            <>
                              <td className="px-3 py-3">
                                <EvaluationSignal evaluation={ev} metric={e.primaryMetric} />
                                <p className="mt-0.5 max-w-xs text-2xs text-muted">{ev.summary}</p>
                              </td>
                              <td className="px-3 py-3">
                                <ConfidenceBadge value={ev.confidence} />
                              </td>
                              <td className="px-4 py-3 text-right text-xs tabular">{e.budget > 0 ? `${formatUsd(e.spend)} / ${formatUsd(e.budget)}` : "—"}</td>
                            </>
                          );
                        })()}
                      {view.id === "completed" && (
                        <>
                          <td className="max-w-sm px-3 py-3 text-xs text-muted">{e.resultSummary}</td>
                          <td className={cn("px-3 py-3 text-xs font-medium tabular", e.outcome === "winner" ? "text-positive" : e.outcome === "loser" ? "text-negative" : "text-muted")}>
                            {e.primaryMetric === "cac" ? (e.observedValue !== null ? `CAC ${formatUsd(e.observedValue)}` : "—") : formatDelta(e.lift)}
                          </td>
                          <td className="px-4 py-3 text-right text-xs tabular">{e.spend > 0 ? formatUsd(e.spend) : "—"}</td>
                        </>
                      )}
                      {view.id === "suppressed" && <td className="max-w-md px-4 py-3 text-xs text-muted">{e.suppressedReason ?? "Archived"}</td>}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
