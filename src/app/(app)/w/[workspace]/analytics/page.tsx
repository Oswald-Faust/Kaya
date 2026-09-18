import type { Metadata } from "next";
import { getI18n } from "@/i18n/server";
import { fmt } from "@/i18n/format";
import { ButtonLink } from "@/components/ui/button";
import { ChannelBadge, DemoBadge } from "@/components/ui/badge";
import { AreaChart, ChartContainer } from "@/components/ui/chart";
import { Metric, MetricGroup } from "@/components/ui/metric";
import { PageHeader } from "@/components/ui/page-header";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { EmptyState } from "@/components/ui/states";
import { computeKpis, pctChange, splitWindows } from "@/server/domain/analytics/metrics";
import { requireWorkspace } from "@/server/context";
import { getBlendedRows, getChannelRows, latestMetricDay, shiftDay } from "@/server/services/metrics";
import { getPrimaryProduct } from "@/server/services/workspace";
import { formatDate, formatNumber, formatPct, formatUsd } from "@/lib/format";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.app.analytics.metaTitle };
}

export default async function AnalyticsPage({ params }: PageProps<"/w/[workspace]/analytics">) {
  const { workspace } = await params;
  const ctx = await requireWorkspace(workspace);
  const product = await getPrimaryProduct(ctx.workspaceId);
  const { t, locale } = await getI18n();
  const at = t.app.analytics;
  const usd = (v: number | null | undefined, opts?: Parameters<typeof formatUsd>[1]) => formatUsd(v, opts, locale);
  const num = (v: number | null | undefined) => formatNumber(v, locale);
  const asOf = product ? await latestMetricDay(ctx.workspaceId, product.id) : null;

  if (!product || !asOf) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-12">
        <EmptyState
          title={at.noDataTitle}
          description={at.noDataHint}
          action={<ButtonLink href={`/w/${ctx.workspaceSlug}/integrations`} variant="primary">{at.connectData}</ButtonLink>}
        />
      </div>
    );
  }

  const [blended, channelRows] = await Promise.all([
    getBlendedRows(ctx.workspaceId, product.id, shiftDay(asOf, -89), asOf),
    getChannelRows(ctx.workspaceId, product.id, shiftDay(asOf, -29), asOf),
  ]);
  const [prev, cur] = splitWindows(blended, 30);
  const k = computeKpis(cur);
  const p = computeKpis(prev);

  const funnel = [
    { key: "visits", label: at.stages.visits, value: k.visits.value ?? 0 },
    { key: "signups", label: at.stages.signups, value: k.signups.value ?? 0 },
    { key: "activated", label: at.stages.activated, value: k.activations.value ?? 0 },
    { key: "trials", label: at.stages.trials, value: cur.reduce((s, r) => s + r.trials, 0) },
    { key: "customers", label: at.stages.customers, value: k.paidConversions.value ?? 0 },
  ];

  const channels = new Map<string, { visits: number; signups: number; paid: number; spend: number; newMrr: number }>();
  for (const r of channelRows) {
    const c = channels.get(r.channel) ?? { visits: 0, signups: 0, paid: 0, spend: 0, newMrr: 0 };
    c.visits += r.visits;
    c.signups += r.signups;
    c.paid += r.paidConversions;
    c.spend += r.spend;
    c.newMrr += r.newMrr;
    channels.set(r.channel, c);
  }
  const channelTable = [...channels.entries()].sort((a, b) => b[1].newMrr - a[1].newMrr);
  const totalNewMrr = channelTable.reduce((s, [, c]) => s + c.newMrr, 0);

  return (
    <div className="mx-auto max-w-[1400px] space-y-5 px-3 py-5 sm:px-5 lg:py-6">
      <PageHeader
        title={at.title}
        description={fmt(at.description, { date: formatDate(asOf, { month: "long", day: "numeric" }, locale) })}
        meta={ctx.isDemo ? <DemoBadge /> : undefined}
      />

      <MetricGroup>
        <Metric label="MRR" value={usd(k.mrr.value)} delta={pctChange(k.mrr.value, p.mrr.value)} formula={k.mrr.formula} />
        <Metric label={at.arpu} value={usd(k.arpu.value, { cents: true })} delta={pctChange(k.arpu.value, p.arpu.value)} formula={k.arpu.formula} />
        <Metric label={t.app.command.blendedCac} value={usd(k.blendedCac.value)} delta={pctChange(k.blendedCac.value, p.blendedCac.value)} invert formula={k.blendedCac.formula} />
        <Metric label={at.payback} value={k.paybackMonths.value !== null ? fmt(at.months, { value: k.paybackMonths.value.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) }) : "—"} formula={k.paybackMonths.formula} />
        <Metric label={at.roas} value={k.roas.value !== null ? `${k.roas.value.toFixed(2)}×` : "—"} formula={k.roas.formula} hint={at.roasHint} />
        <Metric label={at.churn} value={formatPct(k.revenueChurnRate.value)} delta={pctChange(k.revenueChurnRate.value, p.revenueChurnRate.value)} invert formula={k.revenueChurnRate.formula} />
      </MetricGroup>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel className="p-4">
          <ChartContainer title={at.mrrChart} value={usd(k.mrr.value)}>
            <AreaChart data={blended.map((r) => ({ x: r.day, y: r.mrr }))} height={170} />
          </ChartContainer>
        </Panel>
        <Panel className="p-4">
          <ChartContainer title={at.signupsChart} value={fmt(at.signupsIn30, { count: num(k.signups.value) })}>
            <AreaChart data={blended.map((r) => ({ x: r.day, y: r.signups }))} height={170} tone="agent" />
          </ChartContainer>
        </Panel>
      </div>

      <Panel>
        <PanelHeader title={at.funnel} description={at.funnelHint} />
        <ol className="grid border-t border-line sm:grid-cols-5">
          {funnel.map((step, i) => {
            const prevStep = funnel[i - 1];
            const rate = prevStep && prevStep.value > 0 ? step.value / prevStep.value : null;
            const width = funnel[0].value > 0 ? Math.max(2, (step.value / funnel[0].value) * 100) : 0;
            return (
              <li key={step.key} className="border-b border-line px-4 py-3 last:border-b-0 sm:border-r sm:border-b-0 sm:last:border-r-0">
                <p className="text-xs text-muted">{step.label}</p>
                <p className="mt-0.5 text-xl font-semibold tabular">{num(step.value)}</p>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-sunken">
                  <div className="h-full rounded-full bg-ink" style={{ width: `${width}%` }} />
                </div>
                <p className="mt-1.5 text-2xs text-muted tabular">{rate === null ? at.topOfFunnel : fmt(at.ofPrevious, { pct: formatPct(rate), previous: prevStep.label.toLowerCase() })}</p>
              </li>
            );
          })}
        </ol>
      </Panel>

      <Panel className="overflow-hidden">
        <PanelHeader title={at.economics} description={at.economicsHint} />
        <div className="overflow-x-auto border-t border-line">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-line text-right text-2xs text-subtle">
                <th className="px-4 py-2 text-left font-medium">{t.app.common.channel}</th>
                <th className="px-3 py-2 font-medium">{at.visits}</th>
                <th className="px-3 py-2 font-medium">{at.signups}</th>
                <th className="px-3 py-2 font-medium">{at.signupRate}</th>
                <th className="px-3 py-2 font-medium">{at.customers}</th>
                <th className="px-3 py-2 font-medium">{t.app.common.spend}</th>
                <th className="px-3 py-2 font-medium">{at.cac}</th>
                <th className="px-4 py-2 font-medium">{at.newMrr}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-right tabular">
              {channelTable.map(([channel, c]) => (
                <tr key={channel}>
                  <td className="px-4 py-2.5 text-left">
                    <ChannelBadge channel={channel} className="text-sm text-ink" />
                  </td>
                  <td className="px-3 py-2.5">{num(c.visits)}</td>
                  <td className="px-3 py-2.5">{num(c.signups)}</td>
                  <td className="px-3 py-2.5">{formatPct(c.visits > 0 ? c.signups / c.visits : null)}</td>
                  <td className="px-3 py-2.5">{num(c.paid)}</td>
                  <td className="px-3 py-2.5">{c.spend > 0 ? usd(c.spend) : "—"}</td>
                  <td className="px-3 py-2.5">{c.spend > 0 && c.paid > 0 ? usd(c.spend / c.paid) : c.spend > 0 ? at.noCustomers : "—"}</td>
                  <td className="px-4 py-2.5">
                    {usd(c.newMrr)} <span className="text-2xs text-subtle">{totalNewMrr > 0 ? `${Math.round((c.newMrr / totalNewMrr) * 100)}%` : ""}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="border-t border-line px-4 py-2.5 text-2xs text-muted">
          {fmt(at.footnote, { signupRate: k.signupRate.formula, cac: k.blendedCac.formula, payback: k.paybackMonths.formula })}
        </p>
      </Panel>
    </div>
  );
}
