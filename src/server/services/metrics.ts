import "server-only";
import { and, asc, desc, eq, gte, lte, ne, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { metricSnapshots } from "@/server/db/schema";
import type { DailyMetricsRow } from "@/server/domain/analytics/metrics";

type SnapshotRow = typeof metricSnapshots.$inferSelect;

function toRow(r: SnapshotRow): DailyMetricsRow & { channel: string } {
  return {
    day: r.day,
    channel: r.channel,
    impressions: r.impressions,
    clicks: r.clicks,
    visits: r.visits,
    signups: r.signups,
    activations: r.activations,
    trials: r.trials,
    paidConversions: r.paidConversions,
    newMrr: r.newMrr,
    churnedMrr: r.churnedMrr,
    mrr: r.mrr,
    customers: r.customers,
    spend: r.spend,
  };
}

export async function getBlendedRows(workspaceId: string, productId: string, from: string, to: string): Promise<DailyMetricsRow[]> {
  const rows = await db
    .select()
    .from(metricSnapshots)
    .where(
      and(
        eq(metricSnapshots.workspaceId, workspaceId),
        eq(metricSnapshots.productId, productId),
        eq(metricSnapshots.channel, "all"),
        gte(metricSnapshots.day, from),
        lte(metricSnapshots.day, to),
      ),
    )
    .orderBy(asc(metricSnapshots.day));
  return rows.map(toRow);
}

export async function getChannelRows(workspaceId: string, productId: string, from: string, to: string) {
  const rows = await db
    .select()
    .from(metricSnapshots)
    .where(
      and(
        eq(metricSnapshots.workspaceId, workspaceId),
        eq(metricSnapshots.productId, productId),
        ne(metricSnapshots.channel, "all"),
        gte(metricSnapshots.day, from),
        lte(metricSnapshots.day, to),
      ),
    )
    .orderBy(asc(metricSnapshots.day));
  return rows.map(toRow);
}

/** Latest day with data; the reporting "today" for a product. */
export async function latestMetricDay(workspaceId: string, productId: string): Promise<string | null> {
  const [row] = await db
    .select({ day: metricSnapshots.day })
    .from(metricSnapshots)
    .where(and(eq(metricSnapshots.workspaceId, workspaceId), eq(metricSnapshots.productId, productId), eq(metricSnapshots.channel, "all")))
    .orderBy(desc(metricSnapshots.day))
    .limit(1);
  return row?.day ?? null;
}

export async function monthSpendToDate(workspaceId: string, productId: string, asOf: string): Promise<number> {
  const monthStart = `${asOf.slice(0, 7)}-01`;
  const [row] = await db
    .select({ spend: sql<number>`coalesce(sum(${metricSnapshots.spend}), 0)::float` })
    .from(metricSnapshots)
    .where(
      and(
        eq(metricSnapshots.workspaceId, workspaceId),
        eq(metricSnapshots.productId, productId),
        eq(metricSnapshots.channel, "all"),
        gte(metricSnapshots.day, monthStart),
        lte(metricSnapshots.day, asOf),
      ),
    );
  return row?.spend ?? 0;
}

export function shiftDay(day: string, days: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Days remaining in the month, counting `day` itself. */
export function daysLeftInMonth(day: string): number {
  const d = new Date(`${day}T00:00:00Z`);
  const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0));
  return end.getUTCDate() - d.getUTCDate() + 1;
}
