/** Small, dependency-free statistics used by experiment evaluation. */

/** Standard normal CDF (Abramowitz & Stegun 7.1.26, |error| < 1.5e-7). */
export function normalCdf(z: number): number {
  const x = Math.abs(z) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * x);
  const poly = ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t;
  const erf = 1 - poly * Math.exp(-x * x);
  return z >= 0 ? (1 + erf) / 2 : (1 - erf) / 2;
}

export interface TwoProportionResult {
  controlRate: number;
  treatmentRate: number;
  /** Relative lift of treatment over control (0.25 = +25%). Null when control rate is 0. */
  lift: number | null;
  z: number;
  /** P(treatment rate > control rate) under the normal approximation. */
  probabilityBetter: number;
}

export function twoProportionTest(
  controlConversions: number,
  controlExposures: number,
  treatmentConversions: number,
  treatmentExposures: number,
): TwoProportionResult {
  const controlRate = controlExposures > 0 ? controlConversions / controlExposures : 0;
  const treatmentRate = treatmentExposures > 0 ? treatmentConversions / treatmentExposures : 0;
  const n = controlExposures + treatmentExposures;
  const pooled = n > 0 ? (controlConversions + treatmentConversions) / n : 0;
  const se =
    controlExposures > 0 && treatmentExposures > 0
      ? Math.sqrt(pooled * (1 - pooled) * (1 / controlExposures + 1 / treatmentExposures))
      : 0;
  const z = se > 0 ? (treatmentRate - controlRate) / se : 0;
  return {
    controlRate,
    treatmentRate,
    lift: controlRate > 0 ? (treatmentRate - controlRate) / controlRate : null,
    z,
    probabilityBetter: se > 0 ? normalCdf(z) : 0.5,
  };
}

/** P(X ≤ k) for X ~ Poisson(λ). Uses a normal approximation for large λ. */
export function poissonCdf(k: number, lambda: number): number {
  if (k < 0) return 0;
  if (lambda <= 0) return 1;
  if (lambda > 500) return normalCdf((k + 0.5 - lambda) / Math.sqrt(lambda));
  let term = Math.exp(-lambda);
  let sum = term;
  for (let i = 1; i <= k; i++) {
    term *= lambda / i;
    sum += term;
  }
  return Math.min(1, sum);
}

export interface CostPerConversionResult {
  observed: number | null;
  /** Confidence that the true cost per conversion is below the threshold. */
  probabilityBelow: number;
  /** Confidence that the true cost per conversion is above the threshold. */
  probabilityAbove: number;
}

/**
 * If the true CAC equalled `threshold`, conversions would follow
 * Poisson(spend / threshold). Observing more (or fewer) conversions than that
 * is evidence the true CAC is below (or above) the threshold.
 */
export function costPerConversionTest(spend: number, conversions: number, threshold: number): CostPerConversionResult {
  if (spend <= 0 || threshold <= 0) return { observed: null, probabilityBelow: 0, probabilityAbove: 0 };
  const lambda = spend / threshold;
  return {
    observed: conversions > 0 ? spend / conversions : null,
    probabilityBelow: conversions > 0 ? poissonCdf(conversions - 1, lambda) : 0,
    probabilityAbove: 1 - poissonCdf(conversions, lambda),
  };
}
