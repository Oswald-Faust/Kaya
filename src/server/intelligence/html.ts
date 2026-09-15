/**
 * Minimal, dependency-free HTML reader for marketing pages. It does not try to
 * be a browser: it extracts the signals product analysis needs (title, meta,
 * headings, readable text, links) and discards scripts, styles and markup.
 */

export interface ParsedHeading {
  level: 1 | 2 | 3;
  text: string;
}

export interface ParsedLink {
  href: string;
  text: string;
}

export interface ParsedPage {
  url: string;
  title: string | null;
  description: string | null;
  siteName: string | null;
  ogImage: string | null;
  icon: string | null;
  lang: string | null;
  headings: ParsedHeading[];
  text: string;
  links: ParsedLink[];
}

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  mdash: "—",
  ndash: "–",
  rsquo: "’",
  lsquo: "‘",
  rdquo: "”",
  ldquo: "“",
  hellip: "…",
  middot: "·",
  copy: "©",
  trade: "™",
  reg: "®",
  euro: "€",
  pound: "£",
  times: "×",
  rarr: "→",
};

const MAX_TEXT = 12_000;

export function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
    if (entity[0] === "#") {
      const code = entity[1].toLowerCase() === "x" ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code < 0x110000 ? String.fromCodePoint(code) : match;
    }
    return ENTITIES[entity.toLowerCase()] ?? match;
  });
}

function collapse(s: string): string {
  return decodeEntities(s.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

function attr(tag: string, name: string): string | null {
  const m = tag.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  return m ? decodeEntities(m[1] ?? m[2] ?? m[3] ?? "").trim() : null;
}

function resolve(href: string | null, base: string): string | null {
  if (!href || /^(mailto:|tel:|javascript:|data:|#)/i.test(href)) return null;
  try {
    const u = new URL(href, base);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    u.hash = "";
    return u.toString();
  } catch {
    return null;
  }
}

export function parseHtml(html: string, pageUrl: string): ParsedPage {
  const stripped = html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|noscript|svg|template|iframe|canvas)\b[\s\S]*?<\/\1>/gi, " ");

  const metaTags = stripped.match(/<meta\b[^>]*>/gi) ?? [];
  const meta = (...keys: string[]) => {
    for (const key of keys) {
      for (const tag of metaTags) {
        const k = (attr(tag, "property") ?? attr(tag, "name") ?? "").toLowerCase();
        if (k === key) {
          const content = attr(tag, "content");
          if (content) return content;
        }
      }
    }
    return null;
  };

  let icon: string | null = null;
  for (const tag of stripped.match(/<link\b[^>]*>/gi) ?? []) {
    const rel = (attr(tag, "rel") ?? "").toLowerCase();
    if (rel.includes("apple-touch-icon") || (rel.includes("icon") && !icon)) icon = resolve(attr(tag, "href"), pageUrl) ?? icon;
  }

  const headings: ParsedHeading[] = [];
  for (const m of stripped.matchAll(/<h([1-3])\b[^>]*>([\s\S]*?)<\/h\1>/gi)) {
    const text = collapse(m[2]);
    if (text && text.length <= 200) headings.push({ level: Number(m[1]) as 1 | 2 | 3, text });
  }

  const links: ParsedLink[] = [];
  const seenLinks = new Set<string>();
  for (const m of stripped.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const href = resolve(attr(`<a ${m[1]}>`, "href"), pageUrl);
    if (!href || seenLinks.has(href)) continue;
    seenLinks.add(href);
    links.push({ href, text: collapse(m[2]).slice(0, 120) });
  }

  const bodyMatch = stripped.match(/<body\b[^>]*>([\s\S]*)<\/body>/i);
  const body = (bodyMatch ? bodyMatch[1] : stripped)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6]|section|article|header|footer|nav|tr|td|th|button|a|span|label|dt|dd|blockquote)>/gi, "\n")
    .replace(/<[^>]+>/g, " ");
  const seenLines = new Set<string>();
  const lines: string[] = [];
  for (const raw of decodeEntities(body).split("\n")) {
    const line = raw.replace(/\s+/g, " ").trim();
    if (line.length < 2 || seenLines.has(line)) continue;
    seenLines.add(line);
    lines.push(line);
  }

  return {
    url: pageUrl,
    title: collapse(stripped.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "") || null,
    description: meta("description", "og:description", "twitter:description"),
    siteName: meta("og:site_name", "application-name"),
    ogImage: resolve(meta("og:image", "twitter:image"), pageUrl),
    icon,
    lang: attr(stripped.match(/<html\b[^>]*>/i)?.[0] ?? "", "lang"),
    headings,
    text: lines.join("\n").slice(0, MAX_TEXT),
    links,
  };
}
