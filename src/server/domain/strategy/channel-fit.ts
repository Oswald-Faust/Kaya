/**
 * Channel Fit Score (0–100). Combines channel priors for the audience archetype
 * with business-specific inputs (price point, budget, traction) and evidence
 * from previous experiments. Deterministic and explainable: every score comes
 * with the factors that produced it and plain-language reasons.
 */
import { CHANNELS, CHANNEL_IDS, type Channel } from "../channels";
import type { ChannelFactors } from "../types";

export type AudienceArchetype = "developers" | "b2b_smb" | "consumer";

export interface ChannelFitInput {
  audience: AudienceArchetype;
  arpuMonthly: number;
  monthlyBudget: number;
  searchIntent: "high" | "medium" | "low";
  /** 0–100 current contribution of the channel to signups. */
  traction: Partial<Record<Channel, number>>;
  evidence: { channel: string; kind: "winner" | "loser"; confidence: number; statement: string }[];
}

export type ChannelVerdict = "prioritize" | "test" | "avoid";

export interface ChannelFit {
  channel: Channel;
  score: number;
  verdict: ChannelVerdict;
  factors: ChannelFactors;
  reasonsFor: string[];
  reasonsAgainst: string[];
  rationale: string;
  evidence: string[];
}

/* Priors: 0–100 audience concentration by archetype. */
const AUDIENCE_PRESENCE: Record<Channel, Record<AudienceArchetype, number>> = {
  google_search: { developers: 85, b2b_smb: 85, consumer: 80 },
  seo_content: { developers: 85, b2b_smb: 80, consumer: 70 },
  reddit: { developers: 80, b2b_smb: 45, consumer: 70 },
  hacker_news: { developers: 85, b2b_smb: 35, consumer: 10 },
  x_organic: { developers: 70, b2b_smb: 45, consumer: 50 },
  linkedin: { developers: 30, b2b_smb: 85, consumer: 20 },
  meta_ads: { developers: 25, b2b_smb: 45, consumer: 90 },
  youtube_creators: { developers: 75, b2b_smb: 55, consumer: 85 },
  email_lifecycle: { developers: 70, b2b_smb: 75, consumer: 70 },
  tiktok: { developers: 20, b2b_smb: 30, consumer: 90 },
};

const PURCHASE_INTENT: Record<Channel, number> = {
  google_search: 90,
  seo_content: 75,
  reddit: 50,
  hacker_news: 40,
  x_organic: 35,
  linkedin: 40,
  meta_ads: 25,
  youtube_creators: 55,
  email_lifecycle: 80,
  tiktok: 20,
};

/* Expected CAC in USD for a self-serve SaaS, by archetype (amortized for organic). */
const EXPECTED_CAC: Record<Channel, Record<AudienceArchetype, number>> = {
  google_search: { developers: 45, b2b_smb: 90, consumer: 35 },
  seo_content: { developers: 20, b2b_smb: 35, consumer: 15 },
  reddit: { developers: 30, b2b_smb: 70, consumer: 25 },
  hacker_news: { developers: 18, b2b_smb: 90, consumer: 60 },
  x_organic: { developers: 40, b2b_smb: 60, consumer: 40 },
  linkedin: { developers: 190, b2b_smb: 80, consumer: 150 },
  meta_ads: { developers: 170, b2b_smb: 110, consumer: 30 },
  youtube_creators: { developers: 55, b2b_smb: 90, consumer: 35 },
  email_lifecycle: { developers: 12, b2b_smb: 15, consumer: 10 },
  tiktok: { developers: 220, b2b_smb: 160, consumer: 30 },
};

const CREATIVE_EASE: Record<Channel, number> = {
  google_search: 85,
  seo_content: 60,
  reddit: 70,
  hacker_news: 70,
  x_organic: 55,
  linkedin: 55,
  meta_ads: 40,
  youtube_creators: 45,
  email_lifecycle: 80,
  tiktok: 20,
};

const ORGANIC_POTENTIAL: Record<Channel, number> = {
  google_search: 10,
  seo_content: 95,
  reddit: 60,
  hacker_news: 55,
  x_organic: 70,
  linkedin: 65,
  meta_ads: 5,
  youtube_creators: 60,
  email_lifecycle: 75,
  tiktok: 70,
};

const WEIGHTS = {
  audiencePresence: 0.22,
  purchaseIntent: 0.2,
  cacFit: 0.18,
  budgetFit: 0.12,
  creativeEase: 0.08,
  organicPotential: 0.1,
  currentTraction: 0.1,
} as const;

/** Three months of gross margin is the affordable CAC for a self-serve SaaS. */
const PAYBACK_MONTHS = 3;

