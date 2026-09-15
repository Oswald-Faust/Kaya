import "server-only";
import { lookup } from "node:dns/promises";
import { DomainError, isDomainError } from "@/server/domain/errors";
import type { PageKind, SnapshotPage } from "@/server/domain/types";
import { parseHtml } from "./html";
import type { CrawledPage } from "./heuristic-extractor";
import { isPrivateAddress, normalizeProductUrl } from "./url-safety";

/**
 * Safe, polite crawler for public marketing sites.
 * - Every hop (including redirects) re-validates the URL and resolves DNS,
 *   rejecting private addresses (SSRF). Residual risk: DNS rebinding between
 *   lookup and connect; production should route through an egress proxy.
 * - Respects robots.txt Disallow rules for all agents.
 * - Caps redirects, response size, content type, time and page count.
 */

const USER_AGENT = "KayaAnalyzer/1.0 (+https://kaya.ai/bot)";
const MAX_BYTES = 1_500_000;
const MAX_REDIRECTS = 4;

export interface FetchedDocument {
  url: string;
  status: number;
  contentType: string;
  body: string;
  bytes: number;
}

async function assertPublicHost(hostname: string): Promise<void> {
  const host = hostname.replace(/^\[|\]$/g, "");
  let addresses: { address: string }[];
  try {
    addresses = await lookup(host, { all: true, verbatim: true });
  } catch {
    throw new DomainError("upstream", `Couldn't find ${host}. Check the address.`);
  }
  if (addresses.length === 0 || addresses.some((a) => isPrivateAddress(a.address))) {
    throw new DomainError("unsafe_url", `${host} resolves to a private network address and can't be analyzed.`);
  }
}

async function readLimited(res: Response): Promise<{ body: string; bytes: number }> {
  if (!res.body) return { body: "", bytes: 0 };
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > MAX_BYTES) {
      await reader.cancel();
      break;
    }
    chunks.push(value);
  }
  return { body: new TextDecoder("utf-8", { fatal: false }).decode(Buffer.concat(chunks)), bytes: Math.min(bytes, MAX_BYTES) };
}

export async function safeFetch(rawUrl: string, opts: { timeoutMs: number; accept?: string }): Promise<FetchedDocument> {
  let url = normalizeProductUrl(rawUrl);
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertPublicHost(url.hostname);
    let res: Response;
    try {
      res = await fetch(url, {
        redirect: "manual",
        signal: AbortSignal.timeout(opts.timeoutMs),
        headers: { "user-agent": USER_AGENT, accept: opts.accept ?? "text/html,application/xhtml+xml;q=0.9,*/*;q=0.5", "accept-language": "en;q=0.9,*;q=0.5" },
      });
    } catch (error) {
      const timedOut = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
      throw new DomainError("upstream", timedOut ? `${url.hostname} took too long to respond.` : `Couldn't reach ${url.hostname}.`);
    }
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (!location) throw new DomainError("upstream", `${url.hostname} redirected without a destination.`);
      url = normalizeProductUrl(new URL(location, url).toString());
      continue;
    }
    const contentType = res.headers.get("content-type") ?? "";
    const { body, bytes } = await readLimited(res);
    return { url: url.toString(), status: res.status, contentType, body, bytes };
  }
  throw new DomainError("upstream", "Too many redirects.");
}

export function classifyPage(url: string, root: URL): PageKind {
  const path = new URL(url).pathname.toLowerCase().replace(/\/$/, "");
  if (path === "" || path === new URL(root).pathname.replace(/\/$/, "")) return "home";
  if (/\/(pricing|plans|price|tarifs?|preise)(\/|$)/.test(path)) return "pricing";
  if (/\/(features?|product|platform|how-it-works|solutions?|use-cases?|why)(\/|$)/.test(path)) return "features";
  if (/\/(customers?|case-stud(y|ies)|testimonials|stories|showcase)(\/|$)/.test(path)) return "customers";
  if (/\/(about|company|team|story|mission)(\/|$)/.test(path)) return "about";
  if (/\/(docs?|documentation|guides?|help|quickstart|getting-started)(\/|$)/.test(path)) return "docs";
  if (/\/(blog|articles?|posts?|news|changelog|resources)(\/|$)/.test(path)) return "blog";
  return "other";
}

const KIND_PRIORITY: Record<PageKind, number> = { home: 0, pricing: 100, features: 90, customers: 70, about: 60, docs: 50, blog: 40, other: 10 };
const SKIP = /\/(log-?in|sign-?in|sign-?up|register|auth|account|dashboard|app|cart|checkout|legal|privacy|terms|cookies?|careers|jobs|press|status|security\.txt)(\/|$)|\.(pdf|png|jpe?g|gif|svg|webp|zip|xml|json|css|js|mp4)$/i;

interface RobotsRules {
  disallow: string[];
  sitemaps: string[];
}

