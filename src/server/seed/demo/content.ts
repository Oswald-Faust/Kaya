/**
 * Narrative content for the demo company. Tickwarden is fictional; competitor
 * names are real products referenced neutrally as market context.
 * Numbers that depend on metrics are injected by seed-demo.ts from the
 * generated history, never typed by hand.
 */
import type { ExtractionResult, FactKind, FactStatus, SnapshotPage, StrategyContent } from "@/server/domain/types";

export const DEMO = {
  orgName: "Tickwarden Labs",
  orgSlug: "tickwarden-labs",
  workspaceName: "Tickwarden",
  workspaceSlug: "tickwarden",
  user: { name: "Faust Oswald", email: "faust@tickwarden.dev" },
  product: {
    name: "Tickwarden",
    url: "https://tickwarden.dev",
    domain: "tickwarden.dev",
    oneLiner: "Monitoring for cron jobs and background tasks that alerts you when a job fails, runs late, or never starts.",
    category: "Developer tools · Job monitoring",
  },
  goal: { baseline: 4180, target: 10000, deadline: "2026-12-31", monthlyBudget: 1000 },
} as const;

export const SNAPSHOT_PAGES: SnapshotPage[] = [
  { url: "https://tickwarden.dev/", kind: "home", title: "Tickwarden — Know when your cron jobs stop running", status: 200, bytes: 48_210, fetchedAt: "2026-06-01T09:00:04Z" },
  { url: "https://tickwarden.dev/pricing", kind: "pricing", title: "Pricing — Tickwarden", status: 200, bytes: 21_876, fetchedAt: "2026-06-01T09:00:06Z" },
  { url: "https://tickwarden.dev/features", kind: "features", title: "Features — Tickwarden", status: 200, bytes: 30_112, fetchedAt: "2026-06-01T09:00:07Z" },
  { url: "https://tickwarden.dev/docs/quickstart", kind: "docs", title: "Quickstart — Tickwarden Docs", status: 200, bytes: 18_430, fetchedAt: "2026-06-01T09:00:09Z" },
  { url: "https://tickwarden.dev/customers", kind: "customers", title: "Customers — Tickwarden", status: 200, bytes: 14_904, fetchedAt: "2026-06-01T09:00:10Z" },
  { url: "https://tickwarden.dev/blog/cron-expression-cheatsheet", kind: "blog", title: "The cron expression cheatsheet", status: 200, bytes: 26_381, fetchedAt: "2026-06-01T09:00:12Z" },
  { url: "https://tickwarden.dev/about", kind: "about", title: "About — Tickwarden", status: 200, bytes: 9_802, fetchedAt: "2026-06-01T09:00:13Z" },
];

