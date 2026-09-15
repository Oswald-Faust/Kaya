/**
 * Grounding check for model output. The model is asked to quote evidence; this
 * verifies the quotes exist in what was actually crawled. Unverifiable claims
 * are kept (the founder may know they're true) but lose confidence and their
 * fake evidence, so a hallucination can never look verified.
 */
import type { ExtractionResult, Extracted } from "@/server/domain/types";
import type { CrawledPage } from "./heuristic-extractor";

const MARKET_KNOWLEDGE_CAP = 0.6;

export function normalizeForMatch(s: string): string {
  return s
    .toLowerCase()
    .replace(/[“”«»]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildCorpus(pages: CrawledPage[]): string {
  return normalizeForMatch(
    pages
      .map((p) => [p.parsed.title, p.parsed.description, p.parsed.siteName, ...p.parsed.headings.map((h) => h.text), p.parsed.text].filter(Boolean).join("\n"))
      .join("\n"),
  );
}

export function groundExtraction(result: ExtractionResult, pages: CrawledPage[]): ExtractionResult {
  const corpus = buildCorpus(pages);
  let unverified = 0;

  const check = <T>(field: Extracted<T>): Extracted<T> => {
    const confidence = clamp(field.confidence);
    if (!field.evidence) return { ...field, confidence: Math.min(confidence, 0.7) };
    if (corpus.includes(normalizeForMatch(field.evidence))) return { ...field, confidence };
    unverified++;
    return { ...field, evidence: undefined, confidence: confidence * 0.5 };
  };

  const plans = result.pricing.plans.map((plan) => {
    if (plan.price === null || plan.price === 0) return plan;
    const num = String(plan.price).replace(/\.0+$/, "");
    if (corpus.includes(num)) return plan;
    unverified++;
    return { ...plan, price: null };
  });

  const warnings = [...result.warnings];
  if (unverified > 0) {
    warnings.push(`${unverified} claim${unverified === 1 ? "" : "s"} could not be matched to text on the site; confidence was lowered and they need your review.`);
  }

  return {
    ...result,
    productName: check(result.productName),
    oneLiner: check(result.oneLiner),
    category: check(result.category),
    valueProposition: check(result.valueProposition),
    features: result.features.map(check),
    pricing: {
      ...result.pricing,
      model: check(result.pricing.model),
      plans,
      freeTrial: result.pricing.freeTrial ? check(result.pricing.freeTrial) : null,
    },
    audiences: result.audiences.map((a) => {
      if (!a.evidence) return { ...a, confidence: Math.min(clamp(a.confidence), MARKET_KNOWLEDGE_CAP) };
      return corpus.includes(normalizeForMatch(a.evidence))
        ? { ...a, confidence: clamp(a.confidence) }
        : { ...a, evidence: undefined, confidence: clamp(a.confidence) * 0.5 };
    }),
    // Competitors often come from market knowledge rather than the site; cap them unless the site names them.
    competitors: result.competitors.map((c) => ({
      ...c,
      confidence: corpus.includes(normalizeForMatch(c.name)) ? clamp(c.confidence) : Math.min(clamp(c.confidence), MARKET_KNOWLEDGE_CAP),
    })),
    brand: { ...result.brand, confidence: Math.min(clamp(result.brand.confidence), 0.8) },
    channels: result.channels.map((c) => ({ ...c, confidence: clamp(c.confidence) })),
    warnings,
  };
}

function clamp(n: number): number {
  return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0;
}
