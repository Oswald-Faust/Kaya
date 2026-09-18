/**
 * Canonical Kaya data model.
 *
 * Ownership: Organization → Workspace → Product. Every downstream business
 * object carries `workspaceId` (and `productId` where it is product-specific)
 * so repositories can enforce tenant isolation on every query.
 *
 * See docs/data-model.md for rationale and the mapping to the Notion spec.
 */
import { boolean, date, doublePrecision, index, integer, jsonb, pgEnum, pgTable, primaryKey, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import type {
  AgentPlan,
  ChannelFactors,
  ExtractionResult,
  PolicyDecision,
  SnapshotPage,
  StrategyContent,
} from "@/server/domain/types";

const id = (name = "id") => text(name).primaryKey();
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () => timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();
const workspaceRef = () =>
  text("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" });
const productRef = () =>
  text("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" });

/* ───────────────────────────── Enums ───────────────────────────── */

export const memberRole = pgEnum("member_role", ["owner", "admin", "member", "viewer"]);
export const autonomyMode = pgEnum("autonomy_mode", ["observe", "suggest", "copilot", "autopilot"]);
export const productStatus = pgEnum("product_status", ["analyzing", "needs_review", "active", "failed"]);
export const factKind = pgEnum("fact_kind", [
  "verified",
  "inferred",
  "hypothesis",
  "user_correction",
  "learning",
]);
export const factStatus = pgEnum("fact_status", ["proposed", "confirmed", "rejected", "superseded"]);
export const experimentStatus = pgEnum("experiment_status", [
  "idea",
  "proposed",
  "awaiting_approval",
  "scheduled",
  "running",
  "evaluating",
  "completed",
  "archived",
  "suppressed",
]);
export const experimentOutcome = pgEnum("experiment_outcome", ["winner", "loser", "inconclusive"]);
export const riskClass = pgEnum("risk_class", ["R0", "R1", "R2", "R3", "R4"]);
export const runStatus = pgEnum("run_status", [
  "queued",
  "planning",
  "running",
  "awaiting_approval",
  "completed",
  "failed",
  "cancelled",
]);
export const stepStatus = pgEnum("step_status", ["pending", "running", "done", "failed", "skipped", "waiting"]);
export const approvalStatus = pgEnum("approval_status", ["pending", "approved", "rejected", "expired"]);
export const integrationStatus = pgEnum("integration_status", ["connected", "disconnected", "error"]);
export const connectionMode = pgEnum("connection_mode", ["live", "demo"]);

/* ─────────────────────────── Tenancy ─────────────────────────── */

export const organizations = pgTable("organizations", {
  id: id(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  /** none | free | launch | growth | scale. "none" until the founder picks a plan at the end of onboarding. */
  plan: text("plan").notNull().default("none"),
  /** none | trialing | active | past_due | canceled */
  planStatus: text("plan_status").notNull().default("none"),
  planInterval: text("plan_interval"),
  planActions: integer("plan_actions"),
  trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }),
  stripeCustomerId: text("stripe_customer_id").unique(),
  stripeSubscriptionId: text("stripe_subscription_id").unique(),
  createdAt: createdAt(),
});

