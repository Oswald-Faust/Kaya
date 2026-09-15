/**
 * Deterministic extraction from crawled pages. Used when no LLM is configured
 * and as the first, instant pass when one is. Confidence is deliberately
 * conservative: everything it finds lands in memory as "proposed" and needs
 * the founder's confirmation before it drives decisions.
 */
import type { ExtractionResult, Extracted, PageKind, PricingPlan } from "@/server/domain/types";
import type { ParsedPage } from "./html";
import { detectInjection } from "./untrusted";

export interface CrawledPage {
  url: string;
  kind: PageKind;
  parsed: ParsedPage;
}

const GENERIC_HEADINGS =
  /^(pricing|plans|faq|frequently asked|testimonials?|customers|blog|contact|about|sign ?up|log ?in|get started|start (?:now|free)|features|product|resources|company|legal|privacy|terms|footer|newsletter|subscribe|menu|navigation|trusted by|loved by|what (?:our|people)|join|ready to|try it|documentation|changelog|careers|press|security|compare plans|all features|integrations)\b/i;

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "Developer tools": ["api", "sdk", "developers", "developer", "deploy", "cli", "github", "code", "monitoring", "logs", "infrastructure", "webhook", "open source", "kubernetes"],
  "Marketing software": ["marketing", "seo", "campaigns", "social media", "newsletter", "email marketing", "ads", "audience"],
  "Sales & CRM": ["crm", "pipeline", "leads", "sales", "prospects", "outreach", "deals"],
  "Analytics": ["analytics", "dashboards", "metrics", "insights", "reporting", "funnels"],
  "Design tools": ["design", "figma", "prototype", "mockups", "templates"],
  "Productivity & collaboration": ["tasks", "projects", "collaboration", "notes", "docs", "calendar", "workspace", "meetings"],
  "Finance software": ["invoices", "accounting", "payments", "expenses", "billing", "bookkeeping"],
  "Customer support": ["support", "helpdesk", "tickets", "live chat", "customer service"],
  "AI software": ["ai", "llm", "gpt", "agents", "machine learning", "automation"],
  "E-commerce": ["store", "shop", "checkout", "ecommerce", "e-commerce", "shopify", "orders"],
  "HR & recruiting": ["hiring", "recruiting", "payroll", "employees", "candidates", "onboarding"],
  "Security & compliance": ["security", "compliance", "soc 2", "vulnerabilities", "encryption", "gdpr"],
  "Education": ["courses", "students", "teachers", "learning", "lessons"],
};

const AUDIENCE_NOUNS =
  "developers|engineers|engineering teams|founders|startups|teams|marketers|marketing teams|designers|agencies|freelancers|creators|small businesses|smbs|enterprises|sales teams|product teams|product managers|ecommerce brands|online stores|recruiters|students|teachers|coaches|consultants|indie hackers|makers|operators|finance teams|support teams|saas companies";

const AUDIENCE_RE = new RegExp(`\\bfor\\s+((?:[a-z0-9-]+\\s){0,3}(?:${AUDIENCE_NOUNS}))\\b`, "gi");

const CHANNEL_LINKS: [RegExp, string, string][] = [
  [/(^|\.)(twitter|x)\.com$/, "x_organic", "X profile linked from the site"],
  [/(^|\.)linkedin\.com$/, "linkedin", "LinkedIn page linked from the site"],
  [/(^|\.)youtube\.com$|(^|\.)youtu\.be$/, "youtube_creators", "YouTube channel linked from the site"],
  [/(^|\.)reddit\.com$/, "reddit", "Reddit community linked from the site"],
  [/(^|\.)news\.ycombinator\.com$/, "hacker_news", "Hacker News discussion linked from the site"],
  [/(^|\.)tiktok\.com$/, "tiktok", "TikTok profile linked from the site"],
];

