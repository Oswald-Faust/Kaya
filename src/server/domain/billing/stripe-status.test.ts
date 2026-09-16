import { describe, expect, it } from "vitest";
import { planFromSubscription, priceLookupKey } from "./stripe-status";

const metadata = { plan: "growth", interval: "year", actions: "20000" };

describe("stripe subscription mapping", () => {
  it("maps a trial with its end date and plan details", () => {
    const u = planFromSubscription({ status: "trialing", trialEnd: 1_790_000_000, metadata });
    expect(u).toEqual({ plan: "growth", planStatus: "trialing", planInterval: "year", planActions: 20000, trialEndsAt: new Date(1_790_000_000_000) });
  });

  it("maps active, past due and ended subscriptions", () => {
    expect(planFromSubscription({ status: "active", trialEnd: null, metadata })?.planStatus).toBe("active");
    expect(planFromSubscription({ status: "past_due", trialEnd: null, metadata })?.planStatus).toBe("past_due");
    for (const status of ["canceled", "unpaid", "incomplete_expired", "paused"]) {
      expect(planFromSubscription({ status, trialEnd: null, metadata })?.planStatus).toBe("canceled");
    }
  });

  it("ignores incomplete subscriptions and ones without Kaya metadata", () => {
    expect(planFromSubscription({ status: "incomplete", trialEnd: null, metadata })).toBeNull();
    expect(planFromSubscription({ status: "active", trialEnd: null, metadata: { plan: "other" } })).toBeNull();
  });

  it("builds stable price lookup keys", () => {
    expect(priceLookupKey("launch", "month", 2000)).toBe("kaya_launch_month_2000");
  });
});
