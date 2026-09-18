import "server-only";
import { and, asc, desc, eq, inArray, ne, sql } from "drizzle-orm";
import { RunRecorder } from "@/server/agent/recorder";
import type { WorkspaceContext } from "@/server/context";
import { db } from "@/server/db/client";
import * as t from "@/server/db/schema";
import { channelLabel, isChannel, type Channel } from "@/server/domain/channels";
import { DomainError, isDomainError } from "@/server/domain/errors";
import { scoreAllChannels, type AudienceArchetype } from "@/server/domain/strategy/channel-fit";
import { DEFAULT_LOCALE, type Locale } from "@/i18n/config";
import { dictionaries } from "@/i18n/dictionaries";
import { fmt as tpl } from "@/i18n/format";
import { generateStrategy } from "@/server/domain/strategy/generate";
import { providersFor } from "@/server/integrations/catalog";
import { arpuFromPlans } from "@/server/intelligence/to-memory";
import { formatUsd } from "@/lib/format";
import { newId, stableId } from "@/lib/ids";
import { recordAudit } from "./audit";
import { nextExperimentNumber, syncSuppression } from "./experiments";
import { listLearnings } from "./learnings";
import { getActiveGoal, getPrimaryProduct } from "./workspace";

export const STRATEGIST_ID = "agent:strategist";

export async function startStrategyRun(ctx: WorkspaceContext, locale: Locale = DEFAULT_LOCALE): Promise<string> {
  const product = await getPrimaryProduct(ctx.workspaceId);
  if (!product) throw new DomainError("not_found", "This workspace has no product.");
  const goal = await getActiveGoal(ctx.workspaceId, product.id);
  if (!goal) throw new DomainError("validation", "Set a growth goal before building the strategy.");
  const runId = newId("run");
  await db.insert(t.agentRuns).values({
    id: runId,
    workspaceId: ctx.workspaceId,
    productId: product.id,
    kind: "strategy",
    goal: tpl(dictionaries[locale].strategyGen.strategyGoal, { goal: goal.title.toLowerCase() }),
    status: "queued",
    planner: "deterministic",
    promptVersion: "strategy-v1",
    createdBy: ctx.userId,
  });
  return runId;
}

function archetypeFrom(text: string): AudienceArchetype {
  const t = text.toLowerCase();
  if (/develop|engineer|devops|\bapi\b|sdk|technical|programm|infrastructure|open source|cli\b/.test(t)) return "developers";
  if (/consumer|personal|famil|students|parents|fitness|dating|hobby|creators? economy|gamers/.test(t)) return "consumer";
  return "b2b_smb";
}

const pause = () => new Promise((r) => setTimeout(r, 200));

