import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { agentRuns, campaigns, creativeAssets, experiments, products } from "@/server/db/schema";
import { classifyIntent, type Intent } from "@/server/domain/agent/intent";
import { CHANNELS, channelLabel, isChannel } from "@/server/domain/channels";
import { localizedError } from "@/i18n/errors";
import { DomainError, isDomainError } from "@/server/domain/errors";
import { assetKindFor } from "@/server/domain/content/draft";
import { allocateBudget } from "@/server/domain/strategy/allocation";
import type { AgentPlan } from "@/server/domain/types";
import { currentChannelScores, ensureRateExperimentVariants, monthlyBudgetFor } from "@/server/services/experiments";
import { getGovernance } from "@/server/services/policy-store";
import { DEFAULT_LOCALE, type Locale } from "@/i18n/config";
import { dictionaries } from "@/i18n/dictionaries";
import { fmt as t } from "@/i18n/format";
import { translateDomainText } from "@/i18n/domain-text";
import { experimentKey, formatDelta, formatPct, formatUsd } from "@/lib/format";
import { newId } from "@/lib/ids";
import { invokeTool, type InvokeResult } from "./executor";
import { RunRecorder } from "./recorder";
import type { ToolContext } from "./tool-types";

export const ORCHESTRATOR_ID = "agent:growth-orchestrator";

export interface StartRunInput {
  workspaceId: string;
  productId: string;
  userId: string;
  isDemo: boolean;
  goal: string;
  /** The founder's language: the agent writes its messages in it. */
  locale?: Locale;
}

type Outputs = Record<string, unknown>;

interface HandlerResult {
  message: string;
  awaitingApproval: boolean;
}

const PLANS: Record<Intent, AgentPlan["steps"]> = {
  diagnose: [
    { id: "kpis", title: "Compare this week with last week", why: "Establish what actually changed, with numbers", tool: "analytics.query_kpis", risk: "R0" },
    { id: "channels", title: "Attribute the change to channels", why: "Find the source of the movement", tool: "analytics.channel_breakdown", risk: "R0" },
    { id: "queue", title: "Check what to do next", why: "Turn the diagnosis into an action", tool: "experiments.rank_queue", risk: "R0" },
  ],
  scale: [
    { id: "channels", title: "Find paid campaigns beating their CAC target", why: "Only scale what evidence supports", tool: "analytics.channel_breakdown", risk: "R0" },
    { id: "budget", title: "Propose a bounded budget increase", why: "Grow spend without breaking guardrails", tool: "ads.update_daily_budget", risk: "R3" },
  ],
  allocate: [
    { id: "fit", title: "Read channel fit from the current strategy", why: "Allocate by evidence, not habit", risk: "R0" },
    { id: "memory", title: "Apply learnings from past experiments", why: "Avoid funding channels that already failed", tool: "experiments.rank_queue", risk: "R0" },
    { id: "split", title: "Split the budget and explain each line", why: "Make the trade-offs visible", risk: "R0" },
  ],
  grow: [
    { id: "queue", title: "Rank the experiment queue", why: "Pick the highest expected value per dollar and day", tool: "experiments.rank_queue", risk: "R0" },
    { id: "launch", title: "Prepare the top experiment for launch", why: "Move from recommendation to execution", risk: "R2" },
  ],
};

/**
 * Growth orchestrator: context → plan → typed tools → approval → observation.
 * Handlers are explicit code paths; numbers in messages come from tool
 * outputs, never from model arithmetic.
 */