export function parseRobots(text: string): RobotsRules {
  const rules: RobotsRules = { disallow: [], sitemaps: [] };
  let applies = false;
  for (const raw of text.split("\n")) {
    const line = raw.replace(/#.*/, "").trim();
    const [field, ...rest] = line.split(":");
    const value = rest.join(":").trim();
    switch (field?.toLowerCase()) {
      case "user-agent":
        applies = value === "*";
        break;
      case "disallow":
        if (applies && value) rules.disallow.push(value);
        break;
      case "sitemap":
        if (value) rules.sitemaps.push(value);
        break;
    }
  }
  return rules;
}

function allowedByRobots(url: string, rules: RobotsRules): boolean {
  const path = new URL(url).pathname;
  return !rules.disallow.some((rule) => rule === "/" ? false : path.startsWith(rule.replace(/\*.*$/, "")));
}

async function readSitemap(url: string, host: string, timeoutMs: number, depth = 0): Promise<string[]> {
  try {
    const doc = await safeFetch(url, { timeoutMs, accept: "application/xml,text/xml;q=0.9,*/*;q=0.5" });
    if (doc.status !== 200) return [];
    const locs = [...doc.body.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => m[1].replace(/&amp;/g, "&"));
    if (/<sitemapindex/i.test(doc.body) && depth === 0) {
      const preferred = locs.find((l) => /page|main|en/i.test(l)) ?? locs[0];
      return preferred ? readSitemap(preferred, host, timeoutMs, 1) : [];
    }
    return locs.filter((l) => {
      try {
        return new URL(l).hostname.replace(/^www\./, "") === host;
      } catch {
        return false;
      }
    });
  } catch {
    return [];
  }
}

export interface DiscoveryResult {
  candidates: string[];
  selected: string[];
  robots: RobotsRules;
}

export async function discoverPages(home: CrawledPage, root: URL, opts: { maxPages: number; timeoutMs: number }): Promise<DiscoveryResult> {
  const host = new URL(home.url).hostname.replace(/^www\./, "");
  let robots: RobotsRules = { disallow: [], sitemaps: [] };
  try {
    const doc = await safeFetch(new URL("/robots.txt", home.url).toString(), { timeoutMs: opts.timeoutMs, accept: "text/plain" });
    if (doc.status === 200) robots = parseRobots(doc.body);
  } catch {
    // No robots.txt: nothing is disallowed.
  }

  const sitemapUrls = robots.sitemaps.length ? robots.sitemaps.slice(0, 1) : [new URL("/sitemap.xml", home.url).toString()];
  const fromSitemap = (await Promise.all(sitemapUrls.map((u) => readSitemap(u, host, opts.timeoutMs)))).flat();
  const fromLinks = home.parsed.links.map((l) => l.href).filter((href) => new URL(href).hostname.replace(/^www\./, "") === host);

  const seen = new Set<string>([normalizeKey(home.url)]);
  const candidates: string[] = [];
  for (const href of [...fromLinks, ...fromSitemap]) {
    const key = normalizeKey(href);
    if (seen.has(key) || SKIP.test(new URL(href).pathname) || !allowedByRobots(href, robots)) continue;
    seen.add(key);
    candidates.push(href.split("?")[0]);
  }

  const perKindLimit: Partial<Record<PageKind, number>> = { docs: 1, blog: 1, other: 1, customers: 1, about: 1, pricing: 1, features: 2 };
  const taken: Partial<Record<PageKind, number>> = {};
  const selected = candidates
    .map((url) => ({ url, kind: classifyPage(url, root), depth: new URL(url).pathname.split("/").filter(Boolean).length }))
    .sort((a, b) => KIND_PRIORITY[b.kind] - KIND_PRIORITY[a.kind] || a.depth - b.depth)
    .filter((c) => {
      const n = taken[c.kind] ?? 0;
      if (n >= (perKindLimit[c.kind] ?? 1)) return false;
      taken[c.kind] = n + 1;
      return true;
    })
    .slice(0, Math.max(0, opts.maxPages - 1))
    .map((c) => c.url);

  return { candidates, selected, robots };
}

function normalizeKey(url: string): string {
  const u = new URL(url);
  return `${u.hostname.replace(/^www\./, "")}${u.pathname.replace(/\/$/, "")}`;
}

export async function fetchPage(url: string, root: URL, timeoutMs: number): Promise<{ page: CrawledPage | null; snapshot: SnapshotPage }> {
  const fetchedAt = new Date().toISOString();
  try {
    const doc = await safeFetch(url, { timeoutMs });
    const kind = classifyPage(doc.url, root);
    if (doc.status >= 400) {
      return { page: null, snapshot: { url, kind, title: null, status: doc.status, bytes: doc.bytes, fetchedAt, error: `HTTP ${doc.status}` } };
    }
    if (!/html/i.test(doc.contentType)) {
      return { page: null, snapshot: { url, kind, title: null, status: "skipped", bytes: doc.bytes, fetchedAt, error: `Not HTML (${doc.contentType || "unknown type"})` } };
    }
    const parsed = parseHtml(doc.body, doc.url);
    return { page: { url: doc.url, kind, parsed }, snapshot: { url: doc.url, kind, title: parsed.title, status: doc.status, bytes: doc.bytes, fetchedAt } };
  } catch (error) {
    const message = isDomainError(error) ? error.message : "Unexpected error while reading the page.";
    if (isDomainError(error) && error.code === "unsafe_url") throw error;
    return { page: null, snapshot: { url, kind: classifyPage(url, root), title: null, status: "error", bytes: 0, fetchedAt, error: message } };
  }
}