export const SNAPSHOT_EXTRACTION: ExtractionResult = {
  productName: { value: "Tickwarden", confidence: 0.99, evidence: "Tickwarden — Know when your cron jobs stop running", sourceUrl: "https://tickwarden.dev/" },
  oneLiner: { value: DEMO.product.oneLiner, confidence: 0.92, evidence: "Get alerted when a scheduled job fails, runs late, or never starts.", sourceUrl: "https://tickwarden.dev/" },
  category: { value: DEMO.product.category, confidence: 0.88, sourceUrl: "https://tickwarden.dev/features" },
  valueProposition: { value: "Know within a minute when a scheduled job silently stops running.", confidence: 0.81, evidence: "Silent failures are the expensive ones.", sourceUrl: "https://tickwarden.dev/" },
  features: [
    { value: "Heartbeat pings from any language with a single curl", confidence: 0.9, sourceUrl: "https://tickwarden.dev/docs/quickstart" },
    { value: "Late-run detection from cron expressions and time zones", confidence: 0.86, sourceUrl: "https://tickwarden.dev/features" },
    { value: "Alerts to Slack, PagerDuty, email and webhooks", confidence: 0.93, sourceUrl: "https://tickwarden.dev/features" },
    { value: "Run duration tracking with anomaly alerts", confidence: 0.64, sourceUrl: "https://tickwarden.dev/features" },
    { value: "Kubernetes CronJob and GitHub Actions integrations", confidence: 0.77, sourceUrl: "https://tickwarden.dev/docs/quickstart" },
  ],
  pricing: {
    model: { value: "Freemium with a 14-day Team trial", confidence: 0.95, sourceUrl: "https://tickwarden.dev/pricing" },
    plans: [
      { name: "Hobby", price: 0, period: "month", highlights: ["20 monitors", "Email alerts"] },
      { name: "Team", price: 29, period: "month", highlights: ["200 monitors", "Slack and PagerDuty", "5 seats"] },
      { name: "Business", price: 99, period: "month", highlights: ["1,000 monitors", "SSO", "Audit log"] },
    ],
    freeTrial: { value: true, confidence: 0.95, evidence: "Start a 14-day Team trial", sourceUrl: "https://tickwarden.dev/pricing" },
    sourceUrl: "https://tickwarden.dev/pricing",
  },
  audiences: [
    { name: "Backend engineers at early-stage startups", description: "Own production jobs and pay with a card", confidence: 0.84, evidence: "Built for backend teams who ship fast" },
    { name: "Indie hackers with production side projects", description: "Price-sensitive, high volume", confidence: 0.61 },
    { name: "Platform / SRE teams at 50–500 person companies", description: "Consolidating job monitoring across services", confidence: 0.52 },
  ],
  competitors: [
    { name: "Cronitor", url: "https://cronitor.io", kind: "direct", reason: "Cron and heartbeat monitoring", confidence: 0.9 },
    { name: "Healthchecks.io", url: "https://healthchecks.io", kind: "direct", reason: "Heartbeat monitoring with an open-source edition", confidence: 0.86 },
    { name: "Better Stack", url: "https://betterstack.com", kind: "indirect", reason: "Uptime and incident management that includes heartbeats", confidence: 0.72 },
    { name: "Dead Man's Snitch", url: "https://deadmanssnitch.com", kind: "direct", reason: "Cron job monitoring", confidence: 0.7 },
  ],
  brand: { traits: ["Direct", "Technical", "Dry humor"], voiceSummary: "Writes for engineers who dislike marketing speak: short sentences, code samples, no hype.", confidence: 0.78 },
  ctas: ["Start monitoring free", "Start a 14-day Team trial", "Read the quickstart"],
  channels: [
    { channel: "seo_content", signal: "Cron syntax articles on the blog", confidence: 0.85 },
    { channel: "hacker_news", signal: "Linked 'As seen on Hacker News' badge", confidence: 0.55 },
    { channel: "x_organic", signal: "Founder X profile linked in footer", confidence: 0.6 },
  ],
  proof: ["“We found a backup job that hadn't run in 9 days.” — engineering lead, fintech startup"],
  logoUrl: null,
  language: "en",
  warnings: [],
};

export interface FactSeed {
  key: string;
  category: string;
  statement: string;
  kind: FactKind;
  status: FactStatus;
  confidence: number;
  source: "home" | "pricing" | "features" | "docs" | "analytics" | "founder";
  evidence?: string;
  userConfirmed: boolean;
  agentGenerated: boolean;
}

