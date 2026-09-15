import { costPerConversionTest, twoProportionTest } from "../analytics/stats";
import type { PrimaryMetric } from "../types";

export interface VariantResult {
  name: string;
  isControl: boolean;
  exposures: number;
  conversions: number;
  spend: number;
}

export interface EvaluationInput {
  primaryMetric: PrimaryMetric;
  successThreshold: number; // relative lift for rate metrics (0.2 = +20%), absolute $ for CAC
  budget: number;
  variants: VariantResult[];
  /** True once the planned duration has elapsed. */
  durationElapsed: boolean;
  minExposuresPerVariant?: number;
  minConversions?: number;
}

export type EvaluationDecision = "continue" | "winner" | "loser" | "inconclusive";

export interface Evaluation {
  decision: EvaluationDecision;
  observedValue: number | null;
  baselineValue: number | null;
  lift: number | null;
  confidence: number;
  summary: string;
}

const WIN_CONFIDENCE = 0.95;
const LOSS_CONFIDENCE = 0.9;
const CAC_CONFIDENCE = 0.9;

const METRIC_NOUN: Record<Exclude<PrimaryMetric, "cac">, string> = {
  signup_rate: "signup rate",
  activation_rate: "activation rate",
  trial_to_paid: "trial → paid conversion",
  ctr: "click-through rate",
};

export function evaluateExperiment(input: EvaluationInput): Evaluation {
  return input.primaryMetric === "cac" ? evaluateCac(input) : evaluateRate(input, input.primaryMetric);
}

function evaluateRate(input: EvaluationInput, metric: Exclude<PrimaryMetric, "cac">): Evaluation {
  const control = input.variants.find((v) => v.isControl);
  const treatment = input.variants.find((v) => !v.isControl);
  const noun = METRIC_NOUN[metric];
  if (!control || !treatment) {
    return inconclusiveOrContinue(input, null, null, null, 0, "Rate experiments need a control and a treatment variant.");
  }

  const minExposures = input.minExposuresPerVariant ?? 300;
  const result = twoProportionTest(control.conversions, control.exposures, treatment.conversions, treatment.exposures);
  const base = {
    observedValue: result.treatmentRate,
    baselineValue: result.controlRate,
    lift: result.lift,
  };

  if (control.exposures < minExposures || treatment.exposures < minExposures) {
    const needed = minExposures - Math.min(control.exposures, treatment.exposures);
    return {
      ...base,
      decision: input.durationElapsed ? "inconclusive" : "continue",
      confidence: result.probabilityBetter,
      summary: input.durationElapsed
        ? `Ended without enough traffic: each variant needed ${minExposures} visitors.`
        : `Collecting data: ~${needed} more visitors per variant before a decision.`,
    };
  }

  const liftText = result.lift === null ? "n/a" : formatSignedPct(result.lift);
  const rates = `${formatPct(result.treatmentRate)} vs ${formatPct(result.controlRate)}`;

  if (result.probabilityBetter >= WIN_CONFIDENCE && result.lift !== null && result.lift >= input.successThreshold) {
    return {
      ...base,
      decision: "winner",
      confidence: result.probabilityBetter,
      summary: `${treatment.name} lifted ${noun} ${liftText} (${rates}), above the ${formatSignedPct(input.successThreshold)} threshold.`,
    };
  }

  if (1 - result.probabilityBetter >= LOSS_CONFIDENCE) {
    return {
      ...base,
      decision: "loser",
      confidence: 1 - result.probabilityBetter,
      summary: `${treatment.name} reduced ${noun} ${liftText} (${rates}).`,
    };
  }

  if (!input.durationElapsed) {
    return {
      ...base,
      decision: "continue",
      confidence: result.probabilityBetter,
      summary: `Trending ${liftText} (${rates}); not yet significant.`,
    };
  }

  return {
    ...base,
    decision: "inconclusive",
    confidence: result.probabilityBetter,
    summary:
      result.probabilityBetter >= WIN_CONFIDENCE
        ? `Real but small effect: ${liftText} is below the ${formatSignedPct(input.successThreshold)} threshold.`
        : `No reliable difference in ${noun} (${rates}).`,
  };
}

function evaluateCac(input: EvaluationInput): Evaluation {
  const spend = input.variants.reduce((s, v) => s + v.spend, 0);
  const conversions = input.variants.reduce((s, v) => s + v.conversions, 0);
  const threshold = input.successThreshold;
  const test = costPerConversionTest(spend, conversions, threshold);
  const lift = test.observed === null ? null : (threshold - test.observed) / threshold;
  const budgetExhausted = input.budget > 0 && spend >= input.budget * 0.98;
  const minConversions = input.minConversions ?? 5;
  const base = { observedValue: test.observed, baselineValue: threshold, lift };
  const observedText = test.observed === null ? "no customers yet" : `CAC ${formatUsd(test.observed)}`;

  if (conversions >= minConversions && test.probabilityBelow >= CAC_CONFIDENCE) {
    return {
      ...base,
      decision: "winner",
      confidence: test.probabilityBelow,
      summary: `${observedText} on ${formatUsd(spend)} spend beats the ${formatUsd(threshold)} target (${conversions} customers).`,
    };
  }

  if (test.probabilityAbove >= CAC_CONFIDENCE || (budgetExhausted && (test.observed === null || test.observed > threshold))) {
    const multiple = test.observed === null ? null : test.observed / threshold;
    return {
      ...base,
      decision: "loser",
      confidence: Math.max(test.probabilityAbove, budgetExhausted ? 0.9 : 0),
      summary:
        multiple === null
          ? `${formatUsd(spend)} spent with no paying customers against a ${formatUsd(threshold)} CAC target.`
          : `${observedText} is ${multiple.toFixed(1)}× the ${formatUsd(threshold)} target after ${formatUsd(spend)} spend.`,
    };
  }

  if (budgetExhausted || input.durationElapsed) {
    return {
      ...base,
      decision: "inconclusive",
      confidence: Math.max(test.probabilityBelow, test.probabilityAbove),
      summary: `${observedText} after ${formatUsd(spend)}; not enough customers to separate it from the ${formatUsd(threshold)} target.`,
    };
  }

  return {
    ...base,
    decision: "continue",
    confidence: Math.max(test.probabilityBelow, test.probabilityAbove),
    summary: `${observedText} so far on ${formatUsd(spend)} of ${formatUsd(input.budget)} budget.`,
  };
}

function inconclusiveOrContinue(
  input: EvaluationInput,
  observedValue: number | null,
  baselineValue: number | null,
  lift: number | null,
  confidence: number,
  summary: string,
): Evaluation {
  return {
    decision: input.durationElapsed ? "inconclusive" : "continue",
    observedValue,
    baselineValue,
    lift,
    confidence,
    summary,
  };
}

function formatPct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

function formatSignedPct(n: number): string {
  return `${n >= 0 ? "+" : "−"}${Math.abs(n * 100).toFixed(0)}%`;
}

function formatUsd(n: number): string {
  return `$${n.toFixed(n >= 100 ? 0 : 2).replace(/\.00$/, "")}`;
}