/** Strategy Engine run: memory + goal + budget → channel fit → strategy version → experiment queue. */
/** `locale` is the founder's language: the strategy is written for them to read. */
export async function runStrategyGeneration(workspaceId: string, runId: string, locale: Locale = DEFAULT_LOCALE): Promise<void> {
  const run = await db.query.agentRuns.findFirst({ where: and(eq(t.agentRuns.id, runId), eq(t.agentRuns.workspaceId, workspaceId)) });
  if (!run?.productId) return;
  const productId = run.productId;
  const rec = await RunRecorder.open(workspaceId, runId);
  await rec.setRun({ status: "running", startedAt: new Date() });

  try {
    const product = await db.query.products.findFirst({ where: eq(t.products.id, productId) });
    const goal = await getActiveGoal(workspaceId, productId);
    if (!product || !goal) throw new DomainError("validation", "A product and an active goal are required.");

    // 1. Context: confirmed memory only; unconfirmed audiences are used as explicit hypotheses.
    const ctxStep = await rec.step("context", "Reading confirmed business memory");
    const [facts, icpRows, competitorRows, snapshot, integrationRows, metricRow, learningRows] = await Promise.all([
      db.select().from(t.businessFacts).where(and(eq(t.businessFacts.workspaceId, workspaceId), eq(t.businessFacts.productId, productId), inArray(t.businessFacts.status, ["confirmed", "proposed"]))),
      db.select().from(t.icps).where(and(eq(t.icps.workspaceId, workspaceId), eq(t.icps.productId, productId), ne(t.icps.status, "rejected"))).orderBy(asc(t.icps.priority)),
      db.select().from(t.competitors).where(and(eq(t.competitors.workspaceId, workspaceId), eq(t.competitors.productId, productId), ne(t.competitors.status, "rejected"))),
      db.query.productSnapshots.findFirst({ where: eq(t.productSnapshots.productId, productId), orderBy: desc(t.productSnapshots.createdAt) }),
      db.select().from(t.integrations).where(and(eq(t.integrations.workspaceId, workspaceId), eq(t.integrations.status, "connected"))),
      db.query.metricSnapshots.findFirst({ where: and(eq(t.metricSnapshots.workspaceId, workspaceId), eq(t.metricSnapshots.productId, productId)) }),
      listLearnings(workspaceId, productId),
    ]);
    const confirmed = facts.filter((f) => f.status === "confirmed");
    const byKey = (key: string) => confirmed.find((f) => f.key === key);
    const icps = [...icpRows].sort((a, b) => Number(b.status === "confirmed") - Number(a.status === "confirmed") || a.priority - b.priority);
    const unconfirmedIcps = icps.filter((i) => i.status !== "confirmed").length;
    await rec.finish(ctxStep, "done", {
      detail: `${confirmed.length} confirmed facts, ${icps.length} audiences${unconfirmedIcps ? ` (${unconfirmedIcps} unconfirmed, used as hypotheses)` : ""}, ${competitorRows.length} competitors. ${facts.length - confirmed.length} unreviewed facts excluded.`,
    });

    // 2. Channel fit
    await pause();
    const fitStep = await rec.step("tool", "Scoring channel fit");
    const liveRevenue = integrationRows.some((i) => i.mode === "live" && providersFor("READ_REVENUE").some((p) => p.provider === i.provider));
    const hasRevenueData = liveRevenue || Boolean(metricRow);
    const arpu = snapshot?.extraction ? arpuFromPlans(snapshot.extraction.pricing.plans) : null;
    const archetypeText = [product.category, product.oneLiner, ...icps.map((i) => i.name)].filter(Boolean).join(" ");
    const traction: Partial<Record<Channel, number>> = {};
    for (const f of confirmed.filter((f) => f.category === "channel")) {
      const channel = String(f.value ?? "");
      if (isChannel(channel)) traction[channel] = 20;
    }
    const fits = scoreAllChannels({
      audience: archetypeFrom(archetypeText),
      arpuMonthly: arpu ?? 30,
      monthlyBudget: goal.monthlyBudget,
      searchIntent: product.category && product.category !== "Software" ? "high" : "medium",
      traction,
      evidence: learningRows
        .filter((l) => (l.kind === "winner" || l.kind === "loser") && l.channel)
        .map((l) => ({ channel: l.channel!, kind: l.kind as "winner" | "loser", confidence: l.confidence, statement: l.statement })),
    });
    const top = fits.slice(0, 3).map((f) => `${channelLabel(f.channel)} ${f.score}`).join(", ");
    const avoid = fits.filter((f) => f.verdict === "avoid").map((f) => channelLabel(f.channel));
    await rec.finish(fitStep, "done", { detail: `Top: ${top}. Avoid for now: ${avoid.slice(0, 3).join(", ") || "none"}.${arpu === null ? " No pricing found; assumed $30/mo for CAC math." : ""}` });

    // 3–5. Strategy composition
    const generated = generateStrategy({
      productName: product.name,
      oneLiner: byKey("product.one_liner")?.statement ?? product.oneLiner ?? "",
      category: product.category ?? "Software",
      valueProposition: byKey("positioning.value_prop")?.statement ?? null,
      features: confirmed.filter((f) => f.category === "feature").map((f) => f.statement).slice(0, 5),
      icps: icps.map((i) => ({ name: i.name, confidence: i.status === "confirmed" ? Math.max(i.confidence, 0.8) : i.confidence })),
      competitors: competitorRows.map((c) => ({ name: c.name, wedge: c.wedge })),
      arpuMonthly: arpu,
      goal: {
        template: goal.template,
        title: goal.title,
        baseline: goal.baselineValue,
        target: goal.targetValue,
        deadline: goal.deadline,
        monthlyBudget: goal.monthlyBudget,
      },
      locale,
      hasRevenueData,
      channelFits: fits,
    });

    await pause();
    await rec.step("observation", "Allocating the budget", {
      status: "done",
      detail: generated.content.budget.allocation.length
        ? generated.content.budget.allocation.map((a) => `${channelLabel(a.channel)} ${formatUsd(a.amount)}`).join(" · ")
        : "Organic only: no paid channel can produce a readable signal at this budget",
    });
    await pause();
    await rec.step("observation", "Choosing positioning and messaging", { status: "done", detail: generated.content.positioning.statement });
    await pause();
    await rec.step("observation", "Identifying the growth bottleneck", { status: "done", detail: generated.content.bottleneck.title });
    await pause();
    await rec.step("tool", "Designing first experiments", { status: "done", detail: generated.experiments.map((e) => e.name).join(" · ") || "No experiment fits the constraints yet" });

    // 6. Persist as a new strategy version
    const saveStep = await rec.step("learning", "Saving the strategy");
    const version = await db.transaction(async (tx) => {
      const existing = await tx.query.strategies.findFirst({ where: eq(t.strategies.productId, productId) });
      const strategyId = existing?.id ?? newId("str");
      const nextVersion = (existing?.currentVersion ?? 0) + 1;
      if (existing) {
        await tx.update(t.strategies).set({ currentVersion: nextVersion, goalId: goal.id }).where(eq(t.strategies.id, strategyId));
      } else {
        await tx.insert(t.strategies).values({ id: strategyId, workspaceId, productId, goalId: goal.id, currentVersion: 1 });
      }
      const versionId = newId("sv");
      await tx.insert(t.strategyVersions).values({
        id: versionId,
        workspaceId,
        strategyId,
        version: nextVersion,
        summary: generated.summary,
        revisionReason: existing ? `Regenerated with the current goal (${goal.title}) and ${learningRows.length} learnings.` : "Initial strategy from product analysis, goal and budget.",
        evidenceLearningIds: learningRows.slice(0, 10).map((l) => l.id),
        content: generated.content,
        createdBy: "agent",
      });
      await tx.insert(t.channelAssessments).values(
        fits.map((f) => ({ id: newId("ch"), workspaceId, strategyVersionId: versionId, channel: f.channel, score: f.score, verdict: f.verdict, factors: f.factors, rationale: f.rationale, evidence: f.evidence })),
      );
      let number = await nextExperimentNumber(tx, workspaceId);
      for (const e of generated.experiments) {
        const inserted = await tx
          .insert(t.experiments)
          .values({
            id: stableId("exp", workspaceId, e.similarityKey),
            workspaceId,
            productId,
            strategyVersionId: versionId,
            number,
            ...e,
            metricDirection: e.primaryMetric === "cac" ? "decrease" : "increase",
            status: "proposed",
          })
          .onConflictDoNothing()
          .returning({ id: t.experiments.id });
        if (inserted.length) number++;
      }
      await tx.update(t.products).set({ status: "active", onboardingStep: sql`case when ${t.products.onboardingStep} = 'done' then 'done' else 'plan' end`, updatedAt: new Date() }).where(eq(t.products.id, productId));
      await recordAudit(tx, { workspaceId, actorType: "agent", actorId: STRATEGIST_ID, action: "strategy.created", targetType: "strategy_version", targetId: versionId, payload: { version: nextVersion, experiments: generated.experiments.length } });
      return nextVersion;
    });
    await syncSuppression(workspaceId, productId, { type: "agent", id: STRATEGIST_ID });
    await rec.finish(saveStep, "done", { title: `Saved strategy v${version}`, detail: `${generated.experiments.length} experiments queued, nothing launched without your approval` });
    await rec.setRun({ status: "completed", finishedAt: new Date(), result: { version, summary: generated.summary } });
  } catch (error) {
    const message = isDomainError(error) ? error.message : "Strategy generation stopped unexpectedly.";
    if (!isDomainError(error)) console.error(JSON.stringify({ level: "error", msg: "strategy_failed", runId, error: String(error) }));
    await rec.step("observation", "Strategy generation stopped", { status: "failed", detail: message });
    await rec.setRun({ status: "failed", error: message, finishedAt: new Date() });
  }
}

