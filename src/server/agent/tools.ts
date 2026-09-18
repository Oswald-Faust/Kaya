import "server-only";
import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/server/db/client";
import { businessFacts, campaigns, competitors, creativeAssets, experimentVariants, experiments, icps, products } from "@/server/db/schema";
import { CHANNELS, isChannel } from "@/server/domain/channels";
import { assetKindFor, draftAsset } from "@/server/domain/content/draft";
import { DEFAULT_LOCALE, type Locale } from "@/i18n/config";
import { computeKpis, splitWindows, pctChange } from "@/server/domain/analytics/metrics";
import { DomainError } from "@/server/domain/errors";
import { resolveAdapter } from "@/server/integrations/resolver";
import { READ_CAPABILITIES, type Capability } from "@/server/integrations/catalog";
import {
  evaluateAndComplete,
  evaluateRow,
  getExperimentById,
  nextExperimentNumber,
  rankQueue,
  syncSuppression,
  transitionExperiment,
} from "@/server/services/experiments";
import { daysLeftInMonth, getBlendedRows, getChannelRows, latestMetricDay, monthSpendToDate, shiftDay } from "@/server/services/metrics";
import { experimentKey } from "@/lib/format";
import { stableId } from "@/lib/ids";
import { defineTool, type ToolContext, type ToolDefinition } from "./tool-types";

const ALL_ROLES: ("owner" | "admin" | "member")[] = ["owner", "admin", "member"];
const MANAGERS: ("owner" | "admin")[] = ["owner", "admin"];

async function reportingWindow(ctx: ToolContext, days: number) {
  const asOf = (await latestMetricDay(ctx.workspaceId, ctx.productId)) ?? ctx.now.toISOString().slice(0, 10);
  return { asOf, from: shiftDay(asOf, -(days * 2 - 1)), to: asOf };
}

async function requireAdapter(ctx: ToolContext, capability: Capability) {
  const resolved = await resolveAdapter(ctx.workspaceId, capability);
  if (!resolved) {
    throw new DomainError("upstream", `No connected integration can perform ${capability}. Connect one in Integrations.`, { capability });
  }
  return resolved;
}

/* ─────────────────────────── Read (R0) ─────────────────────────── */

const queryKpis = defineTool({
  name: "analytics.query_kpis",
  title: "Query business metrics",
  description: "Computes MRR, signups, conversion rates, CAC and spend for a trailing window and the window before it.",
  capability: "READ_ANALYTICS",
  risk: "R0",
  external: false,
  supportsDryRun: true,
  permissions: ALL_ROLES,
  input: z.object({ days: z.number().int().min(7).max(90).default(7) }),
  idempotencyKey: (i) => `days=${i.days}`,
  describe: (i) => ({ title: `Compared the last ${i.days} days with the ${i.days} before` }),
  async run(input, ctx) {
    const w = await reportingWindow(ctx, input.days);
    const rows = await getBlendedRows(ctx.workspaceId, ctx.productId, w.from, w.to);
    const [previous, current] = splitWindows(rows, input.days);
    const cur = computeKpis(current);
    const prev = computeKpis(previous);
    const pick = (k: typeof cur) => ({
      mrr: k.mrr.value,
      newMrr: k.newMrr.value,
      signups: k.signups.value,
      visits: k.visits.value,
      signupRate: k.signupRate.value,
      paidConversions: k.paidConversions.value,
      blendedCac: k.blendedCac.value,
      spend: k.spend.value,
    });
    return {
      output: {
        asOf: w.asOf,
        days: input.days,
        current: pick(cur),
        previous: pick(prev),
        change: {
          signups: pctChange(cur.signups.value, prev.signups.value),
          signupRate: pctChange(cur.signupRate.value, prev.signupRate.value),
          paidConversions: pctChange(cur.paidConversions.value, prev.paidConversions.value),
          blendedCac: pctChange(cur.blendedCac.value, prev.blendedCac.value),
        },
        formulas: { signupRate: cur.signupRate.formula, blendedCac: cur.blendedCac.formula },
      },
    };
  },
});

