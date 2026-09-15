# Design research

References studied on Mobbin (web) plus the inspiration sites named in the brief (Clay, Tines, Corgi, Linear). We borrow interaction patterns and information design, not branding.

## Visual direction (synthesis)

- **Calm ledger, not a dashboard template.** Cool neutral canvas, white surfaces with hairline borders, no drop shadows except popovers. Hierarchy comes from type weight and spacing (Linear, Stripe-style finance tables).
- **One accent, one meaning.** Cobalt (`--color-agent`) marks only the agent's presence: the brief, "agent wants to", live steps, the stage that needs the founder. Status colors are reserved for outcomes (winner, loser, warning).
- **Dense and readable.** 13px base, tabular numbers, ledger-style metric strip with dividers instead of 6 floating cards.
- **Signature element: the Growth Loop rail** in the top bar — Understand → Decide → Experiment → Execute → Measure → Learn with live counts, linking to the surface that owns each stage and pulsing where attention is needed. It makes the product thesis visible on every screen.

## URL-first onboarding

| Reference | Screen | Pattern | Why it works | How Kaya adapts it |
|---|---|---|---|---|
| Bloom | "Add your brand" | Single URL field, one sentence of promise, nothing else | Time-to-value starts at the first keystroke | `/start`: one large URL input, "Analyze my product", manual description as a quiet secondary link |
| Semrush | "Start optimizing your online presence" | Domain field as the hero of an empty app | Frames the whole product around the user's own site | Same framing, but we add a 3-step "what happens next" strip to set expectations about confirmation |
| Mistral Le Chat | New website index library | URL input with explicit "Start indexing" and advanced settings aside | Indexing is shown as a deliberate, inspectable action | Crawl limits and robots.txt respect are stated in the analysis log rather than hidden |
| Dropbox Dash | "Tell us about your work" | Stepper dots, progressive questions | Low commitment per step | Five named steps (Analyze · Confirm · Goal · Connect · Strategy); reached steps stay navigable |
| Rox | Research run "Step 1 of 7" | Progress with tool/search chips under each step | Makes long AI work legible and trustworthy | Live analysis timeline lists real steps with details (pages found, features detected) while the product model fills in beside it |
| Clay | Hero: data sources → Clay → CRM | Visualizing a pipeline of sources into a model | Shows transformation, not a spinner | Analysis screen: steps on the left, the product model assembling block by block on the right |

## Confirm business memory

| Reference | Pattern | Adaptation |
|---|---|---|
| Corgi (inspiration) | Plain-language, reassuring review of generated details before commitment | Fact rows with Confirm / Edit / Remove, source and evidence quote, "nothing drives spend until you confirm" |
| Linear (inspiration) | Inline editing without modal dialogs | Corrections edit in place and save as a superseding founder fact |

Rejected: a long editable form. It hides provenance and turns review into data entry.

## Command Center

| Reference | Screen | Pattern | Adaptation |
|---|---|---|---|
| Linear (inspiration) | Views and inbox | Quiet chrome, keyboard-first, command palette | ⌘K palette (pages, experiments, "ask the agent"), restrained sidebar grouped by frequency |
| Stripe-style finance dashboards | Metric strip + chart | Ledger of few metrics with deltas and sparklines | 6 outcome metrics only (MRR, net new MRR, signups, signup rate, new customers, CAC), formulas on hover |
| Customer.io | Campaign A/B test | "Chance to beat original — need more data" | Running experiments show current result, confidence meter and a plain-language evaluation summary |

Brief card: left agent rule, four labelled answers (what changed, why it matters, opportunity, risk), one recommended action, and the evidence numbers inline. Approvals live in a right rail so risky actions are never below the fold.

## Agent workspace

| Reference | Screen | Pattern | Adaptation |
|---|---|---|---|
| Relevance AI | Agent timeline | "1 step performed in the background · Used <tool>" collapsed by default | Timeline shows human step titles; tool calls expand into capability, risk, idempotency, input/output |
| StackAI | Run details | Flow progress + side panel with run metadata | Run page: conversation, plan with risk per step, timeline; outcome and pending approvals in the side column |
| Braintrust / LangSmith | Trace timeline | Nested spans with durations | Tool call rows show duration; kept flat to stay readable for founders |
| Zoho CRM | Execution preview table | State/event/payload rows | Rejected as default (too technical); the expandable tool call keeps payloads one click away |

## Experiments

| Reference | Screen | Pattern | Adaptation |
|---|---|---|---|
| Google Ads | Experiment arms + "Experiment power" side panel | Arms defined side by side; power and duration explained beside the form | Detail page: variants table from raw counts, "why it's ranked here" factors panel, lifecycle stepper |
| Customer.io | Variations + performance summary | Delta chips next to rates | Lift column colored only by direction, CAC shown for spend experiments |

## Integrations

| Reference | Pattern | Adaptation |
|---|---|---|
| Integration marketplaces (Clay sources, Customer.io data index) | Grouped by domain, status badge per card | Grouped by Revenue, Analytics, Search, Advertising, Email, Distribution; badges say *why* ("Required to measure revenue", "Optional at your budget") |
| OAuth consent screens | Explicit read vs write scopes | Inline permission panel with Read/Write per permission, risk, audit note, and an explicit demo-mode disclosure |

## Settings

Autonomy modes as four radio cards with consequences in one line each; budget caps labelled "Hard cap"; tool registry and audit log as plain tables. Inspired by Linear workspace settings density.

## Anti-patterns avoided

Purple gradients, glassmorphism, emoji UI, 25-card grids, oversized radii (max 8px), multicolored metrics, generic "AI insights" cards without numbers.
