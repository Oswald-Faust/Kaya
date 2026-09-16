import { describe, expect, it } from "vitest";
import { recommendTrialPlan, resolvePlanState, trialEnd } from "./plan-state";

const now = new Date("2026-09-15T12:00:00Z");

describe("plan state", () => {
  it("requires a choice before any plan is picked", () => {
    const s = resolvePlanState({ plan: "none", planStatus: "none", trialEndsAt: null }, now);
    expect(s).toMatchObject({ plan: "none", fullAccess: false, needsChoice: true });
  });

  it("gives full access during a live trial and counts days left", () => {
    const s = resolvePlanState({ plan: "launch", planStatus: "trialing", trialEndsAt: trialEnd(now) }, now);
    expect(s).toMatchObject({ status: "trialing", fullAccess: true, needsChoice: false, trialDaysLeft: 14 });
  });

  it("expires a trial past its end date and asks for a choice again", () => {
    const s = resolvePlanState({ plan: "growth", planStatus: "trialing", trialEndsAt: new Date("2026-09-14T00:00:00Z") }, now);
    expect(s).toMatchObject({ status: "expired", fullAccess: false, needsChoice: true });
  });

  it("keeps Free in the dashboard but without full access", () => {
    const s = resolvePlanState({ plan: "free", planStatus: "active", trialEndsAt: null }, now);
    expect(s).toMatchObject({ status: "active", fullAccess: false, needsChoice: false });
  });

  it("keeps access while a renewal is past due", () => {
    const s = resolvePlanState({ plan: "launch", planStatus: "past_due", trialEndsAt: null }, now);
    expect(s).toMatchObject({ status: "past_due", fullAccess: true, needsChoice: false });
  });

  it("sends a canceled subscription back to the plan choice", () => {
    const s = resolvePlanState({ plan: "growth", planStatus: "canceled", trialEndsAt: null }, now);
    expect(s).toMatchObject({ status: "canceled", fullAccess: false, needsChoice: true });
  });

  it("treats unknown plans as unchosen", () => {
    expect(resolvePlanState({ plan: "enterprise-legacy", planStatus: "active", trialEndsAt: null }, now).needsChoice).toBe(true);
  });

  it("recommends Growth only when Launch limits would bind", () => {
    expect(recommendTrialPlan({ monthlyBudget: 750, experiments: 4 })).toBe("launch");
    expect(recommendTrialPlan({ monthlyBudget: 8000, experiments: 4 })).toBe("growth");
    expect(recommendTrialPlan({ monthlyBudget: 500, experiments: 14 })).toBe("growth");
  });
});