export async function startGoalRun(input: StartRunInput): Promise<string> {
  const runId = newId("run");
  const now = new Date();
  const { intent, amount } = classifyIntent(input.goal);
  const locale = input.locale ?? DEFAULT_LOCALE;
  const c = dictionaries[locale].agentRun;
  const label = c.intents[intent];

  await db.insert(agentRuns).values({
    id: runId,
    workspaceId: input.workspaceId,
    productId: input.productId,
    kind: "goal",
    goal: input.goal,
    status: "planning",
    planner: "deterministic",
    createdBy: input.userId,
    startedAt: now,
  });

  const rec = await RunRecorder.open(input.workspaceId, runId);
  const ctx: ToolContext = {
    workspaceId: input.workspaceId,
    productId: input.productId,
    runId,
    actor: { type: "agent", id: ORCHESTRATOR_ID },
    isDemo: input.isDemo,
    now,
  };

  try {
    await rec.message("user", input.goal);

    const contextStep = await rec.step("context", "Retrieved business context");
    const memory = await call(ctx, rec, "memory.read_business_context", {}, "Ground the plan in confirmed facts", contextStep);
    const kpis = await call(ctx, rec, "analytics.query_kpis", { days: 7 }, "Know where the business stands", contextStep);
    const confirmed = ((memory.output?.confirmed as unknown[]) ?? []).length;
    const unconfirmed = ((memory.output?.unconfirmed as unknown[]) ?? []).length;
    await rec.finish(contextStep, "done", {
      detail: t(c.contextDetail, { confirmed, unconfirmed, asOf: String(kpis.output?.asOf ?? "—") }),
    });

    const plan: AgentPlan = {
      objective: label,
      assumptions: [...c.assumptions],
      steps: PLANS[intent],
    };
    await rec.setRun({ plan, status: "running" });
    await rec.step("plan", `Planned: ${label.toLowerCase()}`, { status: "done", detail: plan.steps.map((s) => s.title).join(" → "), output: { plan } });

    const result = await HANDLERS[intent]({ ctx, rec, kpis: kpis.output ?? {}, amount, locale, c });
    await rec.message("agent", result.message);
    await rec.setRun(
      result.awaitingApproval
        ? { status: "awaiting_approval" }
        : { status: "completed", finishedAt: new Date(), result: { summary: result.message } },
    );
  } catch (error) {
    const message = isDomainError(error) ? error.message : c.unexpectedError;
    if (!isDomainError(error)) console.error(JSON.stringify({ level: "error", msg: "run_failed", runId, error: String(error) }));
    await rec.step("observation", "Run stopped", { status: "failed", detail: message });
    await rec.setRun({ status: "failed", error: message, finishedAt: new Date() });
  }
  return runId;
}

interface HandlerArgs {
  ctx: ToolContext;
  rec: RunRecorder;
  kpis: Outputs;
  amount: number | null;
  locale: Locale;
  /** The agentRun dictionary in the founder's language. */
  c: Copy;
}

async function call(ctx: ToolContext, rec: RunRecorder, tool: string, input: Record<string, unknown>, reason: string, parentStep?: string) {
  const stepId = parentStep ?? (await rec.step("tool", reason));
  const result = await invokeTool(tool, input, ctx, { reason, stepId });
  const output = result.status === "succeeded" ? result.output : undefined;
  if (!parentStep) {
    await rec.finish(stepId, result.status === "succeeded" ? "done" : result.status === "awaiting_approval" ? "waiting" : "failed", {
      detail: result.status === "failed" ? result.error : undefined,
    });
  }
  return { ...result, output, stepId } as InvokeResult & { output?: Outputs; stepId: string };
}

/** A channel name in the founder's language. */
function label(channel: string, locale: Locale): string {
  return dictionaries[locale].common.channels[channel] ?? channelLabel(channel);
}

type ChannelStat = { channel: string; visits: number; signups: number; paid: number; spend: number; signupRate: number | null; cac: number | null };

