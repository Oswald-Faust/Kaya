import { describe, expect, it } from "vitest";
import { scoreAllChannels, scoreChannel, type ChannelFitInput } from "./channel-fit";

const devTool: ChannelFitInput = {
  audience: "developers",
  arpuMonthly: 32,
  monthlyBudget: 1000,
  searchIntent: "high",
  traction: { seo_content: 35, hacker_news: 20 },
  evidence: [],
};

describe("channel fit", () => {
  it("prioritizes search for a high-intent developer tool", () => {
    const fit = scoreChannel("google_search", devTool);
    expect(fit.verdict).toBe("prioritize");
    expect(fit.reasonsFor.join(" ")).toMatch(/looking for a solution/);
  });

  it("tells a developer tool not to use LinkedIn and TikTok", () => {
    const ranked = scoreAllChannels(devTool);
    expect(ranked.find((c) => c.channel === "linkedin")!.verdict).toBe("avoid");
    expect(ranked.find((c) => c.channel === "tiktok")!.verdict).toBe("avoid");
    expect(ranked.find((c) => c.channel === "tiktok")!.rationale).toMatch(/^Don't use TikTok right now/);
  });

  it("flags channels the budget cannot support", () => {
    const fit = scoreChannel("meta_ads", { ...devTool, monthlyBudget: 150 });
    expect(fit.reasonsAgainst.some((r) => r.includes("$500/mo"))).toBe(true);
  });

  it("moves scores with experiment evidence", () => {
    const before = scoreChannel("meta_ads", devTool).score;
    const after = scoreChannel("meta_ads", {
      ...devTool,
      evidence: [{ channel: "meta_ads", kind: "loser", confidence: 0.9, statement: "Broad targeting CAC 3.5× target" }],
    });
    expect(after.score).toBeLessThan(before);
    expect(after.reasonsAgainst[0]).toMatch(/^Disproved by experiment/);
  });

  it("is deterministic and bounded", () => {
    for (const fit of scoreAllChannels(devTool)) {
      expect(fit.score).toBeGreaterThanOrEqual(0);
      expect(fit.score).toBeLessThanOrEqual(100);
    }
    expect(scoreAllChannels(devTool)).toEqual(scoreAllChannels(devTool));
  });
});
