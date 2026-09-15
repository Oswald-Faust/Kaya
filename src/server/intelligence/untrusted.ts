/**
 * Crawled content is untrusted input. It is only ever passed to a model as
 * delimited data, never concatenated into instructions, and pages that appear
 * to address an AI are flagged so the founder can see it happened.
 */

const INJECTION_PATTERNS = [
  /ignore (?:all |any )?(?:the )?(?:previous|prior|above|earlier) (?:instructions|prompts|messages)/i,
  /disregard (?:all |the )?(?:previous|prior|above) (?:instructions|content)/i,
  /\byou are (?:now )?(?:chatgpt|claude|an ai|a language model|an assistant)\b/i,
  /\b(?:system|developer) prompt\b/i,
  /\bnew instructions?:/i,
  /<\/?(?:system|assistant|instructions?)>/i,
];

export function detectInjection(text: string): string | null {
  for (const pattern of INJECTION_PATTERNS) {
    const m = text.match(pattern);
    if (m) return m[0];
  }
  return null;
}

/** Wraps page content in data delimiters the page itself cannot close. */
export function asUntrustedDocument(index: number, url: string, body: string): string {
  const safe = body.replace(/<\/?untrusted_page/gi, "‹untrusted_page");
  return `<untrusted_page index="${index}" url="${url.replace(/"/g, "%22")}">\n${safe}\n</untrusted_page>`;
}
