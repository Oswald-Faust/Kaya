import "server-only";
import { eq } from "drizzle-orm";
import { db, type Tx } from "@/server/db/client";
import * as t from "@/server/db/schema";
import { evaluateExperiment, type Evaluation } from "@/server/domain/experiments/evaluation";
import { rankExperiments } from "@/server/domain/experiments/ranking";
import { evaluatePolicy, type BudgetPolicy } from "@/server/domain/governance/policy";
import { scoreAllChannels, type ChannelFitInput } from "@/server/domain/strategy/channel-fit";
import type { PrimaryMetric } from "@/server/domain/types";
import { INTEGRATIONS } from "@/server/integrations/catalog";
import { buildLearning } from "@/server/services/learnings";
import { channelLabel } from "@/server/domain/channels";
import { experimentKey, formatDelta, formatPct, formatUsd } from "@/lib/format";
import { newId, stableId } from "@/lib/ids";
import {
  COMPETITORS,
  DEMO,
  FACTS,
  HEALTHCHECKS_PAGE,
  ICPS,
  SNAPSHOT_EXTRACTION,
  SNAPSHOT_PAGES,
  SUPERSEDED_FACT,
  strategyV1,
  strategyV2,
} from "./demo/content";
import { generateDemoHistory, STORY, type ArmTotals, type ChannelDayRow } from "./demo/generate-metrics";

const at = (iso: string) => new Date(iso);

type ExperimentInsert = typeof t.experiments.$inferInsert;
type VariantSeed = { name: string; isControl: boolean; description: string } & ArmTotals;

