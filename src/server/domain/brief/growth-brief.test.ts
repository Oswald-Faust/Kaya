import { describe, expect, it } from "vitest";
import { buildGrowthBrief, type BriefInput } from "./growth-brief";

const base: BriefInput = {
  asOf: "2026-09-12",
  signups: { current: 151, previous: 142 },
  signupRate: { current: 0.0455, previous: 0.0448 },
  netNewMrr: { current: 240, previous: 190 },
  channels: [
    { channel: "seo_content", current: 88, previous: 79 },
    { channel: "google_search", current: 22, previous: 21 },
  ],
  goal: { title: "Grow MRR from $4.2k to $10k", onTrack: false, requiredPerWeek: 505, daysLeft: 110 },
  running: [{ key: "EXP-006", name: "Activation email", decision: "continue", summary: "Trending +14%; not yet significant." }],
  topAction: { key: "EXP-007", name: "Healthchecks.io comparison page", boostedBy: "EXP-002 · Confirmed: comparison pages convert" },
  pendingApproval: { id: "apr_1", title: "Increase Google Ads daily budget", change: "$20/day → $28/day", reason: "CAC is $34." },
  integrationIssue: null,
};

describe("growth brief", () => {
  it("states the change with numbers and the driving channel", () => {
    const b = buildGrowthBrief(base);
    expect(b.whatChanged).toContain("+6%");
    expect(b.whatChanged).toContain("142 → 151");
    expect(b.whatChanged).toContain("SEO pages (79 → 88)");
  });

  it("connects the week to the goal pace", () => {
    expect(buildGrowthBrief(base).whyItMatters).toContain("needs $505/week");
  });

  it("recommends the pending approval first", () => {
    const b = buildGrowthBrief(base);
    expect(b.recommendation).toMatch(/^Approve “Increase Google Ads daily budget”/);
    expect(b.approvalId).toBe("apr_1");
  });

  it("flags a running experiment that reached a decision as the main risk", () => {
    const b = buildGrowthBrief({ ...base, running: [{ key: "EXP-006", name: "x", decision: "winner", summary: "Lifted activation +15%." }] });
    expect(b.risk).toContain("EXP-006 has reached a decision (winner)");
  });

  it("handles the first week honestly", () => {
    const b = buildGrowthBrief({ ...base, signups: { current: 10, previous: 0 } });
    expect(b.whatChanged).toContain("no previous week");
  });
});
