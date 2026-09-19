import { describe, expect, it } from "vitest";
import { assessReadiness, measurementPlanFor, proofUrlProblem, trackedLink } from "./measurement";

const showHn = measurementPlanFor({ type: "community", channel: "hacker_news", primaryMetric: "signup_rate", number: 14 });
const seo = measurementPlanFor({ type: "seo_page", channel: "seo_content", primaryMetric: "signup_rate", number: 11 });

describe("measurement plans", () => {
  it("measures a Show HN post by its HN URL and UTM-tagged visits, launched by the founder", () => {
    expect(showHn).toMatchObject({ deliverable: "community_post", launch: "founder", proof: { kind: "post_url", hosts: ["news.ycombinator.com"] }, attribution: { method: "utm", utm: { source: "hackernews" } }, signalDays: 7 });
    expect(showHn.founderSteps.length).toBeGreaterThan(2);
  });

  it("measures an SEO page by its URL on the product domain, with analytics or Search Console", () => {
    expect(seo).toMatchObject({ deliverable: "page", proof: { kind: "page_url", onProductDomain: true }, requires: { anyOf: ["READ_ANALYTICS", "READ_SEARCH_QUERIES"] } });
  });

  it("measures paid ads by the linked campaign and ad insights", () => {
    const paid = measurementPlanFor({ type: "paid_ad", channel: "google_search", primaryMetric: "cac", number: 3 });
    expect(paid).toMatchObject({ deliverable: "campaign", proof: { kind: "campaign_link" }, requires: { anyOf: ["READ_AD_INSIGHTS"] } });
  });

  it("builds a tracked link for the experiment", () => {
    expect(trackedLink("https://stablevps.io/", showHn, 14)).toBe("https://stablevps.io/?utm_source=hackernews&utm_medium=community&utm_campaign=exp-014");
    expect(trackedLink("https://stablevps.io", seo, 11)).toBeNull();
  });

  it("checks proof URLs against the plan", () => {
    expect(proofUrlProblem("https://news.ycombinator.com/item?id=1", showHn, "https://stablevps.io")).toBeNull();
    expect(proofUrlProblem("https://stablevps.io/blog", showHn, "https://stablevps.io")).toMatch(/news\.ycombinator\.com/);
    expect(proofUrlProblem("https://www.stablevps.io/alternative-forexvps", seo, "https://stablevps.io")).toBeNull();
    expect(proofUrlProblem("https://example.com/page", seo, "https://stablevps.io")).toMatch(/stablevps\.io/);
    expect(proofUrlProblem("not a url", seo, null)).toMatch(/valid URL/);
  });

  it("says what's missing before an experiment can be evaluated", () => {
    expect(assessReadiness(showHn, { proofUrl: null, campaignLinked: false, sent: false, connected: [] }).missing.map((m) => m.id)).toEqual(["proof", "analytics"]);
    expect(assessReadiness(seo, { proofUrl: "https://stablevps.io/x", campaignLinked: false, sent: false, connected: ["READ_SEARCH_QUERIES"] })).toMatchObject({ launched: true, measurable: true, missing: [] });
  });
});
