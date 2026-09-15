import { describe, expect, it } from "vitest";
import { scoreAllChannels } from "./channel-fit";
import { generateStrategy, slugKey, type StrategyInput } from "./generate";
import { GOAL_TEMPLATES, goalTitle } from "./goals";

function input(monthlyBudget: number, overrides: Partial<StrategyInput> = {}): StrategyInput {
  return {
    productName: "Shipwright",
    oneLiner: "Preview environments for every pull request.",
    category: "Developer tools",
    valueProposition: "Review code by clicking, not pulling branches",
    features: ["One preview per pull request", "Seeded databases", "Works with any cloud"],
    icps: [{ name: "Engineering teams at startups", confidence: 0.7 }],
    competitors: [{ name: "Heroku Review Apps", wedge: null }],
    arpuMonthly: 49,
    goal: { template: "first_customers", title: "Get my first 10 customers", baseline: 0, target: 10, deadline: "2026-12-31", monthlyBudget },
    hasRevenueData: false,
    channelFits: scoreAllChannels({ audience: "developers", arpuMonthly: 49, monthlyBudget, searchIntent: "high", traction: {}, evidence: [] }),
    ...overrides,
  };
}

describe("strategy generation", () => {
  it("respects an organic-only budget", () => {
    const s = generateStrategy(input(0));
    expect(s.experiments.every((e) => e.budget === 0)).toBe(true);
    expect(s.content.budget.allocation).toHaveLength(0);
    expect(s.experiments.map((e) => e.channel)).not.toContain("google_search");
  });

  it("funds high-intent search when budget allows, within 40% of the monthly budget", () => {
    const s = generateStrategy(input(1000));
    const search = s.experiments.find((e) => e.channel === "google_search");
    expect(search).toBeDefined();
    expect(search!.budget).toBeLessThanOrEqual(400);
    expect(search!.successThreshold).toBe(147);
  });

  it("never proposes channels it tells you to avoid", () => {
    const s = generateStrategy(input(1000));
    const avoided = new Set(s.content.channelsToAvoid.map((c) => c.channel));
    expect(avoided.size).toBeGreaterThan(0);
    expect(s.experiments.some((e) => avoided.has(e.channel))).toBe(false);
  });

  it("uses the competitor for a comparison page and produces valid similarity keys", () => {
    const s = generateStrategy(input(1000));
    expect(s.experiments.find((e) => e.channel === "seo_content")?.similarityKey).toBe("seo_content:comparison_page:heroku_review_apps");
    for (const e of s.experiments) expect(e.similarityKey).toMatch(/^[a-z_]+:[a-z_]+:[a-z0-9_]+$/);
  });

  it("states missing data as a hypothesis and asks to connect revenue", () => {
    const s = generateStrategy(input(500));
    expect(s.content.situation).toContain("hypothesis");
    expect(s.content.plan.days30[0]).toMatch(/Connect revenue/);
    expect(s.content.assumptions[0].statement).toContain("Engineering teams at startups");
  });

  it("builds readable goal titles", () => {
    const grow = GOAL_TEMPLATES.find((t) => t.id === "grow_mrr")!;
    expect(goalTitle(grow, 5000, 10000)).toBe("Grow MRR from $5k to $10k");
    expect(slugKey("Healthchecks.io")).toBe("healthchecks_io");
  });
});
