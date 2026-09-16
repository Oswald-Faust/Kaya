import { eq } from "drizzle-orm";
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

export const metadata = { title: "Integrations" };

const HEALTH: Record<string, { label: string; tone: "positive" | "warning" | "negative" | "neutral" }> = {
  ok: { label: "Healthy", tone: "positive" },
  degraded: { label: "Degraded", tone: "warning" },
  failing: { label: "Failing", tone: "negative" },
  unknown: { label: "Unknown", tone: "neutral" },
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

  return (
    <div className="mx-auto max-w-[1200px] space-y-5 px-3 py-5 sm:px-5 lg:py-6">
      <PageHeader
        title="Integrations"
        description="The agent asks for capabilities, like READ_REVENUE or UPDATE_AD_BUDGET, and connected adapters provide them. Every write goes through policy and the audit log."
      />

      {!canManage && (
        <Notice tone="forbidden" title="Read-only access">
          Only workspace owners and admins can connect or disconnect integrations.
        </Notice>
      )}

      {connected.length > 0 && (
        <Panel className="overflow-hidden">
          <PanelHeader title="Connected" count={connected.length} />
          <div className="overflow-x-auto border-t border-line">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-2xs text-subtle">
                  <th className="px-4 py-2 font-medium">Integration</th>
                  <th className="px-3 py-2 font-medium">Mode</th>
                  <th className="px-3 py-2 font-medium">Health</th>
                  <th className="px-3 py-2 font-medium">Last sync</th>
                  <th className="px-4 py-2 font-medium">Capabilities granted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {connected.map((r) => {
                  const def = getIntegration(r.provider);
                  const h = HEALTH[r.health] ?? HEALTH.unknown;
                  return (
                    <tr key={r.id} className="align-top">
                      <td className="px-4 py-2.5">
                        <p className="font-medium text-ink">{def?.name ?? r.provider}</p>
                        {r.accountLabel && <p className="text-2xs text-muted">{r.accountLabel}</p>}
                        {r.syncError && <p className="mt-0.5 max-w-xs text-2xs text-warning">{r.syncError}</p>}
                      </td>
                      <td className="px-3 py-2.5">
                        {r.mode === "demo" ? (
                          <Badge tone="outline" className="border-dashed">
                            Demo
                          </Badge>
                        ) : (
                          <Badge tone="positive">Live</Badge>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge tone={h.tone}>{h.label}</Badge>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-muted">{r.lastSyncedAt ? relativeTime(r.lastSyncedAt) : "Never"}</td>
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
