# Kaya

**The AI agent that does your marketing.** Build your product. We grow it.

Paste a SaaS URL. Kaya reads the product, lets you confirm what it learned, turns your goal and budget into a strategy and measurable experiments, executes approved actions inside hard guardrails, measures the effect on revenue, and learns from every result.

```
UNDERSTAND → DECIDE → EXPERIMENT → EXECUTE → MEASURE → LEARN → REPEAT
```

## Run it locally

Requirements: Node 22, pnpm 10, PostgreSQL 15+ running locally.

```bash
pnpm install
```

```bash
createdb marketing_os && createdb marketing_os_test
```

```bash
cp .env.example .env.local
```

```bash
pnpm db:reset
```

```bash
pnpm dev
```

`pnpm db:reset` rebuilds the local schema and seeds **Tickwarden**, a fictional cron-monitoring SaaS with 104 days of coherent metrics, 13 experiments, learnings and pending approvals. It refuses to run against a non-local database.

- `/` opens the demo Command Center.
- `/start` runs URL-first onboarding on any public site.

Set `ANTHROPIC_API_KEY` in `.env.local` to refine product analysis with Claude. Without it, analysis uses the deterministic extractor and says so.

## Checks

```bash
pnpm typecheck && pnpm lint && pnpm test
```

```bash
pnpm test:integration
```

Unit tests cover the deterministic core: metrics, experiment statistics, ranking and memory suppression, channel fit, governance policy, extraction, grounding, and demo data coherence. Integration tests run the growth loop against a real database: approval, execution, idempotency, hard caps, audit immutability, tenant scoping, and a learning that changes the next recommendation.

## Where things live

| Path | What |
|---|---|
| `src/app/(onboarding)/start` | URL → analysis → confirm → goal → connect → strategy |
| `src/app/(app)/w/[workspace]` | Command Center, Agent, Strategy, Experiments, Learnings, Analytics, Memory, Integrations, Settings |
| `src/server/domain` | Pure business logic: metrics, evaluation, ranking, channel fit, policy, brief |
| `src/server/intelligence` | Safe crawler, extraction, grounding, business memory mapping |
| `src/server/agent` | Orchestrator, typed tool registry, executor |
| `src/server/services` | Tenant-scoped data access |
| `src/server/integrations` | Capability catalog, adapter contract, demo adapters |
| `docs/` | Requirements matrix, architecture, data model, design research, decisions, build status |

Start with `docs/build-status.md`.
