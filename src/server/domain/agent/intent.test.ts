import { describe, expect, it } from "vitest";
import { allocateBudget } from "../strategy/allocation";
import { classifyIntent } from "./intent";

describe("intent classification", () => {
  it.each([
    ["Why did signups fall this week?", "diagnose"],
    ["Scale what's working in Google Search", "scale"],
    ["We have $500 this month. Find the best way to allocate it.", "allocate"],
    ["Get me my first 20 paying users.", "grow"],
  ])("%s → %s", (text, intent) => {
    expect(classifyIntent(text).intent).toBe(intent);
  });

  it("parses budget amounts", () => {
    expect(classifyIntent("We have $1.5k to spend").amount).toBe(1500);
    expect(classifyIntent("allocate $500 this month").amount).toBe(500);
  });
});

describe("budget allocation", () => {
  const channels = [
    { channel: "google_search", score: 88 },
    { channel: "seo_content", score: 84 },
    { channel: "youtube_creators", score: 58 },
    { channel: "meta_ads", score: 22 },
    { channel: "hacker_news", score: 66 },
  ];

  it("allocates the full amount across eligible channels", () => {
    const a = allocateBudget(1000, channels);
    expect(a.lines.reduce((s, l) => s + l.amount, 0)).toBe(1000);
    expect(a.lines[0].channel).toBe("google_search");
    expect(a.excluded.map((e) => e.channel)).toEqual(expect.arrayContaining(["meta_ads", "hacker_news"]));
  });

  it("excludes paid channels the budget cannot support", () => {
    const a = allocateBudget(100, channels);
    expect(a.lines.find((l) => l.channel === "google_search")).toBeUndefined();
    expect(a.excluded.find((e) => e.channel === "youtube_creators")?.reason).toMatch(/\$400/);
  });

  it("keeps money in reserve instead of spreading paid tests too thin", () => {
    const a = allocateBudget(200, [
      { channel: "seo_content", score: 78 },
      { channel: "email_lifecycle", score: 74 },
      { channel: "google_search", score: 66 },
      { channel: "youtube_creators", score: 53 },
    ]);
    expect(a.lines.map((l) => [l.channel, l.amount])).toEqual([["seo_content", 60], ["email_lifecycle", 60]]);
    expect(a.unallocated).toBe(80);
    expect(a.excluded.find((e) => e.channel === "google_search")?.reason).toMatch(/too small to learn from/);
  });

  it("caps organic production money at 30%", () => {
    const a = allocateBudget(1000, [{ channel: "seo_content", score: 90 }, { channel: "google_search", score: 70 }]);
    expect(a.lines.find((l) => l.channel === "seo_content")!.amount).toBeLessThanOrEqual(300);
  });
});
