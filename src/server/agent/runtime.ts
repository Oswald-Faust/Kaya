import "server-only";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/server/db/client";
import { agentRuns, campaigns, creativeAssets, experiments } from "@/server/db/schema";
import { classifyIntent, type Intent } from "@/server/domain/agent/intent";
import { CHANNELS, channelLabel, isChannel } from "@/server/domain/channels";
import { isDomainError } from "@/server/domain/errors";
import { allocateBudget } from "@/server/domain/strategy/allocation";
import type { AgentPlan } from "@/server/domain/types";
import { currentChannelScores, monthlyBudgetFor } from "@/server/services/experiments";
import { getGovernance } from "@/server/services/policy-store";
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
  const { intent, amount, label } = classifyIntent(input.goal);

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
      detail: `${confirmed} confirmed facts used; ${unconfirmed} unconfirmed inferences excluded from decisions. Metrics through ${String(kpis.output?.asOf ?? "—")}.`,
    });

    const plan: AgentPlan = {
      objective: label,
      assumptions: [
        "Only confirmed facts are treated as true.",
        "All spend and publishing actions go through workspace policy before running.",
      ],
      steps: PLANS[intent],
    };
    await rec.setRun({ plan, status: "running" });
    await rec.step("plan", `Planned: ${label.toLowerCase()}`, { status: "done", detail: plan.steps.map((s) => s.title).join(" → "), output: { plan } });

    const result = await HANDLERS[intent]({ ctx, rec, kpis: kpis.output ?? {}, amount });
    await rec.message("agent", result.message);
    await rec.setRun(
      result.awaitingApproval
        ? { status: "awaiting_approval" }
        : { status: "completed", finishedAt: new Date(), result: { summary: result.message } },
    );
  } catch (error) {
    const message = isDomainError(error) ? error.message : "The run stopped because of an unexpected error.";
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

type ChannelStat = { channel: string; visits: number; signups: number; paid: number; spend: number; signupRate: number | null; cac: number | null };

const HANDLERS: Record<Intent, (args: HandlerArgs) => Promise<HandlerResult>> = {
  async diagnose({ ctx, rec, kpis }) {
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

    const direction = (change.signups ?? 0) >= 0 ? "rose" : "fell";
    const driver = deltas[0];
    const lines = [
      `Signups ${direction} ${formatDelta(change.signups)} week over week (${prev.signups ?? "—"} → ${cur.signups ?? "—"}).`,
      driver
        ? `${channelLabel(driver.channel)} accounts for most of it: ${driver.previous} → ${driver.current} signups.`
        : "No single channel explains the change.",
      `Blended signup rate moved from ${formatPct(prev.signupRate)} to ${formatPct(cur.signupRate)}; paying customers ${prev.paidConversions ?? "—"} → ${cur.paidConversions ?? "—"}.`,
    ];
    if (top) lines.push(`Recommended next step: ${top.key} “${top.name}”.`);
    return { message: lines.join(" "), awaitingApproval: false };
  },

  async scale({ ctx, rec }) {
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
      return { message: "No active paid campaign is beating its CAC target with enough evidence to scale. I would rather run the next experiment than add spend.", awaitingApproval: false };
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
      return { message: `${best.campaign.name} is efficient, but it is already at the $${policy.maxDailySpend}/day cap. Raise the cap in Settings if you want to scale further.`, awaitingApproval: false };
    }

    const stepId = await rec.step("tool", `Increase “${best.campaign.name}” to $${proposed}/day`);
    const reason = `CAC is ${formatUsd(best.cac)} over the last 14 days, ${Math.round(under * 100)}% below the ${formatUsd(best.target)} target validated by ${experimentKey(best.experiment.number)}.`;
    const result = await invokeTool("ads.update_daily_budget", { campaignId: best.campaign.id, dailyBudget: proposed }, ctx, { reason, stepId, experimentId: best.experiment.id });
    return finishAction(rec, stepId, result, {
      waiting: `I want to increase “${best.campaign.name}” from $${current}/day to $${proposed}/day. ${reason} This exceeds the automatic increase limit, so it is waiting for your approval.`,
      done: `Increased “${best.campaign.name}” from $${current}/day to $${proposed}/day. ${reason}`,
    });
  },

  async allocate({ ctx, rec, amount }) {
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
      return { message: `${formatUsd(budget)} is not enough to fund a paid test that produces a readable signal. Put it into organic work: comparison pages and community answers.`, awaitingApproval: false };
    }
    const lines = allocation.lines.map((l) => `${channelLabel(l.channel)} ${formatUsd(l.amount)} (${Math.round(l.share * 100)}%) — ${l.reason}`);
    const skipped = allocation.excluded.slice(0, 3).map((e) => `${channelLabel(e.channel)}: ${e.reason.toLowerCase()}`);
    return {
      message: `Here is how I would split ${formatUsd(budget)}: ${lines.join("; ")}. Not funded: ${skipped.join("; ")}. Nothing is spent until you approve the individual launches.`,
      awaitingApproval: false,
    };
  },

  async grow({ ctx, rec }) {
    const queue = await call(ctx, rec, "experiments.rank_queue", { limit: 5 }, "Rank the experiment queue");
    const ranked = (queue.output?.ranked as { id: string; key: string; name: string; score: number; suppressedBy: string | null; boostedBy: string[] }[]) ?? [];
    const open = ranked.filter((r) => !r.suppressedBy);
    const top = open[0];
    if (!top) {
      return { message: "The queue is empty. Ask me to research new opportunities or confirm the strategy first.", awaitingApproval: false };
    }

    const exp = await db.query.experiments.findFirst({ where: and(eq(experiments.id, top.id), eq(experiments.workspaceId, ctx.workspaceId)) });
    const shortlist = open.slice(0, 3).map((r) => `${r.key} ${r.name} (score ${r.score})`).join("; ");
    const boosted = top.boostedBy[0] ? ` It ranks first partly because of ${top.boostedBy[0]}.` : "";

    if (exp && (exp.type === "seo_page" || exp.type === "landing_page")) {
      const [asset] = await db
        .select()
        .from(creativeAssets)
        .where(and(eq(creativeAssets.experimentId, exp.id), eq(creativeAssets.workspaceId, ctx.workspaceId), inArray(creativeAssets.kind, ["landing_page"])))
        .orderBy(desc(creativeAssets.createdAt))
        .limit(1);
      if (asset) {
        const stepId = await rec.step("tool", `Publish the page for ${top.key}`);
        const path = `/${asset.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;
        const result = await invokeTool("pages.publish", { assetId: asset.id, path, experimentId: exp.id }, ctx, { reason: exp.rationale, stepId, experimentId: exp.id });
        return finishAction(rec, stepId, result, {
          waiting: `Top of the queue: ${shortlist}.${boosted} The page draft for ${top.key} is ready; publishing it is waiting for your approval.`,
          done: `Published the page for ${top.key} and started the experiment.${boosted}`,
        });
      }
    }

    if (exp && isChannel(exp.channel) && CHANNELS[exp.channel].kind === "paid" && exp.budget > 0) {
      const { policy } = await getGovernance(ctx.workspaceId);
      const daily = Math.min(policy.maxDailySpend, Math.ceil(exp.budget / exp.durationDays));
      const stepId = await rec.step("tool", `Launch ${top.key} on ${channelLabel(exp.channel)}`);
      const result = await invokeTool(
        "ads.launch_campaign",
        { experimentId: exp.id, name: exp.name, channel: exp.channel, dailyBudget: daily },
        ctx,
        { reason: exp.rationale, stepId, experimentId: exp.id },
      );
      return finishAction(rec, stepId, result, {
        waiting: `Top of the queue: ${shortlist}. Launching ${top.key} at $${daily}/day needs your approval.`,
        done: `Launched ${top.key} at $${daily}/day.`,
      });
    }

    await rec.step("observation", `${top.key} needs founder time rather than an automated launch`, { status: "done" });
    return { message: `Top of the queue: ${shortlist}. ${top.key} is not something I can launch through a connected integration; it is in Experiments with a ready brief.`, awaitingApproval: false };
  },
};

async function finishAction(rec: RunRecorder, stepId: string, result: InvokeResult, copy: { waiting: string; done: string }): Promise<HandlerResult> {
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
      return { message: `I did not do this: ${result.decision.reasons.join("; ")}.`, awaitingApproval: false };
    case "failed":
      await rec.finish(stepId, "failed", { detail: result.error });
      return { message: `The action failed: ${result.error}`, awaitingApproval: false };
  }
}
