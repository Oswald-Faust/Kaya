import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { fmt } from "@/i18n/format";
import { formatPct, formatUsd } from "@/lib/format";

/** Experiment wording shared by server pages and client components. Pure. */

export function metricLabel(metric: string, t: Dictionary): string {
  return t.app.metrics[metric] ?? metric;
}

export function formatMetricValue(metric: string, value: number | null, locale: Locale): string {
  if (value === null) return "—";
  return metric === "cac" ? formatUsd(value, {}, locale) : formatPct(value);
}

export function thresholdLabel(metric: string, threshold: number, t: Dictionary, locale: Locale): string {
  return metric === "cac" ? `< ${formatUsd(threshold, {}, locale)}` : fmt(t.app.metrics.liftThreshold, { pct: Math.round(threshold * 100) });
}