export async function seedDemoWorkspace(): Promise<{ workspaceSlug: string; metricRows: number; experiments: number; skipped?: boolean }> {
  const existing = await db.query.workspaces.findFirst({ where: eq(t.workspaces.slug, DEMO.workspaceSlug) });
  if (existing) {
    return { workspaceSlug: DEMO.workspaceSlug, metricRows: 0, experiments: 0, skipped: true };
  }

  const history = generateDemoHistory();
  const { arms, channelRows, blendedRows } = history;

  const orgId = stableId("org", DEMO.orgSlug);
  const userId = stableId("usr", DEMO.user.email);
  const wsId = stableId("ws", DEMO.workspaceSlug);
  const productId = stableId("prd", DEMO.product.domain);
  const P = { workspaceId: wsId, productId };

  let experimentCount = 0;

  await db.transaction(async (tx) => {
    /* ── Tenancy ── */
    await tx.insert(t.organizations).values({ plan: "growth", planStatus: "active", planInterval: "year", planActions: 20000, id: orgId, name: DEMO.orgName, slug: DEMO.orgSlug, createdAt: at("2026-06-01T08:55:00Z") });
    await tx.insert(t.users).values({ id: userId, email: DEMO.user.email, name: DEMO.user.name, createdAt: at("2026-06-01T08:55:00Z") });
    await tx.insert(t.members).values({ id: stableId("mem", orgId, userId), organizationId: orgId, userId, role: "owner" });
    await tx.insert(t.workspaces).values({
      id: wsId,
      organizationId: orgId,
      name: DEMO.workspaceName,
      slug: DEMO.workspaceSlug,
      autonomyMode: "copilot",
      isDemo: true,
      createdAt: at("2026-06-01T08:56:00Z"),
    });
    await tx.insert(t.products).values({
      id: productId,
      workspaceId: wsId,
      name: DEMO.product.name,
      url: DEMO.product.url,
      domain: DEMO.product.domain,
      oneLiner: DEMO.product.oneLiner,
      category: DEMO.product.category,
      status: "active",
      onboardingStep: "done",
      createdAt: at("2026-06-01T08:56:00Z"),
    });

    const policy: BudgetPolicy = {
      monthlyBudget: DEMO.goal.monthlyBudget,
      maxDailySpend: 40,
      maxExperimentBudget: 500,
      maxAutoIncreasePct: 0.2,
      autoPauseLosers: true,
      autoLaunchCampaigns: false,
      allowedChannels: [],
      neverWithoutApproval: ["CHANGE_PRICING", "CONTACT_CREATOR", "PUBLISH_COMMUNITY_POST"],
    };
    await tx.insert(t.budgetPolicies).values({ workspaceId: wsId, ...policy });

    /* ── Product intelligence & memory ── */
    await seedMemory(tx, P);

    /* ── Goal ── */
    const goalId = stableId("goal", productId, "grow_mrr");
    await tx.insert(t.goals).values({
      id: goalId,
      ...P,
      template: "grow_mrr",
      title: "Grow MRR from $4.2k to $10k",
      metric: "mrr",
      baselineValue: DEMO.goal.baseline,
      targetValue: DEMO.goal.target,
      unit: "usd",
      deadline: DEMO.goal.deadline,
      monthlyBudget: DEMO.goal.monthlyBudget,
      budgetBand: "1k_5k",
      createdAt: at("2026-06-01T09:04:00Z"),
    });

    /* ── Metrics ── */
    const metricValues = [
      ...channelRows.map((r) => ({ ...P, ...r, source: "demo" })),
      ...blendedRows.map((r) => ({ ...P, ...r, channel: "all", source: "demo" })),
    ];
    for (let i = 0; i < metricValues.length; i += 500) {
      await tx.insert(t.metricSnapshots).values(metricValues.slice(i, i + 500));
    }

    /* ── Derived numbers for narrative (never typed by hand) ── */
    const metaCac = arms.exp001.spend / Math.max(1, arms.exp001.conversions);
    const searchCac = arms.exp003.spend / Math.max(1, arms.exp003.conversions);
    const comparisonRate = arms.exp002.treatment.conversions / arms.exp002.treatment.exposures;
    const homepageRate = arms.exp002.control.conversions / arms.exp002.control.exposures;
    const aug12 = blendedRows.find((r) => r.day === "2026-08-11")!;

    /* ── Strategy v1 → v2 ── */
    const strategyId = stableId("str", productId);
    await tx.insert(t.strategies).values({ id: strategyId, ...P, goalId, currentVersion: 2, createdAt: at("2026-06-01T09:06:00Z") });

    const fitBase: ChannelFitInput = { audience: "developers", arpuMonthly: 40, monthlyBudget: 1000, searchIntent: "high", traction: { seo_content: 45, hacker_news: 20, reddit: 5 }, evidence: [] };
    const v1Id = stableId("sv", strategyId, "1");
    await tx.insert(t.strategyVersions).values({
      id: v1Id,
      workspaceId: wsId,
      strategyId,
      version: 1,
      summary: "Validate paid acquisition and comparison pages before committing budget.",
      revisionReason: "Initial strategy from product analysis, goal and budget.",
      content: strategyV1(),
      createdBy: "agent",
      createdAt: at("2026-06-01T09:06:00Z"),
    });
    await insertChannelFit(tx, wsId, v1Id, fitBase);

    const expIds = {
      e1: stableId("exp", wsId, "meta_ads:broad_interest:developers"),
      e2: stableId("exp", wsId, "seo_content:comparison_page:cronitor"),
      e3: stableId("exp", wsId, "google_search:exact_intent:cron_monitoring"),
    };
    const lrnIds = { l1: stableId("lrn", expIds.e1), l2: stableId("lrn", expIds.e2), l3: stableId("lrn", expIds.e3) };

    const v2Id = stableId("sv", strategyId, "2");
    await tx.insert(t.strategyVersions).values({
      id: v2Id,
      workspaceId: wsId,
      strategyId,
      version: 2,
      summary: "Move budget from Meta to high-intent search and comparison pages; attack activation next.",
      revisionReason: `EXP-001 disproved broad Meta targeting (CAC ${formatUsd(metaCac)}, ${(metaCac / 60).toFixed(1)}× target). EXP-002 and EXP-003 confirmed comparison pages (${formatPct(comparisonRate)} vs ${formatPct(homepageRate)}) and exact-match search (CAC ${formatUsd(searchCac)}).`,
      evidenceLearningIds: [lrnIds.l1, lrnIds.l2, lrnIds.l3],
      content: strategyV2({
        mrr: formatUsd(aug12.mrr),
        customers: aug12.customers,
        comparisonRate: formatPct(comparisonRate),
        homepageRate: formatPct(homepageRate),
        searchCac: formatUsd(searchCac),
        metaCac: formatUsd(metaCac),
        metaMultiple: `${(metaCac / 60).toFixed(1)}×`,
      }),
      createdBy: "agent",
      createdAt: at("2026-08-12T07:30:00Z"),
    });
    await insertChannelFit(tx, wsId, v2Id, {
      ...fitBase,
      traction: { seo_content: 55, google_search: 35, hacker_news: 15, reddit: 5 },
      evidence: [
        { channel: "meta_ads", kind: "loser", confidence: 0.9, statement: `EXP-001 · broad interest targeting CAC ${formatUsd(metaCac)}` },
        { channel: "seo_content", kind: "winner", confidence: 0.97, statement: `EXP-002 · comparison page ${formatPct(comparisonRate)} signup rate` },
        { channel: "google_search", kind: "winner", confidence: 0.92, statement: `EXP-003 · exact-match CAC ${formatUsd(searchCac)}` },
      ],
    });

    /* ── Experiments ── */
    const single = (name: string, a: ArmTotals, description: string): VariantSeed[] => [{ name, isControl: false, description, ...a }];
    const pair = (control: string, treatment: string, a: { control: ArmTotals; treatment: ArmTotals }, cd: string, td: string): VariantSeed[] => [
      { name: control, isControl: true, description: cd, ...a.control },
      { name: treatment, isControl: false, description: td, ...a.treatment },
    ];

    type Def = Omit<ExperimentInsert, "workspaceId" | "productId"> & { variants: VariantSeed[]; completedAt?: string };
    const defs: Def[] = [
      {
        id: expIds.e1, number: 1, strategyVersionId: v1Id, name: "Broad Meta interest targeting: developers & DevOps",
        hypothesis: "Broad developer interest targeting on Meta acquires paying customers below the $60 CAC target",
        type: "paid_ad", channel: "meta_ads", audience: "Developer and DevOps interests, US and EU", primaryMetric: "cac", metricDirection: "decrease",
        successThreshold: 60, budget: 420, impact: 3, priorConfidence: 0.35, effort: 2, informationGain: 4, timeToSignalDays: 10, durationDays: 26,
        similarityKey: "meta_ads:broad_interest:developers", rationale: "The cheapest way to learn whether paid social reaches backend engineers at all.",
        status: "completed", startedAt: at(`${STORY.exp001MetaBroad.start}T08:00:00Z`), completedAt: "2026-07-06T09:00:00Z", createdAt: at("2026-06-01T09:06:00Z"),
        variants: single("Broad interests", arms.exp001, "Interests: software development, DevOps, AWS; lookalikes off"),
      },
      {
        id: expIds.e2, number: 2, strategyVersionId: v1Id, name: "“Cronitor alternative” comparison page",
        hypothesis: "Visitors searching for a Cronitor alternative sign up more often on a dedicated comparison page than on the homepage",
        type: "seo_page", channel: "seo_content", audience: "Searchers comparing cron monitoring tools", primaryMetric: "signup_rate", metricDirection: "increase",
        successThreshold: 0.3, budget: 0, impact: 4, priorConfidence: 0.5, effort: 2, informationGain: 4, timeToSignalDays: 14, durationDays: 36,
        similarityKey: "seo_content:comparison_page:cronitor", rationale: "Comparison-intent searchers already know what they want; the homepage makes them work to find out.",
        status: "completed", startedAt: at(`${STORY.exp002Comparison.start}T08:00:00Z`), completedAt: "2026-07-26T09:00:00Z", createdAt: at("2026-06-01T09:06:00Z"),
        variants: pair("Homepage", "Comparison page", arms.exp002, "Comparison-intent searches land on /", "Comparison-intent searches land on /alternatives/cronitor"),
      },
      {
        id: expIds.e3, number: 3, strategyVersionId: v1Id, name: "Google Search exact match: “cron job monitoring”",
        hypothesis: "High-intent “cron job monitoring” searches convert into paying customers below the $60 CAC target",
        type: "paid_ad", channel: "google_search", audience: "Engineers searching “cron job monitoring” and close variants", primaryMetric: "cac", metricDirection: "decrease",
        successThreshold: 60, budget: 500, impact: 4, priorConfidence: 0.55, effort: 2, informationGain: 4, timeToSignalDays: 10, durationDays: 34,
        similarityKey: "google_search:exact_intent:cron_monitoring", rationale: "Search intent matches the product exactly and the price point supports a ~$60 CAC.",
        status: "completed", startedAt: at(`${STORY.exp003GoogleExact.start}T08:00:00Z`), completedAt: "2026-08-11T09:00:00Z", createdAt: at("2026-07-01T10:00:00Z"),
        variants: single("Exact match", arms.exp003, "[cron job monitoring], [cron monitoring], [monitor cron jobs]"),
      },
      {
        id: stableId("exp", wsId, "website:annual_default:pricing"), number: 4, strategyVersionId: v1Id, name: "Pricing page: annual billing selected by default",
        hypothesis: "Selecting annual billing by default on the pricing page increases trial to paid conversion",
        type: "pricing", channel: "website", audience: "Trial users reaching the upgrade page", primaryMetric: "trial_to_paid", metricDirection: "increase",
        successThreshold: 0.15, budget: 0, impact: 3, priorConfidence: 0.4, effort: 1, informationGain: 3, timeToSignalDays: 21, durationDays: 28,
        similarityKey: "website:annual_default:pricing", rationale: "Cheap to ship; annual plans improve cash flow if conversion holds.",
        status: "completed", startedAt: at(`${STORY.exp004AnnualDefault.start}T08:00:00Z`), completedAt: "2026-08-29T09:00:00Z", createdAt: at("2026-07-28T10:00:00Z"),
        variants: pair("Monthly default", "Annual default", arms.exp004, "Toggle starts on monthly", "Toggle starts on annual (2 months free)"),
      },
      {
        id: stableId("exp", wsId, "google_search:competitor_alternatives:cronitor_healthchecks"), number: 5, strategyVersionId: v2Id, name: "Google Search: competitor alternative keywords",
        hypothesis: "Searchers looking for Cronitor and Healthchecks.io alternatives convert into paying customers below the $60 CAC target",
        type: "paid_ad", channel: "google_search", audience: "“cronitor alternative”, “healthchecks.io alternative” searchers", primaryMetric: "cac", metricDirection: "decrease",
        successThreshold: 60, budget: 300, dailySpendCap: 13, impact: 4, priorConfidence: 0.5, effort: 2, informationGain: 3, timeToSignalDays: 10, durationDays: 14,
        similarityKey: "google_search:competitor_alternatives:cronitor_healthchecks", rationale: "Exact-match search won (EXP-003) and comparison pages convert (EXP-002); competitor keywords combine both.",
        status: "running", startedAt: at(`${STORY.exp005Competitor.start}T08:00:00Z`), createdAt: at("2026-09-02T10:00:00Z"),
        variants: single("Competitor keywords", arms.exp005, "Ads link to the matching comparison page"),
      },
      {
        id: stableId("exp", wsId, "email_lifecycle:activation_nudge:new_signups"), number: 6, strategyVersionId: v2Id, name: "Activation email: “your first monitor hasn't checked in”",
        hypothesis: "An email 24 hours after signup to users whose first monitor never pinged increases activation",
        type: "email", channel: "email_lifecycle", audience: "New signups with no successful ping after 24 hours", primaryMetric: "activation_rate", metricDirection: "increase",
        successThreshold: 0.1, budget: 0, impact: 4, priorConfidence: 0.5, effort: 2, informationGain: 4, timeToSignalDays: 7, durationDays: 21,
        similarityKey: "email_lifecycle:activation_nudge:new_signups", rationale: "Strategy v2 names activation as the bottleneck: 58% of signups never send a first ping.",
        status: "running", startedAt: at(`${STORY.exp006ActivationNudge.start}T08:00:00Z`), createdAt: at("2026-08-27T10:00:00Z"),
        variants: pair("No email", "Missed-ping nudge", arms.exp006, "Standard onboarding only", "Plain-text email with the exact curl for their stack"),
      },
      {
        id: stableId("exp", wsId, "seo_content:comparison_page:healthchecks"), number: 7, strategyVersionId: v2Id, name: "“Healthchecks.io alternative” comparison page",
        hypothesis: "Visitors searching for a Healthchecks.io alternative sign up more often on a dedicated comparison page than on the homepage",
        type: "seo_page", channel: "seo_content", audience: "Searchers comparing Healthchecks.io with alternatives", primaryMetric: "signup_rate", metricDirection: "increase",
        successThreshold: 0.3, budget: 0, impact: 4, priorConfidence: 0.5, effort: 2, informationGain: 3, timeToSignalDays: 14, durationDays: 30,
        similarityKey: "seo_content:comparison_page:healthchecks", rationale: "EXP-002 showed comparison pages convert 2.6× the homepage; Healthchecks.io is the second most searched alternative.",
        status: "awaiting_approval", createdAt: at("2026-09-12T17:41:00Z"), variants: [],
      },
      {
        id: stableId("exp", wsId, "hacker_news:free_tool_launch:crontab_debugger"), number: 8, strategyVersionId: v2Id, name: "Show HN: free crontab expression debugger",
        hypothesis: "A free, useful crontab debugger launched on Hacker News brings qualified signups without spend",
        type: "community", channel: "hacker_news", audience: "Hacker News readers who touch cron", primaryMetric: "signup_rate", metricDirection: "increase",
        successThreshold: 0.2, budget: 0, impact: 4, priorConfidence: 0.4, effort: 3, informationGain: 4, timeToSignalDays: 3, durationDays: 7,
        similarityKey: "hacker_news:free_tool_launch:crontab_debugger", rationale: "The July Show HN brought 1,650 visits in a day; a free tool earns attention without asking for it.",
        status: "proposed", createdAt: at("2026-08-12T07:31:00Z"), variants: [],
      },
      {
        id: stableId("exp", wsId, "reddit:helpful_answers:devops"), number: 9, strategyVersionId: v2Id, name: "r/devops: answer “how do you monitor cron jobs” threads",
        hypothesis: "Transparent, genuinely helpful answers in relevant threads send referral signups",
        type: "community", channel: "reddit", audience: "r/devops and r/sysadmin threads about job monitoring", primaryMetric: "signup_rate", metricDirection: "increase",
        successThreshold: 0.2, budget: 0, impact: 2, priorConfidence: 0.4, effort: 3, informationGain: 3, timeToSignalDays: 21, durationDays: 30,
        similarityKey: "reddit:helpful_answers:devops", rationale: "Communities exist but punish promotion; every reply is drafted for founder approval, never auto-posted.",
        status: "proposed", createdAt: at("2026-08-12T07:31:00Z"), variants: [],
      },
      {
        id: stableId("exp", wsId, "meta_ads:broad_interest:software_engineers"), number: 10, strategyVersionId: v2Id, name: "Meta: broad “software engineers” interest retest",
        hypothesis: "A broader software engineering interest audience on Meta acquires customers below the $60 CAC target",
        type: "paid_ad", channel: "meta_ads", audience: "Software engineering interests, worldwide English", primaryMetric: "cac", metricDirection: "decrease",
        successThreshold: 60, budget: 300, impact: 3, priorConfidence: 0.35, effort: 2, informationGain: 2, timeToSignalDays: 10, durationDays: 21,
        similarityKey: "meta_ads:broad_interest:software_engineers", rationale: "Suggested by a generic playbook for developer tools.",
        status: "proposed", createdAt: at("2026-08-20T10:00:00Z"), variants: [],
      },
      {
        id: stableId("exp", wsId, "linkedin:founder_posts:sre_leads"), number: 11, strategyVersionId: v2Id, name: "LinkedIn founder posts aimed at SRE leads",
        hypothesis: "Weekly founder posts about job reliability generate signups from platform teams",
        type: "messaging", channel: "linkedin", audience: "SRE and platform leads at 50–500 person companies", primaryMetric: "signup_rate", metricDirection: "increase",
        successThreshold: 0.2, budget: 0, impact: 2, priorConfidence: 0.25, effort: 3, informationGain: 2, timeToSignalDays: 30, durationDays: 45,
        similarityKey: "linkedin:founder_posts:sre_leads", rationale: "Targets the third-priority ICP; channel fit is weak, kept for later.",
        status: "proposed", createdAt: at("2026-08-12T07:31:00Z"), variants: [],
      },
      {
        id: stableId("exp", wsId, "youtube_creators:sponsored_segment:devops"), number: 12, strategyVersionId: v2Id, name: "Sponsored segment on a DevOps YouTube channel",
        hypothesis: "A 60-second sponsored segment on a mid-size DevOps channel acquires customers below the $60 CAC target",
        type: "creator", channel: "youtube_creators", audience: "Viewers of hands-on DevOps tutorials", primaryMetric: "cac", metricDirection: "decrease",
        successThreshold: 60, budget: 250, impact: 4, priorConfidence: 0.35, effort: 3, informationGain: 4, timeToSignalDays: 21, durationDays: 30,
        similarityKey: "youtube_creators:sponsored_segment:devops", rationale: "Demonstrable product and a trusted voice; tracked with a unique coupon.",
        status: "proposed", createdAt: at("2026-08-12T07:31:00Z"), variants: [],
      },
      {
        id: stableId("exp", wsId, "email_lifecycle:activation_nudge:trial_users"), number: 13, strategyVersionId: v2Id, name: "Trial day-10 email: “monitors that would have alerted you”",
        hypothesis: "A day-10 trial email listing the alerts Tickwarden already caught increases trial to paid conversion",
        type: "email", channel: "email_lifecycle", audience: "Team trial users on day 10 with at least one alert", primaryMetric: "trial_to_paid", metricDirection: "increase",
        successThreshold: 0.15, budget: 0, impact: 4, priorConfidence: 0.4, effort: 2, informationGain: 3, timeToSignalDays: 14, durationDays: 21,
        similarityKey: "email_lifecycle:activation_nudge:trial_users", rationale: "Proof of value at the moment of decision; depends on whether lifecycle nudges work at all (EXP-006).",
        status: "proposed", createdAt: at("2026-09-01T10:00:00Z"), variants: [],
      },
    ];

    const evaluations = new Map<string, Evaluation>();
    for (const def of defs) {
      const { variants, completedAt, ...exp } = def;
      let patch: Partial<ExperimentInsert> = {};
      if (exp.status === "completed" || exp.status === "running") {
        const evaluation = evaluateExperiment({
          primaryMetric: exp.primaryMetric as PrimaryMetric,
          successThreshold: exp.successThreshold,
          budget: exp.budget ?? 0,
          durationElapsed: exp.status === "completed",
          variants,
        });
        evaluations.set(exp.id, evaluation);
        const spend = variants.reduce((s, v) => s + v.spend, 0);
        patch =
          exp.status === "completed"
            ? {
                outcome: evaluation.decision === "continue" ? "inconclusive" : evaluation.decision,
                observedValue: evaluation.observedValue,
                lift: evaluation.lift,
                confidence: evaluation.confidence,
                resultSummary: evaluation.summary,
                spend,
                endedAt: at(completedAt!),
              }
            : { spend, observedValue: evaluation.observedValue, lift: evaluation.lift, confidence: evaluation.confidence, resultSummary: evaluation.summary };
      }
      await tx.insert(t.experiments).values({ ...exp, ...P, ...patch, updatedAt: exp.createdAt });
      if (variants.length) {
        await tx.insert(t.experimentVariants).values(
          variants.map((v) => ({
            id: stableId("var", exp.id, v.name),
            workspaceId: wsId,
            experimentId: exp.id,
            name: v.name,
            isControl: v.isControl,
            description: v.description,
            exposures: v.exposures,
            conversions: v.conversions,
            spend: Math.round(v.spend * 100) / 100,
          })),
        );
      }
      experimentCount++;
    }

    // Guard the story: the demo is only coherent if evaluation agrees with it.
    const expect = (id: string, decision: string) => {
      const got = evaluations.get(id)?.decision;
      if (got !== decision) throw new Error(`Demo story broke: ${id} evaluated to ${got}, expected ${decision}`);
    };
    expect(expIds.e1, "loser");
    expect(expIds.e2, "winner");
    expect(expIds.e3, "winner");

    /* ── Learnings from completed experiments ── */
    const insertedExperiments = await tx.select().from(t.experiments).where(eq(t.experiments.workspaceId, wsId));
    const signals = [];
    for (const exp of insertedExperiments.filter((e) => e.status === "completed").sort((a, b) => a.number - b.number)) {
      const evaluation = evaluations.get(exp.id)!;
      const built = buildLearning(exp, { ...evaluation, decision: exp.outcome! });
      await tx.insert(t.learnings).values({
        id: stableId("lrn", exp.id),
        ...P,
        statement: built.statement,
        kind: built.kind,
        channel: exp.channel,
        similarityKey: exp.similarityKey,
        confidence: built.confidence,
        impact: built.impact,
        evidenceExperimentIds: [exp.id],
        metricLabel: built.metricLabel,
        createdAt: exp.endedAt!,
      });
      signals.push({ id: stableId("lrn", exp.id), statement: `${experimentKey(exp.number)} · ${built.statement}`, kind: built.kind, similarityKey: exp.similarityKey, confidence: built.confidence });
    }
    // Cross-experiment insight grounded in the metrics, not in a single test.
    const hnDay = channelRows.find((r) => r.day === STORY.hnLaunch.day && r.channel === "hacker_news")!;
    await tx.insert(t.learnings).values({
      id: stableId("lrn", wsId, "hn_launch"),
      ...P,
      statement: "Show HN launches bring a burst of low-intent traffic: huge visits, modest signups, few paying customers.",
      kind: "insight",
      channel: "hacker_news",
      similarityKey: null,
      confidence: 0.7,
      impact: "medium",
      evidenceExperimentIds: [],
      metricLabel: `${hnDay.visits.toLocaleString("en-US")} visits and ${hnDay.signups} signups on Jul 14 (${formatPct(hnDay.signups / hnDay.visits)} signup rate).`,
      createdAt: at("2026-07-20T09:00:00Z"),
    });

    const queue = insertedExperiments.filter((e) => e.status === "proposed" || e.status === "awaiting_approval");
    const scores = Object.fromEntries(scoreAllChannels({ ...fitBase, traction: { seo_content: 55, google_search: 35, hacker_news: 15, reddit: 5 } }).map((c) => [c.channel, c.score]));
    for (const r of rankExperiments(queue, { monthlyBudget: 1000, channelScores: scores, learnings: signals })) {
      if (r.suppressedBy && r.experiment.status === "proposed") {
        await tx.update(t.experiments).set({ status: "suppressed", suppressedReason: r.suppressedBy.statement }).where(eq(t.experiments.id, r.experiment.id));
      }
    }

    /* ── Creative assets ── */
    const e7 = insertedExperiments.find((e) => e.number === 7)!;
    const e6 = insertedExperiments.find((e) => e.number === 6)!;
    const assetE7 = stableId("asset", e7.id, "page");
    await tx.insert(t.creativeAssets).values([
      { id: stableId("asset", expIds.e2, "page"), workspaceId: wsId, experimentId: expIds.e2, kind: "landing_page", channel: "seo_content", title: "Cronitor alternative", body: "# Tickwarden vs Cronitor\n\nPublished comparison page.", status: "published", createdAt: at("2026-06-18T12:00:00Z") },
      { id: stableId("asset", expIds.e3, "ads"), workspaceId: wsId, experimentId: expIds.e3, kind: "ad_copy", channel: "google_search", title: "Exact match ad group", body: "Headline 1: Cron Job Monitoring\nHeadline 2: Alerts When Jobs Don't Run\nDescription: Heartbeat pings from any language. Free for 20 monitors.", status: "published", createdAt: at("2026-07-07T12:00:00Z") },
      { id: stableId("asset", e6.id, "email"), workspaceId: wsId, experimentId: e6.id, kind: "email", channel: "email_lifecycle", title: "Your first monitor hasn't checked in", body: "Subject: Your first monitor hasn't checked in\n\nHi {{first_name}},\n\nYou created “{{monitor_name}}” yesterday, but it hasn't received a ping yet. For {{stack}} it's one line:\n\n{{curl_snippet}}\n\nReply if something's in the way.", status: "published", createdAt: at("2026-08-29T12:00:00Z") },
      { id: assetE7, workspaceId: wsId, experimentId: e7.id, kind: "landing_page", channel: "seo_content", title: "Healthchecks.io alternative", body: HEALTHCHECKS_PAGE, status: "draft", createdAt: at("2026-09-12T17:40:00Z") },
    ]);

    /* ── Integrations (demo connections, explicitly labelled) ── */
    const connected: Record<string, { health: string; syncError?: string }> = {
      stripe: { health: "ok" },
      google_analytics: { health: "ok" },
      search_console: { health: "ok" },
      google_ads: { health: "ok" },
      meta_ads: { health: "degraded", syncError: "Access token expires in 6 days. Reconnect to keep ad insights syncing." },
      resend: { health: "ok" },
    };
    const integrationIds: Record<string, string> = {};
    for (const def of INTEGRATIONS) {
      const c = connected[def.provider];
      if (!c && def.provider !== "posthog") continue;
      const id = stableId("int", wsId, def.provider);
      integrationIds[def.provider] = id;
      await tx.insert(t.integrations).values({
        id,
        workspaceId: wsId,
        provider: def.provider,
        status: c ? "connected" : "disconnected",
        mode: "demo",
        grantedCapabilities: c ? [...def.reads, ...def.writes] : [],
        health: c?.health ?? "unknown",
        syncError: c?.syncError ?? null,
        lastSyncedAt: c ? at("2026-09-13T06:00:00Z") : null,
        connectedAt: c ? at("2026-06-01T09:10:00Z") : null,
      });
    }

    /* ── Campaigns ── */
    const googleSpend = channelRows.filter((r) => r.channel === "google_search").reduce((s, r) => s + r.spend, 0);
    const campExact = stableId("camp", wsId, "google_exact");
    const campCompetitor = stableId("camp", wsId, "google_competitor");
    const campMeta = stableId("camp", wsId, "meta_broad");
    const e5 = insertedExperiments.find((e) => e.number === 5)!;
    await tx.insert(t.campaigns).values([
      { id: campMeta, workspaceId: wsId, experimentId: expIds.e1, integrationId: integrationIds.meta_ads, channel: "meta_ads", name: "Developers & DevOps · broad interests", externalId: "demo-meta-23851", status: "ended", dailyBudget: 16, spend: arms.exp001.spend, isDemo: true, createdAt: at("2026-06-10T08:00:00Z") },
      { id: campExact, workspaceId: wsId, experimentId: expIds.e3, integrationId: integrationIds.google_ads, channel: "google_search", name: "Cron monitoring · exact match", externalId: "demo-gads-71120", status: "active", dailyBudget: 20, spend: Math.round((googleSpend - arms.exp005.spend) * 100) / 100, isDemo: true, createdAt: at("2026-07-08T08:00:00Z") },
      { id: campCompetitor, workspaceId: wsId, experimentId: e5.id, integrationId: integrationIds.google_ads, channel: "google_search", name: "Competitor alternatives", externalId: "demo-gads-71984", status: "active", dailyBudget: 13, spend: arms.exp005.spend, isDemo: true, createdAt: at("2026-09-04T08:00:00Z") },
    ]);

    /* ── Agent history ── */
    await seedRuns(tx, { ...P, userId, channelRows, blendedRows, policy, campExact, assetE7, e7Id: e7.id, e3Id: expIds.e3 });

    /* ── Audit trail ── */
    const audit = (action: string, targetType: string, targetId: string, iso: string, extra: Partial<typeof t.auditLogs.$inferInsert> = {}) =>
      tx.insert(t.auditLogs).values({ id: newId("aud"), workspaceId: wsId, actorType: "agent", actorId: "agent:growth-orchestrator", action, targetType, targetId, payload: {}, createdAt: at(iso), ...extra });
    await audit("external.create_paid_campaign", "campaign", campMeta, "2026-06-10T08:00:00Z", { isExternalMutation: true, actorType: "agent", payload: { demo: true, approvedBy: userId } });
    await audit("experiment.completed", "experiment", expIds.e1, "2026-07-06T09:00:00Z", { payload: { outcome: "loser" } });
    await audit("external.pause_campaign", "campaign", campMeta, "2026-07-06T09:00:05Z", { isExternalMutation: true, payload: { demo: true, reason: "Auto-paused loser within policy" } });
    await audit("experiment.completed", "experiment", expIds.e2, "2026-07-26T09:00:00Z", { payload: { outcome: "winner" } });
    await audit("external.create_paid_campaign", "campaign", campExact, "2026-07-08T08:00:00Z", { isExternalMutation: true, payload: { demo: true, approvedBy: userId } });
    await audit("experiment.completed", "experiment", expIds.e3, "2026-08-11T09:00:00Z", { payload: { outcome: "winner" } });
    await audit("strategy.revised", "strategy_version", v2Id, "2026-08-12T07:30:00Z", { payload: { version: 2, evidence: [lrnIds.l1, lrnIds.l2, lrnIds.l3] } });
    await audit("external.create_paid_campaign", "campaign", campCompetitor, "2026-09-04T08:00:00Z", { isExternalMutation: true, payload: { demo: true, approvedBy: userId } });
  });

  return { workspaceSlug: DEMO.workspaceSlug, metricRows: channelRows.length + blendedRows.length, experiments: experimentCount };
}

