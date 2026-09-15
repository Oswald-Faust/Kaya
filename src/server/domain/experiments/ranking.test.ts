import { describe, expect, it } from "vitest";
import { assertTransition, canTransition } from "./lifecycle";
import { rankExperiments, type RankableExperiment } from "./ranking";

const base: Omit<RankableExperiment, "id" | "channel" | "similarityKey"> = {
  impact: 4,
  priorConfidence: 0.5,
  effort: 2,
  informationGain: 4,
  budget: 0,
  timeToSignalDays: 10,
};

describe("experiment ranking", () => {
  const experiments: RankableExperiment[] = [
    { ...base, id: "meta", channel: "meta_ads", similarityKey: "meta_ads:broad_interest:devops", budget: 300 },
    { ...base, id: "seo", channel: "seo_content", similarityKey: "seo_content:comparison_page:healthchecks" },
    { ...base, id: "linkedin", channel: "linkedin", similarityKey: "linkedin:founder_posts:sre", impact: 2 },
  ];

  it("suppresses experiments already disproved by a learning", () => {
    const ranked = rankExperiments(experiments, {
      monthlyBudget: 1000,
      channelScores: { meta_ads: 60, seo_content: 80, linkedin: 30 },
      learnings: [
        { id: "l1", kind: "loser", similarityKey: "meta_ads:broad_interest:developers", confidence: 0.9, statement: "Broad Meta" },
      ],
    });
    const meta = ranked.find((r) => r.experiment.id === "meta")!;
    expect(meta.suppressedBy?.id).toBe("l1");
    expect(meta.score).toBe(0);
    expect(ranked[ranked.length - 1].experiment.id).toBe("meta");
  });

  it("boosts tactics that already won and ranks them first", () => {
    const ranked = rankExperiments(experiments, {
      monthlyBudget: 1000,
      channelScores: { meta_ads: 60, seo_content: 80, linkedin: 30 },
      learnings: [
        { id: "l2", kind: "winner", similarityKey: "seo_content:comparison_page:cronitor", confidence: 0.9, statement: "Comparison pages" },
      ],
    });
    expect(ranked[0].experiment.id).toBe("seo");
    expect(ranked[0].adjustedConfidence).toBeCloseTo(0.635);
    expect(ranked[0].boostedBy).toHaveLength(1);
  });

  it("ignores low-confidence losers", () => {
    const ranked = rankExperiments(experiments, {
      monthlyBudget: 1000,
      channelScores: {},
      learnings: [{ id: "l3", kind: "loser", similarityKey: "meta_ads:broad_interest:x", confidence: 0.4, statement: "weak" }],
    });
    expect(ranked.find((r) => r.experiment.id === "meta")!.suppressedBy).toBeNull();
  });
});

describe("experiment lifecycle", () => {
  it("allows the approval → running path", () => {
    expect(canTransition("awaiting_approval", "running")).toBe(true);
    expect(canTransition("completed", "running")).toBe(false);
  });

  it("throws a domain error on invalid transitions", () => {
    expect(() => assertTransition("archived", "running")).toThrowError(/cannot move/);
  });
});