const channelBreakdown = defineTool({
  name: "analytics.channel_breakdown",
  title: "Break down results by channel",
  description: "Signups, paying customers, spend, signup rate and CAC per acquisition channel for a trailing window.",
  capability: "READ_ANALYTICS",
  risk: "R0",
  external: false,
  supportsDryRun: true,
  permissions: ALL_ROLES,
  input: z.object({ days: z.number().int().min(7).max(90).default(14) }),
  idempotencyKey: (i) => `days=${i.days}`,
  describe: (i) => ({ title: `Broke down the last ${i.days} days by channel` }),
  async run(input, ctx) {
    const w = await reportingWindow(ctx, input.days);
    const rows = await getChannelRows(ctx.workspaceId, ctx.productId, shiftDay(w.asOf, -(input.days - 1)), w.asOf);
    const byChannel = new Map<string, { visits: number; signups: number; paid: number; spend: number; newMrr: number }>();
    for (const r of rows) {
      const acc = byChannel.get(r.channel) ?? { visits: 0, signups: 0, paid: 0, spend: 0, newMrr: 0 };
      acc.visits += r.visits;
      acc.signups += r.signups;
      acc.paid += r.paidConversions;
      acc.spend += r.spend;
      acc.newMrr += r.newMrr;
      byChannel.set(r.channel, acc);
    }
    const channels = [...byChannel.entries()]
      .map(([channel, v]) => ({
        channel,
        ...v,
        spend: Math.round(v.spend * 100) / 100,
        signupRate: v.visits > 0 ? v.signups / v.visits : null,
        cac: v.paid > 0 && v.spend > 0 ? v.spend / v.paid : null,
      }))
      .sort((a, b) => b.signups - a.signups);
    return { output: { asOf: w.asOf, days: input.days, channels } };
  },
});

const readBusinessContext = defineTool({
  name: "memory.read_business_context",
  title: "Read business memory",
  description: "Confirmed facts, prioritized ICPs and known competitors. Unconfirmed inferences are returned separately and marked.",
  capability: "READ_MEMORY",
  risk: "R0",
  external: false,
  supportsDryRun: true,
  permissions: ALL_ROLES,
  input: z.object({}),
  idempotencyKey: () => "all",
  describe: () => ({ title: "Read confirmed facts, ICPs and competitors" }),
  async run(_input, ctx) {
    const [facts, icpRows, competitorRows] = await Promise.all([
      db
        .select()
        .from(businessFacts)
        .where(and(eq(businessFacts.workspaceId, ctx.workspaceId), eq(businessFacts.productId, ctx.productId), inArray(businessFacts.status, ["confirmed", "proposed"]))),
      db.select().from(icps).where(and(eq(icps.workspaceId, ctx.workspaceId), eq(icps.productId, ctx.productId))).orderBy(icps.priority),
      db.select().from(competitors).where(and(eq(competitors.workspaceId, ctx.workspaceId), eq(competitors.productId, ctx.productId))),
    ]);
    return {
      output: {
        confirmed: facts.filter((f) => f.status === "confirmed").map((f) => ({ key: f.key, statement: f.statement, kind: f.kind })),
        unconfirmed: facts.filter((f) => f.status === "proposed").map((f) => ({ key: f.key, statement: f.statement, confidence: f.confidence })),
        icps: icpRows.map((i) => ({ name: i.name, priority: i.priority, confidence: i.confidence, status: i.status })),
        competitors: competitorRows.map((c) => ({ name: c.name, kind: c.kind, wedge: c.wedge })),
      },
    };
  },
});

const rankExperimentQueue = defineTool({
  name: "experiments.rank_queue",
  title: "Rank the experiment queue",
  description: "Scores queued experiments by impact, confidence, information gain, channel fit, effort, cost and time to signal. Suppresses anything past learnings disproved.",
  capability: "READ_EXPERIMENTS",
  risk: "R0",
  external: false,
  supportsDryRun: true,
  permissions: ALL_ROLES,
  input: z.object({ limit: z.number().int().min(1).max(20).default(5) }),
  idempotencyKey: (i) => `limit=${i.limit}`,
  describe: () => ({ title: "Ranked the experiment queue against past learnings" }),
  async run(input, ctx) {
    const ranked = await rankQueue(ctx.workspaceId, ctx.productId);
    return {
      output: {
        ranked: ranked.slice(0, input.limit).map((r) => ({
          key: experimentKey(r.experiment.number),
          id: r.experiment.id,
          name: r.experiment.name,
          score: r.score,
          confidence: Math.round(r.adjustedConfidence * 100) / 100,
          boostedBy: r.boostedBy.map((l) => l.statement),
          suppressedBy: r.suppressedBy?.statement ?? null,
        })),
      },
    };
  },
});