async function seedMemory(tx: Tx, P: { workspaceId: string; productId: string }) {
  const sourceIds: Record<string, string> = {};
  const sources: [string, string, string, string][] = [
    ["home", "crawl_page", "https://tickwarden.dev/", "Homepage"],
    ["pricing", "crawl_page", "https://tickwarden.dev/pricing", "Pricing page"],
    ["features", "crawl_page", "https://tickwarden.dev/features", "Features page"],
    ["docs", "crawl_page", "https://tickwarden.dev/docs/quickstart", "Docs · Quickstart"],
    ["analytics", "integration", "google_analytics", "Google Analytics 4 (demo connection)"],
    ["founder", "user_input", "", "Founder correction during onboarding"],
  ];
  for (const [key, kind, uri, title] of sources) {
    const id = stableId("src", P.productId, key);
    sourceIds[key] = id;
    await tx.insert(t.knowledgeSources).values({ id, ...P, kind, uri: uri || null, title, fetchedAt: at("2026-06-01T09:00:10Z") });
  }

  await tx.insert(t.productSnapshots).values({
    id: stableId("snap", P.productId, "2026-06-01"),
    ...P,
    sourceUrl: DEMO.product.url,
    pages: SNAPSHOT_PAGES,
    extraction: SNAPSHOT_EXTRACTION,
    extractor: "demo",
    promptVersion: "extraction-v1",
    createdAt: at("2026-06-01T09:00:20Z"),
  });

  await tx.insert(t.brandProfiles).values({
    productId: P.productId,
    workspaceId: P.workspaceId,
    voiceSummary: SNAPSHOT_EXTRACTION.brand.voiceSummary,
    traits: SNAPSHOT_EXTRACTION.brand.traits,
    wordsToUse: ["silent failure", "missed run", "heartbeat", "one curl"],
    wordsToAvoid: ["observability platform", "AI-powered", "revolutionary"],
  });

  const supersededId = stableId("fact", P.productId, "product.category", "superseded");
  await tx.insert(t.businessFacts).values({
    id: supersededId,
    ...P,
    key: SUPERSEDED_FACT.key,
    category: SUPERSEDED_FACT.category,
    statement: SUPERSEDED_FACT.statement,
    kind: "inferred",
    status: "superseded",
    confidence: SUPERSEDED_FACT.confidence,
    sourceId: sourceIds.home,
    sourceLabel: "Homepage",
    evidence: SUPERSEDED_FACT.evidence,
    agentGenerated: true,
    userConfirmed: false,
    createdAt: at("2026-06-01T09:00:20Z"),
  });

  for (const f of FACTS) {
    await tx.insert(t.businessFacts).values({
      id: stableId("fact", P.productId, f.key),
      ...P,
      key: f.key,
      category: f.category,
      statement: f.statement,
      kind: f.kind,
      status: f.status,
      confidence: f.confidence,
      sourceId: sourceIds[f.source],
      sourceLabel: sources.find((s) => s[0] === f.source)![3],
      evidence: f.evidence ?? null,
      agentGenerated: f.agentGenerated,
      userConfirmed: f.userConfirmed,
      supersedesId: f.kind === "user_correction" ? supersededId : null,
      lastVerifiedAt: f.userConfirmed ? at("2026-06-01T09:03:00Z") : at("2026-09-13T06:00:00Z"),
      createdAt: at("2026-06-01T09:00:20Z"),
    });
  }

  for (const icp of ICPS) {
    const id = stableId("icp", P.productId, icp.name);
    const { persona, ...rest } = icp;
    await tx.insert(t.icps).values({ id, ...P, ...rest, createdAt: at("2026-06-01T09:00:30Z") });
    await tx.insert(t.personas).values({ id: stableId("per", id), workspaceId: P.workspaceId, icpId: id, ...persona });
  }

  for (const c of COMPETITORS) {
    await tx.insert(t.competitors).values({ id: stableId("cmp", P.productId, c.name), ...P, ...c, createdAt: at("2026-06-01T09:00:40Z") });
  }
}

