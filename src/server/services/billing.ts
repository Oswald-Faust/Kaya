import "server-only";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import type Stripe from "stripe";
import type { WorkspaceContext } from "@/server/context";
import { db } from "@/server/db/client";
import * as t from "@/server/db/schema";
import { stripe } from "@/server/billing/stripe";
import { DomainError } from "@/server/domain/errors";
import { resolvePlanState, trialEnd, TRIAL_DAYS, type PlanState } from "@/server/domain/billing/plan-state";
import { planFromSubscription, priceLookupKey, type Interval, type PaidPlan } from "@/server/domain/billing/stripe-status";
import { billingEnabled, env } from "@/server/env";
import { PLANS, priceFor } from "@/components/pricing/plans";
import { recordAudit } from "./audit";

/**
 * Plan selection and payments. With Stripe configured, paid plans go through
 * Checkout (card collected, 14-day trial on the first subscription) and Stripe
 * stays the source of truth: the checkout return, the webhook and a lazy refresh
 * all run the same sync. Without Stripe, trials start without a card.
 */

export type WorkspacePlan = PlanState & {
  /** A Stripe subscription exists: changes go through the billing portal. */
  billingManaged: boolean;
};

type OrgRow = typeof t.organizations.$inferSelect;

async function loadOrg(organizationId: string): Promise<OrgRow | undefined> {
  return db.query.organizations.findFirst({ where: eq(t.organizations.id, organizationId) });
}

function toPlan(org: OrgRow | undefined): WorkspacePlan {
  const state = resolvePlanState(org ?? { plan: "none", planStatus: "none", trialEndsAt: null });
  const live = state.status === "trialing" || state.status === "active" || state.status === "past_due";
  return { ...state, billingManaged: Boolean(org?.stripeSubscriptionId) && live };
}

export async function getPlanState(organizationId: string): Promise<WorkspacePlan> {
  let org = await loadOrg(organizationId);
  // A trial that looks over may already have converted: ask Stripe before locking the founder out.
  if (org?.stripeSubscriptionId && billingEnabled && resolvePlanState(org).status === "expired") {
    try {
      await syncSubscription(org.stripeSubscriptionId);
      org = await loadOrg(organizationId);
    } catch (error) {
      console.error(JSON.stringify({ level: "warn", msg: "stripe_lazy_sync_failed", organizationId, error: String(error) }));
    }
  }
  return toPlan(org);
}

function assertCanManage(ctx: WorkspaceContext) {
  if (ctx.isDemo) throw new DomainError("validation", "The demo workspace can't change plans.");
  if (ctx.role !== "owner" && ctx.role !== "admin") throw new DomainError("validation", "Only an owner or admin can choose the plan.");
}

function tierFor(plan: PaidPlan, actions: number) {
  const tier = PLANS.find((p) => p.id === plan)?.tiers?.find((x) => x.actions === actions);
  if (!tier) throw new DomainError("validation", "That plan size doesn't exist.");
  return tier;
}