const evaluateExperimentTool = defineTool({
  name: "experiments.evaluate",
  title: "Evaluate an experiment",
  description: "Runs the deterministic statistical evaluation for a running experiment without changing it.",
  capability: "READ_EXPERIMENTS",
  risk: "R0",
  external: false,
  supportsDryRun: true,
  permissions: ALL_ROLES,
  input: z.object({ experimentId: z.string() }),
  idempotencyKey: (i) => i.experimentId,
  describe: () => ({ title: "Evaluated experiment results" }),
  async run(input, ctx) {
    const exp = await getExperimentById(ctx.workspaceId, input.experimentId);
    const variants = await db.select().from(experimentVariants).where(eq(experimentVariants.experimentId, exp.id));
    const evaluation = evaluateRow(exp, variants, ctx.now);
    return { output: { key: experimentKey(exp.number), ...evaluation }, targetType: "experiment", targetId: exp.id };
  },
});

/* ─────────────────────────── Draft / internal (R1) ─────────────────────────── */

const proposeExperiment = defineTool({
  name: "experiments.propose",
  title: "Propose an experiment",
  description: "Adds a measurable experiment to the queue. Nothing is launched; if memory already disproved the tactic it is suppressed with the reason.",
  capability: "CREATE_EXPERIMENT",
  risk: "R1",
  external: false,
  supportsDryRun: true,
  permissions: ALL_ROLES,
  input: z.object({
    name: z.string().min(4).max(120),
    hypothesis: z.string().min(10).max(400),
    type: z.enum(["paid_ad", "landing_page", "pricing", "messaging", "seo_page", "email", "creator", "community", "activation"]),
    channel: z.string(),
    audience: z.string().min(3),
    primaryMetric: z.enum(["signup_rate", "activation_rate", "trial_to_paid", "ctr", "cac"]),
    successThreshold: z.number().positive(),
    budget: z.number().min(0).default(0),
    impact: z.number().int().min(1).max(5),
    priorConfidence: z.number().min(0).max(1),
    effort: z.number().int().min(1).max(5),
    informationGain: z.number().int().min(1).max(5),
    timeToSignalDays: z.number().int().min(1).max(90),
    durationDays: z.number().int().min(1).max(120),
    similarityKey: z.string().regex(/^[a-z_]+:[a-z_]+:[a-z0-9_]+$/),
    rationale: z.string().min(10),
  }),
  idempotencyKey: (i) => i.similarityKey,
  describe: (i) => ({ title: `Proposed “${i.name}”` }),
  async run(input, ctx, opts) {
    if (opts.dryRun) return { output: { dryRun: true, name: input.name } };
    const number = await nextExperimentNumber(db, ctx.workspaceId);
    const id = stableId("exp", ctx.workspaceId, input.similarityKey);
    await db
      .insert(experiments)
      .values({
        id,
        workspaceId: ctx.workspaceId,
        productId: ctx.productId,
        number,
        ...input,
        metricDirection: input.primaryMetric === "cac" ? "decrease" : "increase",
        status: "proposed",
      })
      .onConflictDoNothing();
    await syncSuppression(ctx.workspaceId, ctx.productId, ctx.actor);
    const saved = await getExperimentById(ctx.workspaceId, id);
    return {
      output: { key: experimentKey(saved.number), id, status: saved.status, suppressedReason: saved.suppressedReason },
      targetType: "experiment",
      targetId: id,
    };
  },
});

const completeExperiment = defineTool({
  name: "experiments.complete",
  title: "Record result and learning",
  description: "Completes a running experiment when the evaluation reaches a decision, and writes the learning into business memory.",
  capability: "WRITE_MEMORY",
  risk: "R1",
  external: false,
  supportsDryRun: false,
  permissions: ALL_ROLES,
  input: z.object({ experimentId: z.string(), force: z.boolean().default(false) }),
  idempotencyKey: (i) => i.experimentId,
  describe: () => ({ title: "Recorded the experiment result and learning" }),
  async run(input, ctx) {
    const result = await evaluateAndComplete(ctx.workspaceId, input.experimentId, ctx.actor, { force: input.force });
    return {
      output: {
        completed: result.completed,
        decision: result.evaluation.decision,
        summary: result.evaluation.summary,
        learning: result.learning?.statement ?? null,
      },
      targetType: "experiment",
      targetId: input.experimentId,
    };
  },
});