export const FACTS: FactSeed[] = [
  { key: "product.name", category: "identity", statement: "The product is called Tickwarden.", kind: "verified", status: "confirmed", confidence: 0.99, source: "home", evidence: "Tickwarden — Know when your cron jobs stop running", userConfirmed: true, agentGenerated: true },
  { key: "product.one_liner", category: "identity", statement: DEMO.product.oneLiner, kind: "inferred", status: "confirmed", confidence: 0.92, source: "home", userConfirmed: true, agentGenerated: true },
  { key: "product.category", category: "identity", statement: "Developer tool for monitoring cron jobs and background tasks.", kind: "user_correction", status: "confirmed", confidence: 1, source: "founder", evidence: "Founder: “We don't do uptime or HTTP monitoring.”", userConfirmed: true, agentGenerated: false },
  { key: "positioning.value_prop", category: "positioning", statement: "Know within a minute when a scheduled job silently stops running.", kind: "inferred", status: "confirmed", confidence: 0.81, source: "home", evidence: "Silent failures are the expensive ones.", userConfirmed: true, agentGenerated: true },
  { key: "pricing.model", category: "pricing", statement: "Freemium: Hobby is free (20 monitors); Team is $29/mo; Business is $99/mo; 14-day Team trial.", kind: "verified", status: "confirmed", confidence: 0.95, source: "pricing", userConfirmed: true, agentGenerated: true },
  { key: "feature.heartbeat", category: "feature", statement: "Jobs report in with a heartbeat ping from any language using a single curl.", kind: "verified", status: "confirmed", confidence: 0.9, source: "docs", userConfirmed: true, agentGenerated: true },
  { key: "feature.late_runs", category: "feature", statement: "Detects late runs by parsing cron expressions and time zones.", kind: "verified", status: "confirmed", confidence: 0.86, source: "features", userConfirmed: true, agentGenerated: true },
  { key: "feature.alerts", category: "feature", statement: "Alerts route to Slack, PagerDuty, email and webhooks.", kind: "verified", status: "confirmed", confidence: 0.93, source: "features", userConfirmed: true, agentGenerated: true },
  { key: "feature.duration", category: "feature", statement: "Tracks run duration and alerts on anomalies.", kind: "inferred", status: "proposed", confidence: 0.64, source: "features", evidence: "See how long every run takes", userConfirmed: false, agentGenerated: true },
  { key: "audience.primary", category: "audience", statement: "Primary buyers are backend engineers at seed to Series A startups.", kind: "inferred", status: "confirmed", confidence: 0.84, source: "home", evidence: "Built for backend teams who ship fast", userConfirmed: true, agentGenerated: true },
  { key: "audience.secondary", category: "audience", statement: "Indie hackers running production side projects are a secondary segment.", kind: "hypothesis", status: "proposed", confidence: 0.61, source: "pricing", evidence: "Hobby plan: free forever", userConfirmed: false, agentGenerated: true },
  { key: "brand.voice", category: "brand", statement: "Voice is direct and technical with dry humor; no marketing hype.", kind: "inferred", status: "confirmed", confidence: 0.78, source: "home", userConfirmed: true, agentGenerated: true },
  { key: "traction.organic_search", category: "traction", statement: "Organic search is the largest source of signups.", kind: "verified", status: "confirmed", confidence: 0.9, source: "analytics", userConfirmed: false, agentGenerated: true },
  { key: "market.search_intent", category: "market", statement: "People search for “cron job monitoring” and “<competitor> alternative” with purchase intent.", kind: "inferred", status: "confirmed", confidence: 0.8, source: "analytics", userConfirmed: true, agentGenerated: true },
];

/** The inference the founder corrected; kept for provenance, never used as truth. */
export const SUPERSEDED_FACT = {
  key: "product.category",
  category: "identity",
  statement: "Uptime and HTTP endpoint monitoring tool.",
  confidence: 0.58,
  evidence: "Monitor anything that runs on a schedule or responds to a ping",
};

export const ICPS = [
  {
    name: "Backend engineers at early-stage startups",
    description: "Engineers at 5–50 person startups who own billing, backup and sync jobs in production and can expense a $29 tool.",
    pains: ["A nightly billing or backup job failed silently for days", "Cron output is scattered across servers and containers", "Uptime monitors don't notice a job that never started"],
    triggers: ["First incident caused by a missed job", "Moving jobs to Kubernetes CronJobs or serverless schedulers", "A customer reports stale data"],
    objections: ["“We can write a health check ourselves”", "Another alerting tool to manage"],
    whereTheyAre: ["Google searches while debugging cron", "Hacker News", "r/devops, r/node, r/golang", "GitHub READMEs and docs"],
    priority: 1,
    confidence: 0.84,
    status: "confirmed" as const,
    persona: { name: "Maya", role: "Backend lead at a 14-person startup", jobs: ["Keep scheduled jobs reliable without building internal tooling", "Hear about a failed job before customers do"] },
  },
  {
    name: "Indie hackers with production side projects",
    description: "Solo builders running a few paid products who want alerts without paying for an observability suite.",
    pains: ["Find out about broken jobs from angry emails", "Can't justify $100+/mo monitoring"],
    triggers: ["First paying customers", "A scheduled email or payout job breaks"],
    objections: ["Free tier might be enough forever"],
    whereTheyAre: ["X (build in public)", "Indie Hackers", "Hacker News"],
    priority: 2,
    confidence: 0.61,
    status: "proposed" as const,
    persona: { name: "Theo", role: "Solo founder with two SaaS products", jobs: ["Sleep without checking cron logs"] },
  },
  {
    name: "Platform / SRE teams at 50–500 person companies",
    description: "Teams standardizing how dozens of services report scheduled work.",
    pains: ["Every team monitors jobs differently", "Alert fatigue from generic tools"],
    triggers: ["Audit after a data incident", "Consolidating monitoring vendors"],
    objections: ["Needs SSO and audit logs", "Procurement process"],
    whereTheyAre: ["SRE newsletters", "Conference talks", "LinkedIn (weakly)"],
    priority: 3,
    confidence: 0.52,
    status: "proposed" as const,
    persona: { name: "Priya", role: "Staff SRE at a 300-person SaaS", jobs: ["One place to see every scheduled job's health"] },
  },
];

