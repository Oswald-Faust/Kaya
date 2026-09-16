import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { integrations, workspaces } from "@/server/db/schema";
import type { MarketingIntegrationAdapter } from "./adapter";
import { providersFor, type Capability } from "./catalog";
import { createDemoAdapter, HostedPagesAdapter } from "./demo-adapters";
import { LiveAdapter } from "./live-adapter";

export interface ResolvedAdapter {
  adapter: MarketingIntegrationAdapter;
  integrationId: string | null;
}

/** Picks a connected integration able to perform `capability`, preferring live connections. */
export async function resolveAdapter(workspaceId: string, capability: Capability): Promise<ResolvedAdapter | null> {
  if (capability === "PUBLISH_LANDING_PAGE") {
    const ws = await db.query.workspaces.findFirst({ where: eq(workspaces.id, workspaceId) });
    return { adapter: new HostedPagesAdapter(workspaceId, ws?.isDemo ? "demo" : "live"), integrationId: null };
  }

  const candidates = providersFor(capability).map((p) => p.provider);
  if (candidates.length === 0) return null;

  const connected = await db
    .select()
    .from(integrations)
    .where(and(eq(integrations.workspaceId, workspaceId), eq(integrations.status, "connected")));

  const usable = connected
    .filter((i) => candidates.includes(i.provider))
    .sort((a, b) => (a.mode === "live" ? -1 : 0) - (b.mode === "live" ? -1 : 0));

  for (const integration of usable) {
    const adapter: MarketingIntegrationAdapter | null =
      integration.mode === "live" ? new LiveAdapter(integration) : createDemoAdapter(integration.provider, workspaceId);
    if (adapter && adapter.capabilities().includes(capability)) {
      return { adapter, integrationId: integration.id };
    }
  }
  return null;
}