const HANDLERS: Record<Intent, (args: HandlerArgs) => Promise<HandlerResult>> = {
  async diagnose({ ctx, rec, kpis, locale, c }) {
    const b14 = await call(ctx, rec, "analytics.channel_breakdown", { days: 14 }, "Break down the last two weeks by channel");
    const b7 = await call(ctx, rec, "analytics.channel_breakdown", { days: 7 }, "Break down the last week by channel");
    const last = new Map(((b7.output?.channels as ChannelStat[]) ?? []).map((c) => [c.channel, c]));
    const deltas = ((b14.output?.channels as ChannelStat[]) ?? []).map((c) => {
      const cur = last.get(c.channel)?.signups ?? 0;
      return { channel: c.channel, previous: c.signups - cur, current: cur, delta: cur - (c.signups - cur) };
    });
    deltas.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

    const cur = kpis.current as Record<string, number | null>;
    const prev = kpis.previous as Record<string, number | null>;
    const change = kpis.change as Record<string, number | null>;
    const obs = await rec.step("observation", "Identified the main driver", { status: "done", output: { deltas: deltas.slice(0, 4) } });
    void obs;

    const queue = await call(ctx, rec, "experiments.rank_queue", { limit: 3 }, "Rank what to do next");
    const top = ((queue.output?.ranked as { key: string; name: string; suppressedBy: string | null }[]) ?? []).find((r) => !r.suppressedBy);

    const driver = deltas[0];
    const lines = [
      t((change.signups ?? 0) >= 0 ? c.diagnose.rose : c.diagnose.fell, { delta: formatDelta(change.signups), previous: prev.signups ?? "—", current: cur.signups ?? "—" }),
      driver
        ? t(c.diagnose.driver, { channel: label(driver.channel, locale), previous: driver.previous, current: driver.current })
        : c.diagnose.noDriver,
      t(c.diagnose.rates, { previous: formatPct(prev.signupRate), current: formatPct(cur.signupRate), previousPaid: prev.paidConversions ?? "—", currentPaid: cur.paidConversions ?? "—" }),
    ];
    if (top) lines.push(t(c.diagnose.next, { key: top.key, name: top.name }));
    return { message: lines.join(" "), awaitingApproval: false };
  },

  async scale({ ctx, rec, locale, c }) {
    const breakdown = await call(ctx, rec, "analytics.channel_breakdown", { days: 14 }, "Measure paid channel efficiency over 14 days");
    const stats = new Map(((breakdown.output?.channels as ChannelStat[]) ?? []).map((c) => [c.channel, c]));
    const active = await db
      .select({ campaign: campaigns, experiment: experiments })
      .from(campaigns)
      .leftJoin(experiments, eq(experiments.id, campaigns.experimentId))
      .where(and(eq(campaigns.workspaceId, ctx.workspaceId), eq(campaigns.status, "active")));

    const candidates = active
      .filter(({ campaign, experiment }) => experiment?.outcome === "winner" && campaign.dailyBudget)
      .map(({ campaign, experiment }) => {
        const s = stats.get(campaign.channel);
        const target = experiment!.primaryMetric === "cac" ? experiment!.successThreshold : null;
        return { campaign, experiment: experiment!, cac: s?.cac ?? null, target };
      })
      .filter((c) => c.cac !== null && c.target !== null && c.cac < c.target)
      .sort((a, b) => a.cac! / a.target! - b.cac! / b.target!);

    const best = candidates[0];
    if (!best) {
      await rec.step("observation", "No paid campaign is clearly beating its target", { status: "done" });
      return { message: c.scale.none, awaitingApproval: false };
    }

    const { policy } = await getGovernance(ctx.workspaceId);
    const current = best.campaign.dailyBudget!;
    const proposed = Math.min(policy.maxDailySpend, Math.round(current * 1.4));
    const under = 1 - best.cac! / best.target!;
    await rec.step("observation", `${best.campaign.name} is ${Math.round(under * 100)}% under its CAC target`, {
      status: "done",
      detail: `CAC ${formatUsd(best.cac)} over 14 days vs a ${formatUsd(best.target)} target (${experimentKey(best.experiment.number)}).`,
    });
    if (proposed <= current) {
      return { message: t(c.scale.atCap, { name: best.campaign.name, cap: formatUsd(policy.maxDailySpend, {}, locale) }), awaitingApproval: false };
    }

    const stepId = await rec.step("tool", `Increase “${best.campaign.name}” to $${proposed}/day`);
    const reason = t(c.scale.reason, { cac: formatUsd(best.cac, {}, locale), pct: Math.round(under * 100), target: formatUsd(best.target, {}, locale), key: experimentKey(best.experiment.number) });
    const result = await invokeTool("ads.update_daily_budget", { campaignId: best.campaign.id, dailyBudget: proposed }, ctx, { reason, stepId, experimentId: best.experiment.id });
    return finishAction(rec, stepId, result, {
      waiting: t(c.scale.waiting, { name: best.campaign.name, current: formatUsd(current, {}, locale), proposed: formatUsd(proposed, {}, locale), reason }),
      done: t(c.scale.done, { name: best.campaign.name, current: formatUsd(current, {}, locale), proposed: formatUsd(proposed, {}, locale), reason }),
    }, c);
  },

  async allocate({ ctx, rec, amount, locale, c }) {
    const budget = amount ?? (await monthlyBudgetFor(ctx.workspaceId, ctx.productId));
    const scores = await currentChannelScores(ctx.workspaceId, ctx.productId);
    await rec.step("tool", "Read channel fit from the current strategy", { status: "done", output: { scores } });
    const queue = await call(ctx, rec, "experiments.rank_queue", { limit: 10 }, "Apply learnings from past experiments");
    const suppressedChannels = new Set(
      ((queue.output?.ranked as { suppressedBy: string | null; key: string }[]) ?? []).filter((r) => r.suppressedBy).map((r) => r.key),
    );
    void suppressedChannels;

    const allocation = allocateBudget(budget, Object.entries(scores).map(([channel, score]) => ({ channel, score })));
    await rec.step("observation", `Split ${formatUsd(budget)} across ${allocation.lines.length} channels`, { status: "done", output: { allocation } });

    if (allocation.lines.length === 0) {
      return { message: t(c.allocate.tooSmall, { budget: formatUsd(budget, {}, locale) }), awaitingApproval: false };
    }
    const lines = allocation.lines.map((l) => t(c.allocate.line, { channel: label(l.channel, locale), amount: formatUsd(l.amount, {}, locale), share: Math.round(l.share * 100), reason: translateDomainText(l.reason, locale) }));
    const skipped = allocation.excluded.slice(0, 3).map((e) => `${label(e.channel, locale)}: ${translateDomainText(e.reason, locale).toLowerCase()}`);
    return {
      message: t(c.allocate.split, { budget: formatUsd(budget, {}, locale), lines: lines.join(" ; "), skipped: skipped.join(" ; ") }),
      awaitingApproval: false,
    };
  },

  async grow({ ctx, rec, locale, c }) {
    const queue = await call(ctx, rec, "experiments.rank_queue", { limit: 5 }, "Rank the experiment queue");
    const ranked = (queue.output?.ranked as { id: string; key: string; name: string; score: number; suppressedBy: string | null; boostedBy: string[] }[]) ?? [];
    const open = ranked.filter((r) => !r.suppressedBy);
    const top = open[0];
    if (!top) {
      return { message: c.grow.empty, awaitingApproval: false };
    }

    const exp = await db.query.experiments.findFirst({ where: and(eq(experiments.id, top.id), eq(experiments.workspaceId, ctx.workspaceId)) });
    const shortlist = open.slice(0, 3).map((r) => t(c.grow.shortlistItem, { key: r.key, name: r.name, score: r.score })).join(" ; ");
    const boosted = top.boostedBy[0] ? t(c.grow.boosted, { learning: top.boostedBy[0] }) : "";

    if (exp) return executeExperiment({ ctx, rec, locale, c, exp, prefix: `${t(c.grow.shortlistLead, { shortlist })}${boosted} ` });

    return { message: t(c.grow.manual, { shortlist, key: top.key }), awaitingApproval: false };
  },
};