export const COMPETITORS = [
  { name: "Cronitor", url: "https://cronitor.io", kind: "direct", positioning: "Cron, heartbeat and uptime monitoring in one platform.", pricingSummary: "Free tier; paid plans per monitor", wedge: "Simpler setup and pricing for teams under 50 monitors", confidence: 0.9, status: "confirmed" as const },
  { name: "Healthchecks.io", url: "https://healthchecks.io", kind: "direct", positioning: "Straightforward heartbeat monitoring with an open-source edition.", pricingSummary: "Generous free tier; hosted paid plans", wedge: "Late-run detection that understands cron expressions and time zones", confidence: 0.86, status: "confirmed" as const },
  { name: "Better Stack", url: "https://betterstack.com", kind: "indirect", positioning: "Uptime monitoring and incident management suite.", pricingSummary: "Bundled observability pricing", wedge: "Built for jobs that never start, not endpoints that go down", confidence: 0.72, status: "confirmed" as const },
  { name: "Dead Man's Snitch", url: "https://deadmanssnitch.com", kind: "direct", positioning: "Simple cron job monitoring.", pricingSummary: "Tiered by number of snitches", wedge: "Modern integrations (Kubernetes, GitHub Actions) and duration alerts", confidence: 0.7, status: "proposed" as const },
  { name: "Homegrown scripts + Slack webhook", url: null, kind: "alternative", positioning: "A wrapper script that posts to Slack on failure.", pricingSummary: "Free, costs engineering time", wedge: "Alerts when the job never runs, which a wrapper script can't detect", confidence: 0.8, status: "confirmed" as const },
];

export function strategyV1(): StrategyContent {
  return {
    situation: "Tickwarden has $4,180 MRR from 104 customers, almost all from organic search and word of mouth. There is no repeatable paid channel yet, and visitors comparing tools land on a generic homepage.",
    objective: "Grow MRR from $4,180 to $10,000 by December 31, 2026 on a $1,000/month budget.",
    baseline: [
      { label: "MRR", value: "$4,180" },
      { label: "Customers", value: "104" },
      { label: "Signup rate", value: "~2.9%" },
      { label: "Paid channels", value: "None" },
    ],
    bottleneck: {
      title: "Too few high-intent visitors reach a page built to convert them",
      detail: "Most organic traffic is people debugging cron syntax, not choosing a monitoring tool. The people who are choosing land on the homepage.",
    },
    positioning: {
      statement: "Tickwarden tells you when a scheduled job silently stops running — the failure uptime tools can't see.",
      forWho: "Backend engineers who own production jobs",
      insteadOf: "Homegrown health checks or uptime monitors",
      because: "It understands cron schedules and alerts on missed and late runs, not only on errors",
    },
    messagingPillars: [
      { pillar: "Catch the job that never started", proof: "Late-run detection from cron expressions and time zones", channels: ["google_search", "seo_content"] },
      { pillar: "Set up in one curl", proof: "Heartbeat ping from any language in under two minutes", channels: ["hacker_news", "reddit"] },
      { pillar: "Priced for small teams", proof: "Free Hobby plan; Team at $29/mo", channels: ["seo_content"] },
    ],
    icpPriorities: [
      { name: "Backend engineers at early-stage startups", why: "Feel the pain first, own the jobs, and can buy with a card" },
      { name: "Indie hackers with production side projects", why: "High volume and word of mouth; low ARPU" },
    ],
    competitorWedges: [
      { competitor: "Cronitor", wedge: "Simpler setup and pricing for teams under 50 monitors" },
      { competitor: "Healthchecks.io", wedge: "Late-run detection that understands cron expressions" },
      { competitor: "Better Stack", wedge: "Built for jobs that never start, not endpoints that go down" },
    ],
    channelsToAvoid: [
      { channel: "linkedin", reason: "Backend engineers are thinly represented and expected CAC is about 5× the target." },
      { channel: "tiktok", reason: "No audience fit and a heavy video creative burden." },
    ],
    budget: {
      monthly: 1000,
      paidShare: 0.7,
      allocation: [
        { channel: "meta_ads", amount: 400, purpose: "Test whether broad developer targeting reaches buyers" },
        { channel: "google_search", amount: 300, purpose: "Validate high-intent search CAC" },
        { channel: "seo_content", amount: 300, purpose: "Produce the first comparison page" },
      ],
    },
    plan: {
      days30: ["Test broad Meta developer targeting (EXP-001)", "Ship a Cronitor comparison page and split comparison-intent traffic (EXP-002)"],
      days60: ["Launch exact-match Google Search on “cron job monitoring” (EXP-003)", "Post a Show HN launch"],
      days90: ["Scale the winning paid channel within guardrails", "Expand comparison pages to the next competitors"],
    },
    assumptions: [
      { statement: "Paid social can reach backend engineers at an acceptable CAC", confidence: 0.35, howToValidate: "EXP-001: CAC below $60 on ~$400" },
      { statement: "Comparison-intent searchers convert better on a dedicated page", confidence: 0.5, howToValidate: "EXP-002: +30% signup rate" },
      { statement: "“Cron job monitoring” searchers buy below the target CAC", confidence: 0.55, howToValidate: "EXP-003: CAC below $60 on $500" },
    ],
  };
}

