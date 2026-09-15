import { describe, expect, it } from "vitest";
import { computeKpis } from "@/server/domain/analytics/metrics";
import { evaluateExperiment } from "@/server/domain/experiments/evaluation";
import { generateDemoHistory, DEMO_END, DEMO_START } from "./generate-metrics";

const history = generateDemoHistory();

describe("demo history coherence", () => {
  it("covers every day and is deterministic", () => {
    expect(history.blendedRows[0].day).toBe(DEMO_START);
    expect(history.blendedRows.at(-1)!.day).toBe(DEMO_END);
    expect(generateDemoHistory().blendedRows.at(-1)).toEqual(history.blendedRows.at(-1));
  });

  it("blended rows equal the sum of channel rows", () => {
    for (const blended of history.blendedRows.slice(0, 40)) {
      const rows = history.channelRows.filter((r) => r.day === blended.day);
      expect(rows.reduce((s, r) => s + r.signups, 0)).toBe(blended.signups);
      expect(rows.reduce((s, r) => s + r.newMrr, 0)).toBe(blended.newMrr);
    }
  });

  it("MRR moves only through new and churned MRR", () => {
    const rows = history.blendedRows;
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i].mrr).toBeCloseTo(rows[i - 1].mrr + rows[i].newMrr - rows[i].churnedMrr, 1);
    }
  });

  it("shows a comparison-page lift in signup rate after EXP-002", () => {
    const before = computeKpis(history.blendedRows.filter((r) => r.day >= "2026-06-01" && r.day < "2026-06-20"));
    const after = computeKpis(history.blendedRows.filter((r) => r.day >= "2026-08-20" && r.day <= "2026-09-12"));
    expect(after.signupRate.value!).toBeGreaterThan(before.signupRate.value!);
  });

  it("experiments evaluate to the outcomes the story needs", () => {
    const a = history.arms;
    const meta = evaluateExperiment({
      primaryMetric: "cac",
      successThreshold: 60,
      budget: 400,
      durationElapsed: true,
      variants: [{ name: "Broad interests", isControl: false, exposures: a.exp001.exposures, conversions: a.exp001.conversions, spend: a.exp001.spend }],
    });
    expect(meta.decision).toBe("loser");

    const comparison = evaluateExperiment({
      primaryMetric: "signup_rate",
      successThreshold: 0.3,
      budget: 0,
      durationElapsed: true,
      variants: [
        { name: "Homepage", isControl: true, ...a.exp002.control },
        { name: "Comparison page", isControl: false, ...a.exp002.treatment },
      ],
    });
    expect(comparison.decision).toBe("winner");

    const google = evaluateExperiment({
      primaryMetric: "cac",
      successThreshold: 60,
      budget: 500,
      durationElapsed: true,
      variants: [{ name: "Exact match", isControl: false, exposures: a.exp003.exposures, conversions: a.exp003.conversions, spend: a.exp003.spend }],
    });
    expect(google.decision).toBe("winner");

    const pricing = evaluateExperiment({
      primaryMetric: "trial_to_paid",
      successThreshold: 0.15,
      budget: 0,
      durationElapsed: true,
      variants: [
        { name: "Monthly default", isControl: true, ...a.exp004.control },
        { name: "Annual default", isControl: false, ...a.exp004.treatment },
      ],
    });
    expect(pricing.decision).toBe("inconclusive");

    const activation = evaluateExperiment({
      primaryMetric: "activation_rate",
      successThreshold: 0.1,
      budget: 0,
      durationElapsed: false,
      variants: [
        { name: "No nudge", isControl: true, ...a.exp006.control },
        { name: "Missed-ping nudge", isControl: false, ...a.exp006.treatment },
      ],
    });
    expect(activation.decision).toBe("continue");
  });
});
