import { describe, expect, it } from "vitest";
import type { ExtractionResult } from "@/server/domain/types";
import { arpuFromPlans, competitorsFromExtraction, factsFromExtraction, icpsFromExtraction } from "./to-memory";

const x: ExtractionResult = {
  productName: { value: "Shipwright", confidence: 0.9, evidence: "Shipwright — Deploy previews", sourceUrl: "https://shipwright.dev/" },
  oneLiner: { value: "Preview environments for every pull request.", confidence: 0.72, evidence: "Preview environments for every pull request." },
  category: { value: "Developer tools", confidence: 0.6 },
  valueProposition: { value: "", confidence: 0 },
  features: [{ value: "Seeded databases", confidence: 0.6, evidence: "Seeded databases" }],
  pricing: {
    model: { value: "Freemium", confidence: 0.7 },
    plans: [
      { name: "Hobby", price: 0, period: "month", highlights: [] },
      { name: "Team", price: 49, period: "month", highlights: [] },
      { name: "Scale", price: 1788, period: "year", highlights: [] },
    ],
    freeTrial: { value: true, confidence: 0.75, evidence: "14-day free trial" },
  },
  audiences: [{ name: "Engineering teams", description: "Stated on the site", confidence: 0.6, evidence: "Built for engineering teams" }],
  competitors: [{ name: "Heroku Review Apps", url: null, kind: "direct", reason: "Mentioned as an alternative", confidence: 0.5 }],
  brand: { traits: ["Technical"], voiceSummary: "Technical tone.", confidence: 0.4 },
  ctas: [],
  channels: [{ channel: "x_organic", signal: "X profile linked from the site", confidence: 0.6 }],
  proof: [],
  logoUrl: null,
  language: "en",
  warnings: [],
};

describe("extraction → business memory", () => {
  const facts = factsFromExtraction(x);

  it("labels only high-confidence quoted facts as verified", () => {
    expect(facts.find((f) => f.key === "product.name")?.kind).toBe("verified");
    expect(facts.find((f) => f.key === "product.one_liner")?.kind).toBe("inferred");
    expect(facts.find((f) => f.key === "product.category")?.kind).toBe("inferred");
  });

  it("skips empty fields rather than inventing them", () => {
    expect(facts.find((f) => f.key === "positioning.value_prop")).toBeUndefined();
  });

  it("summarizes pricing plans in one fact", () => {
    expect(facts.find((f) => f.key === "pricing.plans")?.statement).toBe("Freemium: Hobby free · Team $49/mo · Scale $1788/yr.");
  });

  it("maps audiences and competitors with priority and evidence", () => {
    expect(icpsFromExtraction(x)[0]).toMatchObject({ name: "Engineering teams", priority: 1 });
    expect(icpsFromExtraction(x)[0].description).toContain("Built for engineering teams");
    expect(competitorsFromExtraction(x)[0].name).toBe("Heroku Review Apps");
  });

  it("computes ARPU from paid plans with annual prices normalized", () => {
    expect(arpuFromPlans(x.pricing.plans)).toBe(99);
    expect(arpuFromPlans([{ name: "Free", price: 0, period: "month", highlights: [] }])).toBeNull();
  });
});