const readLive = defineTool({
  name: "integrations.read_live",
  title: "Read live data from a connected tool",
  description: "Reads the latest 30 days straight from a connected integration (Stripe, GA4, Search Console, PostHog, Plausible, ad accounts, email, X). Use it to check real numbers before recommending or acting.",
  capability: "READ_ANALYTICS",
  risk: "R0",
  external: false,
  supportsDryRun: true,
  permissions: ALL_ROLES,
  input: z.object({ capability: z.enum(READ_CAPABILITIES) }),
  idempotencyKey: (i) => i.capability,
  describe: (i) => ({ title: `Read live ${i.capability.replace(/^READ_/, "").toLowerCase().replace(/_/g, " ")}` }),
  async run(input, ctx) {
    const { adapter, integrationId } = await requireAdapter(ctx, input.capability);
    const result = await adapter.read(input.capability, {});
    return { output: result.data, adapter: adapter.provider, isDemo: adapter.mode === "demo", targetType: "integration", targetId: integrationId ?? adapter.provider };
  },
});

const draftContent = defineTool({
  name: "content.draft_asset",
  title: "Draft the content for an experiment",
  description: "Writes the page, email, ad or post an experiment needs, from confirmed memory and the strategy. A draft only: publishing is a separate, approved action.",
  capability: "DRAFT_CONTENT",
  risk: "R1",
  external: false,
  supportsDryRun: true,
  permissions: ALL_ROLES,
  input: z.object({ experimentId: z.string(), locale: z.string().max(5).optional() }),
  idempotencyKey: (i) => i.experimentId,
  describe: () => ({ title: "Draft the content" }),
  async run(input, ctx, opts) {
    const experiment = await getExperimentById(ctx.workspaceId, input.experimentId);
    const existing = await db
      .select()
      .from(creativeAssets)
      .where(and(eq(creativeAssets.workspaceId, ctx.workspaceId), eq(creativeAssets.experimentId, experiment.id)))
      .orderBy(desc(creativeAssets.createdAt))
      .limit(1);
    if (existing[0]) {
      return { output: { assetId: existing[0].id, kind: existing[0].kind, title: existing[0].title, reused: true }, targetType: "creative_asset", targetId: existing[0].id };
    }

    const kind = assetKindFor(experiment.type, experiment.channel);
    if (!kind) throw new DomainError("validation", "This experiment runs on founder time; there is nothing to draft.");
    if (opts.dryRun) return { output: { dryRun: true, kind } };

    const [product, facts, icpRows, competitorRows] = await Promise.all([
      db.query.products.findFirst({ where: eq(products.id, ctx.productId) }),
      db
        .select()
        .from(businessFacts)
        .where(and(eq(businessFacts.workspaceId, ctx.workspaceId), eq(businessFacts.productId, ctx.productId), eq(businessFacts.status, "confirmed"))),
      db.select().from(icps).where(and(eq(icps.workspaceId, ctx.workspaceId), eq(icps.productId, ctx.productId))).orderBy(icps.priority),
      db.select().from(competitors).where(and(eq(competitors.workspaceId, ctx.workspaceId), eq(competitors.productId, ctx.productId))).limit(1),
    ]);
    if (!product) throw new DomainError("not_found", "This workspace has no product yet.");

    const drafted = draftAsset({
      experiment,
      product: { name: product.name, oneLiner: product.oneLiner ?? facts.find((f) => f.key === "product.one_liner")?.statement ?? product.name, url: product.url },
      features: facts.filter((f) => f.category === "feature").map((f) => f.statement),
      icp: icpRows[0]?.name ?? null,
      competitor: competitorRows[0]?.name ?? null,
      locale: (input.locale as Locale) ?? DEFAULT_LOCALE,
    });
    if (!drafted) throw new DomainError("validation", "There is nothing to draft for this experiment.");

    const id = stableId("asset", ctx.workspaceId, `${experiment.id}:${drafted.kind}`);
    await db
      .insert(creativeAssets)
      .values({ id, workspaceId: ctx.workspaceId, experimentId: experiment.id, kind: drafted.kind, channel: experiment.channel, title: drafted.title, body: drafted.body, status: "draft" })
      .onConflictDoNothing();
    return { output: { assetId: id, kind: drafted.kind, title: drafted.title, reused: false }, targetType: "creative_asset", targetId: id };
  },
});