type ExperimentRow = typeof experiments.$inferSelect;
type Copy = (typeof dictionaries)[Locale]["agentRun"];

/**
 * Takes one experiment all the way: draft what it needs, then publish, launch
 * or hand it back when no connected tool can run it. Governance still decides
 * whether each external action needs approval.
 */
async function executeExperiment(args: { ctx: ToolContext; rec: RunRecorder; locale: Locale; c: Copy; exp: ExperimentRow; prefix?: string }): Promise<HandlerResult> {
  const { ctx, rec, locale, c, exp } = args;
  const key = experimentKey(exp.number);
  const prefix = args.prefix ?? "";
  const e = c.execute;

  if (exp.status === "running") return { message: prefix + t(e.alreadyRunning, { key }), awaitingApproval: false };

  let assetId: string | null = null;
  let draftLine = "";
  const kind = assetKindFor(exp.type, exp.channel);
  if (kind) {
    const draft = await call(ctx, rec, "content.draft_asset", { experimentId: exp.id, locale }, "Draft the content this experiment needs");
    if (draft.status === "succeeded") {
      assetId = (draft.output?.assetId as string) ?? null;
      draftLine = `${t(draft.output?.reused ? e.reused : e.drafted, { title: String(draft.output?.title ?? "") })} `;
    } else if (draft.status === "failed") {
      return { message: prefix + t(e.noIntegration, { key, reason: draft.error }), awaitingApproval: false };
    }
  }

  const lead = prefix + draftLine;

  if (kind === "landing_page" && assetId) {
    const stepId = await rec.step("tool", `Publish the page for ${key}`);
    const path = `/${exp.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60) || "page"}`;
    const result = await invokeTool("pages.publish", { assetId, path, experimentId: exp.id }, ctx, { reason: exp.rationale, stepId, experimentId: exp.id });
    if (result.status === "failed") return { message: lead + t(e.noIntegration, { key, reason: result.error }), awaitingApproval: false };
    return finishAction(rec, stepId, result, { waiting: lead + t(c.grow.pageWaiting, { shortlist: key, boosted: "", key }), done: lead + t(c.grow.pageDone, { key, boosted: "" }) }, c);
  }

  if (isChannel(exp.channel) && CHANNELS[exp.channel].kind === "paid" && exp.budget > 0) {
    const { policy } = await getGovernance(ctx.workspaceId);
    const daily = Math.min(policy.maxDailySpend, Math.ceil(exp.budget / exp.durationDays));
    const stepId = await rec.step("tool", `Launch ${key} on ${channelLabel(exp.channel)}`);
    const result = await invokeTool("ads.launch_campaign", { experimentId: exp.id, name: exp.name, channel: exp.channel, dailyBudget: daily }, ctx, { reason: exp.rationale, stepId, experimentId: exp.id });
    if (result.status === "failed") return { message: lead + t(e.noIntegration, { key, reason: result.error }), awaitingApproval: false };
    return finishAction(rec, stepId, result, {
      waiting: lead + t(c.grow.launchWaiting, { shortlist: key, key, daily: formatUsd(daily, {}, locale) }),
      done: lead + t(c.grow.launchDone, { key, daily: formatUsd(daily, {}, locale) }),
    }, c);
  }

  if (kind === "social_post" && assetId && (exp.channel === "x_organic" || exp.channel === "linkedin")) {
    const asset = await db.query.creativeAssets.findFirst({ where: eq(creativeAssets.id, assetId) });
    const stepId = await rec.step("tool", `Publish the post for ${key}`);
    const result = await invokeTool(
      "social.publish_post",
      { text: (asset?.body ?? exp.hypothesis).slice(0, 280), channel: exp.channel, experimentId: exp.id },
      ctx,
      { reason: exp.rationale, stepId, experimentId: exp.id },
    );
    if (result.status === "failed") return { message: lead + t(e.noIntegration, { key, reason: result.error }), awaitingApproval: false };
    return finishAction(rec, stepId, result, { waiting: lead + t(e.postWaiting, { key }), done: lead + t(e.postDone, { key }) }, c);
  }

  if (kind === "email") return { message: lead + t(e.emailReady, { key }), awaitingApproval: false };

  await rec.step("observation", `${key} needs founder time rather than an automated launch`, { status: "done" });
  return { message: lead + t(e.manual, { key }), awaitingApproval: false };
}

