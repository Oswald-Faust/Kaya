/** Languages Kaya ships in. Pure; safe on server and client. */

export const LOCALES = ["en", "fr"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "kaya_locale";

/** BCP 47 tags for Intl formatting. */
export const INTL_LOCALE: Record<Locale, string> = { en: "en-US", fr: "fr-FR" };

export const LOCALE_NAMES: Record<Locale, { native: string; english: string }> = {
  en: { native: "English", english: "English" },
  fr: { native: "Français", english: "French" },
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/** Picks the best supported language from an Accept-Language header. */
export function matchAcceptLanguage(header: string | null | undefined): Locale | null {
  if (!header) return null;
  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { lang: tag.toLowerCase().split("-")[0], q: q ? Number(q) : 1 };
    })
    .filter((x) => x.lang && !Number.isNaN(x.q))
    .sort((a, b) => b.q - a.q);
  return ranked.map((x) => x.lang).find(isLocale) ?? null;
}