async function appOrigin(): Promise<string> {
  if (env.APP_URL) return env.APP_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/** Trial without Stripe (local setups with no keys). One trial per organization. */
export async function startTrial(ctx: WorkspaceContext, plan: PaidPlan, interval: Interval, actions: number): Promise<void> {
  assertCanManage(ctx);
  tierFor(plan, actions);
  const current = await getPlanState(ctx.organizationId);
  if (current.status !== "trialing" && current.status !== "none" && !(current.status === "active" && current.plan === "free")) {
    throw new DomainError("conflict", "Your trial has already been used. Choose a paid plan to continue.");
  }
  const endsAt = current.status === "trialing" && current.trialEndsAt ? current.trialEndsAt : trialEnd();
  await db.transaction(async (tx) => {
    await tx
      .update(t.organizations)
      .set({ plan, planStatus: "trialing", planInterval: interval, planActions: actions, trialEndsAt: endsAt })
      .where(eq(t.organizations.id, ctx.organizationId));
    await tx.update(t.products).set({ onboardingStep: "done", updatedAt: new Date() }).where(eq(t.products.workspaceId, ctx.workspaceId));
    await recordAudit(tx, {
      workspaceId: ctx.workspaceId,
      actorType: "user",
      actorId: ctx.userId,
      action: "plan.trial_started",
      targetType: "organization",
      targetId: ctx.organizationId,
      payload: { plan, interval, actions, trialEndsAt: endsAt.toISOString() },
    });
  });
}

/** Stripe prices are created on first use from the plans in code, keyed by a stable lookup key. */
async function ensurePrice(plan: PaidPlan, interval: Interval, actions: number): Promise<string> {
  const s = stripe();
  const def = PLANS.find((p) => p.id === plan)!;
  const tier = tierFor(plan, actions);
  const amount = interval === "year" ? priceFor(tier, true) * 12 * 100 : tier.monthly * 100;
  const lookupKey = priceLookupKey(plan, interval, actions);

  const existing = await s.prices.list({ lookup_keys: [lookupKey], active: true, limit: 1 });
  const found = existing.data[0];
  if (found && found.unit_amount === amount && found.currency === "usd") return found.id;

  const productId = `kaya_${plan}`;
  try {
    await s.products.retrieve(productId);
  } catch (error) {
    if ((error as Stripe.errors.StripeError).code !== "resource_missing") throw error;
    await s.products.create({ id: productId, name: `Kaya ${def.name}`, description: def.tagline, metadata: { plan } }, { idempotencyKey: `product-${productId}` });
  }
  const price = await s.prices.create(
    {
      product: productId,
      currency: "usd",
      unit_amount: amount,
      recurring: { interval },
      lookup_key: lookupKey,
      transfer_lookup_key: Boolean(found),
      nickname: `${def.name} · ${actions.toLocaleString("en-US")} actions · ${interval === "year" ? "annual" : "monthly"}`,
      metadata: { plan, interval, actions: String(actions) },
    },
    { idempotencyKey: `price-${lookupKey}-${amount}` },
  );
  return price.id;
}

async function ensureCustomer(ctx: WorkspaceContext, org: OrgRow): Promise<string> {
  if (org.stripeCustomerId) return org.stripeCustomerId;
  const customer = await stripe().customers.create(
    { email: ctx.email || undefined, name: org.name, metadata: { organizationId: org.id, workspaceId: ctx.workspaceId } },
    { idempotencyKey: `customer-${org.id}` },
  );
  await db.update(t.organizations).set({ stripeCustomerId: customer.id }).where(eq(t.organizations.id, org.id));
  return customer.id;
}

/** Returns the Stripe Checkout URL for a paid plan. The first subscription gets the 14-day trial. */
export async function createCheckout(ctx: WorkspaceContext, plan: PaidPlan, interval: Interval, actions: number): Promise<string> {
  assertCanManage(ctx);
  const org = await loadOrg(ctx.organizationId);
  if (!org) throw new DomainError("not_found", "Organization not found.");
  const state = toPlan(org);
  if (state.billingManaged) throw new DomainError("conflict", "You already have a subscription. Manage it from billing.");

  // One trial per organization: a past subscription or an expired no-card trial means straight to paid.
  const trialEligible = !org.stripeSubscriptionId && (state.status === "none" || (state.status === "active" && state.plan === "free"));
  const [price, customer, origin] = await Promise.all([ensurePrice(plan, interval, actions), ensureCustomer(ctx, org), appOrigin()]);
  const metadata = { organizationId: org.id, workspaceId: ctx.workspaceId, workspaceSlug: ctx.workspaceSlug, userId: ctx.userId, plan, interval, actions: String(actions) };

  const session = await stripe().checkout.sessions.create({
    mode: "subscription",
    customer,
    client_reference_id: org.id,
    line_items: [{ price, quantity: 1 }],
    payment_method_collection: "always",
    allow_promotion_codes: true,
    customer_update: { name: "auto", address: "auto" },
    billing_address_collection: "auto",
    metadata,
    subscription_data: {
      metadata,
      ...(trialEligible ? { trial_period_days: TRIAL_DAYS, trial_settings: { end_behavior: { missing_payment_method: "cancel" as const } } } : {}),
    },
    success_url: `${origin}/api/stripe/checkout?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/start/${ctx.workspaceSlug}/plan?canceled=1`,
  });
  if (!session.url) throw new DomainError("upstream", "Stripe didn't return a checkout page. Please try again.");
  return session.url;
}

/** Called when the founder comes back from Checkout. Activates the plan without waiting for the webhook. */
export async function completeCheckout(ctx: WorkspaceContext, sessionId: string): Promise<boolean> {
  const session = await stripe().checkout.sessions.retrieve(sessionId);
  if (session.metadata?.organizationId !== ctx.organizationId) throw new DomainError("forbidden", "This checkout belongs to another workspace.");
  if (session.status !== "complete" || !session.subscription) return false;
  await syncSubscription(typeof session.subscription === "string" ? session.subscription : session.subscription.id);
  return true;
}

/**
 * Copies a subscription's current state from Stripe onto its organization.
 * Always re-reads the subscription, so out-of-order or replayed webhooks are harmless.
 */
export async function syncSubscription(subscriptionId: string): Promise<void> {
  const sub = await stripe().subscriptions.retrieve(subscriptionId);
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const org =
    (sub.metadata.organizationId && (await loadOrg(sub.metadata.organizationId))) ||
    (await db.query.organizations.findFirst({ where: eq(t.organizations.stripeCustomerId, customerId) }));
  if (!org) {
    console.error(JSON.stringify({ level: "warn", msg: "stripe_subscription_without_org", subscriptionId }));
    return;
  }
  // An older, ended subscription must not overwrite the one the organization now uses.
  if (org.stripeSubscriptionId && org.stripeSubscriptionId !== sub.id && ["canceled", "incomplete_expired", "unpaid"].includes(sub.status)) return;

  const update = planFromSubscription({ status: sub.status, trialEnd: sub.trial_end, metadata: sub.metadata });
  if (!update) return;

  const workspace =
    (sub.metadata.workspaceId && (await db.query.workspaces.findFirst({ where: eq(t.workspaces.id, sub.metadata.workspaceId) }))) ||
    (await db.query.workspaces.findFirst({ where: eq(t.workspaces.organizationId, org.id) }));
  const changed = org.plan !== update.plan || org.planStatus !== update.planStatus || org.stripeSubscriptionId !== sub.id;

  await db.transaction(async (tx) => {
    await tx
      .update(t.organizations)
      .set({ ...update, stripeCustomerId: customerId, stripeSubscriptionId: sub.id })
      .where(eq(t.organizations.id, org.id));
    if (workspace && update.planStatus !== "canceled") {
      await tx.update(t.products).set({ onboardingStep: "done", updatedAt: new Date() }).where(eq(t.products.workspaceId, workspace.id));
    }
    if (workspace && changed) {
      await recordAudit(tx, {
        workspaceId: workspace.id,
        actorType: "system",
        actorId: "stripe",
        action: `plan.subscription_${update.planStatus}`,
        targetType: "organization",
        targetId: org.id,
        payload: { subscriptionId: sub.id, plan: update.plan, interval: update.planInterval, actions: update.planActions, trialEndsAt: update.trialEndsAt?.toISOString() ?? null },
      });
    }
  });
}

let portalConfigurationId: string | null = null;

async function portalConfiguration(): Promise<string> {
  if (portalConfigurationId) return portalConfigurationId;
  const s = stripe();
  const existing = await s.billingPortal.configurations.list({ active: true, limit: 10 });
  const found = existing.data.find((c) => c.metadata?.app === "kaya") ?? existing.data.find((c) => c.is_default);
  const config =
    found ??
    (await s.billingPortal.configurations.create(
      {
        business_profile: { headline: "Manage your Kaya subscription" },
        features: {
          invoice_history: { enabled: true },
          payment_method_update: { enabled: true },
          customer_update: { enabled: true, allowed_updates: ["email", "name", "address", "tax_id"] },
          subscription_cancel: { enabled: true, mode: "at_period_end", cancellation_reason: { enabled: true, options: ["too_expensive", "missing_features", "switched_service", "unused", "other"] } },
        },
        metadata: { app: "kaya" },
      },
      { idempotencyKey: "kaya-portal-configuration-v1" },
    ));
  portalConfigurationId = config.id;
  return config.id;
}

export async function billingPortalUrl(ctx: WorkspaceContext): Promise<string> {
  assertCanManage(ctx);
  const org = await loadOrg(ctx.organizationId);
  if (!org?.stripeCustomerId) throw new DomainError("not_found", "There is no billing account for this workspace yet.");
  const [configuration, origin] = await Promise.all([portalConfiguration(), appOrigin()]);
  const session = await stripe().billingPortal.sessions.create({ customer: org.stripeCustomerId, configuration, return_url: `${origin}/w/${ctx.workspaceSlug}` });
  return session.url;
}

export async function chooseFree(ctx: WorkspaceContext): Promise<void> {
  assertCanManage(ctx);
  if ((await getPlanState(ctx.organizationId)).billingManaged) {
    throw new DomainError("conflict", "Cancel your subscription from billing to move to Free.");
  }
  await db.transaction(async (tx) => {
    await tx
      .update(t.organizations)
      .set({ plan: "free", planStatus: "active", planInterval: null, planActions: 200 })
      .where(eq(t.organizations.id, ctx.organizationId));
    await tx.update(t.products).set({ onboardingStep: "done", updatedAt: new Date() }).where(eq(t.products.workspaceId, ctx.workspaceId));
    await tx.update(t.workspaces).set({ autonomyMode: "suggest" }).where(eq(t.workspaces.id, ctx.workspaceId));
    await recordAudit(tx, {
      workspaceId: ctx.workspaceId,
      actorType: "user",
      actorId: ctx.userId,
      action: "plan.free_selected",
      targetType: "organization",
      targetId: ctx.organizationId,
      payload: {},
    });
  });
}