export async function getCurrentStrategy(workspaceId: string, productId: string) {
  const strategy = await db.query.strategies.findFirst({ where: and(eq(t.strategies.workspaceId, workspaceId), eq(t.strategies.productId, productId)) });
  if (!strategy) return null;
  const versions = await db.select().from(t.strategyVersions).where(eq(t.strategyVersions.strategyId, strategy.id)).orderBy(desc(t.strategyVersions.version));
  const current = versions.find((v) => v.version === strategy.currentVersion) ?? versions[0];
  if (!current) return null;
  const [channels, experimentRows, goal] = await Promise.all([
    db.select().from(t.channelAssessments).where(eq(t.channelAssessments.strategyVersionId, current.id)).orderBy(desc(t.channelAssessments.score)),
    db.select().from(t.experiments).where(and(eq(t.experiments.workspaceId, workspaceId), eq(t.experiments.productId, productId))).orderBy(asc(t.experiments.number)),
    strategy.goalId ? db.query.goals.findFirst({ where: eq(t.goals.id, strategy.goalId) }) : Promise.resolve(undefined),
  ]);
  return { strategy, current, versions, channels, experiments: experimentRows, goal: goal ?? null };
}

export type CurrentStrategy = NonNullable<Awaited<ReturnType<typeof getCurrentStrategy>>>;
