/**
 * Maps an extraction into Business Memory records. Pure. Nothing produced here
 * is ever "confirmed": every fact starts as `proposed`, and only evidence found
 * verbatim on the site with high confidence is labelled `verified`.
 */
import type { ExtractionResult, Extracted, FactKind } from "@/server/domain/types";
import { channelLabel } from "@/server/domain/channels";

export interface ProposedFact {
  key: string;
  category: string;
  statement: string;
  kind: FactKind;
  confidence: number;
  evidence: string | null;
  sourceUrl: string | null;
  value: unknown;
}

export interface ProposedIcp {
  name: string;
  description: string;
  confidence: number;
  priority: number;
}

export interface ProposedCompetitor {
  name: string;
  url: string | null;
  kind: string;
  positioning: string;
  confidence: number;
}

const VERIFIED_THRESHOLD = 0.8;

function kindOf(field: Pick<Extracted<unknown>, "confidence" | "evidence">): FactKind {
  return field.evidence && field.confidence >= VERIFIED_THRESHOLD ? "verified" : "inferred";
}

function fmtPrice(price: number | null, period: string | null): string {
  if (price === null) return "price not found";
  if (price === 0) return "free";
  return `$${Number.isInteger(price) ? price : price.toFixed(2)}/${period === "year" ? "yr" : "mo"}`;
}

export function factsFromExtraction(x: ExtractionResult): ProposedFact[] {
  const facts: ProposedFact[] = [];
  const push = (key: string, category: string, statement: string, field: Extracted<unknown>, value: unknown = field.value) => {
    if (!statement.trim() || field.confidence <= 0) return;
    facts.push({ key, category, statement, kind: kindOf(field), confidence: round(field.confidence), evidence: field.evidence ?? null, sourceUrl: field.sourceUrl ?? null, value });
  };

  push("product.name", "identity", `The product is called ${x.productName.value}.`, x.productName);
  if (x.oneLiner.value) push("product.one_liner", "identity", x.oneLiner.value, x.oneLiner);
  if (x.category.value) push("product.category", "identity", `Category: ${x.category.value}.`, x.category);
  if (x.valueProposition.value) push("positioning.value_prop", "positioning", x.valueProposition.value, x.valueProposition);

  x.features.forEach((f, i) => push(`feature.${i + 1}`, "feature", f.value, f));

  if (x.pricing.plans.length) {
    const summary = x.pricing.plans.map((p) => `${p.name} ${fmtPrice(p.price, p.period)}`).join(" · ");
    push("pricing.plans", "pricing", `${x.pricing.model.value}: ${summary}.`, { ...x.pricing.model, confidence: Math.max(x.pricing.model.confidence, 0.6) }, x.pricing.plans);
  } else if (x.pricing.model.confidence > 0.2) {
    push("pricing.model", "pricing", `Pricing model: ${x.pricing.model.value}.`, x.pricing.model);
  }
  if (x.pricing.freeTrial?.value) push("pricing.trial", "pricing", `Offers a free trial (“${x.pricing.freeTrial.evidence ?? "free trial"}”).`, x.pricing.freeTrial);

  if (x.brand.voiceSummary) {
    facts.push({ key: "brand.voice", category: "brand", statement: x.brand.voiceSummary, kind: "inferred", confidence: round(x.brand.confidence), evidence: null, sourceUrl: null, value: x.brand.traits });
  }

  x.channels.forEach((c) =>
    facts.push({ key: `channel.${c.channel}`, category: "channel", statement: `Existing presence on ${channelLabel(c.channel)}: ${c.signal}.`, kind: "inferred", confidence: round(c.confidence), evidence: null, sourceUrl: null, value: c.channel }),
  );

  x.proof.forEach((p, i) =>
    facts.push({ key: `proof.${i + 1}`, category: "traction", statement: p, kind: "verified", confidence: 0.7, evidence: p, sourceUrl: null, value: null }),
  );

  return facts;
}

export function icpsFromExtraction(x: ExtractionResult): ProposedIcp[] {
  return x.audiences.slice(0, 3).map((a, i) => ({
    name: a.name,
    description: a.evidence ? `${a.description}. Evidence: “${a.evidence}”` : a.description,
    confidence: round(a.confidence),
    priority: i + 1,
  }));
}

export function competitorsFromExtraction(x: ExtractionResult): ProposedCompetitor[] {
  return x.competitors.slice(0, 6).map((c) => ({ name: c.name, url: c.url, kind: c.kind, positioning: c.reason, confidence: round(c.confidence) }));
}

/** Monthly price used for CAC affordability: median of paid plans, annual prices normalized. */
export function arpuFromPlans(plans: ExtractionResult["pricing"]["plans"]): number | null {
  const monthly = plans
    .filter((p) => p.price !== null && p.price > 0)
    .map((p) => (p.period === "year" ? p.price! / 12 : p.price!))
    .sort((a, b) => a - b);
  if (monthly.length === 0) return null;
  const mid = Math.floor(monthly.length / 2);
  return monthly.length % 2 ? monthly[mid] : (monthly[mid - 1] + monthly[mid]) / 2;
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
