import { describe, expect, it } from "vitest";
import { rowsFromSync } from "./live-metrics";

const NOW = new Date("2026-09-18T10:00:00Z");

describe("metrics from a live sync", () => {
  it("books Stripe MRR, customers and trials on today", () => {
    const rows = rowsFromSync("stripe", { mrr: { usd: 6402.5 }, activeSubscriptions: 128, trialingSubscriptions: 9 }, NOW);
    expect(rows).toEqual([{ day: "2026-09-18", channel: "all", mrr: 6402.5, customers: 128, trials: 9 }]);
  });

  it("sums a multi-currency MRR into one figure", () => {
    expect(rowsFromSync("paddle", { mrr: { usd: 100, eur: 50 }, activeSubscriptions: 3 }, NOW)[0].mrr).toBe(150);
  });

  it("writes nothing when the provider reported no revenue figures", () => {
    expect(rowsFromSync("stripe", { payments30d: 0 }, NOW)).toEqual([]);
  });

  it("keeps GA4's real per-day sessions and key events", () => {
    const rows = rowsFromSync("google_analytics", { sessions30d: 900, daily: [{ date: "20260917", sessions: 120, keyEvents: 8 }, { date: "bad", sessions: 1 }] }, NOW);
    expect(rows).toEqual([{ day: "2026-09-17", channel: "all", visits: 120, signups: 8 }]);
  });

  it("books ad spend as a daily average on its own channel", () => {
    expect(rowsFromSync("google_ads", { spend30d: 300 }, NOW)).toEqual([{ day: "2026-09-18", channel: "google_search", spend: 10 }]);
  });

  it("ignores providers that report no comparable metric", () => {
    expect(rowsFromSync("resend", { recentEmails: 12 }, NOW)).toEqual([]);
  });
});
