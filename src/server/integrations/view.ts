import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { integrations } from "@/server/db/schema";
import { INTEGRATIONS } from "./catalog";
import { LIVE_PROVIDERS } from "./providers";
import { vaultEnabled } from "./vault";

/** What the connect UI needs about a provider. Serializable; never contains secrets. */
export type ConnectSpec =
  | { type: "api_key"; fields: { name: string; label: string; placeholder?: string; secret?: boolean; optional?: boolean; options?: { value: string; label: string }[] }[]; instructions: string[]; docsUrl: string; available: boolean; unavailableReason?: string }
  | { type: "oauth"; available: boolean; unavailableReason?: string; setupUrl: string; scopes: string[] }
  | { type: "none" };

export interface ConnectionView {
  provider: string;
  mode: "live" | "demo";
  status: "connected" | "disconnected" | "error";
  health: string;
  accountId: string | null;
  accountLabel: string | null;
  accounts: { id: string; label: string; detail?: string }[];
  lastSyncAt: string | null;
  lastSyncSummary: string | null;
  syncError: string | null;
}

export function connectSpecs(): Record<string, ConnectSpec> {
  const vault = vaultEnabled();
  return Object.fromEntries(
    INTEGRATIONS.map((def) => {
      const live = LIVE_PROVIDERS[def.provider];
      if (!live) return [def.provider, { type: "none" } satisfies ConnectSpec];
      if (live.auth.type === "api_key") {
        const { fields, instructions, docsUrl } = live.auth;
        return [def.provider, { type: "api_key", fields, instructions, docsUrl, available: vault, unavailableReason: vault ? undefined : "Live connections are disabled: INTEGRATIONS_ENCRYPTION_KEY is missing on the server." } satisfies ConnectSpec];
      }
      const missing = live.auth.missingConfig();
      const reason = !vault ? "Live connections are disabled: INTEGRATIONS_ENCRYPTION_KEY is missing on the server." : missing.length ? `Kaya's ${def.name} app isn't configured yet (${missing.join(", ")}).` : undefined;
      return [def.provider, { type: "oauth", available: !reason, unavailableReason: reason, setupUrl: live.auth.setupUrl, scopes: live.auth.scopes } satisfies ConnectSpec];
    }),
  );
}

export async function connectionViews(workspaceId: string): Promise<ConnectionView[]> {
  const rows = await db.select().from(integrations).where(eq(integrations.workspaceId, workspaceId));
  return rows
    .filter((r) => r.status !== "disconnected")
    .map((r) => ({
      provider: r.provider,
      mode: r.mode,
      status: r.status,
      health: r.health,
      accountId: r.accountId,
      accountLabel: r.accountLabel,
      accounts: r.metadata.accounts ?? [],
      lastSyncAt: r.lastSyncedAt?.toISOString() ?? null,
      lastSyncSummary: r.metadata.lastSync?.summary ?? null,
      syncError: r.syncError,
    }));
}
