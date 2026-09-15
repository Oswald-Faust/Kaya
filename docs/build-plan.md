# Build plan

Order follows the brief's milestones (A–H) and Notion build stages (§31). Checked items are in the codebase.

## Milestones

- [x] **A. App shell, navigation, design system** — tokens, AppShell, Sidebar, WorkspaceSwitcher, TopBar with Goal progress and Growth Loop rail, ⌘K palette, Panel, Metric/MetricGroup, badges, charts, states
- [x] **B. URL-first onboarding** — `/start`, safe crawler, live analysis timeline
- [x] **C. Product analysis + Business Memory confirmation** — extraction, grounding, proposed facts, review board with confirm/correct/remove/add context
- [x] **D. Growth goal + budget** — templates, deadline, budget bands → hard policy caps
- [x] **E. Initial strategy** — channel fit, allocation, positioning, bottleneck, 30/60/90, assumptions, experiment queue, animated reveal
- [x] **F. Command Center** — outcome strip, growth brief, next best actions, running experiments, approvals, learnings, integration health, MRR chart with experiment markers
- [x] **G. Experiments + next best actions** — lifecycle, ranking with factors, suppression, detail page with variants and evaluation
- [x] **H. Agent workspace + timeline + approvals** — runs, plan, execution timeline, expandable tool calls, approve/reject with policy explanation

## Next phases

1. **Live data (Stage 2)** — encrypted token vault; Stripe adapter (READ_REVENUE, READ_SUBSCRIPTIONS) with webhook ingestion into `analytics_events` → `metric_snapshots`; GA4 adapter; attribution confidence.
2. **Durable runs** — move `runProductAnalysis`, `runStrategyGeneration` and agent runs onto a workflow engine; add a daily planning run that evaluates running experiments, writes learnings and refreshes the brief.
3. **LLM planner** — Claude tool-use loop over the existing registry (tools already expose JSON schemas via `describeRegistry()`), with the executor unchanged as the only path to action; record tokens/cost per run.
4. **Paid execution (Stage 4)** — Google Ads live adapter behind `CREATE_PAID_CAMPAIGN` / `UPDATE_AD_BUDGET` / `PAUSE_CAMPAIGN`; auto-pause monitor using `reducesExposure`.
5. **Creative engine** — asset generation for the experiment types in the queue (comparison pages, ad copy, lifecycle emails) with brand profile and previous winners as context.
6. **Evaluation suite** — labelled SaaS URL dataset for extraction accuracy; strategy rubric; tool-use failure scenarios (expired token, partial failure).
7. **Auth** — pick provider (founder decision), map to `users`/`members`, invite flow and roles UI.
8. **E2E browser tests** — Playwright over the critical scenario (onboarding → approval → learning → changed recommendation); the integration test already covers the server side.
