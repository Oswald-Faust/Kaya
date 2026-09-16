import { PLANS, priceFor } from "@/components/pricing/plans";

/** Monthly recurring revenue of one organization, from its plan columns. Trials and Free count as 0. */
export function monthlyRevenue(org: { plan: string; planStatus: string; planInterval: string | null; planActions: number | null }): number {
  if (org.planStatus !== "active" && org.planStatus !== "past_due") return 0;
  return listPrice(org);
}

/** What the organization will pay per month once billed (used for trial pipeline). */
export function listPrice(org: { plan: string; planInterval: string | null; planActions: number | null }): number {
  const plan = PLANS.find((p) => p.id === org.plan);
  if (!plan?.tiers) return 0;
  const tier = plan.tiers.find((t) => t.actions === org.planActions) ?? plan.tiers[0];
  return priceFor(tier, org.planInterval === "year");
}

/** Buckets rows into one count per day for the last `days` days (oldest first). */
export function dailyCounts(dates: Date[], days: number, now: Date = new Date()): { x: string; y: number }[] {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - (days - 1)));
  const buckets = Array.from({ length: days }, (_, i) => ({ x: new Date(start.getTime() + i * 86_400_000).toISOString().slice(0, 10), y: 0 }));
  for (const d of dates) {
    const i = Math.floor((d.getTime() - start.getTime()) / 86_400_000);
    if (i >= 0 && i < days) buckets[i].y++;
  }
  return buckets;
}
