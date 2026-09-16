/**
 * Thin fetch wrapper for vendor APIs: timeouts, JSON, and errors that say
 * what went wrong without leaking credentials into messages or logs.
 */

export class ProviderError extends Error {
  constructor(
    readonly provider: string,
    readonly status: number,
    message: string,
    /** True when the credentials are invalid, expired or lack permission: the founder must reconnect. */
    readonly authFailure: boolean,
    readonly code?: string,
  ) {
    super(message);
    this.name = "ProviderError";
  }
}

type Body = Record<string, unknown> | unknown[] | URLSearchParams | string;

export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  headers?: Record<string, string>;
  query?: Record<string, string | number | boolean | undefined>;
  body?: Body;
  timeoutMs?: number;
}

function extractMessage(json: unknown): { message?: string; code?: string } {
  if (!json || typeof json !== "object") return {};
  const j = json as Record<string, unknown>;
  const err = (j.error ?? j.errors) as unknown;
  if (typeof err === "string") return { message: (j.error_description as string) ?? err, code: err };
  if (Array.isArray(err) && err[0] && typeof err[0] === "object") {
    const e = err[0] as Record<string, unknown>;
    return { message: (e.detail ?? e.message ?? e.title) as string, code: (e.code ?? e.status) as string };
  }
  if (err && typeof err === "object") {
    const e = err as Record<string, unknown>;
    return { message: (e.message ?? e.detail ?? e.error_user_msg) as string, code: String(e.code ?? e.type ?? e.status ?? "") || undefined };
  }
  return { message: (j.message ?? j.detail ?? j.title) as string, code: (j.name ?? j.code) as string };
}

export async function request<T = unknown>(provider: string, url: string, opts: RequestOptions = {}): Promise<T> {
  const u = new URL(url);
  for (const [k, v] of Object.entries(opts.query ?? {})) if (v !== undefined) u.searchParams.set(k, String(v));

  const headers: Record<string, string> = { Accept: "application/json", ...opts.headers };
  let body: BodyInit | undefined;
  if (opts.body instanceof URLSearchParams) {
    body = opts.body;
    headers["Content-Type"] ??= "application/x-www-form-urlencoded";
  } else if (typeof opts.body === "string") {
    body = opts.body;
  } else if (opts.body !== undefined) {
    body = JSON.stringify(opts.body);
    headers["Content-Type"] ??= "application/json";
  }

  let res: Response;
  try {
    res = await fetch(u, { method: opts.method ?? (body ? "POST" : "GET"), headers, body, signal: AbortSignal.timeout(opts.timeoutMs ?? 20_000), cache: "no-store" });
  } catch (error) {
    const timeout = error instanceof Error && error.name === "TimeoutError";
    throw new ProviderError(provider, 0, timeout ? `${provider} didn't respond in time.` : `Couldn't reach ${provider}.`, false);
  }

  const text = await res.text();
  let json: unknown = undefined;
  try {
    json = text ? JSON.parse(text) : undefined;
  } catch {
    json = undefined;
  }

  if (!res.ok) {
    const { message, code } = extractMessage(json);
    const auth = res.status === 401 || res.status === 403;
    throw new ProviderError(provider, res.status, message ? `${provider}: ${String(message).slice(0, 300)}` : `${provider} returned HTTP ${res.status}.`, auth, code);
  }
  return (json ?? {}) as T;
}

export const basicAuth = (user: string, password: string) => `Basic ${Buffer.from(`${user}:${password}`).toString("base64")}`;

export const daysAgoIso = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();
export const dayString = (daysAgo: number) => new Date(Date.now() - daysAgo * 86_400_000).toISOString().slice(0, 10);

/** Converts a recurring amount to its monthly equivalent. */
export function toMonthly(amount: number, interval: string, count = 1): number {
  const perMonth = { day: 365 / 12, week: 52 / 12, month: 1, year: 1 / 12 }[interval.toLowerCase()] ?? 0;
  return (amount * perMonth) / Math.max(1, count);
}

export function sumByCurrency(rows: { currency: string; amount: number }[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of rows) {
    const c = r.currency.toUpperCase();
    out[c] = (out[c] ?? 0) + r.amount;
  }
  for (const c of Object.keys(out)) out[c] = Math.round(out[c] * 100) / 100;
  return out;
}

export function formatMoneyMap(m: Record<string, number>): string {
  const entries = Object.entries(m);
  if (!entries.length) return "0";
  return entries.map(([c, v]) => new Intl.NumberFormat("en-US", { style: "currency", currency: c, maximumFractionDigits: 0 }).format(v)).join(" + ");
}
