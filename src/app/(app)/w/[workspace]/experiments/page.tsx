import type { Metadata } from "next";
import { getI18n } from "@/i18n/server";
import { fmt, plural } from "@/i18n/format";
import Link from "next/link";
import { ResetExperimentsButton } from "@/components/product/reset-experiments-button";
import { EffortDots, EvaluationSignal, ScoreBar } from "@/components/product/experiment-bits";
import { metricLabel, thresholdLabel } from "@/components/product/experiment-format";
import { translateDomainText } from "@/i18n/domain-text";
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

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.app.experiments.metaTitle };
}

const VIEWS = [
  { id: "queue", statuses: ["proposed", "awaiting_approval"] },
  { id: "running", statuses: ["scheduled", "running", "evaluating"] },
  { id: "completed", statuses: ["completed"] },
  { id: "suppressed", statuses: ["suppressed"] },
  { id: "archived", statuses: ["archived"] },
] as const satisfies readonly { id: string; statuses: readonly ExperimentStatus[] }[];

export default async function ExperimentsPage({ params, searchParams }: PageProps<"/w/[workspace]/experiments">) {
  const { workspace } = await params;
  const { view: rawView } = await searchParams;
  const ctx = await requireWorkspace(workspace);
  const product = await getPrimaryProduct(ctx.workspaceId);
  const base = `/w/${ctx.workspaceSlug}`;
  const { t, locale } = await getI18n();
  const x = t.app.experiments;
  const usd = (v: number | null | undefined) => formatUsd(v, {}, locale);
  if (!product) return <EmptyState title={t.app.common.noProduct} className="mx-auto max-w-3xl" />;

  const all = await listExperiments(ctx.workspaceId, product.id);
  const view = VIEWS.find((v) => v.id === rawView) ?? VIEWS[0];
  const counts = Object.fromEntries(VIEWS.map((v) => [v.id, all.filter((e) => (v.statuses as readonly string[]).includes(e.status)).length]));
  const rows = all.filter((e) => (view.statuses as readonly string[]).includes(e.status));

  const ranked = view.id === "queue" || view.id === "suppressed" ? await rankQueue(ctx.workspaceId, product.id) : [];
  const rankById = new Map(ranked.map((r, i) => [r.experiment.id, { ...r, position: i + 1 }]));
  const variants = view.id === "running" && rows.length ? await db.select().from(experimentVariants).where(inArray(experimentVariants.experimentId, rows.map((r) => r.id))) : [];
  if (view.id === "queue") rows.sort((a, b) => (rankById.get(a.id)?.position ?? 99) - (rankById.get(b.id)?.position ?? 99));

  const winners = all.filter((e) => e.status === "completed" && e.outcome === "winner").length;
  const completed = all.filter((e) => e.status === "completed").length;

  return (
    <div className="mx-auto max-w-[1400px] space-y-5 px-3 py-5 sm:px-5 lg:py-6">
      <PageHeader
        title={x.title}
        description={x.description}
        actions={all.length > 0 && !ctx.isGuest && (ctx.role === "owner" || ctx.role === "admin") ? <ResetExperimentsButton slug={ctx.workspaceSlug} name={ctx.workspaceName} /> : undefined}
        meta={
          <span className="text-xs text-muted tabular">
            {fmt(x.stats, { completed, winners: plural(locale, winners, x.winners), rate: completed ? Math.round((winners / completed) * 100) : 0 })}
          </span>
        }
      />

      <nav aria-label={x.viewsLabel} className="flex gap-1 border-b border-line">
        {VIEWS.map((v) => (
          <Link
            key={v.id}
            href={`${base}/experiments?view=${v.id}`}
            aria-current={v.id === view.id ? "page" : undefined}
            className={cn("-mb-px flex h-9 items-center gap-1.5 border-b-2 px-3 text-sm", v.id === view.id ? "border-ink font-medium text-ink" : "border-transparent text-muted hover:text-ink")}
          >
            {v.id === "archived" ? x.resetArchive : x.views[v.id]}
            <span className="text-xs text-subtle tabular">{counts[v.id]}</span>
          </Link>
        ))}
      </nav>

      <Panel className="overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState
            title={view.id === "running" ? x.emptyRunning : view.id === "completed" ? x.emptyCompleted : view.id === "archived" ? x.emptyArchived : view.id === "suppressed" ? x.emptySuppressed : x.emptyQueue}
            description={view.id === "queue" ? x.emptyQueueHint : view.id === "suppressed" ? x.emptySuppressedHint : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-2xs text-subtle">
                  {view.id === "queue" && <th className="w-10 px-4 py-2 font-medium">#</th>}
                  <th className="px-4 py-2 font-medium">{t.app.common.experiment}</th>
                  <th className="px-3 py-2 font-medium">{t.app.common.status}</th>
                  <th className="px-3 py-2 font-medium">{x.metricSuccess}</th>
                  {view.id === "queue" && (
                    <>
                      <th className="px-3 py-2 font-medium">{t.app.common.confidence}</th>
                      <th className="px-3 py-2 font-medium">{x.effort}</th>
                      <th className="px-3 py-2 text-right font-medium">{x.cost}</th>
                      <th className="px-4 py-2 font-medium">{x.priority}</th>
                    </>
                  )}
                  {view.id === "running" && (
                    <>
                      <th className="px-3 py-2 font-medium">{x.currentResult}</th>
                      <th className="px-3 py-2 font-medium">{t.app.common.confidence}</th>
                      <th className="px-4 py-2 text-right font-medium">{t.app.common.spend}</th>
                    </>
                  )}
                  {view.id === "completed" && (
                    <>
                      <th className="px-3 py-2 font-medium">{x.result}</th>
                      <th className="px-3 py-2 font-medium">{t.app.common.lift}</th>
                      <th className="px-4 py-2 text-right font-medium">{t.app.common.spend}</th>
                    </>
                  )}
                  {(view.id === "suppressed" || view.id === "archived") && <th className="px-4 py-2 font-medium">{x.whyNot}</th>}
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
                        {view.id === "queue" && r?.boostedBy[0] && <p className="mt-1 text-2xs text-positive">{fmt(t.app.command.backedBy, { statement: r.boostedBy[0].statement })}</p>}
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge status={e.status} outcome={e.outcome} />
                      </td>
                      <td className="px-3 py-3 text-xs text-muted">
                        {metricLabel(e.primaryMetric, t)} · {thresholdLabel(e.primaryMetric, e.successThreshold, t, locale)}
                      </td>
                      {view.id === "queue" && r && (
                        <>
                          <td className="px-3 py-3">
                            <ConfidenceBadge value={r.adjustedConfidence} />
                          </td>
                          <td className="px-3 py-3">
                            <EffortDots effort={e.effort} />
                          </td>
                          <td className="px-3 py-3 text-right text-xs tabular">{e.budget > 0 ? usd(e.budget) : t.app.common.organic}</td>
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
                                <p className="mt-0.5 max-w-xs text-2xs text-muted">{translateDomainText(ev.summary, locale)}</p>
                              </td>
                              <td className="px-3 py-3">
                                <ConfidenceBadge value={ev.confidence} />
                              </td>
                              <td className="px-4 py-3 text-right text-xs tabular">{e.budget > 0 ? `${usd(e.spend)} / ${usd(e.budget)}` : "—"}</td>
                            </>
                          );
                        })()}
                      {view.id === "completed" && (
                        <>
                          <td className="max-w-sm px-3 py-3 text-xs text-muted">{e.resultSummary && translateDomainText(e.resultSummary, locale)}</td>
                          <td className={cn("px-3 py-3 text-xs font-medium tabular", e.outcome === "winner" ? "text-positive" : e.outcome === "loser" ? "text-negative" : "text-muted")}>
                            {e.primaryMetric === "cac" ? (e.observedValue !== null ? `CAC ${usd(e.observedValue)}` : "—") : formatDelta(e.lift)}
                          </td>
                          <td className="px-4 py-3 text-right text-xs tabular">{e.spend > 0 ? usd(e.spend) : "—"}</td>
                        </>
                      )}
                      {(view.id === "suppressed" || view.id === "archived") && <td className="max-w-md px-4 py-3 text-xs text-muted">{e.suppressedReason ?? x.archived}</td>}
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
