import "server-only";
import { and, eq } from "drizzle-orm";
import { RunRecorder } from "@/server/agent/recorder";
import { db } from "@/server/db/client";
import * as t from "@/server/db/schema";
import { channelLabel } from "@/server/domain/channels";
import { isDomainError } from "@/server/domain/errors";
import type { ExtractionResult, SnapshotPage } from "@/server/domain/types";
import { env, llmAvailable } from "@/server/env";
import { recordAudit } from "@/server/services/audit";
import { newId } from "@/lib/ids";
import { discoverPages, fetchPage } from "./crawler";
import { groundExtraction } from "./grounding";
import { extractHeuristically, type CrawledPage } from "./heuristic-extractor";
import { parseHtml } from "./html";
import { extractWithLlm, EXTRACTION_PROMPT_VERSION } from "./llm-extractor";
import { DEFAULT_LOCALE, type Locale } from "@/i18n/config";
import { researchPricingWithClaude } from "./pricing-research";
import { competitorsFromExtraction, factsFromExtraction, icpsFromExtraction } from "./to-memory";

export const ANALYZER_ID = "agent:product-analyst";

export interface AnalysisRunResult {
  host: string;
  stage: "reading" | "extracting" | "refining" | "saving" | "done";
  pagesRead: number;
  pagesFound: number;
  extraction?: ExtractionResult;
  extractor?: "heuristic" | "llm";
  manual?: { name: string; description: string };
  factCount?: number;
}

/** Small pause between user-visible steps so progress is legible; never used to fake work. */
const STEP_PAUSE_MS = 220;
const pause = () => new Promise((r) => setTimeout(r, STEP_PAUSE_MS));

/**
 * Product Intelligence pipeline: crawl → extract → (refine with LLM) → ground →
 * write proposed facts into Business Memory. Every stage is persisted as a run
 * step so the onboarding screen can show real progress and partial results.
 */