/* ─────────────────────────── Publish (R2) ─────────────────────────── */

const publishPage = defineTool({
  name: "pages.publish",
  title: "Publish a landing page",
  description: "Publishes an approved page draft and starts the experiment it belongs to.",
  capability: "PUBLISH_LANDING_PAGE",
  risk: "R2",
  external: true,
  supportsDryRun: true,
  permissions: MANAGERS,
  input: z.object({ assetId: z.string(), path: z.string().regex(/^\/[a-z0-9\-/]+$/), experimentId: z.string().optional() }),
  idempotencyKey: (i) => `${i.assetId}:${i.path}`,
  describe: (i) => ({ title: "Publish landing page", change: `Draft → live at ${i.path}` }),
  async run(input, ctx, opts) {
    const { adapter } = await requireAdapter(ctx, "PUBLISH_LANDING_PAGE");
    const result = await adapter.execute("PUBLISH_LANDING_PAGE", input, opts);
    if (!opts.dryRun && input.experimentId) {
      const exp = await getExperimentById(ctx.workspaceId, input.experimentId);
      if (exp.status === "awaiting_approval" || exp.status === "proposed") {
        const e = exp.status === "proposed" ? { ...exp } : exp;
        if (exp.status === "proposed") await transitionExperiment(db, ctx.workspaceId, e, "awaiting_approval", ctx.actor);
        await transitionExperiment(db, ctx.workspaceId, { ...e, status: "awaiting_approval" }, "running", ctx.actor, { startedAt: ctx.now });
      }
    }
    return { output: result.data, adapter: adapter.provider, isDemo: adapter.mode === "demo", targetType: "creative_asset", targetId: input.assetId };
  },
});

const publishSocialPost = defineTool({
  name: "social.publish_post",
  title: "Publish a social post",
  description: "Publishes an approved post to the connected X or LinkedIn account, as the founder.",
  capability: "PUBLISH_SOCIAL_POST",
  risk: "R2",
  external: true,
  supportsDryRun: true,
  permissions: MANAGERS,
  input: z.object({ text: z.string().min(1).max(3000) }),
  idempotencyKey: (i) => `post:${i.text.slice(0, 200)}`,
  describe: (i) => ({ title: "Publish post", change: i.text.slice(0, 120) }),
  async run(input, ctx, opts) {
    const { adapter } = await requireAdapter(ctx, "PUBLISH_SOCIAL_POST");
    const result = await adapter.execute("PUBLISH_SOCIAL_POST", input, opts);
    return { output: result.data, adapter: adapter.provider, isDemo: adapter.mode === "demo", targetType: "social_post", targetId: result.externalId };
  },
});

const sendEmail = defineTool({
  name: "email.send",
  title: "Send an email",
  description: "Sends an approved email through the connected Resend or Brevo account, from the founder's verified sender.",
  capability: "SEND_EMAIL",
  risk: "R2",
  external: true,
  supportsDryRun: true,
  permissions: MANAGERS,
  input: z.object({ to: z.union([z.string().email(), z.array(z.string().email()).min(1).max(50)]), subject: z.string().min(1).max(200), html: z.string().min(1).max(100_000) }),
  idempotencyKey: (i) => `email:${[i.to].flat().join(",")}:${i.subject}`,
  describe: (i) => ({ title: `Send “${i.subject}”`, change: `To ${[i.to].flat().length} recipient(s)` }),
  async run(input, ctx, opts) {
    const { adapter } = await requireAdapter(ctx, "SEND_EMAIL");
    const result = await adapter.execute("SEND_EMAIL", input, opts);
    return { output: result.data, adapter: adapter.provider, isDemo: adapter.mode === "demo", targetType: "email", targetId: result.externalId };
  },
});

/* ─────────────────────────── Spend (R3) ─────────────────────────── */

