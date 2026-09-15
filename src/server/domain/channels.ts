export const CHANNELS = {
  google_search: { label: "Google Search", kind: "paid", minMonthlyBudget: 300 },
  seo_content: { label: "SEO pages", kind: "organic", minMonthlyBudget: 0 },
  reddit: { label: "Reddit", kind: "community", minMonthlyBudget: 0 },
  hacker_news: { label: "Hacker News", kind: "community", minMonthlyBudget: 0 },
  x_organic: { label: "X", kind: "organic", minMonthlyBudget: 0 },
  linkedin: { label: "LinkedIn", kind: "organic", minMonthlyBudget: 0 },
  meta_ads: { label: "Meta Ads", kind: "paid", minMonthlyBudget: 500 },
  youtube_creators: { label: "YouTube creators", kind: "creator", minMonthlyBudget: 400 },
  email_lifecycle: { label: "Lifecycle email", kind: "owned", minMonthlyBudget: 0 },
  tiktok: { label: "TikTok", kind: "organic", minMonthlyBudget: 0 },
} as const satisfies Record<string, { label: string; kind: string; minMonthlyBudget: number }>;

export type Channel = keyof typeof CHANNELS;

export const CHANNEL_IDS = Object.keys(CHANNELS) as Channel[];

export function isChannel(value: string): value is Channel {
  return value in CHANNELS;
}

/** Surfaces that appear in data but are not acquisition channels scored by Channel Fit. */
const OTHER_SURFACES: Record<string, string> = {
  direct: "Direct",
  website: "Website",
};

export function channelLabel(channel: string): string {
  return isChannel(channel) ? CHANNELS[channel].label : (OTHER_SURFACES[channel] ?? channel);
}