export const users = pgTable("users", {
  id: id(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  /** scrypt hash; null for Google-only and guest accounts. */
  passwordHash: text("password_hash"),
  googleSub: text("google_sub").unique(),
  avatarUrl: text("avatar_url"),
  /** Anonymous visitor who started an analysis before creating an account. */
  isGuest: boolean("is_guest").notNull().default(false),
  /** Kaya staff with access to /admin. Granted only by the admin:grant script or another admin. */
  isPlatformAdmin: boolean("is_platform_admin").notNull().default(false),
  /** Suspended accounts can't sign in and their sessions stop resolving. */
  suspendedAt: timestamp("suspended_at", { withTimezone: true }),
  /** Set when the user finishes or skips the first-login product tour. */
  tourCompletedAt: timestamp("tour_completed_at", { withTimezone: true }),
  /** "en" | "fr". Null follows the browser until the user picks a language. */
  locale: text("locale"),
  createdAt: createdAt(),
});

/** Small uploaded images (avatars, workspace icons), resized client-side to 256px. Ids are unguessable. */
export const images = pgTable("images", {
  id: id(),
  contentType: text("content_type").notNull(),
  /** base64 of the bytes; images are capped at 512 KB. */
  data: text("data").notNull(),
  uploadedBy: text("uploaded_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: createdAt(),
});

export const sessions = pgTable(
  "sessions",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** SHA-256 of the cookie token; the token itself is never stored. */
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export const members = pgTable(
  "members",
  {
    id: id(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: memberRole("role").notNull().default("member"),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("members_org_user_idx").on(t.organizationId, t.userId)],
);

/** Pending seat in an organization. Only the token's SHA-256 is stored; the link is shown once. */
export const invitations = pgTable(
  "invitations",
  {
    id: id(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    /** Where the invitee lands after accepting. */
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: memberRole("role").notNull().default("member"),
    tokenHash: text("token_hash").notNull().unique(),
    invitedBy: text("invited_by").references(() => users.id, { onDelete: "set null" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [index("invitations_org_email_idx").on(t.organizationId, t.email)],
);

export const workspaces = pgTable(
  "workspaces",
  {
    id: id(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    autonomyMode: autonomyMode("autonomy_mode").notNull().default("copilot"),
    isDemo: boolean("is_demo").notNull().default(false),
    /** Uploaded icon, served from /api/images/:id. Null shows the name's initials. */
    iconUrl: text("icon_url"),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("workspaces_org_slug_idx").on(t.organizationId, t.slug)],
);

export const products = pgTable(
  "products",
  {
    id: id(),
    workspaceId: workspaceRef(),
    name: text("name").notNull(),
    url: text("url").notNull(),
    domain: text("domain").notNull(),
    logoUrl: text("logo_url"),
    oneLiner: text("one_liner"),
    category: text("category"),
    status: productStatus("status").notNull().default("analyzing"),
    onboardingStep: text("onboarding_step").notNull().default("analyze"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("products_workspace_idx").on(t.workspaceId)],
);

/* ─────────────────────── Product Intelligence ─────────────────────── */

export const productSnapshots = pgTable(
  "product_snapshots",
  {
    id: id(),
    workspaceId: workspaceRef(),
    productId: productRef(),
    sourceUrl: text("source_url").notNull(),
    pages: jsonb("pages").$type<SnapshotPage[]>().notNull().default([]),
    extraction: jsonb("extraction").$type<ExtractionResult>(),
    extractor: text("extractor").notNull(), // llm | heuristic | demo
    model: text("model"),
    promptVersion: text("prompt_version"),
    createdAt: createdAt(),
  },
  (t) => [index("snapshots_product_idx").on(t.productId, t.createdAt)],
);

export const knowledgeSources = pgTable(
  "knowledge_sources",
  {
    id: id(),
    workspaceId: workspaceRef(),
    productId: productRef(),
    kind: text("kind").notNull(), // crawl_page | integration | user_input | experiment | research
    uri: text("uri"),
    title: text("title").notNull(),
    contentHash: text("content_hash"),
    fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("sources_product_idx").on(t.productId)],
);

export const brandProfiles = pgTable("brand_profiles", {
  productId: text("product_id")
    .primaryKey()
    .references(() => products.id, { onDelete: "cascade" }),
  workspaceId: workspaceRef(),
  voiceSummary: text("voice_summary").notNull(),
  traits: jsonb("traits").$type<string[]>().notNull().default([]),
  wordsToUse: jsonb("words_to_use").$type<string[]>().notNull().default([]),
  wordsToAvoid: jsonb("words_to_avoid").$type<string[]>().notNull().default([]),
  updatedAt: updatedAt(),
});

/**
 * Business Memory. Every fact carries provenance and a lifecycle so an
 * inference can never silently become truth: `kind` separates verified facts,
 * inferences, hypotheses, user corrections and experiment learnings.
 */
export const businessFacts = pgTable(
  "business_facts",
  {
    id: id(),
    workspaceId: workspaceRef(),
    productId: productRef(),
    key: text("key").notNull(), // e.g. product.one_liner, audience.primary, pricing.plan.pro
    category: text("category").notNull(), // identity | pricing | feature | audience | positioning | competitor | channel | brand | traction | market
    statement: text("statement").notNull(),
    value: jsonb("value").$type<unknown>(),
    kind: factKind("kind").notNull(),
    status: factStatus("status").notNull().default("proposed"),
    confidence: doublePrecision("confidence").notNull(),
    sourceId: text("source_id").references(() => knowledgeSources.id, { onDelete: "set null" }),
    sourceLabel: text("source_label").notNull(),
    evidence: text("evidence"),
    agentGenerated: boolean("agent_generated").notNull().default(true),
    userConfirmed: boolean("user_confirmed").notNull().default(false),
    supersedesId: text("supersedes_id"),
    lastVerifiedAt: timestamp("last_verified_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("facts_product_key_idx").on(t.productId, t.key),
    index("facts_product_category_idx").on(t.productId, t.category, t.status),
  ],
);

export const icps = pgTable(
  "icps",
  {
    id: id(),
    workspaceId: workspaceRef(),
    productId: productRef(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    pains: jsonb("pains").$type<string[]>().notNull().default([]),
    triggers: jsonb("triggers").$type<string[]>().notNull().default([]),
    objections: jsonb("objections").$type<string[]>().notNull().default([]),
    whereTheyAre: jsonb("where_they_are").$type<string[]>().notNull().default([]),
    priority: integer("priority").notNull(),
    confidence: doublePrecision("confidence").notNull(),
    status: factStatus("status").notNull().default("proposed"),
    createdAt: createdAt(),
  },
  (t) => [index("icps_product_idx").on(t.productId, t.priority)],
);

export const personas = pgTable("personas", {
  id: id(),
  workspaceId: workspaceRef(),
  icpId: text("icp_id")
    .notNull()
    .references(() => icps.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  role: text("role").notNull(),
  jobs: jsonb("jobs").$type<string[]>().notNull().default([]),
});

export const competitors = pgTable(
  "competitors",
  {
    id: id(),
    workspaceId: workspaceRef(),
    productId: productRef(),
    name: text("name").notNull(),
    url: text("url"),
    kind: text("kind").notNull(), // direct | indirect | alternative
    positioning: text("positioning"),
    pricingSummary: text("pricing_summary"),
    wedge: text("wedge"),
    confidence: doublePrecision("confidence").notNull(),
    status: factStatus("status").notNull().default("proposed"),
    createdAt: createdAt(),
  },
  (t) => [index("competitors_product_idx").on(t.productId)],
);

/* ──────────────────────────── Strategy ──────────────────────────── */

export const goals = pgTable(
  "goals",
  {
    id: id(),
    workspaceId: workspaceRef(),
    productId: productRef(),
    template: text("template").notNull(),
    title: text("title").notNull(),
    metric: text("metric").notNull(), // mrr | customers | signups | cac | trial_conversion | custom
    baselineValue: doublePrecision("baseline_value"),
    targetValue: doublePrecision("target_value"),
    unit: text("unit").notNull(), // usd | count | pct
    deadline: date("deadline"),
    monthlyBudget: doublePrecision("monthly_budget").notNull(),
    budgetBand: text("budget_band").notNull(),
    status: text("status").notNull().default("active"),
    createdAt: createdAt(),
  },
  (t) => [index("goals_product_idx").on(t.productId, t.status)],
);

export const strategies = pgTable(
  "strategies",
  {
    id: id(),
    workspaceId: workspaceRef(),
    productId: productRef(),
    goalId: text("goal_id").references(() => goals.id, { onDelete: "set null" }),
    currentVersion: integer("current_version").notNull().default(1),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("strategies_product_idx").on(t.productId)],
);

export const strategyVersions = pgTable(
  "strategy_versions",
  {
    id: id(),
    workspaceId: workspaceRef(),
    strategyId: text("strategy_id")
      .notNull()
      .references(() => strategies.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    summary: text("summary").notNull(),
    revisionReason: text("revision_reason").notNull(),
    evidenceLearningIds: jsonb("evidence_learning_ids").$type<string[]>().notNull().default([]),
    content: jsonb("content").$type<StrategyContent>().notNull(),
    createdBy: text("created_by").notNull(), // agent | user
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("strategy_versions_idx").on(t.strategyId, t.version)],
);

export const channelAssessments = pgTable(
  "channel_assessments",
  {
    id: id(),
    workspaceId: workspaceRef(),
    strategyVersionId: text("strategy_version_id")
      .notNull()
      .references(() => strategyVersions.id, { onDelete: "cascade" }),
    channel: text("channel").notNull(),
    score: integer("score").notNull(),
    verdict: text("verdict").notNull(), // prioritize | test | avoid
    factors: jsonb("factors").$type<ChannelFactors>().notNull(),
    rationale: text("rationale").notNull(),
    evidence: jsonb("evidence").$type<string[]>().notNull().default([]),
  },
  (t) => [index("channel_assessments_version_idx").on(t.strategyVersionId, t.score)],
);

/* ─────────────────────────── Experiments ─────────────────────────── */

export const experiments = pgTable(
  "experiments",
  {
    id: id(),
    workspaceId: workspaceRef(),
    productId: productRef(),
    strategyVersionId: text("strategy_version_id").references(() => strategyVersions.id, {
      onDelete: "set null",
    }),
    number: integer("number").notNull(),
    name: text("name").notNull(),
    hypothesis: text("hypothesis").notNull(),
    type: text("type").notNull(), // paid_ad | landing_page | pricing | messaging | seo_page | email | creator | community | activation
    channel: text("channel").notNull(),
    audience: text("audience").notNull(),
    icpId: text("icp_id").references(() => icps.id, { onDelete: "set null" }),
    primaryMetric: text("primary_metric").notNull(), // signup_rate | cac | activation_rate | trial_to_paid | ctr
    metricDirection: text("metric_direction").notNull(), // increase | decrease
    baselineValue: doublePrecision("baseline_value"),
    successThreshold: doublePrecision("success_threshold").notNull(),
    budget: doublePrecision("budget").notNull().default(0),
    spend: doublePrecision("spend").notNull().default(0),
    dailySpendCap: doublePrecision("daily_spend_cap"),
    status: experimentStatus("status").notNull().default("proposed"),
    outcome: experimentOutcome("outcome"),
    observedValue: doublePrecision("observed_value"),
    lift: doublePrecision("lift"),
    confidence: doublePrecision("confidence"),
    resultSummary: text("result_summary"),
    impact: integer("impact").notNull(), // 1–5
    priorConfidence: doublePrecision("prior_confidence").notNull(), // 0–1
    effort: integer("effort").notNull(), // 1–5
    informationGain: integer("information_gain").notNull(), // 1–5
    timeToSignalDays: integer("time_to_signal_days").notNull(),
    durationDays: integer("duration_days").notNull(),
    similarityKey: text("similarity_key").notNull(),
    suppressedReason: text("suppressed_reason"),
    rationale: text("rationale").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("experiments_number_idx").on(t.workspaceId, t.number),
    index("experiments_status_idx").on(t.workspaceId, t.status),
    index("experiments_similarity_idx").on(t.workspaceId, t.similarityKey),
  ],
);

export const experimentVariants = pgTable(
  "experiment_variants",
  {
    id: id(),
    workspaceId: workspaceRef(),
    experimentId: text("experiment_id")
      .notNull()
      .references(() => experiments.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    isControl: boolean("is_control").notNull().default(false),
    description: text("description").notNull(),
    exposures: integer("exposures").notNull().default(0),
    conversions: integer("conversions").notNull().default(0),
    spend: doublePrecision("spend").notNull().default(0),
  },
  (t) => [index("variants_experiment_idx").on(t.experimentId)],
);

export const campaigns = pgTable(
  "campaigns",
  {
    id: id(),
    workspaceId: workspaceRef(),
    experimentId: text("experiment_id").references(() => experiments.id, { onDelete: "set null" }),
    integrationId: text("integration_id").references(() => integrations.id, { onDelete: "set null" }),
    channel: text("channel").notNull(),
    name: text("name").notNull(),
    externalId: text("external_id"),
    status: text("status").notNull(), // draft | active | paused | ended
    dailyBudget: doublePrecision("daily_budget"),
    spend: doublePrecision("spend").notNull().default(0),
    isDemo: boolean("is_demo").notNull().default(false),
    createdAt: createdAt(),
  },
  (t) => [index("campaigns_workspace_idx").on(t.workspaceId, t.status)],
);

/** CreativeAsset also covers ContentItem (kind distinguishes post/email/page/ad). */
export const creativeAssets = pgTable(
  "creative_assets",
  {
    id: id(),
    workspaceId: workspaceRef(),
    experimentId: text("experiment_id").references(() => experiments.id, { onDelete: "set null" }),
    kind: text("kind").notNull(), // ad_copy | landing_page | email | social_post | seo_brief
    channel: text("channel").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    status: text("status").notNull().default("draft"), // draft | approved | published
    createdAt: createdAt(),
  },
  (t) => [index("assets_experiment_idx").on(t.experimentId)],
);

/* ──────────────────────────── Analytics ──────────────────────────── */

/**
 * Daily business metrics per channel ('all' = blended row). Raw counts only;
 * rates, CAC, ROAS etc. are always derived by the metric engine in code.
 */
export const metricSnapshots = pgTable(
  "metric_snapshots",
  {
    workspaceId: workspaceRef(),
    productId: productRef(),
    day: date("day").notNull(),
    channel: text("channel").notNull(),
    impressions: integer("impressions").notNull().default(0),
    clicks: integer("clicks").notNull().default(0),
    visits: integer("visits").notNull().default(0),
    signups: integer("signups").notNull().default(0),
    activations: integer("activations").notNull().default(0),
    trials: integer("trials").notNull().default(0),
    paidConversions: integer("paid_conversions").notNull().default(0),
    newMrr: doublePrecision("new_mrr").notNull().default(0),
    churnedMrr: doublePrecision("churned_mrr").notNull().default(0),
    mrr: doublePrecision("mrr").notNull().default(0),
    customers: integer("customers").notNull().default(0),
    spend: doublePrecision("spend").notNull().default(0),
    source: text("source").notNull(), // demo | stripe | ga4 | posthog | google_ads | ...
  },
  (t) => [primaryKey({ columns: [t.productId, t.day, t.channel] }), index("metrics_ws_day_idx").on(t.workspaceId, t.day)],
);

/** Normalized marketing + revenue events (spec §18). */
export const analyticsEvents = pgTable(
  "analytics_events",
  {
    id: id(),
    workspaceId: workspaceRef(),
    productId: productRef(),
    name: text("name").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    anonymousId: text("anonymous_id"),
    customerId: text("customer_id"),
    source: text("source").notNull(),
    channel: text("channel"),
    campaignId: text("campaign_id"),
    experimentId: text("experiment_id"),
    variantId: text("variant_id"),
    value: doublePrecision("value"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  },
  (t) => [index("events_ws_name_time_idx").on(t.workspaceId, t.name, t.occurredAt)],
);

/* ──────────────────────────── Learning ──────────────────────────── */

export const learnings = pgTable(
  "learnings",
  {
    id: id(),
    workspaceId: workspaceRef(),
    productId: productRef(),
    statement: text("statement").notNull(),
    kind: text("kind").notNull(), // winner | loser | insight
    channel: text("channel"),
    similarityKey: text("similarity_key"),
    confidence: doublePrecision("confidence").notNull(),
    impact: text("impact").notNull(), // high | medium | low
    evidenceExperimentIds: jsonb("evidence_experiment_ids").$type<string[]>().notNull().default([]),
    metricLabel: text("metric_label"),
    status: text("status").notNull().default("active"), // active | superseded | expired
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [index("learnings_ws_idx").on(t.workspaceId, t.status, t.createdAt)],
);

/* ───────────────────────────── Agent ───────────────────────────── */

export const agentRuns = pgTable(
  "agent_runs",
  {
    id: id(),
    workspaceId: workspaceRef(),
    productId: text("product_id").references(() => products.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(), // product_analysis | strategy | goal | daily_brief
    goal: text("goal").notNull(),
    status: runStatus("status").notNull().default("queued"),
    plan: jsonb("plan").$type<AgentPlan>(),
    result: jsonb("result").$type<Record<string, unknown>>(),
    error: text("error"),
    planner: text("planner").notNull(), // llm | deterministic
    model: text("model"),
    promptVersion: text("prompt_version"),
    createdBy: text("created_by").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("runs_ws_idx").on(t.workspaceId, t.createdAt)],
);

export const agentMessages = pgTable(
  "agent_messages",
  {
    id: id(),
    workspaceId: workspaceRef(),
    runId: text("run_id")
      .notNull()
      .references(() => agentRuns.id, { onDelete: "cascade" }),
    role: text("role").notNull(), // user | agent
    content: text("content").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("messages_run_idx").on(t.runId, t.createdAt)],
);

export const agentSteps = pgTable(
  "agent_steps",
  {
    id: id(),
    workspaceId: workspaceRef(),
    runId: text("run_id")
      .notNull()
      .references(() => agentRuns.id, { onDelete: "cascade" }),
    seq: integer("seq").notNull(),
    kind: text("kind").notNull(), // context | plan | tool | approval | observation | learning | message
    title: text("title").notNull(),
    detail: text("detail"),
    status: stepStatus("status").notNull().default("pending"),
    output: jsonb("output").$type<Record<string, unknown>>(),
    startedAt: timestamp("started_at", { withTimezone: true }),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
  },
  (t) => [uniqueIndex("steps_run_seq_idx").on(t.runId, t.seq)],
);

export const toolCalls = pgTable(
  "tool_calls",
  {
    id: id(),
    workspaceId: workspaceRef(),
    runId: text("run_id")
      .notNull()
      .references(() => agentRuns.id, { onDelete: "cascade" }),
    stepId: text("step_id").references(() => agentSteps.id, { onDelete: "set null" }),
    tool: text("tool").notNull(),
    capability: text("capability").notNull(),
    risk: riskClass("risk").notNull(),
    input: jsonb("input").$type<Record<string, unknown>>().notNull(),
    output: jsonb("output").$type<unknown>(),
    status: text("status").notNull(), // planned | awaiting_approval | succeeded | failed | blocked | dry_run
    dryRun: boolean("dry_run").notNull().default(false),
    idempotencyKey: text("idempotency_key").notNull(),
    adapter: text("adapter"),
    isDemo: boolean("is_demo").notNull().default(false),
    error: text("error"),
    durationMs: integer("duration_ms"),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("tool_calls_idem_idx").on(t.workspaceId, t.idempotencyKey),
    index("tool_calls_run_idx").on(t.runId),
  ],
);

/* ─────────────────────────── Governance ─────────────────────────── */

export const approvals = pgTable(
  "approvals",
  {
    id: id(),
    workspaceId: workspaceRef(),
    runId: text("run_id").references(() => agentRuns.id, { onDelete: "set null" }),
    toolCallId: text("tool_call_id").references(() => toolCalls.id, { onDelete: "set null" }),
    experimentId: text("experiment_id").references(() => experiments.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    change: text("change"), // e.g. "$20/day → $28/day"
    reason: text("reason").notNull(),
    risk: riskClass("risk").notNull(),
    tool: text("tool").notNull(),
    toolInput: jsonb("tool_input").$type<Record<string, unknown>>().notNull(),
    policyDecision: jsonb("policy_decision").$type<PolicyDecision>().notNull(),
    status: approvalStatus("status").notNull().default("pending"),
    decidedBy: text("decided_by"),
    decisionNote: text("decision_note"),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [index("approvals_ws_status_idx").on(t.workspaceId, t.status)],
);

export const budgetPolicies = pgTable("budget_policies", {
  workspaceId: text("workspace_id")
    .primaryKey()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  monthlyBudget: doublePrecision("monthly_budget").notNull(),
  maxDailySpend: doublePrecision("max_daily_spend").notNull(),
  maxExperimentBudget: doublePrecision("max_experiment_budget").notNull(),
  maxAutoIncreasePct: doublePrecision("max_auto_increase_pct").notNull(),
  autoPauseLosers: boolean("auto_pause_losers").notNull().default(true),
  autoLaunchCampaigns: boolean("auto_launch_campaigns").notNull().default(false),
  allowedChannels: jsonb("allowed_channels").$type<string[]>().notNull().default([]),
  neverWithoutApproval: jsonb("never_without_approval").$type<string[]>().notNull().default([]),
  updatedAt: updatedAt(),
});

/** Append-only. A database trigger (see migrations) rejects UPDATE and DELETE. */
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: id(),
    workspaceId: text("workspace_id").notNull(),
    actorType: text("actor_type").notNull(), // user | agent | system
    actorId: text("actor_id").notNull(),
    action: text("action").notNull(),
    targetType: text("target_type").notNull(),
    targetId: text("target_id"),
    toolCallId: text("tool_call_id"),
    approvalId: text("approval_id"),
    isExternalMutation: boolean("is_external_mutation").notNull().default(false),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: createdAt(),
  },
  (t) => [index("audit_ws_time_idx").on(t.workspaceId, t.createdAt)],
);

/* ────────────────────────── Integrations ────────────────────────── */

/** Never stores secrets; points to a vault entry by reference only. */
export const credentialReferences = pgTable("credential_references", {
  id: id(),
  workspaceId: workspaceRef(),
  provider: text("provider").notNull(),
  vaultKey: text("vault_key").notNull(),
  authType: text("auth_type").notNull(), // oauth | api_key
  scopes: jsonb("scopes").$type<string[]>().notNull().default([]),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  createdAt: createdAt(),
});

export const integrations = pgTable(
  "integrations",
  {
    id: id(),
    workspaceId: workspaceRef(),
    provider: text("provider").notNull(),
    status: integrationStatus("status").notNull().default("disconnected"),
    mode: connectionMode("mode").notNull().default("demo"),
    grantedCapabilities: jsonb("granted_capabilities").$type<string[]>().notNull().default([]),
    health: text("health").notNull().default("unknown"), // ok | degraded | failing | unknown
    lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
    syncError: text("sync_error"),
    credentialRefId: text("credential_ref_id").references(() => credentialReferences.id, {
      onDelete: "set null",
    }),
    connectedAt: timestamp("connected_at", { withTimezone: true }),
    /** External account the connection acts on (GA4 property, ad account, Stripe account…). */
    accountId: text("account_id"),
    accountLabel: text("account_label"),
    /** Non-secret connection details: selectable accounts, scopes granted, last sync summary. */
    metadata: jsonb("metadata").$type<IntegrationMetadata>().notNull().default({}),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("integrations_ws_provider_idx").on(t.workspaceId, t.provider)],
);

export interface IntegrationMetadata {
  accounts?: { id: string; label: string; detail?: string }[];
  scopes?: string[];
  connectedBy?: string;
  lastSync?: { at: string; summary: string; data?: Record<string, unknown> };
  [key: string]: unknown;
}

/**
 * Encrypted secrets (API keys, OAuth tokens). AES-256-GCM with a key that
 * lives only in the environment; the database alone can't decrypt them.
 * Referenced from credential_references.vault_key.
 */
export const vaultEntries = pgTable("vault_entries", {
  id: id(),
  workspaceId: workspaceRef(),
  ciphertext: text("ciphertext").notNull(),
  iv: text("iv").notNull(),
  tag: text("tag").notNull(),
  keyVersion: integer("key_version").notNull().default(1),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});
