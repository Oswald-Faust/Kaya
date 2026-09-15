# Product requirements matrix

Source of truth: Notion — *Kaya — The AI Agent That Does Your Marketing* (main spec, §0–§40), **🧱 Product Build Backlog**, **🔌 Integration Matrix**, **🧭 Competitive Map**. Read on 2026-09-13.

Status legend: **Done** (implemented and tested) · **Partial** (works end to end, known gaps listed) · **Foundation** (architecture and data model in place, feature not built) · **Not started** · **Blocked** (needs credentials or an external decision).

## P0 · YC Demo Critical (Backlog)

| Requirement (Backlog task) | Notion source | Area / Stage | Depends on | Screens | Backend | Entities | Status |
|---|---|---|---|---|---|---|---|
| Define canonical product + workspace data model | Backlog; spec §17 | Foundation · S1 | — | all | `server/db/schema.ts`, `server/context.ts` | Organization, Workspace, Member, Product + all scoped entities | **Done** |
| Build URL crawler + sitemap ingestion | Backlog; spec §6, §28 | Product Intelligence · S1 | data model | `/start`, `/start/[ws]/analyze` | `intelligence/crawler.ts`, `url-safety.ts` | ProductSnapshot, KnowledgeSource | **Done** — SSRF guard per hop, robots.txt, sitemap index, size/time/page caps |
| Create product extraction schema | Backlog; spec §6 | Product Intelligence · S1 | crawler | analyze, confirm | `intelligence/heuristic-extractor.ts`, `llm-extractor.ts`, `grounding.ts` | ProductSnapshot.extraction, BusinessFact | **Done** — heuristic pass always; Claude refinement when `ANTHROPIC_API_KEY` is set, quotes verified against the crawl |
| Implement Business Knowledge Graph | Backlog; spec §6 Business Memory | Product Intelligence · S1 | extraction | confirm, `/memory` | `intelligence/to-memory.ts`, `services/onboarding.ts` | BusinessFact (kind, status, confidence, source, evidence, supersedes), ICP, Persona, Competitor, BrandProfile | **Done** — verified/inferred/hypothesis/correction/learning separated; corrections supersede, never overwrite |
| Implement ICP + persona generator | Backlog; spec §7 | Strategy · S1 | knowledge graph | confirm, `/memory`, strategy | extraction + seed | ICP (pains, triggers, objections, where), Persona | **Partial** — ICPs with confidence from site signals; pains/triggers/objections only in demo data until the LLM pass fills them |
| Implement positioning + messaging matrix | Backlog; spec §7 | Strategy · S1 | ICP, competitors | strategy | `domain/strategy/generate.ts` | StrategyVersion.content | **Partial** — deterministic positioning, pillars and competitor wedges from confirmed facts; no LLM copywriting yet |
| Build Channel Fit Score engine | Backlog; spec §7 | Strategy · S1 | goal, pricing | strategy, onboarding | `domain/strategy/channel-fit.ts` | ChannelAssessment | **Done** — 0–100, factors, reasons for/against, evidence adjustment from experiments; says "Don't use X right now" |
| Build goal + budget planning engine | Backlog; spec §21 step 4 | Strategy · S1 | — | `/start/[ws]/goal`, Settings | `domain/strategy/goals.ts`, `allocation.ts`, `services/onboarding.ts` | Goal, BudgetPolicy | **Done** — budget becomes hard policy caps |
| Implement Strategy document as living object | Backlog; spec §7 | Strategy · S1 | channel fit, goal | `/strategy`, onboarding reveal | `services/strategy.ts` | Strategy, StrategyVersion (revisionReason, evidenceLearningIds) | **Done** — versions tied to learnings; demo shows v1 → v2 caused by EXP-001/002/003 |
| Implement Experiment entity + lifecycle | Backlog; spec §8 | Experiments · S1 | strategy | `/experiments`, `/experiments/[n]` | `domain/experiments/lifecycle.ts`, `services/experiments.ts` | Experiment, ExperimentVariant | **Done** |
| Build experiment recommendation queue | Backlog; spec §8 | Experiments · S1 | learnings | Command Center, `/experiments` | `domain/experiments/ranking.ts` | Experiment, Learning | **Done** — impact × confidence × info gain × fit × speed ÷ effort × cost; disproved tactics suppressed |
| Design + build Command Center | Backlog; spec §22A | UX/UI · S1 | metrics, queue, approvals | `/w/[ws]` | `services/command-center.ts`, `domain/brief/growth-brief.ts` | MetricSnapshot, Experiment, Approval, Learning | **Done** |
| Build agent runtime + orchestration skeleton | Backlog; spec §15 | Foundation · S1 | tool registry | `/agent` | `agent/runtime.ts`, `recorder.ts` | AgentRun, AgentStep, AgentMessage | **Partial** — explicit orchestrator with 4 intents, persisted steps; planner is deterministic (LLM planner not wired) |
| Implement typed Tool Registry | Backlog; spec §10 | Execution · S1 | policy | Settings › Tool registry | `agent/tools.ts`, `tool-types.ts`, `executor.ts` | ToolCall | **Done** — schema, capability, risk, permissions, idempotency, dry-run, audit |
| Build Agent workspace + execution timeline | Backlog; spec §22B | UX/UI · S1 | runtime | `/agent`, `/agent/[run]` | `services/agent-runs.ts` | AgentRun, AgentStep, ToolCall, Approval | **Done** |
| Design URL-first onboarding | Backlog; spec §21 | UX/UI · S1 | crawler, strategy | `/start/*` | `app/(onboarding)` | all onboarding entities | **Done** |
| Implement immutable external-action audit log | Backlog; spec §28 | Security · S2 | — | Settings › Audit log | `services/audit.ts`, migration `0001_audit_immutable.sql` | AuditLog | **Done** — DB trigger rejects UPDATE/DELETE/TRUNCATE |
| Build metric engine for CAC / ROAS / MRR / LTV | Backlog; spec §12, §16 | Analytics · S2 | events | Command Center, `/analytics` | `domain/analytics/metrics.ts`, `stats.ts` | MetricSnapshot | **Done** — every metric carries formula + inputs (LTV not shown yet) |
| Define normalized marketing + revenue events | Backlog; spec §18 | Analytics · S2 | — | — | schema `analytics_events` | AnalyticsEvent | **Foundation** — table and fields defined; ingestion not built |
| Build attribution layer | Backlog; spec §12 | Analytics · S2 | events | `/analytics` | — | AttributionEvent (planned) | **Foundation** — last-touch per channel with stated limits; multi-model attribution not built |
| Build Learning Engine V1 | Backlog; spec §13 | Learning · S2 | evaluation | `/learnings`, Command Center | `services/learnings.ts`, `domain/experiments/evaluation.ts` | Learning | **Done** — deterministic statistical evaluation → learning → ranking/suppression/channel-fit evidence |
| Integrate Stripe revenue data | Backlog; Integration Matrix | Integrations · S2 | vault | Integrations | adapter contract + demo adapter | Integration, CredentialReference | **Blocked** — needs Stripe OAuth credentials; demo adapter behind the real interface |
| Integrate GA4 / product analytics | Backlog; Integration Matrix | Integrations · S2 | vault, events | Integrations | demo adapter | Integration | **Blocked** — needs Google OAuth client |
| Implement encrypted OAuth/token vault | Backlog; spec §28 | Security · S2 | — | — | schema `credential_references` | CredentialReference | **Foundation** — secrets are referenced, never stored; vault not implemented |
| Build AI evaluation suite | Backlog; spec §30 | Foundation · S2 | — | — | unit tests for analytics math, extraction, grounding, policy | — | **Partial** — deterministic evals (87 unit + 9 integration tests); no LLM extraction/strategy eval dataset yet |
| Dogfood end-to-end on first real SaaS | Backlog | GTM · S2 | Stripe, Google Ads | — | — | — | **Blocked** — needs real credentials |
| Build Creative Engine | Backlog; spec §9 | Creative · S3 | strategy | Content | — | CreativeAsset | **Foundation** — assets are first-class and tied to experiments; generation not built |
| Recruit first 10 design-partner founders | Backlog | GTM · S3 | — | — | — | — | Not an engineering task |
| Integrate Google Ads execution + insights | Backlog; Integration Matrix | Integrations · S4 | vault, governance | Campaigns | `integrations/demo-adapters.ts` (UPDATE_AD_BUDGET, PAUSE_CAMPAIGN, CREATE_PAID_CAMPAIGN) | Campaign | **Blocked** — needs OAuth + developer token; full flow runs on demo adapter |
| Integrate Meta Ads execution + insights | Backlog; Integration Matrix | Integrations · S4 | vault, governance | Campaigns | demo adapter | Campaign | **Blocked** — needs app review + OAuth |
| Implement Governance + approval engine | Backlog; spec §14 | Security · S4 | — | approvals everywhere, Settings | `domain/governance/policy.ts`, `services/approvals.ts` | Approval, BudgetPolicy | **Done** — Observe/Suggest/Copilot/Autopilot, R0–R4, re-evaluated at execution |
| Implement hard budget guardrails | Backlog; spec §14 | Security · S4 | policy | Settings | `policy.ts` (hard checks) | BudgetPolicy | **Done** — daily cap, monthly projection, per-experiment cap cannot be bypassed by approval or model output |
| Build Policy Engine for Autopilot | Backlog | Security · S6 | governance | Settings | `policy.ts` | BudgetPolicy | **Partial** — autonomy rules enforced; allowed-channel lists and "never without approval" capabilities supported in code, not yet editable in UI |
| Implement auto-pause + bounded scaling | Backlog | Execution · S6 | governance, metrics | Agent | `runtime.ts` (scale intent), policy `reducesExposure` | Campaign | **Partial** — bounded scaling proposal and exposure-reducing auto-permission exist; no scheduled monitor yet |
| Build recurring daily growth planning loop | Backlog | Learning · S6 | runtime, workflow engine | Command Center brief | `growth-brief.ts` | AgentRun (daily_brief) | **Partial** — brief is computed on read; no scheduled run |
| Build YC demo golden path | Backlog; spec §36 | YC · S6 | everything above | all | seed + integration test | — | **Partial** — demo loop is coherent and tested; "real action executed" requires live Google Ads credentials |
| Track YC traction proof metrics | Backlog | YC · S7 | — | — | — | — | Not started |

