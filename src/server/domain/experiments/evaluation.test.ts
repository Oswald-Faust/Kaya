import { describe, expect, it } from "vitest";
import { normalCdf, poissonCdf, twoProportionTest } from "../analytics/stats";
import { evaluateExperiment } from "./evaluation";

describe("stats", () => {
  it("matches known normal CDF values", () => {
    expect(normalCdf(0)).toBeCloseTo(0.5, 6);
    expect(normalCdf(1.96)).toBeCloseTo(0.975, 3);
    expect(normalCdf(-1.645)).toBeCloseTo(0.05, 3);
  });

  it("computes a two-proportion z-test", () => {
    const r = twoProportionTest(31, 1000, 79, 1000);
    expect(r.lift).toBeCloseTo(1.548, 2);
    expect(r.probabilityBetter).toBeGreaterThan(0.999);
  });

  it("computes Poisson CDF", () => {
    expect(poissonCdf(0, 2)).toBeCloseTo(Math.exp(-2), 6);
    expect(poissonCdf(3, 3)).toBeCloseTo(0.6472, 3);
  });
});

describe("experiment evaluation", () => {
  it("declares a rate winner when significant and above threshold", () => {
    const e = evaluateExperiment({
      primaryMetric: "signup_rate",
      successThreshold: 0.2,
      budget: 0,
      durationElapsed: true,
      variants: [
        { name: "Homepage", isControl: true, exposures: 2400, conversions: 74, spend: 0 },
        { name: "Comparison page", isControl: false, exposures: 2300, conversions: 182, spend: 0 },
      ],
    });
    expect(e.decision).toBe("winner");
    expect(e.lift).toBeGreaterThan(1);
  });

  it("keeps collecting when traffic is too low", () => {
    const e = evaluateExperiment({
      primaryMetric: "signup_rate",
      successThreshold: 0.1,
      budget: 0,
      durationElapsed: false,
      variants: [
        { name: "A", isControl: true, exposures: 120, conversions: 4, spend: 0 },
        { name: "B", isControl: false, exposures: 110, conversions: 9, spend: 0 },
      ],
    });
    expect(e.decision).toBe("continue");
  });

  it("marks a small but real lift as inconclusive at the end", () => {
    const e = evaluateExperiment({
      primaryMetric: "trial_to_paid",
      successThreshold: 0.3,
      budget: 0,
      durationElapsed: true,
      variants: [
        { name: "Monthly default", isControl: true, exposures: 900, conversions: 90, spend: 0 },
        { name: "Annual default", isControl: false, exposures: 900, conversions: 95, spend: 0 },
      ],
    });
    expect(e.decision).toBe("inconclusive");
  });

  it("declares a CAC loser when cost is far above target", () => {
    const e = evaluateExperiment({
      primaryMetric: "cac",
      successThreshold: 60,
      budget: 400,
      durationElapsed: true,
      variants: [{ name: "Broad interests", isControl: false, exposures: 5000, conversions: 2, spend: 400 }],
    });
    expect(e.decision).toBe("loser");
    expect(e.observedValue).toBe(200);
    expect(e.summary).toContain("3.3×");
  });

  it("declares a CAC winner when conversions clearly exceed the threshold rate", () => {
    const e = evaluateExperiment({
      primaryMetric: "cac",
      successThreshold: 60,
      budget: 500,
      durationElapsed: false,
      variants: [{ name: "Exact match", isControl: false, exposures: 1800, conversions: 14, spend: 480 }],
    });
    expect(e.decision).toBe("winner");
    expect(e.observedValue).toBeCloseTo(34.29, 1);
  });
});
