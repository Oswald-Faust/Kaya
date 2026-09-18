/**
 * Initial strategy generator (Strategy Engine V1). Deterministic and
 * explainable: it composes confirmed memory, the goal, the budget and Channel
 * Fit into a strategy and a first experiment queue. Nothing here invents
 * facts; unknowns are stated as assumptions with a way to validate them.
 */
import { DEFAULT_LOCALE, type Locale } from "@/i18n/config";
import { dictionaries } from "@/i18n/dictionaries";
import { fmt } from "@/i18n/format";
import { CHANNELS, channelLabel, type Channel } from "../channels";
import type { StrategyContent } from "../types";
import { allocateBudget } from "./allocation";
import type { ChannelFit } from "./channel-fit";

export interface StrategyInput {
  productName: string;
  oneLiner: string;
  category: string;
  valueProposition: string | null;
  features: string[];
  icps: { name: string; confidence: number }[];
  competitors: { name: string; wedge: string | null }[];
  arpuMonthly: number | null;
  goal: { template: string; title: string; baseline: number | null; target: number | null; deadline: string | null; monthlyBudget: number };
  hasRevenueData: boolean;
  channelFits: ChannelFit[];
  /** The founder's language: everything the engine writes is for them to read. */
  locale?: Locale;
}

export interface ExperimentSeed {
  name: string;
  hypothesis: string;
  type: "paid_ad" | "landing_page" | "pricing" | "messaging" | "seo_page" | "email" | "creator" | "community" | "activation";
  channel: Channel;
  audience: string;
  primaryMetric: "signup_rate" | "activation_rate" | "trial_to_paid" | "ctr" | "cac";
  successThreshold: number;
  budget: number;
  impact: number;
  priorConfidence: number;
  effort: number;
  informationGain: number;
  timeToSignalDays: number;
  durationDays: number;
  similarityKey: string;
  rationale: string;
}

export interface GeneratedStrategy {
  summary: string;
  content: StrategyContent;
  experiments: ExperimentSeed[];
}

const MAX_EXPERIMENTS = 6;

export function slugKey(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 40) || "general"
  );
}

function lowerFirst(s: string): string {
  return /^[A-Z][a-z]/.test(s) ? s[0].toLowerCase() + s.slice(1) : s;
}

/** Strips trailing sentence punctuation so fragments can be composed into sentences. */
function clause(s: string): string {
  return s.trim().replace(/[.!?…]+$/, "");
}

function money(n: number, locale: Locale = DEFAULT_LOCALE): string {
  return new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-US", { style: "currency", currency: "USD", currencyDisplay: "narrowSymbol", maximumFractionDigits: 0 }).format(Math.round(n));
}

function longDate(iso: string, locale: Locale = DEFAULT_LOCALE): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
}

/** A channel name in the founder's language. */
function channel(id: string, locale: Locale): string {
  return dictionaries[locale].common.channels[id] ?? channelLabel(id);
}

function bottleneckFor(input: StrategyInput, locale: Locale): StrategyContent["bottleneck"] {
  const c = dictionaries[locale].strategyGen;
  const noData = input.hasRevenueData ? "" : c.noData;
  const b =
    input.goal.template === "reduce_cac"
      ? c.bottleneck.cac
      : input.goal.template === "trial_conversion"
        ? c.bottleneck.activation
        : ["first_customers", "reach_1k_mrr", "new_market"].includes(input.goal.template)
          ? c.bottleneck.awareness
          : c.bottleneck.conversion;
  return { title: b.title, detail: fmt(b.detail, { buyers: input.icps[0]?.name.toLowerCase() ?? c.buyers }) + noData };
}