async function campaignInWorkspace(ctx: ToolContext, campaignId: string) {
  const campaign = await db.query.campaigns.findFirst({ where: and(eq(campaigns.id, campaignId), eq(campaigns.workspaceId, ctx.workspaceId)) });
  if (!campaign) throw new DomainError("not_found", "Campaign not found in this workspace.");
  return campaign;
}

/** Spend already committed this month by other active campaigns, through their planned end. */
async function committedSpend(ctx: ToolContext, excludeCampaignId: string | null, asOf: string) {
  const active = await db
    .select({ campaign: campaigns, experiment: experiments })
    .from(campaigns)
    .leftJoin(experiments, eq(experiments.id, campaigns.experimentId))
    .where(and(eq(campaigns.workspaceId, ctx.workspaceId), eq(campaigns.status, "active")));
  const monthDaysLeft = daysLeftInMonth(asOf);
  let committed = 0;
  for (const { campaign, experiment } of active) {
    if (campaign.id === excludeCampaignId || !campaign.dailyBudget) continue;
    let days = monthDaysLeft;
    if (experiment && experiment.status === "running" && experiment.startedAt) {
      const end = new Date(experiment.startedAt.getTime() + (experiment.durationDays - 1) * 86_400_000).toISOString().slice(0, 10);
      const until = Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${asOf}T00:00:00Z`)) / 86_400_000) + 1;
      days = Math.max(0, Math.min(monthDaysLeft, until));
    }
    committed += campaign.dailyBudget * days;
  }
  return committed;
}

const updateDailyBudget = defineTool({
  name: "ads.update_daily_budget",
  title: "Change a campaign's daily budget",
  description: "Sets a new daily budget on a paid campaign. Hard caps and the monthly budget are enforced before execution.",
  capability: "UPDATE_AD_BUDGET",
  risk: "R3",
  external: true,
  supportsDryRun: true,
  permissions: MANAGERS,
  input: z.object({ campaignId: z.string(), dailyBudget: z.number().positive().max(100_000) }),
  idempotencyKey: (i) => `${i.campaignId}:${i.dailyBudget}`,
  describe: (i) => ({ title: "Change daily budget", change: `→ $${i.dailyBudget}/day` }),
  async policy(input, ctx) {
    const campaign = await campaignInWorkspace(ctx, input.campaignId);
    const asOf = (await latestMetricDay(ctx.workspaceId, ctx.productId)) ?? ctx.now.toISOString().slice(0, 10);
    const today = shiftDay(asOf, 1);
    const spent = await monthSpendToDate(ctx.workspaceId, ctx.productId, asOf);
    const committed = await committedSpend(ctx, campaign.id, today);
    const current = campaign.dailyBudget ?? 0;
    return {
      channel: campaign.channel,
      dailyBudget: { current, proposed: input.dailyBudget },
      monthSpendToDate: spent + committed,
      daysLeftInMonth: daysLeftInMonth(today),
      reducesExposure: input.dailyBudget < current,
    };
  },
  async run(input, ctx, opts) {
    const campaign = await campaignInWorkspace(ctx, input.campaignId);
    const { adapter } = await requireAdapter(ctx, "UPDATE_AD_BUDGET");
    const result = await adapter.execute("UPDATE_AD_BUDGET", { campaignId: campaign.id, dailyBudget: input.dailyBudget }, opts);
    return { output: result.data, adapter: adapter.provider, isDemo: adapter.mode === "demo", targetType: "campaign", targetId: campaign.id };
  },
});

const pauseCampaign = defineTool({
  name: "ads.pause_campaign",
  title: "Pause a campaign",
  description: "Stops spend on a paid campaign. Reducing exposure is permitted automatically outside Observe mode.",
  capability: "PAUSE_CAMPAIGN",
  risk: "R3",
  external: true,
  supportsDryRun: true,
  permissions: MANAGERS,
  input: z.object({ campaignId: z.string() }),
  idempotencyKey: (i) => i.campaignId,
  describe: () => ({ title: "Pause campaign", change: "Active → paused" }),
  async policy(input, ctx) {
    const campaign = await campaignInWorkspace(ctx, input.campaignId);
    return { channel: campaign.channel, reducesExposure: true };
  },
  async run(input, ctx, opts) {
    const { adapter } = await requireAdapter(ctx, "PAUSE_CAMPAIGN");
    const result = await adapter.execute("PAUSE_CAMPAIGN", input, opts);
    return { output: result.data, adapter: adapter.provider, isDemo: adapter.mode === "demo", targetType: "campaign", targetId: input.campaignId };
  },
});

const launchCampaign = defineTool({
  name: "ads.launch_campaign",
  title: "Launch a paid campaign",
  description: "Creates a paid campaign for an experiment and starts the experiment. Always requires approval unless Autopilot may launch campaigns.",
  capability: "CREATE_PAID_CAMPAIGN",
  risk: "R3",
  external: true,
  supportsDryRun: true,
  permissions: MANAGERS,
  input: z.object({ experimentId: z.string(), name: z.string().min(3), channel: z.string(), dailyBudget: z.number().positive() }),
  idempotencyKey: (i) => `${i.experimentId}:${i.channel}`,
  describe: (i) => ({ title: `Launch “${i.name}”`, change: `$${i.dailyBudget}/day` }),
  async policy(input, ctx) {
    const exp = await getExperimentById(ctx.workspaceId, input.experimentId);
    const asOf = (await latestMetricDay(ctx.workspaceId, ctx.productId)) ?? ctx.now.toISOString().slice(0, 10);
    const today = shiftDay(asOf, 1);
    const spent = await monthSpendToDate(ctx.workspaceId, ctx.productId, asOf);
    const committed = await committedSpend(ctx, null, today);
    return {
      channel: input.channel,
      totalBudget: exp.budget,
      dailyBudget: { current: 0, proposed: input.dailyBudget },
      monthSpendToDate: spent + committed,
      daysLeftInMonth: Math.min(daysLeftInMonth(today), exp.durationDays),
    };
  },
  async run(input, ctx, opts) {
    if (!isChannel(input.channel) || CHANNELS[input.channel].kind !== "paid") {
      throw new DomainError("validation", `${input.channel} is not a paid channel.`);
    }
    const exp = await getExperimentById(ctx.workspaceId, input.experimentId);
    const { adapter, integrationId } = await requireAdapter(ctx, "CREATE_PAID_CAMPAIGN");
    const result = await adapter.execute("CREATE_PAID_CAMPAIGN", { ...input, integrationId }, opts);
    if (!opts.dryRun) {
      if (exp.status === "proposed") await transitionExperiment(db, ctx.workspaceId, exp, "awaiting_approval", ctx.actor);
      const current = await getExperimentById(ctx.workspaceId, exp.id);
      if (current.status === "awaiting_approval") {
        await transitionExperiment(db, ctx.workspaceId, current, "running", ctx.actor, { startedAt: ctx.now, dailySpendCap: input.dailyBudget });
      }
    }
    return { output: result.data, adapter: adapter.provider, isDemo: adapter.mode === "demo", targetType: "experiment", targetId: exp.id };
  },
});

export const TOOLS = [
  queryKpis,
  channelBreakdown,
  readBusinessContext,
  readLive,
  rankExperimentQueue,
  evaluateExperimentTool,
  proposeExperiment,
  completeExperiment,
  draftContent,
  publishPage,
  publishSocialPost,
  sendEmail,
  updateDailyBudget,
  pauseCampaign,
  launchCampaign,
] as const satisfies readonly ToolDefinition[];

export type ToolName = (typeof TOOLS)[number]["name"];

const BY_NAME = new Map<string, ToolDefinition>(TOOLS.map((t) => [t.name, t as unknown as ToolDefinition]));

export function getTool(name: string): ToolDefinition {
  const tool = BY_NAME.get(name);
  if (!tool) throw new DomainError("validation", `Unknown tool: ${name}`);
  return tool;
}

/** Public, serializable description of the registry for the UI and the planner. */
export function describeRegistry() {
  return TOOLS.map((t) => ({
    name: t.name,
    title: t.title,
    description: t.description,
    capability: t.capability,
    risk: t.risk,
    external: t.external,
    supportsDryRun: t.supportsDryRun,
    permissions: t.permissions,
    inputSchema: z.toJSONSchema(t.input),
  }));
}

export async function latestActiveCampaigns(workspaceId: string) {
  return db.select().from(campaigns).where(eq(campaigns.workspaceId, workspaceId)).orderBy(desc(campaigns.createdAt));
}