/** `locale` is the founder's language: what the model writes is meant for them to read. */
export async function runProductAnalysis(workspaceId: string, runId: string, locale: Locale = DEFAULT_LOCALE): Promise<void> {
  const run = await db.query.agentRuns.findFirst({ where: and(eq(t.agentRuns.id, runId), eq(t.agentRuns.workspaceId, workspaceId)) });
  if (!run?.productId) return;
  const product = await db.query.products.findFirst({ where: eq(t.products.id, run.productId) });
  if (!product) return;

  const rec = await RunRecorder.open(workspaceId, runId);
  // Manually described products may have no website; the domain slug stands in as an identifier, never crawled.
  const rootUrl = product.url || `https://${product.domain}`;
  const root = new URL(rootUrl);
  const state: AnalysisRunResult = { ...(run.result as AnalysisRunResult | null), host: root.hostname.replace(/^www\./, ""), stage: "reading", pagesRead: 0, pagesFound: 0 };
  const save = (patch: Partial<AnalysisRunResult>) => {
    Object.assign(state, patch);
    return rec.setRun({ result: { ...state } });
  };

  await rec.setRun({ status: "running", startedAt: new Date() });

  try {
    const pages: CrawledPage[] = [];
    const snapshot: SnapshotPage[] = [];

    if (state.manual) {
      const step = await rec.step("context", "Reading your description");
      const html = `<html><head><title>${escapeHtml(state.manual.name)}</title><meta name="description" content="${escapeHtml(state.manual.description.slice(0, 300))}"></head><body><h1>${escapeHtml(state.manual.name)}</h1><p>${escapeHtml(state.manual.description).replace(/\n/g, "</p><p>")}</p></body></html>`;
      pages.push({ url: rootUrl, kind: "home", parsed: parseHtml(html, rootUrl) });
      snapshot.push({ url: rootUrl, kind: "home", title: state.manual.name, status: "skipped", bytes: html.length, fetchedAt: new Date().toISOString(), error: "Described manually" });
      await rec.finish(step, "done", { detail: `${state.manual.description.split(/\s+/).length} words` });
      await save({ pagesRead: 1, pagesFound: 1 });
    } else {
      const homeStep = await rec.step("tool", `Reading ${state.host}`);
      const home = await fetchPage(product.url, root, env.CRAWL_TIMEOUT_MS);
      snapshot.push(home.snapshot);
      if (!home.page) {
        await rec.finish(homeStep, "failed", { detail: home.snapshot.error });
        throw new AnalysisError(home.snapshot.error ?? "The homepage couldn't be read.");
      }
      pages.push(home.page);
      await rec.finish(homeStep, "done", { title: "Read homepage", detail: `${home.page.parsed.title ?? state.host} · ${Math.round(home.snapshot.bytes / 1024)} KB` });
      await save({ pagesRead: 1 });

      const discoverStep = await rec.step("tool", "Discovering product pages");
      const discovery = await discoverPages(home.page, root, { maxPages: env.CRAWL_MAX_PAGES, timeoutMs: env.CRAWL_TIMEOUT_MS });
      const kinds = discovery.selected.map((u) => new URL(u).pathname).join(", ");
      await rec.finish(discoverStep, "done", {
        detail: discovery.candidates.length
          ? `Found ${discovery.candidates.length} pages; reading ${discovery.selected.length}${kinds ? `: ${kinds}` : ""}`
          : "Only the homepage is linked; continuing with it",
      });
      await save({ pagesFound: discovery.candidates.length + 1 });

      let pricingUrl = discovery.selected.find((u) => /pricing|plans|tarif|prix/i.test(u));
      if (pricingUrl) {
        const s = await rec.step("tool", "Reading pricing");
        const r = await fetchPage(pricingUrl, root, env.CRAWL_TIMEOUT_MS);
        snapshot.push(r.snapshot);
        if (r.page) pages.push(r.page);
        await rec.finish(s, r.page ? "done" : "failed", { detail: r.page ? new URL(r.page.url).pathname : r.snapshot.error });
        await save({ pagesRead: pages.length });
      } else {
        // Many sites don't link pricing from the homepage; try the usual paths before giving up.
        const s = await rec.step("tool", "Looking for a pricing page");
        for (const path of ["/pricing", "/plans", "/tarifs", "/prix"]) {
          const r = await fetchPage(new URL(path, root).toString(), root, env.CRAWL_TIMEOUT_MS);
          if (!r.page) continue;
          snapshot.push(r.snapshot);
          pages.push(r.page);
          pricingUrl = r.page.url;
          break;
        }
        await rec.finish(s, pricingUrl ? "done" : "skipped", { detail: pricingUrl ? new URL(pricingUrl).pathname : llmAvailable ? "Not linked on the site; AI will look for it" : "You can add pricing during review" });
        await save({ pagesRead: pages.length });
      }

      const rest = discovery.selected.filter((u) => u !== pricingUrl);
      if (rest.length) {
        const s = await rec.step("tool", `Reading ${rest.length} more page${rest.length === 1 ? "" : "s"}`);
        for (let i = 0; i < rest.length; i += 3) {
          const batch = await Promise.all(rest.slice(i, i + 3).map((u) => fetchPage(u, root, env.CRAWL_TIMEOUT_MS)));
          for (const r of batch) {
            snapshot.push(r.snapshot);
            if (r.page) pages.push(r.page);
          }
          await save({ pagesRead: pages.length });
        }
        const failed = snapshot.filter((p) => p.status === "error" || (typeof p.status === "number" && p.status >= 400)).length;
        await rec.finish(s, "done", { detail: `${pages.length} pages read${failed ? `, ${failed} couldn't be read` : ""}` });
      }
    }

    // ── Deterministic first pass: instant, conservative ──
    await save({ stage: "extracting" });
    let extraction = extractHeuristically(pages, rootUrl);
    let extractor: "heuristic" | "llm" = "heuristic";
    await save({ extraction, extractor });

    await revealStep(rec, "Detecting features", extraction.features.length ? `${extraction.features.length} features: ${extraction.features.slice(0, 3).map((f) => f.value).join("; ")}` : "No clear feature list found");
    await revealStep(rec, "Understanding positioning", extraction.valueProposition.value || extraction.oneLiner.value || "Positioning isn't stated clearly on the site");
    await revealStep(rec, "Finding audience signals", extraction.audiences.map((a) => `${a.name} (${Math.round(a.confidence * 100)}%)`).join(", ") || "No explicit audience found");
    await revealStep(rec, "Finding competitors", extraction.competitors.length ? extraction.competitors.map((c) => c.name).join(", ") : "None named on the site");
    await revealStep(rec, "Looking at acquisition surfaces", extraction.channels.length ? extraction.channels.map((c) => channelLabel(c.channel)).join(", ") : "No existing channels detected");

    // ── LLM refinement: structured output, grounded against the crawl ──
    if (llmAvailable) {
      await save({ stage: "refining" });
      const s = await rec.step("tool", "Studying the category with AI");
      try {
        const refined = await extractWithLlm(pages, rootUrl, extraction, locale);
        extraction = groundExtraction(refined.result, pages);
        extractor = "llm";
        await rec.setRun({ planner: "llm", model: refined.model, promptVersion: EXTRACTION_PROMPT_VERSION });
        await rec.finish(s, "done", { detail: `Refined ${extraction.features.length} features, ${extraction.audiences.length} audiences and ${extraction.competitors.length} competitors; claims checked against the site` });
      } catch (error) {
        console.error(JSON.stringify({ level: "warn", msg: "llm_extraction_failed", runId, error: String(error) }));
        await rec.finish(s, "failed", { detail: "Model refinement unavailable; keeping the site-based analysis" });
        extraction = { ...extraction, warnings: [...extraction.warnings, "Model refinement failed, so this analysis is based on the site text only."] };
      }
      await save({ extraction, extractor });

      if (!state.manual && !extraction.pricing.plans.some((p) => p.price !== null)) {
        const ps = await rec.step("tool", "Researching pricing with AI");
        try {
          const pricing = await researchPricingWithClaude(rootUrl, extraction.productName.value || state.host, locale);
          if (pricing) {
            extraction = { ...extraction, pricing: { ...extraction.pricing, ...pricing, freeTrial: pricing.freeTrial ?? extraction.pricing.freeTrial } };
            const priced = pricing.plans.filter((p) => p.price !== null);
            await rec.finish(ps, "done", { detail: `${pricing.plans.length} plans found on ${new URL(pricing.sourceUrl ?? rootUrl).pathname || "/"}: ${priced.map((p) => `${p.name} ${p.price}`).join(", ")}` });
          } else {
            await rec.finish(ps, "skipped", { detail: "No public prices on the site; you can add them during review" });
          }
        } catch (error) {
          console.error(JSON.stringify({ level: "warn", msg: "pricing_research_failed", runId, error: String(error) }));
          await rec.finish(ps, "failed", { detail: "Pricing research unavailable; add pricing during review" });
        }
        await save({ extraction, extractor });
      }
    } else {
      extraction = { ...extraction, warnings: [...extraction.warnings, "No language model is configured (ANTHROPIC_API_KEY). Competitors and audiences come only from what your site states."] };
      await save({ extraction });
    }

    // ── Persist into Business Memory ──
    await save({ stage: "saving" });
    const buildStep = await rec.step("learning", "Building product model");
    const factCount = await persistAnalysis(workspaceId, product.id, rootUrl, pages, snapshot, extraction, extractor);
    await rec.finish(buildStep, "done", {
      detail: `${factCount} facts · ${Math.min(3, extraction.audiences.length)} audience hypotheses · ${extraction.competitors.length} competitors — all waiting for your review`,
    });
    await save({ stage: "done", factCount });
    await rec.setRun({ status: "completed", finishedAt: new Date() });
  } catch (error) {
    const message = isDomainError(error) || error instanceof AnalysisError ? error.message : "The analysis stopped unexpectedly.";
    if (!isDomainError(error) && !(error instanceof AnalysisError)) {
      console.error(JSON.stringify({ level: "error", msg: "analysis_failed", runId, error: String(error) }));
    }
    await rec.step("observation", "Analysis stopped", { status: "failed", detail: message });
    await rec.setRun({ status: "failed", error: message, finishedAt: new Date() });
    await db.update(t.products).set({ status: "failed", updatedAt: new Date() }).where(eq(t.products.id, product.id));
  }
}

class AnalysisError extends Error {}

async function revealStep(rec: RunRecorder, title: string, detail: string) {
  await pause();
  await rec.step("observation", title, { status: "done", detail });
}

async function persistAnalysis(
  workspaceId: string,
  productId: string,
  url: string,
  pages: CrawledPage[],
  snapshot: SnapshotPage[],
  extraction: ExtractionResult,
  extractor: "heuristic" | "llm",
): Promise<number> {
  const facts = factsFromExtraction(extraction);
  const icps = icpsFromExtraction(extraction);
  const competitors = competitorsFromExtraction(extraction);
  const P = { workspaceId, productId };

  await db.transaction(async (tx) => {
    // Re-analysis replaces only unreviewed proposals; anything the founder confirmed or corrected is kept.
    await tx.delete(t.businessFacts).where(and(eq(t.businessFacts.productId, productId), eq(t.businessFacts.status, "proposed"), eq(t.businessFacts.userConfirmed, false)));
    await tx.delete(t.icps).where(and(eq(t.icps.productId, productId), eq(t.icps.status, "proposed")));
    await tx.delete(t.competitors).where(and(eq(t.competitors.productId, productId), eq(t.competitors.status, "proposed")));

    await tx.insert(t.productSnapshots).values({ id: newId("snap"), ...P, sourceUrl: url, pages: snapshot, extraction, extractor, promptVersion: extractor === "llm" ? EXTRACTION_PROMPT_VERSION : "heuristic-v1" });

    const sourceByUrl = new Map<string, string>();
    for (const page of pages) {
      const id = newId("src");
      sourceByUrl.set(page.url, id);
      await tx.insert(t.knowledgeSources).values({ id, ...P, kind: "crawl_page", uri: page.url, title: page.parsed.title ?? new URL(page.url).pathname });
    }
    const homeSource = sourceByUrl.get(pages[0]?.url ?? "") ?? null;

    const confirmedKeys = new Set(
      (await tx.select({ key: t.businessFacts.key }).from(t.businessFacts).where(and(eq(t.businessFacts.productId, productId), eq(t.businessFacts.status, "confirmed")))).map((f) => f.key),
    );
    const newFacts = facts.filter((f) => !confirmedKeys.has(f.key));
    if (newFacts.length) {
      await tx.insert(t.businessFacts).values(
        newFacts.map((f) => ({
          id: newId("fact"),
          ...P,
          key: f.key,
          category: f.category,
          statement: f.statement,
          value: f.value,
          kind: f.kind,
          status: "proposed" as const,
          confidence: f.confidence,
          sourceId: (f.sourceUrl && sourceByUrl.get(f.sourceUrl)) || homeSource,
          sourceLabel: f.sourceUrl ? new URL(f.sourceUrl).pathname === "/" ? "Homepage" : new URL(f.sourceUrl).pathname : extractor === "llm" ? "Site analysis + model" : "Site analysis",
          evidence: f.evidence,
          agentGenerated: true,
          userConfirmed: false,
          lastVerifiedAt: new Date(),
        })),
      );
    }

    if (icps.length) await tx.insert(t.icps).values(icps.map((i) => ({ id: newId("icp"), ...P, ...i, status: "proposed" as const })));
    if (competitors.length) await tx.insert(t.competitors).values(competitors.map((c) => ({ id: newId("cmp"), ...P, ...c, status: "proposed" as const })));

    await tx
      .insert(t.brandProfiles)
      .values({ productId, workspaceId, voiceSummary: extraction.brand.voiceSummary || "Not enough copy to infer a voice.", traits: extraction.brand.traits })
      .onConflictDoUpdate({ target: t.brandProfiles.productId, set: { voiceSummary: extraction.brand.voiceSummary, traits: extraction.brand.traits, updatedAt: new Date() } });

    await tx
      .update(t.products)
      .set({
        name: extraction.productName.value || undefined,
        oneLiner: extraction.oneLiner.value || null,
        category: extraction.category.value || null,
        logoUrl: extraction.logoUrl,
        status: "needs_review",
        onboardingStep: "confirm",
        updatedAt: new Date(),
      })
      .where(eq(t.products.id, productId));

    await recordAudit(tx, {
      workspaceId,
      actorType: "agent",
      actorId: ANALYZER_ID,
      action: "memory.proposed",
      targetType: "product",
      targetId: productId,
      payload: { facts: newFacts.length, icps: icps.length, competitors: competitors.length, extractor, pages: pages.length },
    });
  });

  return facts.length;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