export function extractHeuristically(pages: CrawledPage[], rootUrl: string): ExtractionResult {
  const home = pages.find((p) => p.kind === "home") ?? pages[0];
  const warnings: string[] = [];
  if (!home) return emptyExtraction(rootUrl, ["No page could be read."]);

  const byKind = (kind: PageKind) => pages.find((p) => p.kind === kind);
  const domainLabel = new URL(rootUrl).hostname.replace(/^www\./, "").split(".")[0];

  const productName = extractName(home, domainLabel);
  const oneLiner = extractOneLiner(home);
  const valueProposition = extractValueProp(home);
  const features = extractFeatures(byKind("features") ?? home);
  const pricing = extractPricing(byKind("pricing") ?? home, pages);
  const primaryText = [home, byKind("features")].filter(Boolean).map((p) => `${p!.parsed.title ?? ""}\n${p!.parsed.description ?? ""}\n${p!.parsed.text}`).join("\n");
  const category = extractCategory(primaryText, home.url);
  const audiences = extractAudiences(pages, category.value);
  const competitors = extractCompetitors(pages, productName.value);
  const brand = extractBrand(home.parsed.text);
  const channels = extractChannels(pages);

  for (const page of pages) {
    const hit = detectInjection(page.parsed.text);
    if (hit) warnings.push(`${new URL(page.url).pathname || "/"} contains text addressed to an AI (“${hit.slice(0, 60)}”). It was treated as page content and ignored.`);
  }
  if (pages.length < 2) warnings.push("Only one page could be read, so pricing, features and audience may be incomplete.");
  if (pricing.plans.length === 0) warnings.push("No pricing was found. Add it during review so strategy can estimate an affordable CAC.");

  const ctas = uniq(
    pages
      .flatMap((p) => p.parsed.links.map((l) => l.text))
      .filter((t) => t.length > 2 && t.length < 40 && /^(start|get|try|sign up|book|request|join|create|download|see|watch)\b/i.test(t)),
  ).slice(0, 5);

  // Proof = testimonials (a whole quoted sentence, optionally attributed) or social-proof claims, on marketing pages only.
  const proof = uniq(
    pages
      .filter((p) => p.kind === "home" || p.kind === "customers" || p.kind === "about")
      .flatMap((p) => p.parsed.text.split("\n"))
      .filter(
        (l) =>
          l.length > 40 &&
          l.length < 240 &&
          (/^[“"][^”"]{30,}[”"](\s*[—–-]\s*\S.*)?$/.test(l) || /\b(trusted by|used by|loved by)\b/i.test(l)),
      ),
  ).slice(0, 3);

  return {
    productName,
    oneLiner,
    category,
    valueProposition,
    features,
    pricing,
    audiences,
    competitors,
    brand,
    ctas,
    channels,
    proof,
    logoUrl: home.parsed.icon,
    language: (home.parsed.lang ?? "en").slice(0, 2).toLowerCase(),
    warnings,
  };
}

function extractName(home: CrawledPage, domainLabel: string): Extracted<string> {
  const candidates = [home.parsed.siteName, ...(home.parsed.title ?? "").split(/\s[|–—\-:·]\s|\s?[|–—·]\s?/)]
    .map((s) => s?.trim())
    .filter((s): s is string => Boolean(s) && s!.length <= 40);
  const matching = candidates.find((c) => c.toLowerCase().replace(/[^a-z0-9]/g, "").includes(domainLabel.toLowerCase().replace(/[^a-z0-9]/g, "")));
  if (matching) return { value: matching, confidence: 0.9, evidence: home.parsed.title ?? matching, sourceUrl: home.url };
  if (candidates[0]) return { value: candidates[0], confidence: 0.6, evidence: home.parsed.title ?? candidates[0], sourceUrl: home.url };
  return { value: domainLabel.charAt(0).toUpperCase() + domainLabel.slice(1), confidence: 0.4, sourceUrl: home.url };
}

function extractOneLiner(home: CrawledPage): Extracted<string> {
  const d = home.parsed.description;
  if (d && d.length >= 20) return { value: d.slice(0, 220), confidence: 0.72, evidence: d.slice(0, 220), sourceUrl: home.url };
  const line = home.parsed.text.split("\n").find((l) => l.length > 40 && l.length < 220 && /\b(is|helps|lets|makes|for)\b/i.test(l));
  return line
    ? { value: line, confidence: 0.45, evidence: line, sourceUrl: home.url }
    : { value: "", confidence: 0, sourceUrl: home.url };
}

function extractValueProp(home: CrawledPage): Extracted<string> {
  const h1 = home.parsed.headings.find((h) => h.level === 1 && h.text.length >= 8 && h.text.length <= 140);
  return h1
    ? { value: h1.text, confidence: 0.62, evidence: h1.text, sourceUrl: home.url }
    : { value: home.parsed.description ?? "", confidence: home.parsed.description ? 0.35 : 0, sourceUrl: home.url };
}

function extractFeatures(page: CrawledPage): Extracted<string>[] {
  const conf = page.kind === "features" ? 0.6 : 0.5;
  return uniq(
    page.parsed.headings
      .filter((h) => h.level >= 2)
      .map((h) => h.text.replace(/[.:]$/, ""))
      .filter((t) => {
        const words = t.split(/\s+/).length;
        return words >= 2 && words <= 12 && !GENERIC_HEADINGS.test(t) && !/\?$/.test(t);
      }),
  )
    .slice(0, 6)
    .map((value) => ({ value, confidence: conf, evidence: value, sourceUrl: page.url }));
}

const PRICE_RE = /(?:[$€£])\s?(\d{1,5}(?:[.,]\d{1,2})?)(?:\s?(?:\/|per)\s?(mo|month|yr|year|user|seat))?/i;

function extractPricing(page: CrawledPage, pages: CrawledPage[]): ExtractionResult["pricing"] {
  const text = page.parsed.text;
  const lines = text.split("\n");
  const planNames = new Set(
    page.parsed.headings.filter((h) => h.level >= 2 && h.text.split(/\s+/).length <= 3 && !GENERIC_HEADINGS.test(h.text)).map((h) => h.text),
  );

  const plans: PricingPlan[] = [];
  let current: PricingPlan | null = null;
  for (const line of lines) {
    if (planNames.has(line)) {
      current = { name: line, price: null, period: null, highlights: [] };
      plans.push(current);
      continue;
    }
    if (!current) continue;
    if (current.price === null) {
      const m = line.match(PRICE_RE);
      if (m) {
        current.price = Number(m[1].replace(",", "."));
        const unit = (m[2] ?? "").toLowerCase();
        current.period = unit.startsWith("y") ? "year" : "month";
      } else if (/^free\b/i.test(line)) {
        current.price = 0;
        current.period = "month";
      }
    } else if (current.highlights.length < 3 && line.length > 3 && line.length < 80 && !PRICE_RE.test(line)) {
      current.highlights.push(line);
    }
  }
  const priced = plans.filter((p) => p.price !== null).slice(0, 4);

  const all = pages.map((p) => p.parsed.text).join("\n");
  const trial = all.match(/\b(\d{1,2})[- ]day (?:free )?trial\b|\bfree trial\b/i);
  const hasFree = priced.some((p) => p.price === 0) || /\b(free (?:plan|forever|tier)|free for\b)/i.test(all);
  const model = priced.length
    ? hasFree
      ? "Freemium"
      : trial
        ? "Paid plans with a free trial"
        : "Paid subscription"
    : trial
      ? "Free trial (prices not found)"
      : "Not found";

  return {
    model: { value: model, confidence: priced.length ? 0.7 : trial ? 0.45 : 0.15, sourceUrl: page.url },
    plans: priced,
    freeTrial: trial ? { value: true, confidence: 0.75, evidence: trial[0], sourceUrl: page.url } : null,
    sourceUrl: page.kind === "pricing" ? page.url : undefined,
  };
}

function extractCategory(text: string, url: string): Extracted<string> {
  const lower = ` ${text.toLowerCase()} `;
  let best: [string, number] = ["Software", 0];
  let total = 0;
  for (const [category, words] of Object.entries(CATEGORY_KEYWORDS)) {
    const score = words.reduce((s, w) => s + (lower.match(new RegExp(`[^a-z]${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[^a-z]`, "g"))?.length ?? 0), 0);
    total += score;
    if (score > best[1]) best = [category, score];
  }
  if (best[1] === 0) return { value: "Software", confidence: 0.2, sourceUrl: url };
  const share = best[1] / Math.max(total, 1);
  return { value: best[0], confidence: Math.min(0.75, 0.35 + share * 0.5), sourceUrl: url };
}

function extractAudiences(pages: CrawledPage[], category: string): ExtractionResult["audiences"] {
  const counts = new Map<string, { n: number; evidence: string }>();
  for (const page of pages) {
    for (const line of page.parsed.text.split("\n")) {
      for (const m of line.matchAll(AUDIENCE_RE)) {
        const name = m[1].toLowerCase().replace(/^(all|busy|modern|growing|the|your)\s+/, "");
        const entry = counts.get(name) ?? { n: 0, evidence: line.slice(0, 160) };
        entry.n++;
        counts.set(name, entry);
      }
    }
  }
  const found = [...counts.entries()]
    .sort((a, b) => b[1].n - a[1].n)
    .slice(0, 3)
    .map(([name, { n, evidence }]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      description: "Mentioned as a target audience on the site",
      confidence: Math.min(0.72, 0.4 + n * 0.1),
      evidence,
    }));
  if (found.length) return found;
  const fallback: Record<string, string> = {
    "Developer tools": "Software developers",
    "Marketing software": "Marketing teams at small businesses",
    "Sales & CRM": "Sales teams at small businesses",
  };
  return [{ name: fallback[category] ?? "Small software teams", description: "Inferred from the product category, not stated on the site", confidence: 0.3 }];
}

function extractCompetitors(pages: CrawledPage[], productName: string): ExtractionResult["competitors"] {
  const out = new Map<string, ExtractionResult["competitors"][number]>();
  const self = productName.toLowerCase();
  const add = (name: string, reason: string, confidence: number, url: string | null = null) => {
    const clean = name.trim().replace(/[.,]$/, "");
    const key = clean.toLowerCase();
    if (clean.length < 2 || key === self || key.includes(self) || /^(the|our|your|a|an|this|other)$/i.test(clean)) return;
    if (!out.has(key)) out.set(key, { name: clean, url, kind: "direct", reason, confidence });
  };
  for (const page of pages) {
    for (const link of page.parsed.links) {
      const m = new URL(link.href).pathname.match(/\/(?:vs|compare|alternatives?)\/([a-z0-9-]+)/i);
      if (m) add(m[1].split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "), "Your site has a comparison page for it", 0.6);
    }
    for (const m of page.parsed.text.matchAll(/\b([A-Z][A-Za-z0-9.]{1,20}(?:\s[A-Z][A-Za-z0-9.]{1,20}){0,2})\s+alternative\b/g)) {
      add(m[1].replace(/^(The|An?|Our|Your)\s+/, ""), "Mentioned as an alternative on your site", 0.5);
    }
    for (const m of page.parsed.text.matchAll(/\bvs\.?\s+([A-Z][A-Za-z0-9.]{1,20})/g)) add(m[1], "Compared against on your site", 0.5);
    for (const m of page.parsed.text.matchAll(/\b(?:switch(?:ing)?|migrat(?:e|ing)|mov(?:e|ing)) from\s+([A-Z][A-Za-z0-9.]{1,20})/g)) add(m[1], "Your site targets people switching from it", 0.55);
  }
  return [...out.values()].slice(0, 5);
}

function extractBrand(text: string): ExtractionResult["brand"] {
  const sentences = text.split(/[.!?\n]+/).map((s) => s.trim()).filter((s) => s.split(/\s+/).length >= 3);
  const avgWords = sentences.length ? sentences.reduce((s, x) => s + x.split(/\s+/).length, 0) / sentences.length : 0;
  const lower = text.toLowerCase();
  const traits: string[] = [];
  if (avgWords && avgWords < 12) traits.push("Concise");
  if ((lower.match(/\byou(r)?\b/g)?.length ?? 0) > 8) traits.push("Direct");
  if (/\b(api|sdk|cli|deploy|latency|webhook|json)\b/.test(lower)) traits.push("Technical");
  if ((text.match(/!/g)?.length ?? 0) > 4) traits.push("Energetic");
  if (/\b(enterprise|compliance|secure|soc 2|gdpr)\b/.test(lower)) traits.push("Trust-focused");
  if (traits.length === 0) traits.push("Clear");
  return {
    traits,
    voiceSummary: `${traits.join(", ")} tone${avgWords ? `, with sentences averaging ${Math.round(avgWords)} words` : ""}.`,
    confidence: 0.4,
  };
}

function extractChannels(pages: CrawledPage[]): ExtractionResult["channels"] {
  const found = new Map<string, { channel: string; signal: string; confidence: number }>();
  for (const page of pages) {
    for (const link of page.parsed.links) {
      const host = new URL(link.href).hostname.replace(/^www\./, "");
      for (const [re, channel, signal] of CHANNEL_LINKS) {
        if (re.test(host) && !found.has(channel)) found.set(channel, { channel, signal, confidence: 0.6 });
      }
    }
  }
  const blog = pages.filter((p) => p.kind === "blog").length;
  const blogLinks = pages.flatMap((p) => p.parsed.links).filter((l) => /\/(blog|articles|guides|resources)\//.test(new URL(l.href).pathname)).length;
  if (blog || blogLinks >= 3) found.set("seo_content", { channel: "seo_content", signal: `Blog or guides (${Math.max(blog, blogLinks)} articles found)`, confidence: 0.7 });
  if (pages.some((p) => /\b(subscribe|newsletter)\b/i.test(p.parsed.text))) {
    found.set("email_lifecycle", { channel: "email_lifecycle", signal: "Newsletter or subscribe form on the site", confidence: 0.5 });
  }
  return [...found.values()];
}

function emptyExtraction(rootUrl: string, warnings: string[]): ExtractionResult {
  const none = { value: "", confidence: 0, sourceUrl: rootUrl };
  return {
    productName: none,
    oneLiner: none,
    category: none,
    valueProposition: none,
    features: [],
    pricing: { model: none, plans: [], freeTrial: null },
    audiences: [],
    competitors: [],
    brand: { traits: [], voiceSummary: "", confidence: 0 },
    ctas: [],
    channels: [],
    proof: [],
    logoUrl: null,
    language: "en",
    warnings,
  };
}

function uniq(items: string[]): string[] {
  const seen = new Set<string>();
  return items.filter((i) => {
    const k = i.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
