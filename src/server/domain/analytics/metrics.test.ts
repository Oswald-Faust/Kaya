import { describe, expect, it } from "vitest";
import { computeKpis, goalProgress, pctChange, splitWindows, totals, type DailyMetricsRow } from "./metrics";

function row(day: string, overrides: Partial<DailyMetricsRow> = {}): DailyMetricsRow {
  return {
    day,
    impressions: 1000,
    clicks: 50,
    visits: 400,
    signups: 20,
    activations: 10,
    trials: 8,
    paidConversions: 2,
    newMrr: 98,
    churnedMrr: 20,
    mrr: 5000,
    customers: 100,
    spend: 60,
    ...overrides,
  };
}

describe("metric engine", () => {
  it("derives start MRR from the first day's net movement", () => {
    const t = totals([row("2026-09-02", { mrr: 5078 }), row("2026-09-01", { mrr: 5000 })]);
    expect(t.mrrStart).toBe(4922);
    expect(t.mrrEnd).toBe(5078);
    expect(t.signups).toBe(40);
  });

  it("computes rates and CAC with traceable inputs", () => {
    const kpis = computeKpis([row("2026-09-01"), row("2026-09-02")]);
    expect(kpis.signupRate.value).toBeCloseTo(40 / 800);
    expect(kpis.blendedCac.value).toBe(30);
    expect(kpis.blendedCac.inputs).toEqual({ spend: 120, paidConversions: 4 });
    expect(kpis.arpu.value).toBe(50);
    expect(kpis.paybackMonths.value).toBeCloseTo(0.6);
  });

  it("returns null instead of dividing by zero", () => {
    const kpis = computeKpis([row("2026-09-01", { paidConversions: 0, visits: 0 })]);
    expect(kpis.blendedCac.value).toBeNull();
    expect(kpis.signupRate.value).toBeNull();
    expect(pctChange(10, 0)).toBeNull();
  });

  it("splits comparable windows", () => {
    const rows = Array.from({ length: 14 }, (_, i) => row(`2026-09-${String(i + 1).padStart(2, "0")}`));
    const [prev, curr] = splitWindows(rows, 7);
    expect(prev[0].day).toBe("2026-09-01");
    expect(curr[0].day).toBe("2026-09-08");
    expect(curr).toHaveLength(7);
  });

  it("tracks goal progress against elapsed time", () => {
    const p = goalProgress({
      baseline: 2000,
      target: 10000,
      current: 6000,
      startDate: "2026-06-01",
      deadline: "2026-12-01",
      today: "2026-09-01",
    });
    expect(p.progress).toBe(0.5);
    expect(p.expectedProgress).toBeCloseTo(92 / 183);
    expect(p.onTrack).toBe(true);
    expect(p.daysLeft).toBe(91);
  });

  it("handles goals where lower is better", () => {
    const p = goalProgress({ baseline: 80, target: 40, current: 60, startDate: "2026-01-01", deadline: "2026-01-11", today: "2026-01-06" });
    expect(p.progress).toBe(0.5);
  });

  it("judges on-track by current pace when pace is known", () => {
    const base = { baseline: 4180, target: 10000, current: 6402, startDate: "2026-06-01", deadline: "2026-12-31", today: "2026-09-12" };
    expect(goalProgress(base).onTrack).toBe(false); // behind the straight-line schedule
    expect(goalProgress({ ...base, weeklyPace: 390 }).onTrack).toBe(true); // but $390/week beats the ~$229/week needed
    expect(goalProgress({ ...base, weeklyPace: 150 }).onTrack).toBe(false);
  });
});
