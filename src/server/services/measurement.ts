import "server-only";
import { and, eq, isNotNull } from "drizzle-orm";
import { db } from "@/server/db/client";
import { campaigns, creativeAssets, experiments, integrations, products } from "@/server/db/schema";
import { assessReadiness, measurementPlanFor, proofUrlProblem, trackedLink, type MeasurementPlan, type Readiness } from "@/server/domain/experiments/measurement";
import { DomainError } from "@/server/domain/errors";
import type { Capability } from "@/server/integrations/catalog";
import type { Locale } from "@/i18n/config";
import { validateAndSetPublishedUrl, type ValidateUrlResult } from "./experiments";

type ExperimentRow = typeof experiments.$inferSelect;
type Actor = { type: "agent" | "user"; id: string };

export interface MeasurementContext {
  plan: MeasurementPlan;
  readiness: Readiness;
  trackedLink: string | null;
  productUrl: string | null;
  proofUrl: string | null;
  connected: Capability[];
}

/** Everything needed to launch, prove and evaluate one experiment, from live workspace state. */
export async function measurementContext(workspaceId: string, exp: ExperimentRow): Promise<MeasurementContext> {
  const plan = measurementPlanFor(exp);
  const [product, connectedRows, linkedCampaign, sentEmail] = await Promise.all([
    db.query.products.findFirst({ where: eq(products.id, exp.productId) }),
    db.select({ caps: integrations.grantedCapabilities }).from(integrations).where(and(eq(integrations.workspaceId, workspaceId), eq(integrations.status, "connected"))),
    db.query.campaigns.findFirst({ where: and(eq(campaigns.workspaceId, workspaceId), eq(campaigns.experimentId, exp.id), isNotNull(campaigns.externalId)) }),
    db.query.creativeAssets.findFirst({ where: and(eq(creativeAssets.workspaceId, workspaceId), eq(creativeAssets.experimentId, exp.id), eq(creativeAssets.kind, "email"), eq(creativeAssets.status, "published")) }),
  ]);
  const connected = [...new Set(connectedRows.flatMap((r) => r.caps))] as Capability[];
  const proofUrl = exp.publishedUrl ?? null;
  return {
    plan,
    readiness: assessReadiness(plan, { proofUrl, campaignLinked: Boolean(linkedCampaign), sent: Boolean(sentEmail), connected }),
    trackedLink: product?.url ? trackedLink(product.url, plan, exp.number) : null,
    productUrl: product?.url ?? null,
    proofUrl,
    connected,
  };
}

/**
 * Verifies the proof that an experiment is live (the page, the HN item, the
 * post) against the plan's rules, pings it, stores it and optionally starts the experiment.
 */
export async function verifyLaunchProof(workspaceId: string, exp: ExperimentRow, url: string, actor: Actor, opts: { launch?: boolean; locale?: Locale } = {}): Promise<ValidateUrlResult> {
  const plan = measurementPlanFor(exp);
  if (plan.proof.kind === "none" || plan.proof.kind === "campaign_link" || plan.proof.kind === "send_record") {
    throw new DomainError("validation", `This experiment is proven live by: ${plan.proof.label.toLowerCase()}, not a URL.`);
  }
  const product = await db.query.products.findFirst({ where: eq(products.id, exp.productId) });
  const problem = proofUrlProblem(url.trim(), plan, product?.url ?? null);
  if (problem) return { ok: false, error: problem };
  return validateAndSetPublishedUrl(workspaceId, exp.id, url.trim(), actor, opts);
}
