import { desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { getI18n } from "@/i18n/server";
import { fmt } from "@/i18n/format";
import Link from "next/link";
import { Badge, ChannelBadge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { EmptyState } from "@/components/ui/states";
import { experimentKey, formatDate, formatUsd } from "@/lib/format";
import { requireWorkspace } from "@/server/context";
import { db } from "@/server/db/client";
import { campaigns, experiments } from "@/server/db/schema";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.app.campaigns.metaTitle };
}

const STATUS_TONE = { active: "agent", paused: "warning", ended: "neutral", draft: "outline" } as const;

export default async function CampaignsPage({ params }: PageProps<"/w/[workspace]/campaigns">) {
  const { workspace } = await params;
  const ctx = await requireWorkspace(workspace);
  const rows = await db
    .select({ campaign: campaigns, experimentNumber: experiments.number, experimentName: experiments.name, outcome: experiments.outcome })
    .from(campaigns)
    .leftJoin(experiments, eq(experiments.id, campaigns.experimentId))
    .where(eq(campaigns.workspaceId, ctx.workspaceId))
    .orderBy(desc(campaigns.createdAt));
  const base = `/w/${ctx.workspaceSlug}`;
  const { t, locale } = await getI18n();
  const ct = t.app.campaigns;
  const activeDaily = rows.filter((r) => r.campaign.status === "active").reduce((s, r) => s + (r.campaign.dailyBudget ?? 0), 0);

  return (
    <div className="mx-auto max-w-[1200px] space-y-5 px-3 py-5 sm:px-5 lg:py-6">
      <PageHeader
        tour="camp-header"
        title={ct.title}
        description={ct.description}
        meta={<span className="text-xs text-muted tabular">{fmt(ct.activeDaily, { amount: formatUsd(activeDaily, undefined, locale) })}</span>}
      />
      <Panel tour="camp-table" className="overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState title={ct.emptyTitle} description={ct.emptyHint} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-2xs text-subtle">
                  <th className="px-4 py-2 font-medium">{ct.campaign}</th>
                  <th className="px-3 py-2 font-medium">{t.app.common.status}</th>
                  <th className="px-3 py-2 font-medium">{t.app.common.experiment}</th>
                  <th className="px-3 py-2 text-right font-medium">{ct.dailyBudget}</th>
                  <th className="px-3 py-2 text-right font-medium">{ct.spendToDate}</th>
                  <th className="px-4 py-2 font-medium">{t.app.common.started}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map(({ campaign: c, experimentNumber, experimentName, outcome }) => (
                  <tr key={c.id}>
                    <td className="px-4 py-2.5">
                      <p className="font-medium text-ink">{c.name}</p>
                      <div className="mt-0.5 flex items-center gap-2 text-2xs text-muted">
                        <ChannelBadge channel={c.channel} />
                        {c.isDemo && <span className="rounded-sm border border-dashed border-line-strong px-1">{t.app.common.demoConnection}</span>}
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge tone={STATUS_TONE[c.status as keyof typeof STATUS_TONE] ?? "neutral"}>{t.app.statusValues[c.status] ?? c.status}</Badge>
                    </td>
                    <td className="px-3 py-2.5 text-xs">
                      {experimentNumber ? (
                        <Link href={`${base}/experiments/${experimentNumber}`} className="text-ink hover:underline">
                          {experimentKey(experimentNumber)} {experimentName}
                        </Link>
                      ) : (
                        "—"
                      )}
                      {outcome && <Badge tone={outcome === "winner" ? "positive" : outcome === "loser" ? "negative" : "neutral"} className="ml-2">{t.app.common[outcome as "winner" | "loser" | "inconclusive"] ?? outcome}</Badge>}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular">{c.dailyBudget ? formatUsd(c.dailyBudget, undefined, locale) : "—"}</td>
                    <td className="px-3 py-2.5 text-right tabular">{formatUsd(c.spend, undefined, locale)}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{formatDate(c.createdAt, { month: "short", day: "numeric", year: "numeric" }, locale)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
