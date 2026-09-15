/**
 * Initial strategy generator (Strategy Engine V1). Deterministic and
 * explainable: it composes confirmed memory, the goal, the budget and Channel
 * Fit into a strategy and a first experiment queue. Nothing here invents
 * facts; unknowns are stated as assumptions with a way to validate them.
 */
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

function money(n: number): string {
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

function longDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
}

function bottleneckFor(input: StrategyInput): StrategyContent["bottleneck"] {
  const noData = input.hasRevenueData ? "" : " Without revenue and analytics data this is a hypothesis; the first experiments are designed to confirm it.";
  switch (input.goal.template) {
    case "first_customers":
    case "reach_1k_mrr":
    case "new_market":
      return { title: "Not enough of the right people know the product exists", detail: `At this stage distribution, not conversion, limits growth. The job is to find one channel where ${input.icps[0]?.name.toLowerCase() ?? "buyers"} already look for a solution.${noData}` };
    case "reduce_cac":
      return { title: "Spend isn't concentrated on high-intent audiences", detail: `CAC falls fastest by moving budget toward channels where people are already searching, and cutting channels that only create awareness.${noData}` };
    case "trial_conversion":
      return { title: "Trial users don't reach value before the trial ends", detail: `More traffic won't fix conversion. The first experiments target activation and the moment of purchase.${noData}` };
    default:
      return { title: "High-intent visitors aren't reaching a page built to convert them", detail: `Growth needs both more qualified visitors and a clearer path from visit to signup.${noData}` };
  }
}

