# Build status

Last updated: 2026-09-15.

Verification: `pnpm typecheck` clean · `pnpm eslint src` clean · `pnpm test` 89 unit tests passing · `pnpm test:integration` 9 growth-loop tests passing against a real database · `next build` succeeds (24 routes) · browser QA at 1440×900: demo Command Center, live approval execution, Agent workspace, and the full onboarding on a public SaaS site (healthchecks.io: analysis → confirm → goal → connect → strategy → Command Center).

## Implemented

**Foundation**
- Organization → Workspace → Product tenancy, workspace-scoped queries, membership-checked workspace resolution, workspace switcher.
- 31-table Drizzle schema with migrations, indexes and an append-only audit trigger.
- Environment validation, structured error logging, domain errors, error/loading/not-found boundaries.
- Kaya brand identity (`/brand`, `docs/brand.md`): logo, black-and-white core with cream and seven clay accents, Host Grotesk + Geist Mono, SVG clay illustrations, interface and voice rules. App tokens retuned to the brand.
- Marketing site (`/`, `/pricing`, `/brand`, `/lab/hero`) in the Clay structure: announcement bar; sticky nav with five mega menus (Product, Use cases, Solutions, Resources, Company) whose items deep-link into tabs, pillars and pricing plans, "Soon" labels for pages not built, and a mobile sheet; real-time 3D hero (three.js/R3F, paused off-screen) with two alternates (`?hero=b`, `?hero=c`); three-row scrolling marquee of 40 integration logos labeled Connected / Channel / Soon; 12 use-case tabs with rotating subtitle, autoplay progress and per-tab product mocks; animated clay illustrations (scan, stack, bubble, dial, grow) started in view; staggered reveals and counters; shared footer and closing CTA.
- Home page version 2 at `/v2` (also `/?hero=clay`): Clay-style 3D clay machine hero with physics, headline bottom-left and product analysis on the right; the integrations card overlaps the hero. Reusable design skill saved at `~/.claude/skills/clay-grade-landing` (workflow, rules, pitfalls, copyable source).
- Pricing page (draft prices, D-018): monthly/annual toggle, four plans with action tiers, usage calculator with visible formula, comparison table, trust cards and pricing FAQ.
- Checked at 1280×800 and 390×844 with no horizontal overflow; `next build` succeeds.
- Design system: tokens, AppShell, Sidebar, TopBar (goal progress, Growth Loop rail, autonomy state), ⌘K command palette, Panel, Metric/MetricGroup, Status/Confidence/Channel/Risk/Demo badges, AreaChart with experiment markers, Sparkline, EmptyState/Skeleton/Notice.

**Product Intelligence**
- URL-first onboarding (`/start`), manual description fallback.
- Safe crawler: SSRF checks on every redirect hop, robots.txt, sitemap index, 8-page / 1.5 MB / timeout caps.
- Heuristic extraction (name, one-liner, category, value prop, features, pricing plans, trial, audiences, competitors, brand voice, channels, proof, CTAs).
- Claude refinement (`claude-opus-5`, structured output, server-side fallbacks) when `ANTHROPIC_API_KEY` is set; grounding check against the crawl.
- Prompt-injection detection surfaced to the founder.
- Live analysis screen with persisted steps and a progressively filling product model.
- Business memory review: confirm, correct (supersedes), remove, bulk-confirm verbatim facts, ICP confirm/rename/reject, competitor confirm/add/reject, add context.

**Strategy**
- Goal templates, deadlines, budget bands → hard policy caps.
- Integrations step with explicit permissions and demo-mode disclosure.
- Channel Fit Score (0–100, factors, reasons, evidence adjustment, "don't use right now").
- Budget allocation, positioning, messaging pillars, competitor wedges, bottleneck, 30/60/90 plan, assumptions, first experiment queue.
- Strategy versions with revision reasons and evidence learnings; animated onboarding reveal; Strategy page with history.

**Experiments & learning**
- Experiment lifecycle with enforced transitions; ranked queue (impact, confidence, info gain, channel fit, effort, cost, time to signal).
- Memory suppression of disproved tactics and boosts from proven ones.
- Statistical evaluation (two-proportion z-test, Poisson CAC test); learning creation; list and detail pages with variants, lifecycle stepper and ranking factors.
- Demo-only "simulate to end", refused in real workspaces.