async function insertChannelFit(tx: Tx, workspaceId: string, versionId: string, input: ChannelFitInput) {
  const fits = scoreAllChannels(input);
  await tx.insert(t.channelAssessments).values(
    fits.map((f) => ({
      id: stableId("ch", versionId, f.channel),
      workspaceId,
      strategyVersionId: versionId,
      channel: f.channel,
      score: f.score,
      verdict: f.verdict,
      factors: f.factors,
      rationale: f.rationale,
      evidence: f.evidence,
    })),
  );
}

interface RunSeedArgs {
  workspaceId: string;
  productId: string;
  userId: string;
  channelRows: ChannelDayRow[];
  blendedRows: { day: string; spend: number; signups: number; visits: number; paidConversions: number }[];
  policy: BudgetPolicy;
  campExact: string;
  assetE7: string;
  e7Id: string;
  e3Id: string;
}

async function seedRuns(tx: Tx, a: RunSeedArgs) {
  const W = a.workspaceId;
  const sum = (rows: { day: string }[], from: string, to: string, pick: (r: never) => number) =>
    (rows as never[]).filter((r: { day: string }) => r.day >= from && r.day <= to).reduce((s, r) => s + pick(r), 0);

  const run = async (id: string, v: Omit<typeof t.agentRuns.$inferInsert, "id" | "workspaceId">) =>
    tx.insert(t.agentRuns).values({ id, workspaceId: W, ...v });
  const steps = async (runId: string, items: { kind: string; title: string; detail?: string; status?: "done" | "waiting" | "failed"; iso: string; output?: Record<string, unknown> }[]) =>
    tx.insert(t.agentSteps).values(
      items.map((s, i) => ({
        id: stableId("step", runId, String(i)),
        workspaceId: W,
        runId,
        seq: i + 1,
        kind: s.kind,
        title: s.title,
        detail: s.detail ?? null,
        status: s.status ?? "done",
        output: s.output ?? null,
        startedAt: at(s.iso),
        finishedAt: s.status === "waiting" ? null : at(s.iso),
      })),
    );
  const messages = async (runId: string, items: { role: "user" | "agent"; content: string; iso: string }[]) =>
    tx.insert(t.agentMessages).values(items.map((m, i) => ({ id: stableId("msg", runId, String(i)), workspaceId: W, runId, role: m.role, content: m.content, createdAt: at(m.iso) })));

  // 1. Product analysis
  const r1 = stableId("run", W, "analysis");
  await run(r1, { productId: a.productId, kind: "product_analysis", goal: "Understand tickwarden.dev", status: "completed", planner: "deterministic", promptVersion: "extraction-v1", createdBy: a.userId, startedAt: at("2026-06-01T09:00:00Z"), finishedAt: at("2026-06-01T09:00:24Z"), createdAt: at("2026-06-01T09:00:00Z") });
  await steps(r1, [
    { kind: "tool", title: "Read homepage", detail: "tickwarden.dev · 200 · 48 KB", iso: "2026-06-01T09:00:04Z" },
    { kind: "tool", title: "Discovered 14 pages from sitemap.xml", detail: "Selected 7: pricing, features, docs, customers, blog, about", iso: "2026-06-01T09:00:05Z" },
    { kind: "tool", title: "Read pricing", detail: "3 plans · 14-day Team trial", iso: "2026-06-01T09:00:06Z" },
    { kind: "observation", title: "Detected 5 core features", iso: "2026-06-01T09:00:12Z" },
    { kind: "observation", title: "Found audience signals", detail: "“Built for backend teams who ship fast”; quickstart examples in Node, Python and Go", iso: "2026-06-01T09:00:15Z" },
    { kind: "observation", title: "Found 4 likely competitors", iso: "2026-06-01T09:00:19Z" },
    { kind: "learning", title: "Built product model", detail: "15 facts · 3 ICP hypotheses · 5 competitors", iso: "2026-06-01T09:00:24Z" },
  ]);

  // 2. Why did signups jump? (week of Jul 13 vs Jul 6)
  const r3 = stableId("run", W, "hn_diagnosis");
  const prevSignups = sum(a.blendedRows, "2026-07-06", "2026-07-12", (r: { signups: number }) => r.signups);
  const curSignups = sum(a.blendedRows, "2026-07-13", "2026-07-19", (r: { signups: number }) => r.signups);
  const hn = a.channelRows.filter((r) => r.channel === "hacker_news");
  const hnPrev = sum(hn, "2026-07-06", "2026-07-12", (r: { signups: number }) => r.signups);
  const hnCur = sum(hn, "2026-07-13", "2026-07-19", (r: { signups: number }) => r.signups);
  const hnVisits = sum(hn, "2026-07-13", "2026-07-19", (r: { visits: number }) => r.visits);
  await run(r3, { productId: a.productId, kind: "goal", goal: "Why did signups jump last week?", status: "completed", planner: "deterministic", createdBy: a.userId, startedAt: at("2026-07-20T08:30:00Z"), finishedAt: at("2026-07-20T08:30:09Z"), createdAt: at("2026-07-20T08:30:00Z"), plan: { objective: "Diagnose a change in the funnel", assumptions: [], steps: [] } });
  await steps(r3, [
    { kind: "context", title: "Retrieved business context", detail: "14 confirmed facts used; 2 unconfirmed inferences excluded from decisions.", iso: "2026-07-20T08:30:01Z" },
    { kind: "plan", title: "Planned: diagnose a change in the funnel", detail: "Compare this week with last week → Attribute the change to channels → Check what to do next", iso: "2026-07-20T08:30:02Z" },
    { kind: "tool", title: "Break down the last two weeks by channel", iso: "2026-07-20T08:30:04Z" },
    { kind: "observation", title: "Identified the main driver", detail: `Hacker News: ${hnPrev} → ${hnCur} signups on ${hnVisits.toLocaleString("en-US")} visits`, iso: "2026-07-20T08:30:07Z" },
  ]);
  await messages(r3, [
    { role: "user", content: "Why did signups jump last week?", iso: "2026-07-20T08:30:00Z" },
    { role: "agent", content: `Signups rose ${formatDelta((curSignups - prevSignups) / prevSignups)} week over week (${prevSignups} → ${curSignups}). Hacker News accounts for most of it: ${hnPrev} → ${hnCur} signups from the Show HN post, on ${hnVisits.toLocaleString("en-US")} visits. That is a ${formatPct(hnCur / hnVisits)} signup rate, far below search, so treat it as a one-off burst rather than a channel to fund.`, iso: "2026-07-20T08:30:09Z" },
  ]);

  // 3. Scale Google Search → awaiting approval (budget increase)
  const r4 = stableId("run", W, "scale_search");
  const google = a.channelRows.filter((r) => r.channel === "google_search");
  const spend14 = sum(google, "2026-08-30", "2026-09-12", (r: { spend: number }) => r.spend);
  const paid14 = sum(google, "2026-08-30", "2026-09-12", (r: { paidConversions: number }) => r.paidConversions);
  const cac14 = spend14 / Math.max(1, paid14);
  const monthSpent = sum(a.blendedRows, "2026-09-01", "2026-09-12", (r: { spend: number }) => r.spend);
  const committedCompetitor = 13 * 5; // EXP-005 runs through Sep 17
  const decision = evaluatePolicy(
    { tool: "ads.update_daily_budget", capability: "UPDATE_AD_BUDGET", risk: "R3", channel: "google_search", dailyBudget: { current: 20, proposed: 28 }, monthSpendToDate: monthSpent + committedCompetitor, daysLeftInMonth: 18 },
    "copilot",
    a.policy,
    at("2026-09-13T08:12:06Z"),
  );
  const reason = `CAC is ${formatUsd(cac14)} over the last 14 days, ${Math.round((1 - cac14 / 60) * 100)}% below the $60 target validated by EXP-003.`;
  const tcKpis = stableId("tc", r4, "kpis");
  const tcBreak = stableId("tc", r4, "breakdown");
  const tcBudget = stableId("tc", r4, "budget");
  await run(r4, {
    productId: a.productId, kind: "goal", goal: "Scale what's working in Google Search without breaking the budget", status: "awaiting_approval", planner: "deterministic", createdBy: a.userId,
    startedAt: at("2026-09-13T08:12:00Z"), createdAt: at("2026-09-13T08:12:00Z"),
    plan: { objective: "Scale what is working, within guardrails", assumptions: ["Only confirmed facts are treated as true.", "All spend and publishing actions go through workspace policy before running."], steps: [
      { id: "channels", title: "Find paid campaigns beating their CAC target", why: "Only scale what evidence supports", tool: "analytics.channel_breakdown", risk: "R0" },
      { id: "budget", title: "Propose a bounded budget increase", why: "Grow spend without breaking guardrails", tool: "ads.update_daily_budget", risk: "R3" },
    ] },
  });
  const r4Steps = [
    { kind: "context", title: "Retrieved business context", detail: "14 confirmed facts used; 2 unconfirmed inferences excluded from decisions. Metrics through 2026-09-12.", iso: "2026-09-13T08:12:01Z" },
    { kind: "plan", title: "Planned: scale what is working, within guardrails", detail: "Find paid campaigns beating their CAC target → Propose a bounded budget increase", iso: "2026-09-13T08:12:02Z" },
    { kind: "tool", title: "Measure paid channel efficiency over 14 days", iso: "2026-09-13T08:12:03Z" },
    { kind: "observation", title: `Cron monitoring · exact match is ${Math.round((1 - cac14 / 60) * 100)}% under its CAC target`, detail: `CAC ${formatUsd(cac14)} over 14 days vs a $60 target (EXP-003).`, iso: "2026-09-13T08:12:05Z" },
    { kind: "tool", title: "Increase “Cron monitoring · exact match” to $28/day", status: "waiting" as const, iso: "2026-09-13T08:12:06Z", output: { toolCallId: tcBudget } },
    { kind: "approval", title: "Requested approval", status: "waiting" as const, detail: decision.reasons.join("; "), iso: "2026-09-13T08:12:06Z" },
  ];
  await steps(r4, r4Steps);
  await tx.insert(t.toolCalls).values([
    { id: tcKpis, workspaceId: W, runId: r4, stepId: stableId("step", r4, "0"), tool: "analytics.query_kpis", capability: "READ_ANALYTICS", risk: "R0", input: { days: 7 }, output: { asOf: "2026-09-12" }, status: "succeeded", idempotencyKey: `${r4}:analytics.query_kpis:days=7`, durationMs: 38, createdAt: at("2026-09-13T08:12:01Z") },
    { id: tcBreak, workspaceId: W, runId: r4, stepId: stableId("step", r4, "2"), tool: "analytics.channel_breakdown", capability: "READ_ANALYTICS", risk: "R0", input: { days: 14 }, output: { asOf: "2026-09-12", channels: [{ channel: "google_search", spend: spend14, paid: paid14, cac: cac14 }] }, status: "succeeded", idempotencyKey: `${r4}:analytics.channel_breakdown:days=14`, durationMs: 52, createdAt: at("2026-09-13T08:12:03Z") },
    { id: tcBudget, workspaceId: W, runId: r4, stepId: stableId("step", r4, "4"), tool: "ads.update_daily_budget", capability: "UPDATE_AD_BUDGET", risk: "R3", input: { campaignId: a.campExact, dailyBudget: 28 }, status: "awaiting_approval", idempotencyKey: `ads.update_daily_budget:${a.campExact}:28`, createdAt: at("2026-09-13T08:12:06Z") },
  ]);
  const apr1 = stableId("apr", r4, "budget");
  await tx.insert(t.approvals).values({
    id: apr1, workspaceId: W, runId: r4, toolCallId: tcBudget, experimentId: a.e3Id, title: "Increase Google Ads daily budget", change: "$20/day → $28/day", reason,
    risk: "R3", tool: "ads.update_daily_budget", toolInput: { campaignId: a.campExact, dailyBudget: 28 }, policyDecision: decision, createdAt: at("2026-09-13T08:12:06Z"),
  });
  await messages(r4, [
    { role: "user", content: "Scale what's working in Google Search without breaking the budget", iso: "2026-09-13T08:12:00Z" },
    { role: "agent", content: `I want to increase “Cron monitoring · exact match” from $20/day to $28/day. ${reason} This exceeds the automatic +20% increase limit, so it is waiting for your approval. Projected September spend stays under $1,000.`, iso: "2026-09-13T08:12:07Z" },
  ]);
  await tx.insert(t.auditLogs).values({ id: newId("aud"), workspaceId: W, actorType: "agent", actorId: "agent:growth-orchestrator", action: "approval.requested", targetType: "approval", targetId: apr1, toolCallId: tcBudget, approvalId: apr1, payload: { tool: "ads.update_daily_budget", reasons: decision.reasons }, createdAt: at("2026-09-13T08:12:06Z") });

  // 4. What should we launch next? → awaiting approval (publish page)
  const r5 = stableId("run", W, "launch_next");
  const tcPublish = stableId("tc", r5, "publish");
  const publishDecision = evaluatePolicy({ tool: "pages.publish", capability: "PUBLISH_LANDING_PAGE", risk: "R2" }, "copilot", a.policy, at("2026-09-12T17:41:00Z"));
  await run(r5, {
    productId: a.productId, kind: "goal", goal: "What should we launch next?", status: "awaiting_approval", planner: "deterministic", createdBy: a.userId,
    startedAt: at("2026-09-12T17:40:00Z"), createdAt: at("2026-09-12T17:40:00Z"),
    plan: { objective: "Find and launch the next best growth experiment", assumptions: ["Only confirmed facts are treated as true."], steps: [
      { id: "queue", title: "Rank the experiment queue", why: "Pick the highest expected value per dollar and day", tool: "experiments.rank_queue", risk: "R0" },
      { id: "launch", title: "Prepare the top experiment for launch", why: "Move from recommendation to execution", risk: "R2" },
    ] },
  });
  await steps(r5, [
    { kind: "context", title: "Retrieved business context", detail: "14 confirmed facts used; 2 unconfirmed inferences excluded from decisions.", iso: "2026-09-12T17:40:01Z" },
    { kind: "plan", title: "Planned: find and launch the next best growth experiment", detail: "Rank the experiment queue → Prepare the top experiment for launch", iso: "2026-09-12T17:40:02Z" },
    { kind: "tool", title: "Rank the experiment queue", detail: "EXP-010 suppressed: disproved by EXP-001", iso: "2026-09-12T17:40:03Z" },
    { kind: "tool", title: "Drafted the Healthchecks.io comparison page", detail: "Reused the structure of the winning Cronitor page (EXP-002)", iso: "2026-09-12T17:40:40Z" },
    { kind: "tool", title: "Publish the page for EXP-007", status: "waiting", iso: "2026-09-12T17:41:00Z", output: { toolCallId: tcPublish } },
    { kind: "approval", title: "Requested approval", status: "waiting", detail: publishDecision.reasons.join("; "), iso: "2026-09-12T17:41:00Z" },
  ]);
  await tx.insert(t.toolCalls).values({ id: tcPublish, workspaceId: W, runId: r5, stepId: stableId("step", r5, "4"), tool: "pages.publish", capability: "PUBLISH_LANDING_PAGE", risk: "R2", input: { assetId: a.assetE7, path: "/alternatives/healthchecks-io", experimentId: a.e7Id }, status: "awaiting_approval", idempotencyKey: `pages.publish:${a.assetE7}:/alternatives/healthchecks-io`, createdAt: at("2026-09-12T17:41:00Z") });
  const apr2 = stableId("apr", r5, "publish");
  await tx.insert(t.approvals).values({
    id: apr2, workspaceId: W, runId: r5, toolCallId: tcPublish, experimentId: a.e7Id, title: "Publish “Healthchecks.io alternative” page", change: "Draft → live at /alternatives/healthchecks-io",
    reason: "EXP-002 showed comparison pages convert 2.6× the homepage; Healthchecks.io is the second most searched alternative.",
    risk: "R2", tool: "pages.publish", toolInput: { assetId: a.assetE7, path: "/alternatives/healthchecks-io", experimentId: a.e7Id }, policyDecision: publishDecision, createdAt: at("2026-09-12T17:41:00Z"),
  });
  await messages(r5, [
    { role: "user", content: "What should we launch next?", iso: "2026-09-12T17:40:00Z" },
    { role: "agent", content: `Top of the queue is EXP-007, a Healthchecks.io comparison page. It ranks first because EXP-002 confirmed the tactic on Cronitor searchers. I did not include a Meta retest (EXP-010): EXP-001 already disproved broad Meta targeting. The page draft is ready; publishing it is waiting for your approval.`, iso: "2026-09-12T17:41:01Z" },
  ]);
  void channelLabel;
}
