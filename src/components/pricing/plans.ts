/**
 * Kaya pricing (draft, see docs/decision-log.md D-018). Plans are priced on
 * agent actions: tool calls that do work. Reads, dashboards, briefs and blocked
 * or failed actions are free. Kaya never takes a share of ad spend.
 */

export type PlanId = "free" | "launch" | "growth" | "scale";
export type Tier = { actions: number; monthly: number };

export interface UserSubscriptionSummary {
  plan: PlanId;
  status: "none" | "trialing" | "active" | "past_due" | "canceled" | "expired";
  workspaceSlug: string;
  workspaceName: string;
  trialDaysLeft: number | null;
  billingManaged: boolean;
}

export type Plan = {
  id: PlanId;
  name: string;
  tone: "blue" | "grass" | "pink" | "lilac";
  tagline: string;
  tiers: Tier[] | null;
  spendCap: number | null;
  maxExperiments: number | null;
  maxProducts: number | null;
  cta: { label: string; href: string };
  intro: string;
  features: string[];
  recommended?: boolean;
};

export const ANNUAL_DISCOUNT = 0.1;

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    tone: "blue",
    tagline: "Try Kaya on one product. No card needed.",
    tiers: [{ actions: 200, monthly: 0 }],
    spendCap: 0,
    maxExperiments: 3,
    maxProducts: 1,
    cta: { label: "Start free", href: "/start" },
    intro: "Includes",
    features: ["1 product and 1 seat", "URL analysis and business memory", "Channel strategy and budget plan", "3 experiments at a time", "Observe and Suggest modes", "Stripe and GA4 measurement", "Weekly brief by email"],
  },
  {
    id: "launch",
    name: "Launch",
    tone: "grass",
    tagline: "For founders running their first real growth experiments.",
    tiers: [
      { actions: 2000, monthly: 79 },
      { actions: 5000, monthly: 149 },
      { actions: 10000, monthly: 249 },
    ],
    spendCap: 5000,
    maxExperiments: 10,
    maxProducts: 2,
    cta: { label: "Start 14-day trial", href: "/start" },
    intro: "Everything in Free, plus",
    features: ["2 products and 3 seats", "10 experiments at a time", "Copilot mode with approvals", "Google Ads, Meta and LinkedIn Ads", "SEO and comparison pages", "PostHog, Plausible and Search Console", "Up to $5k/mo ad spend under guardrails"],
  },
  {
    id: "growth",
    name: "Growth",
    tone: "pink",
    recommended: true,
    tagline: "For teams scaling what works across channels.",
    tiers: [
      { actions: 8000, monthly: 249 },
      { actions: 20000, monthly: 449 },
      { actions: 50000, monthly: 899 },
    ],
    spendCap: 25000,
    maxExperiments: null,
    maxProducts: 5,
    cta: { label: "Start 14-day trial", href: "/start" },
    intro: "Everything in Launch, plus",
    features: ["5 products and 10 seats", "Unlimited experiments", "Autopilot inside your guardrails", "Automatic pause of losing ads", "TikTok Ads and community launch drafts", "Lifecycle email with Resend or Brevo", "HubSpot and Attio sync", "Up to $25k/mo ad spend under guardrails", "Priority support"],
  },
  {
    id: "scale",
    name: "Scale",
    tone: "lilac",
    tagline: "For companies running growth as a system.",
    tiers: null,
    spendCap: null,
    maxExperiments: null,
    maxProducts: null,
    cta: { label: "Talk to us", href: "/start" },
    intro: "Everything in Growth, plus",
    features: ["Unlimited products and seats", "Custom policies and approval chains", "SSO and role-based access", "Audit log export", "Unlimited managed ad spend", "Dedicated growth strategist", "Custom agreements"],
  },
];

export function priceFor(tier: Tier, annual: boolean) {
  return annual ? Math.round(tier.monthly * (1 - ANNUAL_DISCOUNT)) : tier.monthly;
}

export type Usage = { products: number; experiments: number; channels: number; spend: number };

/** Estimated monthly agent actions. Deterministic and shown with its formula on the page. */
export function estimateActions(u: Usage) {
  const parts = {
    products: u.products * 150,
    experiments: u.experiments * 180,
    channels: u.channels * 120,
    spend: Math.round((u.spend / 1000) * 60),
  };
  const total = Math.ceil((parts.products + parts.experiments + parts.channels + parts.spend) / 50) * 50;
  return { parts, total };
}

export function recommendPlan(u: Usage): { plan: Plan; tier: Tier | null } {
  const { total } = estimateActions(u);
  for (const plan of PLANS) {
    if (!plan.tiers) return { plan, tier: null };
    const fitsLimits =
      (plan.spendCap === null || u.spend <= plan.spendCap) &&
      (plan.maxExperiments === null || u.experiments <= plan.maxExperiments) &&
      (plan.maxProducts === null || u.products <= plan.maxProducts);
    const tier = plan.tiers.find((t) => t.actions >= total);
    if (fitsLimits && tier) return { plan, tier };
  }
  return { plan: PLANS[PLANS.length - 1], tier: null };
}