**Analytics**
- Deterministic metric engine (MRR, net new MRR, signup rate, activation, trial→paid, CAC, ARPU, ROAS, churn, payback, goal progress with pace), each with formula and inputs.
- Command Center outcome strip and Growth Brief; Analytics page with funnel and channel economics.

**Agent & governance**
- Orchestrator with persisted runs, plans, steps, messages and tool calls.
- Typed tool registry: 11 tools, R0–R3, idempotency, dry run.
- Executor enforcing policy → approval → execution → audit.
- Autonomy modes and hard budget guardrails; approvals re-evaluated at execution.
- Agent workspace with timeline and expandable tool calls; approval cards with policy explanation; Settings for autonomy, budget caps, tool registry and audit log.

**Integrations**
- Capability catalog mirroring the Notion Integration Matrix (19 providers).
- Adapter contract, resolver (live preferred over demo), demo ads adapter (budget, pause, create campaign), hosted pages publisher.
- Integrations page with health, last sync, sync errors and granted capabilities.

**Demo**
- Tickwarden workspace generated from a causal model: 104 days of per-channel metrics, 13 experiments (winners, loser, inconclusive, running, queued, suppressed), learnings, strategy v1→v2, campaigns, assets, agent runs, 2 pending approvals, audit history. A unit test guards that metrics and experiment outcomes agree.

## Partially implemented

- **Agent planner**: 4 deterministic intents (diagnose, scale, allocate, grow). No LLM tool-use loop yet; no token/cost tracking.
- **ICP generator**: pains, triggers and objections are only rich in the demo; live analysis without an LLM yields names and evidence only.
- **Strategy writing**: deterministic; no LLM phrasing of positioning or messaging.
- **Attribution**: last-touch by channel with stated limits; no UTM/first-touch/self-report models.
- **Daily planning loop, auto-pause monitor**: logic exists, no scheduler.
- **Policy UI**: allowed channels and never-without-approval capabilities are enforced but not editable.
- **Campaigns, Content**: read-only lists; SEO and Creators are honest module previews backed by real experiments.
- **Evaluation suite**: deterministic math, extraction, grounding, policy and loop are tested; no LLM eval datasets.

## Blocked

- **Live Stripe, GA4/PostHog, Search Console, Google Ads, Meta Ads, Resend adapters**: need OAuth apps or API credentials (and Google Ads developer token, Meta app review). Demo adapters implement the same contracts.
- **Claude refinement in this environment**: `ANTHROPIC_API_KEY` is not set, so the live analysis ran the heuristic pass only. Code path is typechecked but not exercised against the API.
- **Auth provider**: founder decision (spec §40).
- **Dogfooding on a real SaaS**: needs the credentials above.

## Next

1. Set `ANTHROPIC_API_KEY` and run the extraction on 10 known SaaS URLs; build the extraction eval from the results.
2. Token vault + Stripe adapter + event ingestion into `analytics_events` → `metric_snapshots`.
3. Workflow engine for analysis, strategy and a daily planning run (evaluate running experiments → learnings → brief).
4. LLM planner over `describeRegistry()` with the existing executor as the only path to action.
5. Google Ads live adapter; auto-pause monitor.
6. Playwright E2E for the onboarding → approval → learning scenario.
7. Auth provider and team roles UI.

## Notion coverage

See `docs/product-requirements.md` for the full matrix.

| Backlog status | Count | Items |
|---|---|---|
| Done | 17 | data model · crawler · extraction schema · knowledge graph · channel fit · goal + budget · living strategy · experiment entity · recommendation queue · Command Center · tool registry · agent workspace · URL onboarding · audit log · metric engine · Learning Engine V1 · governance + approvals · hard budget guardrails |
| Partial | 9 | ICP/persona generator · positioning/messaging · agent runtime · AI eval suite · policy engine for Autopilot · auto-pause + bounded scaling · daily planning loop · YC golden path · competitor discovery (P1) |
| Foundation only | 5 | normalized events · attribution · token vault · Creative Engine · P1/P2 channel modules |
| Blocked on credentials | 5 | Stripe · GA4 · Google Ads · Meta Ads · dogfood on real SaaS |
| Not engineering / not started | 2 | design partners · YC traction metrics |
