import "server-only";
import { and, desc, eq, lt } from "drizzle-orm";
import { db } from "@/server/db/client";
import * as t from "@/server/db/schema";

/**
 * Turns what a live integration just synced into metric snapshots, so revenue
 * and analytics connections feed the Command Center instead of only showing a
 * summary line on the Integrations page.
 *
 * Only figures a provider actually reports are written. Flows that a provider
 * gives as a 30-day total (visits, signups) are never spread over days: they
 * would look like daily data that was never measured.
 */

type SyncData = Record<string, unknown>;

const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);
const int = (v: unknown): number | null => {
  const n = num(v);
  return n === null ? null : Math.round(n);
};

/** Revenue providers report money per currency; the workspace reports in one number. */
function primaryAmount(value: unknown): number | null {
  if (typeof value === "number") return num(value);
  if (!value || typeof value !== "object") return null;
  const amounts = Object.values(value as Record<string, unknown>).map(num).filter((n): n is number => n !== null);
  return amounts.length ? Math.round(amounts.reduce((s, n) => s + n, 0) * 100) / 100 : null;
}

const today = (now: Date) => now.toISOString().slice(0, 10);

interface Row {
  day: string;
  channel: string;
  mrr?: number;
  customers?: number;
  newMrr?: number;
  churnedMrr?: number;
  visits?: number;
  signups?: number;
  trials?: number;
  paidConversions?: number;
  spend?: number;
  clicks?: number;
  impressions?: number;
}

const REVENUE = new Set(["stripe", "paddle", "lemon_squeezy"]);

function revenueRows(data: SyncData, now: Date): Row[] {
  const mrr = primaryAmount(data.mrr);
  const customers = int(data.activeSubscriptions);
  const trials = int(data.trialingSubscriptions);
  if (mrr === null && customers === null) return [];
  return [{ day: today(now), channel: "all", ...(mrr !== null && { mrr }), ...(customers !== null && { customers }), ...(trials !== null && { trials }) }];
}

/** GA4 reports real per-day sessions and key events; everything else stays out. */
function ga4Rows(data: SyncData): Row[] {
  const daily = Array.isArray(data.daily) ? (data.daily as { date?: unknown; sessions?: unknown; keyEvents?: unknown }[]) : [];
  const rows: Row[] = [];
  for (const d of daily) {
    const raw = typeof d.date === "string" ? d.date : null;
    const day = raw && /^\d{8}$/.test(raw) ? `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}` : raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null;
    if (!day) continue;
    const visits = int(d.sessions);
    const signups = int(d.keyEvents);
    if (visits === null && signups === null) continue;
    rows.push({ day, channel: "all", ...(visits !== null && { visits }), ...(signups !== null && { signups }) });
  }
  return rows;
}

function adsRows(provider: string, data: SyncData, now: Date): Row[] {
  const channel = provider === "google_ads" ? "google_search" : provider === "meta_ads" ? "meta_ads" : provider === "tiktok_ads" ? "tiktok" : null;
  if (!channel) return [];
  const spend = num(data.spend30d);
  if (spend === null) return [];
  // A 30-day total is booked as a daily average on the paid channel: ad platforms
  // bill per day, so the average is the honest per-day figure here.
  return [{ day: today(now), channel, spend: Math.round((spend / 30) * 100) / 100 }];
}

export function rowsFromSync(provider: string, data: SyncData, now: Date = new Date()): Row[] {
  if (REVENUE.has(provider)) return revenueRows(data, now);
  if (provider === "google_analytics") return ga4Rows(data);
  return adsRows(provider, data, now);
}

/**
 * Writes the rows, filling new MRR and churn from the previous snapshot so the
 * Command Center can show movement from the second sync onwards.
 */
export async function recordSyncMetrics(workspaceId: string, provider: string, data: SyncData, now: Date = new Date()): Promise<number> {
  const rows = rowsFromSync(provider, data, now);
  if (rows.length === 0) return 0;
  const product = await db.query.products.findFirst({ where: eq(t.products.workspaceId, workspaceId), columns: { id: true } });
  if (!product) return 0;

  let written = 0;
  for (const row of rows) {
    const values = { ...row };
    if (values.mrr !== undefined && row.channel === "all") {
      const previous = await db
        .select({ mrr: t.metricSnapshots.mrr, customers: t.metricSnapshots.customers })
        .from(t.metricSnapshots)
        .where(and(eq(t.metricSnapshots.productId, product.id), eq(t.metricSnapshots.channel, "all"), lt(t.metricSnapshots.day, row.day)))
        .orderBy(desc(t.metricSnapshots.day))
        .limit(1);
      const before = previous[0];
      if (before) {
        const delta = Math.round((values.mrr - before.mrr) * 100) / 100;
        values.newMrr = Math.max(0, delta);
        values.churnedMrr = Math.max(0, -delta);
        if (values.customers !== undefined) values.paidConversions = Math.max(0, values.customers - before.customers);
      }
    }
    await db
      .insert(t.metricSnapshots)
      .values({ workspaceId, productId: product.id, source: provider, ...values })
      .onConflictDoUpdate({
        target: [t.metricSnapshots.productId, t.metricSnapshots.day, t.metricSnapshots.channel],
        set: { source: provider, ...values },
      });
    written++;
  }
  return written;
}

/**
 * Connections synced before metrics were recorded still hold their last payload.
 * When a workspace has no metrics at all, replay those payloads once so the
 * founder sees their revenue without having to click sync again.
 */
export async function backfillFromLastSync(workspaceId: string): Promise<number> {
  const rows = await db
    .select({ provider: t.integrations.provider, metadata: t.integrations.metadata })
    .from(t.integrations)
    .where(and(eq(t.integrations.workspaceId, workspaceId), eq(t.integrations.status, "connected"), eq(t.integrations.mode, "live")));

  let written = 0;
  for (const row of rows) {
    const last = row.metadata?.lastSync;
    if (!last?.data || !last.at) continue;
    written += await recordSyncMetrics(workspaceId, row.provider, last.data as SyncData, new Date(last.at));
  }
  return written;
}