export function scoreChannel(channel: Channel, input: ChannelFitInput): ChannelFit {
  const meta = CHANNELS[channel];
  const affordableCac = Math.max(1, input.arpuMonthly * PAYBACK_MONTHS);
  const expectedCac = EXPECTED_CAC[channel][input.audience];

  const searchAdjust =
    channel === "google_search" || channel === "seo_content"
      ? { high: 5, medium: -10, low: -30 }[input.searchIntent]
      : 0;

  const factors: ChannelFactors = {
    audiencePresence: AUDIENCE_PRESENCE[channel][input.audience],
    purchaseIntent: clamp(PURCHASE_INTENT[channel] + searchAdjust),
    cacFit: clamp(Math.round((affordableCac / expectedCac) * 60)),
    budgetFit:
      meta.minMonthlyBudget === 0
        ? 90
        : clamp(Math.round((input.monthlyBudget / meta.minMonthlyBudget) * 70)),
    creativeEase: CREATIVE_EASE[channel],
    organicPotential: ORGANIC_POTENTIAL[channel],
    currentTraction: clamp(input.traction[channel] ?? 0),
    evidenceAdjustment: 0,
    expectedCac,
  };

  const relevant = input.evidence.filter((e) => e.channel === channel);
  factors.evidenceAdjustment = Math.round(
    relevant.reduce((sum, e) => sum + (e.kind === "winner" ? 12 : -25) * e.confidence, 0),
  );

  const weighted = (Object.keys(WEIGHTS) as (keyof typeof WEIGHTS)[]).reduce(
    (sum, key) => sum + factors[key] * WEIGHTS[key],
    0,
  );
  const score = clamp(Math.round(weighted + factors.evidenceAdjustment));
  const verdict: ChannelVerdict = score >= 70 ? "prioritize" : score >= 45 ? "test" : "avoid";

  const { reasonsFor, reasonsAgainst } = explain(channel, factors, input);
  for (const e of relevant) {
    (e.kind === "winner" ? reasonsFor : reasonsAgainst).unshift(
      `${e.kind === "winner" ? "Validated" : "Disproved"} by experiment: ${e.statement}`,
    );
  }

  const rationale =
    verdict === "avoid"
      ? `Don't use ${meta.label} right now. ${reasonsAgainst.slice(0, 2).join(". ")}.`
      : verdict === "prioritize"
        ? `${reasonsFor.slice(0, 2).join(". ")}.`
        : `Worth a bounded test. ${[reasonsFor[0], reasonsAgainst[0]].filter(Boolean).join(", but ")}.`;

  return {
    channel,
    score,
    verdict,
    factors,
    reasonsFor: reasonsFor.slice(0, 3),
    reasonsAgainst: reasonsAgainst.slice(0, 3),
    rationale,
    evidence: relevant.map((e) => e.statement),
  };
}

export function scoreAllChannels(input: ChannelFitInput): ChannelFit[] {
  return CHANNEL_IDS.map((c) => scoreChannel(c, input)).sort((a, b) => b.score - a.score);
}

function explain(channel: Channel, f: ChannelFactors, input: ChannelFitInput) {
  type Reason = { text: string; strength: number };
  const pros: Reason[] = [];
  const cons: Reason[] = [];
  // Strength = how far the factor sits from neutral, scaled by its weight in the score.
  const strength = (key: keyof typeof WEIGHTS) => WEIGHTS[key] * Math.abs(f[key] - 50);
  const label = CHANNELS[channel].label;
  const arpu = `$${Math.round(input.arpuMonthly)}/mo`;

  if (f.purchaseIntent >= 70) pros.push({ text: "People arrive here already looking for a solution", strength: strength("purchaseIntent") });
  else if (f.purchaseIntent <= 35)
    cons.push({ text: "Attention is passive, so intent has to be created from scratch", strength: strength("purchaseIntent") });

  if (f.audiencePresence >= 75) pros.push({ text: "Your audience is concentrated here", strength: strength("audiencePresence") });
  else if (f.audiencePresence <= 35)
    cons.push({ text: `Your audience is thinly represented on ${label}`, strength: strength("audiencePresence") });

  if (f.cacFit >= 70)
    pros.push({ text: `Expected CAC (~$${f.expectedCac}) fits a ${arpu} price point`, strength: strength("cacFit") });
  else if (f.cacFit <= 40)
    cons.push({ text: `Expected CAC (~$${f.expectedCac}) is too high for a ${arpu} price point`, strength: strength("cacFit") });

  if (f.budgetFit <= 45) {
    cons.push({
      text: `Needs ~$${CHANNELS[channel].minMonthlyBudget}/mo to learn anything; the budget is $${Math.round(input.monthlyBudget)}/mo`,
      strength: strength("budgetFit"),
    });
  }
  if (f.organicPotential >= 80) pros.push({ text: "Compounds without ongoing spend", strength: strength("organicPotential") });
  if (f.creativeEase <= 30) cons.push({ text: "Requires a steady stream of video creative", strength: strength("creativeEase") });
  if (f.currentTraction >= 40)
    pros.push({ text: "Already drives a meaningful share of signups", strength: strength("currentTraction") });

  const sorted = (rs: Reason[]) => rs.sort((a, b) => b.strength - a.strength).map((r) => r.text);
  return { reasonsFor: sorted(pros), reasonsAgainst: sorted(cons) };
}

function clamp(n: number): number {
  return Math.min(100, Math.max(0, n));
}
