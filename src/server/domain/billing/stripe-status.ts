/**
 * Maps a Stripe subscription onto the organization's plan columns. Pure so the
 * webhook, the checkout return and the lazy refresh all agree on one rule.
 */

export type PaidPlan = "launch" | "growth";
export type Interval = "month" | "year";

export interface SubscriptionSnapshot {
  status: string;
  trialEnd: number | null;
  metadata: Record<string, string | undefined>;
}

export interface OrgPlanUpdate {
  plan: string;
  planStatus: "trialing" | "active" | "past_due" | "canceled";
  planInterval: Interval | null;
  planActions: number | null;
  trialEndsAt: Date | null;
}

export function planFromSubscription(sub: SubscriptionSnapshot): OrgPlanUpdate | null {
  const plan = sub.metadata.plan;
  if (plan !== "launch" && plan !== "growth") return null;
  const interval: Interval | null = sub.metadata.interval === "year" || sub.metadata.interval === "month" ? sub.metadata.interval : null;
  const actions = Number(sub.metadata.actions);
  const base = { plan, planInterval: interval, planActions: Number.isFinite(actions) && actions > 0 ? actions : null, trialEndsAt: sub.trialEnd ? new Date(sub.trialEnd * 1000) : null };

  switch (sub.status) {
    case "trialing":
      return { ...base, planStatus: "trialing" };
    case "active":
      return { ...base, planStatus: "active" };
    case "past_due":
      return { ...base, planStatus: "past_due" };
    case "canceled":
    case "unpaid":
    case "incomplete_expired":
    case "paused":
      return { ...base, planStatus: "canceled" };
    default:
      // "incomplete": the first payment is still being confirmed; leave the org as it is.
      return null;
  }
}

export function priceLookupKey(plan: PaidPlan, interval: Interval, actions: number): string {
  return `kaya_${plan}_${interval}_${actions}`;
}
