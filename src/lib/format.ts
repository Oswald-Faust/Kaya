/** Presentation formatting. Pure; safe on server and client. Locale fixed for stable rendering. */

const LOCALE = "en-US";

export function formatUsd(value: number | null | undefined, opts: { compact?: boolean; cents?: boolean } = {}): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  if (opts.compact && Math.abs(value) >= 10_000) {
    return new Intl.NumberFormat(LOCALE, { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(value);
  }
  const cents = opts.cents ?? (Math.abs(value) < 100 && !Number.isInteger(value));
  return new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: cents ? 2 : 0,
    maximumFractionDigits: cents ? 2 : 0,
  }).format(value);
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 }).format(value);
}

export function formatPct(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `${(value * 100).toFixed(digits)}%`;
}

export function formatDelta(value: number | null | undefined, digits = 0): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  const pct = (value * 100).toFixed(digits);
  if (Number(pct) === 0) return "0%";
  return `${value > 0 ? "+" : "−"}${pct.replace("-", "")}%`;
}

export function formatConfidence(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function formatDate(value: string | Date, opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }): string {
  const date = typeof value === "string" ? new Date(value.length === 10 ? `${value}T00:00:00Z` : value) : value;
  return new Intl.DateTimeFormat(LOCALE, { timeZone: "UTC", ...opts }).format(date);
}

export function relativeTime(value: string | Date, now: Date = new Date()): string {
  const date = typeof value === "string" ? new Date(value) : value;
  const seconds = Math.round((date.getTime() - now.getTime()) / 1000);
  const abs = Math.abs(seconds);
  const rtf = new Intl.RelativeTimeFormat(LOCALE, { numeric: "auto" });
  if (abs < 60) return "just now";
  if (abs < 3600) return rtf.format(Math.round(seconds / 60), "minute");
  if (abs < 86_400) return rtf.format(Math.round(seconds / 3600), "hour");
  if (abs < 86_400 * 30) return rtf.format(Math.round(seconds / 86_400), "day");
  return formatDate(date, { month: "short", day: "numeric", year: "numeric" });
}

export function experimentKey(number: number): string {
  return `EXP-${String(number).padStart(3, "0")}`;
}
