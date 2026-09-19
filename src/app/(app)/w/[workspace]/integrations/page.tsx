import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { getI18n } from "@/i18n/server";
import { translateServerText } from "@/i18n/server-text";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Notice } from "@/components/ui/states";
import { relativeTime } from "@/lib/format";
import { requireWorkspace } from "@/server/context";
import { db } from "@/server/db/client";
import { integrations } from "@/server/db/schema";
import { getIntegration } from "@/server/integrations/catalog";
import { connectionViews, connectSpecs } from "@/server/integrations/view";
import { getActiveGoal, getPrimaryProduct } from "@/server/services/workspace";
import { IntegrationsCatalog } from "./catalog";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.app.integrations.metaTitle };
}

const HEALTH_TONE: Record<string, "positive" | "warning" | "negative" | "neutral"> = {
  ok: "positive",
  degraded: "warning",
  failing: "negative",
  unknown: "neutral",
};

export default async function IntegrationsPage({ params }: PageProps<"/w/[workspace]/integrations">) {
  const { workspace } = await params;
  const ctx = await requireWorkspace(workspace);
  const product = await getPrimaryProduct(ctx.workspaceId);
  const [rows, goal, connections] = await Promise.all([
    db.select().from(integrations).where(eq(integrations.workspaceId, ctx.workspaceId)),
    product ? getActiveGoal(ctx.workspaceId, product.id) : Promise.resolve(undefined),
    connectionViews(ctx.workspaceId),
  ]);
  const connected = rows.filter((r) => r.status !== "disconnected");
  const canManage = ctx.role === "owner" || ctx.role === "admin";
  const { t, locale } = await getI18n();
  const it = t.app.integrations;

  return (
    <div className="mx-auto max-w-[1200px] space-y-5 px-3 py-5 sm:px-5 lg:py-6">
      <PageHeader
        tour="int-header"
        title={it.title}
        description={it.description}
      />

      {!canManage && (
        <Notice tone="forbidden" title={it.readOnlyTitle}>
          {it.readOnlyBody}
        </Notice>
      )}

      {connected.length > 0 && (
        <Panel tour="int-connected" className="overflow-hidden">
          <PanelHeader title={it.connected} count={connected.length} />
          <div className="overflow-x-auto border-t border-line">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-2xs text-subtle">
                  <th className="px-4 py-2 font-medium">{it.integration}</th>
                  <th className="px-3 py-2 font-medium">{it.mode}</th>
                  <th className="px-3 py-2 font-medium">{it.health}</th>
                  <th className="px-3 py-2 font-medium">{it.lastSync}</th>
                  <th className="px-4 py-2 font-medium">{it.capabilities}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {connected.map((r) => {
                  const def = getIntegration(r.provider);
                  const tone = HEALTH_TONE[r.health] ?? "neutral";
                  const healthLabel = it.healthValues[r.health] ?? it.healthValues.unknown;
                  return (
                    <tr key={r.id} className="align-top">
                      <td className="px-4 py-2.5">
                        <p className="font-medium text-ink">{def?.name ?? r.provider}</p>
                        {r.accountLabel && <p className="text-2xs text-muted">{r.accountLabel}</p>}
                        {r.syncError && <p className="mt-0.5 max-w-xs text-2xs text-warning">{translateServerText(r.syncError, locale)}</p>}
                      </td>
                      <td className="px-3 py-2.5">
                        {r.mode === "demo" ? (
                          <Badge tone="outline" className="border-dashed">
                            {it.demo}
                          </Badge>
                        ) : (
                          <Badge tone="positive">{it.live}</Badge>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge tone={tone}>{healthLabel}</Badge>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-muted">{r.lastSyncedAt ? relativeTime(r.lastSyncedAt, undefined, locale) : it.never}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex flex-wrap gap-1">
                          {r.grantedCapabilities.map((c) => (
                            <code key={c} className="rounded-sm bg-sunken px-1 text-[10px] text-muted">
                              {c}
                            </code>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      <IntegrationsCatalog
        slug={ctx.workspaceSlug}
        monthlyBudget={goal?.monthlyBudget ?? 0}
        canManage={canManage}
        isDemo={ctx.isDemo}
        connections={connections}
        specs={connectSpecs()}
      />
    </div>
  );
}
