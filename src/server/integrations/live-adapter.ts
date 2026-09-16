import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { campaigns, integrations } from "@/server/db/schema";
import { DomainError } from "@/server/domain/errors";
import { CapabilityNotSupportedError, type AdapterHealth, type AdapterResult, type MarketingIntegrationAdapter } from "./adapter";
import type { Capability } from "./catalog";
import { withConnection } from "./connections";
import { getLiveProvider } from "./providers";

type IntegrationRow = typeof integrations.$inferSelect;

/**
 * Production adapter: every call goes to the vendor's API with the workspace's
 * own credentials. Dry runs never call a write endpoint.
 */
export class LiveAdapter implements MarketingIntegrationAdapter {
  readonly mode = "live" as const;
  readonly provider: string;

  constructor(private readonly row: IntegrationRow) {
    this.provider = row.provider;
  }

  capabilities(): Capability[] {
    const live = getLiveProvider(this.provider);
    return (live?.liveCapabilities ?? []).filter((c) => this.row.grantedCapabilities.includes(c));
  }

  async read(capability: Capability, input: Record<string, unknown>): Promise<AdapterResult> {
    if (!this.capabilities().includes(capability)) throw new CapabilityNotSupportedError(this.provider, capability);
    const data = await withConnection(this.row, (live, ctx) => (live.read ? live.read(capability, input, ctx) : live.sync(ctx).then((r) => r.data)));
    return { data: { ...data, live: true, provider: this.provider, account: this.row.accountLabel } };
  }

  async execute(capability: Capability, input: Record<string, unknown>, opts: { idempotencyKey: string; dryRun: boolean }): Promise<AdapterResult> {
    if (!this.capabilities().includes(capability)) throw new CapabilityNotSupportedError(this.provider, capability);
    const payload = { ...input };

    // Ad tools address campaigns by Kaya id; the vendor needs its own id.
    if ((capability === "PAUSE_CAMPAIGN" || capability === "UPDATE_AD_BUDGET") && typeof input.campaignId === "string") {
      const campaign = await db.query.campaigns.findFirst({ where: and(eq(campaigns.id, input.campaignId), eq(campaigns.workspaceId, this.row.workspaceId)) });
      if (!campaign?.externalId) throw new DomainError("validation", "This campaign isn't linked to an ad account campaign.");
      payload.externalId = campaign.externalId;
    }

    if (opts.dryRun) return { data: { dryRun: true, live: true, provider: this.provider, wouldSend: payload } };

    const live = getLiveProvider(this.provider);
    if (!live?.execute) throw new CapabilityNotSupportedError(this.provider, capability);
    const result = await withConnection(this.row, (p, ctx) => p.execute!(capability, payload, { ...ctx, idempotencyKey: opts.idempotencyKey }));
    return { externalId: result.externalId, data: { ...result.data, live: true, provider: this.provider } };
  }

  async healthCheck(): Promise<AdapterHealth> {
    try {
      await withConnection(this.row, (live, ctx) => live.verify(ctx.credentials));
      return { status: "ok", detail: `Connected to ${this.row.accountLabel ?? this.provider}`, checkedAt: new Date().toISOString() };
    } catch (error) {
      return { status: "failing", detail: error instanceof Error ? error.message : String(error), checkedAt: new Date().toISOString() };
    }
  }
}
