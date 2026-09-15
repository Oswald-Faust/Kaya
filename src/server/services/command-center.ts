import "server-only";
import { and, asc, eq, inArray } from "drizzle-orm";
import type { WorkspaceContext } from "@/server/context";
import { db } from "@/server/db/client";
import { experimentVariants, experiments, integrations } from "@/server/db/schema";
import { buildGrowthBrief } from "@/server/domain/brief/growth-brief";
import { computeKpis, pctChange, splitWindows, type DailyMetricsRow } from "@/server/domain/analytics/metrics";
import { getIntegration } from "@/server/integrations/catalog";
import { experimentKey } from "@/lib/format";
import { listApprovals } from "./approvals";
import { evaluateRow, rankQueue } from "./experiments";
import { listLearnings } from "./learnings";
import { getBlendedRows, getChannelRows, shiftDay } from "./metrics";
import { getShellData } from "./workspace";

export async function getCommandCenter(ctx: WorkspaceContext) {
  const shell = await getShellData(ctx);
  const product = shell.product;
  if (!product) return null;
  const W = ctx.workspaceId;
  const asOf = shell.asOf;

  const [blended, channelRows, running, ranked, pendingApprovals, learningRows, integrationRows] = await Promise.all([
    asOf ? getBlendedRows(W, product.id, shiftDay(asOf, -89), asOf) : Promise.resolve([] as DailyMetricsRow[]),
    asOf ? getChannelRows(W, product.id, shiftDay(asOf, -13), asOf) : Promise.resolve([]),
    db
      .select()
      .from(experiments)
      .where(and(eq(experiments.workspaceId, W), eq(experiments.productId, product.id), inArray(experiments.status, ["running", "evaluating"])))
      .orderBy(asc(experiments.startedAt)),
    rankQueue(W, product.id),
    listApprovals(W, "pending"),
    listLearnings(W, product.id),
    db.select().from(integrations).where(eq(integrations.workspaceId, W)),
  ]);

  /* Outcome strip: last 30 days vs the 30 before. */
  const [prev30, cur30] = splitWindows(blended, 30);
  const k30 = computeKpis(cur30);
  const p30 = computeKpis(prev30);
  const strip = {
    mrr: { value: k30.mrr.value, delta: pctChange(k30.mrr.value, p30.mrr.value), formula: k30.mrr.formula },
    netNewMrr: { value: k30.netNewMrr.value, delta: pctChange(k30.netNewMrr.value, p30.netNewMrr.value), formula: k30.netNewMrr.formula },
    signups: { value: k30.signups.value, delta: pctChange(k30.signups.value, p30.signups.value), formula: k30.signups.formula },
    signupRate: { value: k30.signupRate.value, delta: pctChange(k30.signupRate.value, p30.signupRate.value), formula: k30.signupRate.formula },
    newCustomers: { value: k30.paidConversions.value, delta: pctChange(k30.paidConversions.value, p30.paidConversions.value), formula: k30.paidConversions.formula },
    cac: { value: k30.blendedCac.value, delta: pctChange(k30.blendedCac.value, p30.blendedCac.value), formula: k30.blendedCac.formula, spend: k30.spend.value },
  };
  const sparks = {
    mrr: cur30.map((r) => r.mrr),
    signups: cur30.map((r) => r.signups),
  };

  /* Weekly comparison for the brief. */
  const [prev7, cur7] = splitWindows(blended, 7);
  const k7 = computeKpis(cur7);
  const p7 = computeKpis(prev7);
  const lastWeekStart = asOf ? shiftDay(asOf, -6) : "";
  const channelWeek = new Map<string, { current: number; previous: number }>();
  for (const r of channelRows) {
    const acc = channelWeek.get(r.channel) ?? { current: 0, previous: 0 };
    if (r.day >= lastWeekStart) acc.current += r.signups;
    else acc.previous += r.signups;
    channelWeek.set(r.channel, acc);
  }

  /* Running experiments with live evaluation. */
  const variantRows = running.length
    ? await db.select().from(experimentVariants).where(inArray(experimentVariants.experimentId, running.map((e) => e.id)))
    : [];
  const runningView = running.map((exp) => {
    const variants = variantRows.filter((v) => v.experimentId === exp.id);
    const evaluation = evaluateRow(exp, variants);
    const elapsed = exp.startedAt ? Math.floor((Date.now() - exp.startedAt.getTime()) / 86_400_000) : 0;
    return { experiment: exp, key: experimentKey(exp.number), evaluation, daysLeft: Math.max(0, exp.durationDays - elapsed), elapsed };
  });

  const open = ranked.filter((r) => !r.suppressedBy);
  const suppressed = ranked.filter((r) => r.suppressedBy);
  const issues = integrationRows
    .filter((i) => i.status === "error" || (i.status === "connected" && i.health !== "ok"))
    .map((i) => ({ provider: i.provider, name: getIntegration(i.provider)?.name ?? i.provider, detail: i.syncError ?? `Health: ${i.health}` }));

  const goal = shell.goal;
  const brief = asOf
    ? buildGrowthBrief({
        asOf,
        signups: { current: k7.signups.value ?? 0, previous: p7.signups.value ?? 0 },
        signupRate: { current: k7.signupRate.value, previous: p7.signupRate.value },
        netNewMrr: { current: k7.netNewMrr.value ?? 0, previous: p7.netNewMrr.value ?? 0 },
        channels: [...channelWeek.entries()].map(([channel, v]) => ({ channel, ...v })),
        goal: goal
          ? {
              title: goal.title,
              onTrack: goal.onTrack,
              requiredPerWeek: goal.daysLeft > 0 ? ((goal.target - goal.current) / goal.daysLeft) * 7 : null,
              daysLeft: goal.daysLeft,
            }
          : null,
        running: runningView.map((r) => ({ key: r.key, name: r.experiment.name, decision: r.evaluation.decision, summary: r.evaluation.summary })),
        topAction: open[0]
          ? { key: experimentKey(open[0].experiment.number), name: open[0].experiment.name, boostedBy: open[0].boostedBy[0]?.statement ?? null }
          : null,
        pendingApproval: pendingApprovals[0]
          ? { id: pendingApprovals[0].id, title: pendingApprovals[0].title, change: pendingApprovals[0].change, reason: pendingApprovals[0].reason }
          : null,
        integrationIssue: issues[0] ? { name: issues[0].name, detail: issues[0].detail } : null,
      })
    : null;

  /* Markers: experiment launches visible in the MRR chart. */
  const markers = (await db
    .select({ number: experiments.number, startedAt: experiments.startedAt })
    .from(experiments)
    .where(and(eq(experiments.workspaceId, W), eq(experiments.productId, product.id))))
    .filter((e) => e.startedAt)
    .map((e) => ({ x: e.startedAt!.toISOString().slice(0, 10), label: experimentKey(e.number) }));

  return {
    shell,
    asOf,
    strip,
    sparks,
    brief,
    mrrSeries: blended.map((r) => ({ x: r.day, y: r.mrr })),
    markers,
    running: runningView,
    nextActions: open.slice(0, 4),
    suppressed: suppressed.slice(0, 2),
    approvals: pendingApprovals,
    learnings: learningRows.filter((l) => l.status === "active").slice(0, 5),
    issues,
  };
}

export type CommandCenterData = NonNullable<Awaited<ReturnType<typeof getCommandCenter>>>;