## P1 / P2 items that shape P0 architecture

| Requirement | Why it matters now | How the architecture leaves room | Status |
|---|---|---|---|
| Competitor discovery + research pipeline (P1) | Wedges and channel choice depend on it | Competitor entity with confidence/status; LLM extractor may add market-knowledge competitors capped at 0.6 | Partial |
| Google Search Console (P1) | Feeds SEO engine and search-intent factor | `READ_SEARCH_QUERIES` capability; SEO module page | Blocked (credentials) |
| Lifecycle email engine (P1) | Activation is the demo's second bottleneck | `SEND_EMAIL` / `MANAGE_EMAIL_SEQUENCE` capabilities; email experiments | Foundation |
| Organic content calendar + publishing (P1) | R2 publish path | `PUBLISH_SOCIAL_POST` capability, R2 policy path proven by `pages.publish` | Foundation |
| SEO opportunity + content engine (P1) | Comparison pages are the demo's winning tactic | `seo_page` experiment type, hosted pages adapter | Foundation |
| Creator discovery, outreach, tracking (P1) | R4 sensitive actions | `CONTACT_CREATOR` in never-without-approval; Creators module page | Foundation |
| Multi-product / agency workspace (P2) | Tenancy must not assume one product | Organization → Workspace → Product; workspace switcher | Foundation |
| Playbooks + cross-workspace priors (P2) | Channel priors are currently static | Channel fit separates priors from business evidence | Foundation |
| LinkedIn Ads, TikTok, HubSpot, Attio, GitHub (P2) | Capability-based registry | Catalog entries with read/write capabilities; no adapters | Foundation |

## Spec requirements outside the Backlog

| Requirement | Source | Status |
|---|---|---|
| Prompt-injection defense for crawled content | §28 | Done — delimited untrusted documents, injection detection surfaced to founder, grounding check |
| "Why did the agent do this?" observability per run | §29 | Partial — goal, planner, prompt version, steps, tool calls, approvals, outcome persisted; token/cost not recorded |
| Math outside the LLM | §16 | Done |
| Model routing | §16 | Partial — single model (`claude-opus-5`) for extraction; routing not built |
| Daily Growth Brief | §23 | Partial — on Command Center; no notification delivery |
| Pricing / billing of Kaya itself | §24 | Not started |
