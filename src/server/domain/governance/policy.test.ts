import { describe, expect, it } from "vitest";
import { evaluatePolicy, type BudgetPolicy } from "./policy";

const policy: BudgetPolicy = {
  monthlyBudget: 1000,
  maxDailySpend: 40,
  maxExperimentBudget: 300,
  maxAutoIncreasePct: 0.2,
  autoPauseLosers: true,
  autoLaunchCampaigns: false,
  allowedChannels: [],
  neverWithoutApproval: ["CHANGE_PRICING"],
};

const budgetIncrease = (current: number, proposed: number) => ({
  tool: "ads.update_daily_budget",
  capability: "UPDATE_AD_BUDGET",
  risk: "R3" as const,
  channel: "google_search",
  dailyBudget: { current, proposed },
});

describe("governance policy", () => {
  it("allows read-only actions in observe mode", () => {
    expect(evaluatePolicy({ tool: "metrics.query", capability: "READ_REVENUE", risk: "R0" }, "observe", policy).outcome).toBe(
      "allow",
    );
  });

  it("blocks any write in observe mode", () => {
    expect(evaluatePolicy({ tool: "content.draft", capability: "CREATE_DRAFT", risk: "R1" }, "observe", policy).outcome).toBe(
      "block",
    );
  });

  it("requires approval for spend in copilot mode", () => {
    const d = evaluatePolicy(budgetIncrease(20, 24), "copilot", policy);
    expect(d.outcome).toBe("require_approval");
  });

  it("lets autopilot apply a small increase within guardrails", () => {
    expect(evaluatePolicy(budgetIncrease(20, 24), "autopilot", policy).outcome).toBe("allow");
  });

  it("escalates an increase above the automatic limit even in autopilot", () => {
    const d = evaluatePolicy(budgetIncrease(20, 28), "autopilot", policy);
    expect(d.outcome).toBe("require_approval");
    expect(d.reasons[0]).toContain("+40%");
  });

  it("hard-blocks spend above the daily cap regardless of mode", () => {
    for (const mode of ["copilot", "autopilot"] as const) {
      const d = evaluatePolicy(budgetIncrease(35, 60), mode, policy);
      expect(d.outcome).toBe("block");
      expect(d.reasons.join(" ")).toContain("$40/day cap");
    }
  });

  it("hard-blocks a projected monthly overspend", () => {
    const d = evaluatePolicy({ ...budgetIncrease(20, 24), monthSpendToDate: 900, daysLeftInMonth: 10 }, "autopilot", policy);
    expect(d.outcome).toBe("block");
  });

  it("blocks experiments above the per-experiment cap", () => {
    const d = evaluatePolicy(
      { tool: "experiments.launch", capability: "CREATE_PAID_CAMPAIGN", risk: "R3", totalBudget: 450 },
      "copilot",
      policy,
    );
    expect(d.outcome).toBe("block");
  });

  it("always permits pausing a losing campaign outside observe mode", () => {
    const d = evaluatePolicy(
      { tool: "ads.pause_campaign", capability: "PAUSE_CAMPAIGN", risk: "R3", reducesExposure: true },
      "copilot",
      policy,
    );
    expect(d.outcome).toBe("allow");
  });

  it("never auto-runs capabilities reserved for humans", () => {
    const d = evaluatePolicy({ tool: "pricing.update", capability: "CHANGE_PRICING", risk: "R4" }, "autopilot", policy);
    expect(d.outcome).toBe("require_approval");
  });
});
