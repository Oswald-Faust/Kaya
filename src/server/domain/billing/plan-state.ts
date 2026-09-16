/**
 * Plan entitlements, decided in code. A workspace has full strategy access and
 * the dashboard only on a paid plan or a live trial; Free sees a teaser.
 */

export type PlanId = "none" | "free" | "launch" | "growth" | "scale";
export type PlanStatus = "none" | "trialing" | "active" | "past_due" | "canceled" | "expired";

export interface OrgPlanRow {
  plan: string;
  planStatus: string;
  trialEndsAt: Date | null;
}

export interface PlanState {
  plan: PlanId;
  status: PlanStatus;
  trialEndsAt: Date | null;
  trialDaysLeft: number | null;
  /** Full strategy, experiments launch and autonomy beyond Suggest. */
  fullAccess: boolean;
  /** The founder must choose (or renew) a plan before entering the dashboard. */
  needsChoice: boolean;
}

export const TRIAL_DAYS = 14;
const DAY_MS = 86_400_000;
const PAID: PlanId[] = ["launch", "growth", "scale"];

export function resolvePlanState(row: OrgPlanRow, now: Date = new Date()): PlanState {
  const plan: PlanId = (["free", "launch", "growth", "scale"] as const).includes(row.plan as never) ? (row.plan as PlanId) : "none";
  if (plan === "none") {
    return { plan, status: "none", trialEndsAt: null, trialDaysLeft: null, fullAccess: false, needsChoice: true };
  }
  if (row.planStatus === "trialing") {
    const remaining = row.trialEndsAt ? row.trialEndsAt.getTime() - now.getTime() : -1;
    if (remaining <= 0) {
      return { plan, status: "expired", trialEndsAt: row.trialEndsAt, trialDaysLeft: 0, fullAccess: false, needsChoice: true };
    }
    return { plan, status: "trialing", trialEndsAt: row.trialEndsAt, trialDaysLeft: Math.ceil(remaining / DAY_MS), fullAccess: PAID.includes(plan), needsChoice: false };
  }
  if (row.planStatus === "canceled") {
    return { plan, status: "canceled", trialEndsAt: row.trialEndsAt, trialDaysLeft: null, fullAccess: false, needsChoice: true };
  }
  // A failed renewal keeps access while Stripe retries the card; the app asks for a new one.
  const status: PlanStatus = row.planStatus === "past_due" ? "past_due" : "active";
  return { plan, status, trialEndsAt: row.trialEndsAt, trialDaysLeft: null, fullAccess: PAID.includes(plan), needsChoice: false };
}

export function trialEnd(now: Date = new Date()): Date {
  return new Date(now.getTime() + TRIAL_DAYS * DAY_MS);
}

/** Growth when the strategy needs more than Launch allows (spend cap $5k, 10 experiments). */
export function recommendTrialPlan(input: { monthlyBudget: number; experiments: number }): "launch" | "growth" {
  return input.monthlyBudget > 5000 || input.experiments > 10 ? "growth" : "launch";
}
