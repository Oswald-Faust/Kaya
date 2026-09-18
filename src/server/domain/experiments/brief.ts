/**
 * The brief behind an experiment: what will be done, why now, how it is
 * measured, what is learned either way and what could go wrong. Composed from
 * the experiment, Channel Fit and memory, so every line is traceable.
 */
import { DEFAULT_LOCALE, type Locale } from "@/i18n/config";
import { dictionaries } from "@/i18n/dictionaries";
import { fmt } from "@/i18n/format";

export interface BriefInput {
  experiment: {
    name: string;
    hypothesis: string;
    rationale: string;
    type: string;
    channel: string;
    audience: string;
    primaryMetric: string;
    successThreshold: number;
    budget: number;
    dailySpendCap: number | null;
    durationDays: number;
    timeToSignalDays: number;
    impact: number;
    effort: number;
    informationGain: number;
  };
  channelFit: { score: number; rationale: string; reasonsAgainst: string[] } | null;
  /** Learnings that already point this way, and the one that would suppress it. */
  boostedBy: string[];
  suppressedBy: string | null;
  hasRevenueData: boolean;
  /** A draft already written for this experiment, if any. */
  assetKind: string | null;
  formatUsd: (value: number) => string;
  formatThreshold: (metric: string, threshold: number) => string;
  metricLabel: (metric: string) => string;
  channelLabel: string;
  locale?: Locale;
}

export interface BriefSection {
  id: "do" | "why" | "measure" | "learn" | "risk";
  title: string;
  lines: string[];
}

const ACTION_BY_TYPE: Record<string, "page" | "email" | "ad" | "post" | "pricing" | "activation"> = {
  seo_page: "page",
  landing_page: "page",
  pricing: "pricing",
  email: "email",
  activation: "activation",
  paid_ad: "ad",
  creator: "ad",
  messaging: "post",
  community: "post",
};

export function buildExperimentBrief(input: BriefInput): BriefSection[] {
  const locale = input.locale ?? DEFAULT_LOCALE;
  const c = dictionaries[locale].app.brief;
  const e = input.experiment;
  const usd = input.formatUsd;
  const sections: BriefSection[] = [];

  /* What we'll do */
  const action = ACTION_BY_TYPE[e.type] ?? "post";
  const doLines = [
    fmt(c.do[action], { channel: input.channelLabel, audience: e.audience }),
    e.budget > 0
      ? fmt(c.doBudget, { budget: usd(e.budget), days: e.durationDays, daily: usd(e.dailySpendCap ?? Math.round(e.budget / Math.max(1, e.durationDays))) })
      : fmt(c.doOrganic, { days: e.durationDays }),
  ];
  if (input.assetKind) doLines.push(c.doDraftReady);
  else doLines.push(c.doDraftPending);
  sections.push({ id: "do", title: c.doTitle, lines: doLines });

  /* Why now */
  const whyLines = [e.rationale];
  if (input.channelFit) {
    // The experiment rationale is often the Channel Fit sentence; don't say it twice.
    const same = input.channelFit.rationale.trim() === e.rationale.trim();
    whyLines.push(same ? fmt(c.whyFitShort, { channel: input.channelLabel, score: input.channelFit.score }) : fmt(c.whyFit, { channel: input.channelLabel, score: input.channelFit.score, rationale: input.channelFit.rationale }));
  }
  for (const statement of input.boostedBy.slice(0, 2)) whyLines.push(fmt(c.whyBoosted, { statement }));
  whyLines.push(fmt(c.whyRanking, { impact: e.impact, effort: e.effort, info: e.informationGain }));
  sections.push({ id: "why", title: c.whyTitle, lines: whyLines });

  /* How we measure */
  const measureLines = [
    fmt(c.measureMetric, { metric: input.metricLabel(e.primaryMetric), threshold: input.formatThreshold(e.primaryMetric, e.successThreshold) }),
    fmt(c.measureWindow, { signal: e.timeToSignalDays, days: e.durationDays }),
    e.primaryMetric === "cac" ? c.measureCac : c.measureRate,
  ];
  if (!input.hasRevenueData) measureLines.push(c.measureNoRevenue);
  sections.push({ id: "measure", title: c.measureTitle, lines: measureLines });

  /* What we learn */
  sections.push({
    id: "learn",
    title: c.learnTitle,
    lines: [
      fmt(c.learnWin, { channel: input.channelLabel, audience: e.audience }),
      fmt(c.learnLose, { channel: input.channelLabel }),
      c.learnEither,
    ],
  });

  /* What could go wrong */
  const riskLines: string[] = [];
  if (input.suppressedBy) riskLines.push(fmt(c.riskSuppressed, { statement: input.suppressedBy }));
  if (e.budget > 0) riskLines.push(fmt(c.riskSpend, { budget: usd(e.budget) }));
  if (input.channelFit?.reasonsAgainst[0]) riskLines.push(input.channelFit.reasonsAgainst[0]);
  riskLines.push(e.effort >= 4 ? c.riskEffortHigh : c.riskEffortLow);
  riskLines.push(c.riskApproval);
  sections.push({ id: "risk", title: c.riskTitle, lines: riskLines });

  return sections;
}