export function strategyV2(n: { mrr: string; customers: number; comparisonRate: string; homepageRate: string; searchCac: string; metaCac: string; metaMultiple: string }): StrategyContent {
  const v1 = strategyV1();
  return {
    ...v1,
    situation: `MRR is ${n.mrr} from ${n.customers} customers. Comparison-intent visitors convert at ${n.comparisonRate} on a dedicated page vs ${n.homepageRate} on the homepage, and exact-match Google Search acquires customers at ${n.searchCac} CAC. Broad Meta targeting failed at ${n.metaCac}.`,
    baseline: [
      { label: "MRR", value: n.mrr },
      { label: "Customers", value: String(n.customers) },
      { label: "Search CAC", value: n.searchCac },
      { label: "Comparison page signup rate", value: n.comparisonRate },
    ],
    bottleneck: {
      title: "Activation after signup",
      detail: "About 58% of signups never send a first successful ping. Acquisition is now efficient enough that each point of activation is worth more than another channel.",
    },
    channelsToAvoid: [
      { channel: "meta_ads", reason: `Disproved by EXP-001: broad interest targeting produced CAC ${n.metaCac}, ${n.metaMultiple} the $60 target.` },
      ...v1.channelsToAvoid,
    ],
    budget: {
      monthly: 1000,
      paidShare: 0.81,
      allocation: [
        { channel: "google_search", amount: 560, purpose: "Always-on exact match plus a competitor-alternative test" },
        { channel: "youtube_creators", amount: 250, purpose: "One sponsored segment test in the 60-day plan" },
        { channel: "seo_content", amount: 190, purpose: "Two comparison pages per month" },
      ],
    },
    plan: {
      days30: ["Scale exact-match search within the $40/day cap", "Test competitor-alternative keywords (EXP-005)", "Activation nudge email for new signups (EXP-006)"],
      days60: ["Publish the Healthchecks.io comparison page (EXP-007)", "Show HN: free crontab expression debugger (EXP-008)"],
      days90: ["Sponsored segment on a DevOps YouTube channel (EXP-012)", "Revisit pricing defaults once trials exceed ~600/month"],
    },
    assumptions: [
      { statement: "Competitor-alternative searchers convert near exact-match CAC", confidence: 0.5, howToValidate: "EXP-005: CAC below $60 on $300" },
      { statement: "A missed-first-ping email lifts activation by 10% or more", confidence: 0.5, howToValidate: "EXP-006: +10% activation rate" },
      { statement: "The comparison-page effect generalizes to other competitors", confidence: 0.65, howToValidate: "EXP-007: +30% signup rate" },
    ],
  };
}

export const HEALTHCHECKS_PAGE = `# Tickwarden vs Healthchecks.io

Both tools alert you when a heartbeat doesn't arrive. The difference is what counts as "late".

## What's the same
- A ping URL per job, from any language
- Email, Slack and webhook alerts

## Where Tickwarden is different
- **Understands your cron expression.** A job scheduled for 02:00 Europe/Paris is late at 02:05 Paris time, across DST changes.
- **Duration alerts.** Get told when a 4-minute job starts taking 40.
- **Kubernetes CronJob and GitHub Actions integrations** without wrapper scripts.

## Pricing
Hobby is free for 20 monitors. Team is $29/month.

[Start monitoring free]`;
