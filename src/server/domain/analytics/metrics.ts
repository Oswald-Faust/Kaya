/**
 * Deterministic metric engine. Math never lives in the LLM: every number the
 * product shows is computed here and carries its formula and inputs so the UI
 * (and the agent) can trace it back to data.
 */

export interface DailyMetricsRow {
  day: string; // YYYY-MM-DD
  impressions: number;
  clicks: number;
  visits: number;
  signups: number;
  activations: number;
  trials: number;
  paidConversions: number;
  newMrr: number;
  churnedMrr: number;
  mrr: number;
  customers: number;
  spend: number;
}

export interface Metric {
  value: number | null;
  formula: string;
  inputs: Record<string, number>;
}

export interface Totals {
  days: number;
  impressions: number;
  clicks: number;
  visits: number;
  signups: number;
  activations: number;
  trials: number;
  paidConversions: number;
  newMrr: number;
  churnedMrr: number;
  spend: number;
  mrrStart: number;
  mrrEnd: number;
  customersEnd: number;
}

const ADDITIVE = [
  "impressions",
  "clicks",
  "visits",
  "signups",
  "activations",
  "trials",
  "paidConversions",
  "newMrr",
  "churnedMrr",
  "spend",
] as const;

export function totals(rows: DailyMetricsRow[]): Totals {
  const sorted = [...rows].sort((a, b) => a.day.localeCompare(b.day));
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const sums = Object.fromEntries(ADDITIVE.map((k) => [k, 0])) as Record<(typeof ADDITIVE)[number], number>;
  for (const row of sorted) for (const key of ADDITIVE) sums[key] += row[key];
  return {
    days: sorted.length,
    ...sums,
    // MRR at the start of the first day = end-of-day MRR minus that day's net movement.
    mrrStart: first ? round2(first.mrr - first.newMrr + first.churnedMrr) : 0,
    mrrEnd: last ? last.mrr : 0,
    customersEnd: last ? last.customers : 0,
  };
}

function count(value: number, formula: string, inputs: Record<string, number> = {}): Metric {
  return { value, formula, inputs };
}

function ratio(numerator: number, denominator: number, formula: string, inputs: Record<string, number>): Metric {
  return { value: denominator > 0 ? numerator / denominator : null, formula, inputs };
}

export interface Kpis {
  mrr: Metric;
  netNewMrr: Metric;
  newMrr: Metric;
  visits: Metric;
  signups: Metric;
  activations: Metric;
  paidConversions: Metric;
  spend: Metric;
  signupRate: Metric;
  activationRate: Metric;
  trialToPaid: Metric;
  blendedCac: Metric;
  arpu: Metric;
  roas: Metric;
  ctr: Metric;
  revenueChurnRate: Metric;
  paybackMonths: Metric;
}

export function computeKpis(rows: DailyMetricsRow[]): Kpis {
  const t = totals(rows);
  const arpu = t.customersEnd > 0 ? t.mrrEnd / t.customersEnd : null;
  const cac = t.paidConversions > 0 ? t.spend / t.paidConversions : null;
  return {
    mrr: count(t.mrrEnd, "MRR at end of period", { mrrEnd: t.mrrEnd }),
    netNewMrr: count(round2(t.mrrEnd - t.mrrStart), "MRR end − MRR start", { mrrEnd: t.mrrEnd, mrrStart: t.mrrStart }),
    newMrr: count(round2(t.newMrr), "Σ new MRR", { newMrr: t.newMrr }),
    visits: count(t.visits, "Σ visits", { visits: t.visits }),
    signups: count(t.signups, "Σ signups", { signups: t.signups }),
    activations: count(t.activations, "Σ activated users", { activations: t.activations }),
    paidConversions: count(t.paidConversions, "Σ new paying customers", { paidConversions: t.paidConversions }),
    spend: count(round2(t.spend), "Σ marketing spend", { spend: t.spend }),
    signupRate: ratio(t.signups, t.visits, "signups ÷ visits", { signups: t.signups, visits: t.visits }),
    activationRate: ratio(t.activations, t.signups, "activated ÷ signups", {
      activations: t.activations,
      signups: t.signups,
    }),
    trialToPaid: ratio(t.paidConversions, t.trials, "new paying ÷ trials started", {
      paidConversions: t.paidConversions,
      trials: t.trials,
    }),
    blendedCac: ratio(t.spend, t.paidConversions, "spend ÷ new paying customers", {
      spend: t.spend,
      paidConversions: t.paidConversions,
    }),
    arpu: ratio(t.mrrEnd, t.customersEnd, "MRR ÷ customers", { mrr: t.mrrEnd, customers: t.customersEnd }),
    roas: ratio(t.newMrr, t.spend, "new MRR ÷ spend", { newMrr: t.newMrr, spend: t.spend }),
    ctr: ratio(t.clicks, t.impressions, "clicks ÷ impressions", { clicks: t.clicks, impressions: t.impressions }),
    revenueChurnRate: ratio(t.churnedMrr, t.mrrStart, "churned MRR ÷ starting MRR", {
      churnedMrr: t.churnedMrr,
      mrrStart: t.mrrStart,
    }),
    paybackMonths:
      cac !== null && arpu !== null && arpu > 0
        ? { value: cac / arpu, formula: "CAC ÷ ARPU", inputs: { cac, arpu } }
        : { value: null, formula: "CAC ÷ ARPU", inputs: {} },
  };
}

/** Relative change; null when it cannot be computed honestly. */
export function pctChange(current: number | null, previous: number | null): number | null {
  if (current === null || previous === null || previous === 0) return null;
  return (current - previous) / Math.abs(previous);
}

/** Split rows into [previous, current] windows of `days` ending at the last row. */
export function splitWindows(rows: DailyMetricsRow[], days: number): [DailyMetricsRow[], DailyMetricsRow[]] {
  const sorted = [...rows].sort((a, b) => a.day.localeCompare(b.day));
  const current = sorted.slice(-days);
  const previous = sorted.slice(-2 * days, -days);
  return [previous, current];
}

export interface GoalProgressInput {
  baseline: number;
  target: number;
  current: number;
  startDate: string;
  deadline: string;
  today: string;
  /** Change in the goal metric over the last 7 days. When known, "on track" means the current pace reaches the target in time. */
  weeklyPace?: number | null;
}

export interface GoalProgress {
  progress: number; // 0–1 of the distance baseline → target
  expectedProgress: number; // 0–1 of elapsed time
  onTrack: boolean;
  remaining: number;
  daysLeft: number;
  requiredPerWeek: number | null;
}

export function goalProgress(input: GoalProgressInput): GoalProgress {
  const span = input.target - input.baseline;
  const progress = span === 0 ? 1 : clamp01((input.current - input.baseline) / span);
  const total = daysBetween(input.startDate, input.deadline);
  const elapsed = daysBetween(input.startDate, input.today);
  const expectedProgress = total <= 0 ? 1 : clamp01(elapsed / total);
  const daysLeft = Math.max(0, daysBetween(input.today, input.deadline));
  const remaining = input.target - input.current;
  const requiredPerWeek = daysLeft > 0 ? (remaining / daysLeft) * 7 : null;
  const byTime = progress >= expectedProgress * 0.9;
  const byPace =
    input.weeklyPace === undefined || input.weeklyPace === null || requiredPerWeek === null
      ? null
      : span >= 0
        ? input.weeklyPace >= requiredPerWeek
        : input.weeklyPace <= requiredPerWeek;
  return {
    progress,
    expectedProgress,
    onTrack: progress >= 1 || (byPace ?? byTime),
    remaining,
    daysLeft,
    requiredPerWeek,
  };
}

export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
