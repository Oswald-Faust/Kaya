import { describe, expect, it } from "vitest";
import { dailyCounts, listPrice, monthlyRevenue } from "./metrics";

describe("admin metrics", () => {
  it("counts MRR only for billed plans, at the annual discount when yearly", () => {
    expect(monthlyRevenue({ plan: "launch", planStatus: "active", planInterval: "month", planActions: 2000 })).toBe(79);
    expect(monthlyRevenue({ plan: "growth", planStatus: "past_due", planInterval: "year", planActions: 20000 })).toBe(404);
    expect(monthlyRevenue({ plan: "growth", planStatus: "trialing", planInterval: "month", planActions: 8000 })).toBe(0);
    expect(monthlyRevenue({ plan: "free", planStatus: "active", planInterval: null, planActions: 200 })).toBe(0);
  });

  it("prices a trial at what it will convert to", () => {
    expect(listPrice({ plan: "growth", planInterval: "month", planActions: 8000 })).toBe(249);
  });

  it("buckets dates per UTC day, ignoring anything outside the window", () => {
    const now = new Date("2026-09-16T12:00:00Z");
    const counts = dailyCounts([new Date("2026-09-16T01:00:00Z"), new Date("2026-09-15T23:00:00Z"), new Date("2026-09-15T02:00:00Z"), new Date("2026-08-01T00:00:00Z")], 3, now);
    expect(counts).toEqual([
      { x: "2026-09-14", y: 0 },
      { x: "2026-09-15", y: 2 },
      { x: "2026-09-16", y: 1 },
    ]);
  });
});