/** Runs the one experiment the founder picked, instead of letting the agent choose. */
export async function startExperimentRun(input: Omit<StartRunInput, "goal"> & { experimentId: string }): Promise<string> {
  const locale = input.locale ?? DEFAULT_LOCALE;
  const c = dictionaries[locale].agentRun;
  const now = new Date();
  const runId = newId("run");
  const exp = await db.transaction(async (tx) => {
    await tx.select({ id: products.id }).from(products).where(and(eq(products.id, input.productId), eq(products.workspaceId, input.workspaceId))).for("update");
    const experiment = await tx.query.experiments.findFirst({ where: and(eq(experiments.id, input.experimentId), eq(experiments.workspaceId, input.workspaceId), eq(experiments.productId, input.productId)) });
    if (!experiment) throw new DomainError("not_found", c.execute.notFound);
    if (experiment.status === "archived") throw localizedError("conflict", "experimentArchived");
    await ensureRateExperimentVariants(tx, experiment);
    await tx.insert(agentRuns).values({
      id: runId, workspaceId: input.workspaceId, productId: input.productId,
      kind: "goal", goal: t(c.execute.goal, { key: experimentKey(experiment.number), name: experiment.name }),
      status: "planning", planner: "deterministic", createdBy: input.userId, startedAt: now,
    });
    return experiment;
  });
  const key = experimentKey(exp.number);
  const goal = t(c.execute.goal, { key, name: exp.name });

  const rec = await RunRecorder.open(input.workspaceId, runId);
  const ctx: ToolContext = { workspaceId: input.workspaceId, productId: input.productId, runId, actor: { type: "agent", id: ORCHESTRATOR_ID }, isDemo: input.isDemo, now };

  try {
    await rec.message("user", goal);
    const plan: AgentPlan = {
      objective: t(c.execute.objective, { key, name: exp.name }),
      assumptions: [...c.assumptions],
      steps: [
        { id: "read", title: c.execute.planRead, why: c.execute.planReadWhy, tool: "memory.read_business_context", risk: "R0" },
        { id: "draft", title: c.execute.planDraft, why: c.execute.planDraftWhy, tool: "content.draft_asset", risk: "R1" },
        { id: "execute", title: c.execute.planExecute, why: c.execute.planExecuteWhy, risk: "R2" },
      ],
    };
    await rec.setRun({ plan, status: "running" });

    const contextStep = await rec.step("context", "Retrieved business context");
    await call(ctx, rec, "memory.read_business_context", {}, "Ground the plan in confirmed facts", contextStep);
    await rec.finish(contextStep, "done");

    const result = await executeExperiment({ ctx, rec, locale, c, exp });
    await rec.message("agent", result.message);
    await rec.setRun(result.awaitingApproval ? { status: "awaiting_approval" } : { status: "completed", finishedAt: new Date(), result: { summary: result.message } });
  } catch (error) {
    const message = isDomainError(error) ? error.message : c.unexpectedError;
    if (!isDomainError(error)) console.error(JSON.stringify({ level: "error", msg: "experiment_run_failed", runId, error: String(error) }));
    await rec.step("observation", "Run stopped", { status: "failed", detail: message });
    await rec.setRun({ status: "failed", error: message, finishedAt: new Date() });
  }
  return runId;
}

async function finishAction(rec: RunRecorder, stepId: string, result: InvokeResult, copy: { waiting: string; done: string }, c: Copy): Promise<HandlerResult> {
  switch (result.status) {
    case "awaiting_approval":
      await rec.finish(stepId, "waiting", { output: { approvalId: result.approvalId, toolCallId: result.toolCallId } });
      await rec.step("approval", "Requested approval", { status: "waiting", detail: result.decision.reasons.join("; "), output: { approvalId: result.approvalId } });
      return { message: copy.waiting, awaitingApproval: true };
    case "succeeded":
      await rec.finish(stepId, "done", { output: { toolCallId: result.toolCallId, demo: result.isDemo } });
      return { message: copy.done, awaitingApproval: false };
    case "blocked":
      await rec.finish(stepId, "failed", { detail: `Blocked by policy: ${result.decision.reasons.join("; ")}` });
      return { message: t(c.blocked, { reasons: result.decision.reasons.join("; ") }), awaitingApproval: false };
    case "failed":
      await rec.finish(stepId, "failed", { detail: result.error });
      return { message: t(c.failed, { error: result.error }), awaitingApproval: false };
  }
}
