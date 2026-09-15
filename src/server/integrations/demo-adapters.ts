import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { campaigns, creativeAssets } from "@/server/db/schema";
import { DomainError } from "@/server/domain/errors";
import { stableId } from "@/lib/ids";
import { CapabilityNotSupportedError, type AdapterHealth, type AdapterResult, type MarketingIntegrationAdapter } from "./adapter";
import { getIntegration, type Capability } from "./catalog";

/**
 * Demo adapters implement the production contract against local state only.
 * They never call a vendor API. Every result carries `demo: true`, and tool
 * calls made through them are persisted with `is_demo = true`.
 */

function health(): AdapterHealth {
  return { status: "ok", detail: "Demo connection: no external API is called.", checkedAt: new Date().toISOString() };
}

class DemoAdsAdapter implements MarketingIntegrationAdapter {
  readonly mode = "demo" as const;
  constructor(
    readonly provider: string,
    private readonly workspaceId: string,
  ) {}

  capabilities(): Capability[] {
    const def = getIntegration(this.provider);
    return def ? [...def.reads, ...def.writes] : [];
  }

  async read(capability: Capability): Promise<AdapterResult> {
    if (capability !== "READ_AD_INSIGHTS") throw new CapabilityNotSupportedError(this.provider, capability);
    const rows = await db.select().from(campaigns).where(eq(campaigns.workspaceId, this.workspaceId));
    return { data: { demo: true, campaigns: rows.filter((c) => this.matches(c.channel)) } };
  }

  async execute(capability: Capability, input: Record<string, unknown>, opts: { idempotencyKey: string; dryRun: boolean }): Promise<AdapterResult> {
    switch (capability) {
      case "UPDATE_AD_BUDGET": {
        const campaign = await this.campaign(String(input.campaignId));
        const next = Number(input.dailyBudget);
        if (!opts.dryRun) {
          await db
            .update(campaigns)
            .set({ dailyBudget: next })
            .where(and(eq(campaigns.id, campaign.id), eq(campaigns.workspaceId, this.workspaceId)));
        }
        return {
          externalId: campaign.externalId ?? undefined,
          data: { demo: true, dryRun: opts.dryRun, campaignId: campaign.id, previousDailyBudget: campaign.dailyBudget, dailyBudget: next },
        };
      }
      case "PAUSE_CAMPAIGN": {
        const campaign = await this.campaign(String(input.campaignId));
        if (!opts.dryRun) {
          await db
            .update(campaigns)
            .set({ status: "paused" })
            .where(and(eq(campaigns.id, campaign.id), eq(campaigns.workspaceId, this.workspaceId)));
        }
        return { externalId: campaign.externalId ?? undefined, data: { demo: true, dryRun: opts.dryRun, campaignId: campaign.id, status: "paused" } };
      }
      case "CREATE_PAID_CAMPAIGN": {
        const externalId = `demo-${this.provider}-${stableId("camp", opts.idempotencyKey).slice(5, 15)}`;
        const existing = await db.query.campaigns.findFirst({
          where: and(eq(campaigns.workspaceId, this.workspaceId), eq(campaigns.externalId, externalId)),
        });
        if (existing || opts.dryRun) {
          return { externalId, data: { demo: true, dryRun: opts.dryRun, campaignId: existing?.id ?? null, reused: Boolean(existing) } };
        }
        const id = stableId("camp", this.workspaceId, externalId);
        await db.insert(campaigns).values({
          id,
          workspaceId: this.workspaceId,
          experimentId: (input.experimentId as string | undefined) ?? null,
          integrationId: (input.integrationId as string | undefined) ?? null,
          channel: String(input.channel),
          name: String(input.name),
          externalId,
          status: "active",
          dailyBudget: Number(input.dailyBudget),
          isDemo: true,
        });
        return { externalId, data: { demo: true, campaignId: id, status: "active" } };
      }
      default:
        throw new CapabilityNotSupportedError(this.provider, capability);
    }
  }

  async healthCheck(): Promise<AdapterHealth> {
    return health();
  }

  private matches(channel: string): boolean {
    return (this.provider === "google_ads" && channel === "google_search") || (this.provider === "meta_ads" && channel === "meta_ads");
  }

  private async campaign(id: string) {
    const campaign = await db.query.campaigns.findFirst({
      where: and(eq(campaigns.id, id), eq(campaigns.workspaceId, this.workspaceId)),
    });
    if (!campaign) throw new DomainError("not_found", "Campaign not found in this workspace.");
    if (!this.matches(campaign.channel)) throw new DomainError("validation", `${this.provider} does not manage ${campaign.channel} campaigns.`);
    return campaign;
  }
}

/** Read-only demo source for revenue, analytics and search capabilities. Data comes from seeded metric snapshots. */
class DemoReadAdapter implements MarketingIntegrationAdapter {
  readonly mode = "demo" as const;
  constructor(readonly provider: string) {}
  capabilities(): Capability[] {
    return getIntegration(this.provider)?.reads ?? [];
  }
  async read(capability: Capability): Promise<AdapterResult> {
    if (!this.capabilities().includes(capability)) throw new CapabilityNotSupportedError(this.provider, capability);
    return { data: { demo: true, source: "metric_snapshots" } };
  }
  async execute(capability: Capability): Promise<AdapterResult> {
    throw new CapabilityNotSupportedError(this.provider, capability);
  }
  async healthCheck(): Promise<AdapterHealth> {
    return health();
  }
}

/**
 * Pages are hosted by Kaya itself, so publishing is an internal
 * mutation (asset status) rather than a vendor call. It is still an R2
 * Publish action and goes through policy and approval like any other.
 */
export class HostedPagesAdapter implements MarketingIntegrationAdapter {
  readonly provider = "hosted_pages";
  constructor(
    private readonly workspaceId: string,
    readonly mode: "live" | "demo",
  ) {}
  capabilities(): Capability[] {
    return ["PUBLISH_LANDING_PAGE"];
  }
  async read(capability: Capability): Promise<AdapterResult> {
    throw new CapabilityNotSupportedError(this.provider, capability);
  }
  async execute(capability: Capability, input: Record<string, unknown>, opts: { dryRun: boolean }): Promise<AdapterResult> {
    if (capability !== "PUBLISH_LANDING_PAGE") throw new CapabilityNotSupportedError(this.provider, capability);
    const asset = await db.query.creativeAssets.findFirst({
      where: and(eq(creativeAssets.id, String(input.assetId)), eq(creativeAssets.workspaceId, this.workspaceId)),
    });
    if (!asset) throw new DomainError("not_found", "Page draft not found in this workspace.");
    if (!opts.dryRun) {
      await db.update(creativeAssets).set({ status: "published" }).where(eq(creativeAssets.id, asset.id));
    }
    return { externalId: asset.id, data: { demo: this.mode === "demo", dryRun: opts.dryRun, assetId: asset.id, path: input.path, status: "published" } };
  }
  async healthCheck(): Promise<AdapterHealth> {
    return health();
  }
}

export function createDemoAdapter(provider: string, workspaceId: string): MarketingIntegrationAdapter | null {
  const def = getIntegration(provider);
  if (!def) return null;
  if (def.domain === "ads") return new DemoAdsAdapter(provider, workspaceId);
  if (def.writes.length === 0) return new DemoReadAdapter(provider);
  return null;
}
