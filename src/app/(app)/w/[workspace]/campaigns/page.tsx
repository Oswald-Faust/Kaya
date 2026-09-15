import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { Badge, ChannelBadge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { EmptyState } from "@/components/ui/states";
import { experimentKey, formatDate, formatUsd } from "@/lib/format";
import { requireWorkspace } from "@/server/context";
import { db } from "@/server/db/client";
import { campaigns, experiments } from "@/server/db/schema";

export const metadata = { title: "Campaigns" };

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
  const activeDaily = rows.filter((r) => r.campaign.status === "active").reduce((s, r) => s + (r.campaign.dailyBudget ?? 0), 0);

  return (
    <div className="mx-auto max-w-[1200px] space-y-5 px-3 py-5 sm:px-5 lg:py-6">
      <PageHeader
        title="Campaigns"
        description="Cross-channel control plane. Every campaign exists to run an experiment, so its spend can be judged against a threshold."
        meta={<span className="text-xs text-muted tabular">{formatUsd(activeDaily)}/day across active campaigns</span>}
      />
      <Panel className="overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState title="No campaigns yet" description="Campaigns are created when you approve a paid experiment launch." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-2xs text-subtle">
                  <th className="px-4 py-2 font-medium">Campaign</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Experiment</th>
                  <th className="px-3 py-2 text-right font-medium">Daily budget</th>
                  <th className="px-3 py-2 text-right font-medium">Spend to date</th>
                  <th className="px-4 py-2 font-medium">Started</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map(({ campaign: c, experimentNumber, experimentName, outcome }) => (
                  <tr key={c.id}>
                    <td className="px-4 py-2.5">
                      <p className="font-medium text-ink">{c.name}</p>
                      <div className="mt-0.5 flex items-center gap-2 text-2xs text-muted">
                        <ChannelBadge channel={c.channel} />
                        {c.isDemo && <span className="rounded-sm border border-dashed border-line-strong px-1">demo connection</span>}
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge tone={STATUS_TONE[c.status as keyof typeof STATUS_TONE] ?? "neutral"}>{c.status}</Badge>
                    </td>
                    <td className="px-3 py-2.5 text-xs">
                      {experimentNumber ? (
                        <Link href={`${base}/experiments/${experimentNumber}`} className="text-ink hover:underline">
                          {experimentKey(experimentNumber)} {experimentName}
                        </Link>
                      ) : (
                        "—"
                      )}
                      {outcome && <Badge tone={outcome === "winner" ? "positive" : outcome === "loser" ? "negative" : "neutral"} className="ml-2">{outcome}</Badge>}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular">{c.dailyBudget ? formatUsd(c.dailyBudget) : "—"}</td>
                    <td className="px-3 py-2.5 text-right tabular">{formatUsd(c.spend)}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{formatDate(c.createdAt, { month: "short", day: "numeric", year: "numeric" })}</td>
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
