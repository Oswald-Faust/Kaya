import { describe, expect, it } from "vitest";
import { evaluateExperiment } from "@/server/domain/experiments/evaluation";
import { translateDomainText } from "./domain-text";

describe("translateDomainText", () => {
  it("keeps English as recorded", () => {
    expect(translateDomainText("Trending +12% (4.5% vs 4.0%); not yet significant.", "en")).toBe("Trending +12% (4.5% vs 4.0%); not yet significant.");
  });

  it("translates evaluation summaries and policy checks into French", () => {
    expect(translateDomainText("Trending +12% (4.5% vs 4.0%); not yet significant.", "fr")).toBe("Tendance +12 % (4,5 % contre 4,0 %) ; pas encore significatif.");
    expect(translateDomainText("$120/day against a $100/day cap", "fr")).toBe("120 $/jour pour un plafond de 100 $/jour");
    expect(translateDomainText("Max daily spend", "fr")).toBe("Dépense quotidienne max.");
    expect(translateDomainText("Some LLM sentence", "fr")).toBe("Some LLM sentence");
  });

  it("covers every CAC evaluation phrasing", () => {
    const base = { primaryMetric: "cac" as const, successThreshold: 40, budget: 1000, durationElapsed: false };
    const cases = [
      evaluateExperiment({ ...base, variants: [{ name: "A", isControl: false, exposures: 0, conversions: 12, spend: 240 }] }),
      evaluateExperiment({ ...base, variants: [{ name: "A", isControl: false, exposures: 0, conversions: 0, spend: 1000 }] }),
      evaluateExperiment({ ...base, variants: [{ name: "A", isControl: false, exposures: 0, conversions: 1, spend: 100 }] }),
    ];
    for (const e of cases) expect(translateDomainText(e.summary, "fr")).not.toBe(e.summary);
  });
});

describe("Channel Fit rationales", () => {
  it("translates a prioritized channel's reasons", () => {
    expect(translateDomainText("Expected CAC (~$20) fits a $20/mo price point. Your audience is concentrated here.", "fr")).toBe(
      "Le CAC attendu (~20 $) correspond à un prix de 20 $/mois. Votre audience y est concentrée.",
    );
  });

  it("translates an avoided channel and a bounded test", () => {
    expect(translateDomainText("Don't use Meta Ads right now. Your audience is thinly represented on Meta Ads. Expected CAC (~$170) is too high for a $20/mo price point.", "fr")).toBe(
      "N'utilisez pas Meta Ads pour l'instant. Votre audience est peu présente sur Meta Ads. Le CAC attendu (~170 $) est trop élevé pour un prix de 20 $/mois.",
    );
    expect(translateDomainText("Worth a bounded test. Your audience is concentrated here, but Needs ~$400/mo to learn anything; the budget is $200/mo.", "fr")).toBe(
      "Mérite un test encadré. Votre audience y est concentrée, mais nécessite ~400 $/mois pour apprendre quoi que ce soit ; le budget est de 200 $/mois.",
    );
  });

  it("leaves an unknown sentence alone", () => {
    expect(translateDomainText("Some rationale we never wrote.", "fr")).toBe("Some rationale we never wrote.");
  });
});