export function generateStrategy(input: StrategyInput): GeneratedStrategy {
  const locale = input.locale ?? DEFAULT_LOCALE;
  const c = dictionaries[locale].strategyGen;
  const x = c.experiments;
  const usd = (n: number) => money(n, locale);
  const monthly = input.goal.monthlyBudget;
  const fits = input.channelFits;
  const icp = input.icps[0]?.name ?? c.earlyAdopters;
  const competitor = input.competitors[0];
  const targetCac = Math.max(20, Math.round((input.arpuMonthly ?? 30) * 3));
  const allocation = allocateBudget(monthly, fits.map((f) => ({ channel: f.channel, score: f.score })));
  const funded = new Map(allocation.lines.map((l) => [l.channel, l.amount]));
  const keyword = input.category.split(/[·,/]/).pop()!.trim().toLowerCase() || input.productName.toLowerCase();

  const experiments: ExperimentSeed[] = [];
  const push = (seed: ExperimentSeed) => {
    if (experiments.length < MAX_EXPERIMENTS && !experiments.some((e) => e.similarityKey === seed.similarityKey)) experiments.push(seed);
  };

  for (const fit of fits) {
    if (fit.verdict === "avoid") continue;
    const impact = fit.score >= 80 ? 4 : fit.score >= 60 ? 3 : 2;
    const priorConfidence = Math.round(Math.min(0.6, Math.max(0.25, 0.25 + (fit.score - 40) / 120)) * 100) / 100;
    const common = { impact, priorConfidence, informationGain: 4, rationale: fit.rationale };
    const paidBudget = Math.min(funded.get(fit.channel) ?? 0, Math.round(monthly * 0.4));

    switch (fit.channel) {
      case "google_search":
        if (paidBudget >= 150)
          push({ ...common, name: fmt(x.googleSearch.name, { keyword }), hypothesis: fmt(x.googleSearch.hypothesis, { keyword, cac: usd(targetCac) }), type: "paid_ad", channel: "google_search", audience: fmt(x.googleSearch.audience, { keyword }), primaryMetric: "cac", successThreshold: targetCac, budget: paidBudget, effort: 2, timeToSignalDays: 10, durationDays: 21, similarityKey: `google_search:exact_intent:${slugKey(keyword)}` });
        break;
      case "seo_content":
        if (competitor)
          push({ ...common, name: fmt(x.comparison.name, { competitor: competitor.name }), hypothesis: fmt(x.comparison.hypothesis, { competitor: competitor.name }), type: "seo_page", channel: "seo_content", audience: fmt(x.comparison.audience, { competitor: competitor.name }), primaryMetric: "signup_rate", successThreshold: 0.3, budget: 0, effort: 2, timeToSignalDays: 14, durationDays: 30, similarityKey: `seo_content:comparison_page:${slugKey(competitor.name)}` });
        else
          push({ ...common, name: fmt(x.useCase.name, { icp: lowerFirst(icp) }), hypothesis: fmt(x.useCase.hypothesis, { icp: lowerFirst(icp) }), type: "seo_page", channel: "seo_content", audience: icp, primaryMetric: "signup_rate", successThreshold: 0.3, budget: 0, effort: 2, timeToSignalDays: 14, durationDays: 30, similarityKey: `seo_content:use_case_page:${slugKey(icp)}` });
        break;
      case "hacker_news":
        push({ ...common, name: fmt(x.showHn.name, { product: input.productName }), hypothesis: x.showHn.hypothesis, type: "community", channel: "hacker_news", audience: x.showHn.audience, primaryMetric: "signup_rate", successThreshold: 0.2, budget: 0, effort: 2, timeToSignalDays: 2, durationDays: 7, similarityKey: `hacker_news:launch_post:${slugKey(input.productName)}` });
        break;
      case "reddit":
        push({ ...common, name: fmt(x.reddit.name, { icp: lowerFirst(icp) }), hypothesis: x.reddit.hypothesis, type: "community", channel: "reddit", audience: icp, primaryMetric: "signup_rate", successThreshold: 0.2, budget: 0, effort: 3, informationGain: 3, timeToSignalDays: 21, durationDays: 30, similarityKey: `reddit:helpful_answers:${slugKey(icp)}` });
        break;
      case "email_lifecycle":
        push({ ...common, name: x.activationEmail.name, hypothesis: x.activationEmail.hypothesis, type: "email", channel: "email_lifecycle", audience: x.activationEmail.audience, primaryMetric: "activation_rate", successThreshold: 0.1, budget: 0, effort: 2, timeToSignalDays: 7, durationDays: 21, similarityKey: "email_lifecycle:activation_nudge:new_signups" });
        break;
      case "youtube_creators":
        if (paidBudget >= 200)
          push({ ...common, name: x.creator.name, hypothesis: fmt(x.creator.hypothesis, { icp: lowerFirst(icp), cac: usd(targetCac) }), type: "creator", channel: "youtube_creators", audience: icp, primaryMetric: "cac", successThreshold: targetCac, budget: paidBudget, effort: 3, timeToSignalDays: 21, durationDays: 30, similarityKey: `youtube_creators:sponsored_segment:${slugKey(icp)}` });
        break;
      case "x_organic":
        push({ ...common, name: x.buildInPublic.name, hypothesis: x.buildInPublic.hypothesis, type: "messaging", channel: "x_organic", audience: icp, primaryMetric: "signup_rate", successThreshold: 0.2, budget: 0, effort: 3, informationGain: 3, timeToSignalDays: 21, durationDays: 30, similarityKey: `x_organic:build_in_public:${slugKey(icp)}` });
        break;
      case "linkedin":
        push({ ...common, name: fmt(x.linkedin.name, { icp: lowerFirst(icp) }), hypothesis: fmt(x.linkedin.hypothesis, { icp: lowerFirst(icp) }), type: "messaging", channel: "linkedin", audience: icp, primaryMetric: "signup_rate", successThreshold: 0.2, budget: 0, effort: 3, informationGain: 3, timeToSignalDays: 30, durationDays: 45, similarityKey: `linkedin:founder_posts:${slugKey(icp)}` });
        break;
      case "meta_ads":
        if (paidBudget >= 300)
          push({ ...common, name: fmt(x.meta.name, { icp: lowerFirst(icp) }), hypothesis: fmt(x.meta.hypothesis, { icp: lowerFirst(icp), cac: usd(targetCac) }), type: "paid_ad", channel: "meta_ads", audience: icp, primaryMetric: "cac", successThreshold: targetCac, budget: paidBudget, effort: 3, timeToSignalDays: 10, durationDays: 21, similarityKey: `meta_ads:broad_interest:${slugKey(icp)}` });
        break;
      case "tiktok":
        push({ ...common, name: x.tiktok.name, hypothesis: x.tiktok.hypothesis, type: "messaging", channel: "tiktok", audience: icp, primaryMetric: "signup_rate", successThreshold: 0.2, budget: 0, effort: 4, informationGain: 3, timeToSignalDays: 21, durationDays: 30, similarityKey: `tiktok:short_demos:${slugKey(icp)}` });
        break;
    }
  }

  const prioritized = fits.filter((f) => f.verdict === "prioritize").slice(0, 2).map((f) => f.channel);
  const avoid = fits.filter((f) => f.verdict === "avoid").sort((a, b) => a.score - b.score).slice(0, 3);
  const paidTotal = allocation.lines.filter((l) => CHANNELS[l.channel as Channel]?.kind === "paid" || CHANNELS[l.channel as Channel]?.kind === "creator").reduce((s, l) => s + l.amount, 0);

  const baseline: StrategyContent["baseline"] = [];
  if (input.goal.baseline !== null) baseline.push({ label: c.baseline.today, value: input.goal.template.includes("mrr") || input.goal.template === "reduce_cac" ? usd(input.goal.baseline) : String(input.goal.baseline) });
  baseline.push({ label: c.baseline.monthlyBudget, value: monthly > 0 ? usd(monthly) : c.baseline.organicOnly });
  if (input.arpuMonthly !== null) baseline.push({ label: c.baseline.pricePoint, value: fmt(c.baseline.perMonth, { amount: usd(input.arpuMonthly) }) });
  baseline.push({ label: c.baseline.revenueData, value: input.hasRevenueData ? c.baseline.connected : c.baseline.notConnected });

  const launches = experiments.map((e) => fmt(c.launch, { name: e.name }));
  const winnerChannel = prioritized[0] ? channel(prioritized[0], locale) : c.bestChannel;
  const valueProp = input.valueProposition && clause(input.valueProposition) !== clause(input.oneLiner) ? clause(input.valueProposition) : null;
  const description = clause(input.oneLiner || input.valueProposition || input.category);

  const content: StrategyContent = {
    situation: fmt(c.situation, {
      product: input.productName,
      description: lowerFirst(description),
      noData: input.hasRevenueData ? "" : c.situationNoData,
      fit: fits[0] ? fmt(c.fitWithScore, { channel: channel(fits[0].channel, locale), score: fits[0].score }) : c.fitUnknown,
    }),
    objective: fmt(c.objective, {
      goal: input.goal.title,
      deadline: input.goal.deadline ? fmt(c.byDate, { date: longDate(input.goal.deadline, locale) }) : "",
      budget: monthly > 0 ? fmt(c.budgetOf, { amount: usd(monthly) }) : c.organicBudget,
    }),
    baseline,
    bottleneck: bottleneckFor(input, locale),
    positioning: {
      statement: fmt(c.positioning.statement, { product: input.productName, value: valueProp ?? description }),
      forWho: icp,
      insteadOf: competitor ? fmt(c.positioning.insteadOf, { competitor: competitor.name }) : c.positioning.insteadOfNone,
      because: input.features[0] ?? (valueProp && valueProp !== description ? valueProp : c.positioning.becauseFallback),
    },
    messagingPillars: input.features.slice(0, 3).map((f) => ({ pillar: f, proof: c.pillarProof, channels: prioritized })),
    icpPriorities: input.icps.slice(0, 2).map((i, idx) => ({
      name: i.name,
      why: idx === 0 ? fmt(c.icpWhyPrimary, { pct: Math.round(i.confidence * 100) }) : c.icpWhySecondary,
    })),
    competitorWedges: input.competitors.slice(0, 3).map((comp) => ({ competitor: comp.name, wedge: comp.wedge ?? (input.features[0] ? fmt(c.wedgeLead, { feature: lowerFirst(input.features[0]) }) : c.wedgeFallback) })),
    channelsToAvoid: avoid.map((f) => ({ channel: f.channel, reason: f.reasonsAgainst[0] ? `${f.reasonsAgainst[0]}.` : f.rationale })),
    budget: {
      monthly,
      paidShare: monthly > 0 ? paidTotal / monthly : 0,
      allocation: allocation.lines.map((l) => ({ channel: l.channel as Channel, amount: l.amount, purpose: l.reason })),
    },
    plan: {
      days30: [...(input.hasRevenueData ? [] : [c.plan.connectData]), ...launches.slice(0, 2)],
      days60: [
        ...launches.slice(2, 4),
        allocation.unallocated > 0
          ? fmt(c.plan.moveReserve, { amount: usd(allocation.unallocated) })
          : c.plan.doubleDown,
      ],
      days90: [...launches.slice(4), fmt(c.plan.revise, { channel: winnerChannel })],
    },
    assumptions: [
      ...(input.icps[0] && input.icps[0].confidence < 0.8
        ? [{ statement: fmt(c.assumptionIcp.statement, { icp: input.icps[0].name }), confidence: input.icps[0].confidence, howToValidate: c.assumptionIcp.howToValidate }]
        : []),
      ...experiments.slice(0, 3).map((e) => ({
        statement: e.hypothesis,
        confidence: e.priorConfidence,
        howToValidate: e.primaryMetric === "cac" ? fmt(c.validateCac, { threshold: usd(e.successThreshold), budget: usd(e.budget) }) : fmt(c.validateLift, { pct: Math.round(e.successThreshold * 100), metric: e.primaryMetric.replace(/_/g, " ") }),
      })),
    ],
  };

  const summary = prioritized.length
    ? fmt(c.summary.focus, {
        prioritized: prioritized.map((p) => channel(p, locale)).join(c.and),
        avoid: avoid.slice(0, 2).map((f) => channel(f.channel, locale)).join(c.and) || c.summary.unprovenChannels,
      })
    : c.summary.none;

  return { summary, content, experiments };
}