export function generateStrategy(input: StrategyInput): GeneratedStrategy {
  const monthly = input.goal.monthlyBudget;
  const fits = input.channelFits;
  const icp = input.icps[0]?.name ?? "Early adopters";
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
          push({ ...common, name: `Google Search: high-intent “${keyword}” keywords`, hypothesis: `People searching for ${keyword} convert into paying customers below a ${money(targetCac)} CAC`, type: "paid_ad", channel: "google_search", audience: `People searching for ${keyword} and close variants`, primaryMetric: "cac", successThreshold: targetCac, budget: paidBudget, effort: 2, timeToSignalDays: 10, durationDays: 21, similarityKey: `google_search:exact_intent:${slugKey(keyword)}` });
        break;
      case "seo_content":
        if (competitor)
          push({ ...common, name: `“${competitor.name} alternative” comparison page`, hypothesis: `Visitors comparing ${competitor.name} with alternatives sign up more often on a dedicated comparison page than on the homepage`, type: "seo_page", channel: "seo_content", audience: `Searchers evaluating ${competitor.name}`, primaryMetric: "signup_rate", successThreshold: 0.3, budget: 0, effort: 2, timeToSignalDays: 14, durationDays: 30, similarityKey: `seo_content:comparison_page:${slugKey(competitor.name)}` });
        else
          push({ ...common, name: `Use-case page for ${lowerFirst(icp)}`, hypothesis: `A page written for ${lowerFirst(icp)} converts better than the generic homepage`, type: "seo_page", channel: "seo_content", audience: icp, primaryMetric: "signup_rate", successThreshold: 0.3, budget: 0, effort: 2, timeToSignalDays: 14, durationDays: 30, similarityKey: `seo_content:use_case_page:${slugKey(icp)}` });
        break;
      case "hacker_news":
        push({ ...common, name: `Show HN: ${input.productName}`, hypothesis: "A candid Show HN post brings qualified signups without spend", type: "community", channel: "hacker_news", audience: "Hacker News readers", primaryMetric: "signup_rate", successThreshold: 0.2, budget: 0, effort: 2, timeToSignalDays: 2, durationDays: 7, similarityKey: `hacker_news:launch_post:${slugKey(input.productName)}` });
        break;
      case "reddit":
        push({ ...common, name: `Answer relevant Reddit threads for ${lowerFirst(icp)}`, hypothesis: "Transparent, genuinely helpful answers in relevant threads send referral signups", type: "community", channel: "reddit", audience: icp, primaryMetric: "signup_rate", successThreshold: 0.2, budget: 0, effort: 3, informationGain: 3, timeToSignalDays: 21, durationDays: 30, similarityKey: `reddit:helpful_answers:${slugKey(icp)}` });
        break;
      case "email_lifecycle":
        push({ ...common, name: "Activation email for signups who haven't reached value", hypothesis: "An email 24 hours after signup, sent to users who haven't completed setup, increases activation", type: "email", channel: "email_lifecycle", audience: "New signups who haven't completed setup", primaryMetric: "activation_rate", successThreshold: 0.1, budget: 0, effort: 2, timeToSignalDays: 7, durationDays: 21, similarityKey: "email_lifecycle:activation_nudge:new_signups" });
        break;
      case "youtube_creators":
        if (paidBudget >= 200)
          push({ ...common, name: "Sponsored segment with a niche creator", hypothesis: `A sponsored segment with a creator followed by ${lowerFirst(icp)} acquires customers below a ${money(targetCac)} CAC`, type: "creator", channel: "youtube_creators", audience: icp, primaryMetric: "cac", successThreshold: targetCac, budget: paidBudget, effort: 3, timeToSignalDays: 21, durationDays: 30, similarityKey: `youtube_creators:sponsored_segment:${slugKey(icp)}` });
        break;
      case "x_organic":
        push({ ...common, name: "Build in public on X", hypothesis: "Weekly posts showing real product progress bring signups from builders", type: "messaging", channel: "x_organic", audience: icp, primaryMetric: "signup_rate", successThreshold: 0.2, budget: 0, effort: 3, informationGain: 3, timeToSignalDays: 21, durationDays: 30, similarityKey: `x_organic:build_in_public:${slugKey(icp)}` });
        break;
      case "linkedin":
        push({ ...common, name: `Founder posts for ${lowerFirst(icp)} on LinkedIn`, hypothesis: `Weekly founder posts about the problem generate signups from ${lowerFirst(icp)}`, type: "messaging", channel: "linkedin", audience: icp, primaryMetric: "signup_rate", successThreshold: 0.2, budget: 0, effort: 3, informationGain: 3, timeToSignalDays: 30, durationDays: 45, similarityKey: `linkedin:founder_posts:${slugKey(icp)}` });
        break;
      case "meta_ads":
        if (paidBudget >= 300)
          push({ ...common, name: `Meta: interest targeting for ${lowerFirst(icp)}`, hypothesis: `Interest targeting on Meta acquires customers below a ${money(targetCac)} CAC`, type: "paid_ad", channel: "meta_ads", audience: icp, primaryMetric: "cac", successThreshold: targetCac, budget: paidBudget, effort: 3, timeToSignalDays: 10, durationDays: 21, similarityKey: `meta_ads:broad_interest:${slugKey(icp)}` });
        break;
      case "tiktok":
        push({ ...common, name: "Short product demos on TikTok", hypothesis: "Short demos of the product in use bring signups", type: "messaging", channel: "tiktok", audience: icp, primaryMetric: "signup_rate", successThreshold: 0.2, budget: 0, effort: 4, informationGain: 3, timeToSignalDays: 21, durationDays: 30, similarityKey: `tiktok:short_demos:${slugKey(icp)}` });
        break;
    }
  }

  const prioritized = fits.filter((f) => f.verdict === "prioritize").slice(0, 2).map((f) => f.channel);
  const avoid = fits.filter((f) => f.verdict === "avoid").sort((a, b) => a.score - b.score).slice(0, 3);
  const paidTotal = allocation.lines.filter((l) => CHANNELS[l.channel as Channel]?.kind === "paid" || CHANNELS[l.channel as Channel]?.kind === "creator").reduce((s, l) => s + l.amount, 0);

  const baseline: StrategyContent["baseline"] = [];
  if (input.goal.baseline !== null) baseline.push({ label: "Today", value: input.goal.template.includes("mrr") || input.goal.template === "reduce_cac" ? money(input.goal.baseline) : String(input.goal.baseline) });
  baseline.push({ label: "Monthly budget", value: monthly > 0 ? money(monthly) : "Organic only" });
  if (input.arpuMonthly !== null) baseline.push({ label: "Price point", value: `${money(input.arpuMonthly)}/mo` });
  baseline.push({ label: "Revenue data", value: input.hasRevenueData ? "Connected" : "Not connected" });

  const launches = experiments.map((e) => `Launch: ${e.name}`);
  const winnerChannel = prioritized[0] ? channelLabel(prioritized[0]) : "the best channel";
  const valueProp = input.valueProposition && clause(input.valueProposition) !== clause(input.oneLiner) ? clause(input.valueProposition) : null;
  const description = clause(input.oneLiner || input.valueProposition || input.category);

  const content: StrategyContent = {
    situation: `${input.productName}: ${lowerFirst(description)}. ${input.hasRevenueData ? "" : "No revenue or analytics data is connected yet, so every recommendation below starts as a hypothesis with a test attached. "}The strongest channel fit is ${fits[0] ? `${channelLabel(fits[0].channel)} (${fits[0].score})` : "not yet known"}.`,
    objective: `${input.goal.title}${input.goal.deadline ? ` by ${longDate(input.goal.deadline)}` : ""}, on ${monthly > 0 ? `a ${money(monthly)}/month budget` : "an organic-only budget"}.`,
    baseline,
    bottleneck: bottleneckFor(input),
    positioning: {
      statement: `${input.productName}: ${valueProp ?? description}.`,
      forWho: icp,
      insteadOf: competitor ? `${competitor.name} or a do-it-yourself workaround` : "A do-it-yourself workaround",
      because: input.features[0] ?? (valueProp && valueProp !== description ? valueProp : "Confirm a differentiating feature to complete this"),
    },
    messagingPillars: input.features.slice(0, 3).map((f) => ({ pillar: f, proof: "Stated on your site; back it with a customer quote or a number", channels: prioritized })),
    icpPriorities: input.icps.slice(0, 2).map((i, idx) => ({
      name: i.name,
      why: idx === 0 ? `Strongest audience signal (${Math.round(i.confidence * 100)}% confidence)` : "Secondary segment: test only after the primary one converts",
    })),
    competitorWedges: input.competitors.slice(0, 3).map((c) => ({ competitor: c.name, wedge: c.wedge ?? (input.features[0] ? `Lead with ${lowerFirst(input.features[0])}` : "Confirm a differentiating feature to define the wedge") })),
    channelsToAvoid: avoid.map((f) => ({ channel: f.channel, reason: f.reasonsAgainst[0] ? `${f.reasonsAgainst[0]}.` : f.rationale })),
    budget: {
      monthly,
      paidShare: monthly > 0 ? paidTotal / monthly : 0,
      allocation: allocation.lines.map((l) => ({ channel: l.channel as Channel, amount: l.amount, purpose: l.reason })),
    },
    plan: {
      days30: [...(input.hasRevenueData ? [] : ["Connect revenue and analytics so results are measured in customers, not clicks"]), ...launches.slice(0, 2)],
      days60: [
        ...launches.slice(2, 4),
        allocation.unallocated > 0
          ? `Move the ${money(allocation.unallocated)} reserve to the first experiment that beats its threshold`
          : "Double down on the first winner; stop anything that missed its threshold",
      ],
      days90: [...launches.slice(4), `Revise the strategy with evidence from ${winnerChannel} and the first experiments`],
    },
    assumptions: [
      ...(input.icps[0] && input.icps[0].confidence < 0.8
        ? [{ statement: `${input.icps[0].name} are the buyers most likely to pay`, confidence: input.icps[0].confidence, howToValidate: "Share of paying customers from this segment after the first experiments" }]
        : []),
      ...experiments.slice(0, 3).map((e) => ({
        statement: e.hypothesis,
        confidence: e.priorConfidence,
        howToValidate: e.primaryMetric === "cac" ? `CAC below ${money(e.successThreshold)} on ${money(e.budget)}` : `+${Math.round(e.successThreshold * 100)}% ${e.primaryMetric.replace(/_/g, " ")}`,
      })),
    ],
  };

  const summary = prioritized.length
    ? `Focus on ${prioritized.map(channelLabel).join(" and ")}; avoid ${avoid.slice(0, 2).map((f) => channelLabel(f.channel)).join(" and ") || "unproven channels"} for now.`
    : "No channel fits strongly yet; run small tests before committing budget.";

  return { summary, content, experiments };
}
