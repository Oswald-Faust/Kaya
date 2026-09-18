import "server-only";
import { cookies, headers } from "next/headers";
import { cache } from "react";
import { currentUser } from "@/server/context";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, matchAcceptLanguage, type Locale } from "./config";
import { dictionaries, type Dictionary } from "./dictionaries";

/**
 * The request's language: the signed-in user's saved choice, then the visitor
 * cookie set by the language switcher, then the browser, then English.
 */
export const getLocale = cache(async (): Promise<Locale> => {
  // Public pages must render without a database: a failed lookup just skips the saved preference.
  const user = await currentUser().catch(() => null);
  if (user && !user.isGuest && isLocale(user.locale)) return user.locale;
  const cookie = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(cookie)) return cookie;
  return matchAcceptLanguage((await headers()).get("accept-language")) ?? DEFAULT_LOCALE;
});

export async function getI18n(): Promise<{ locale: Locale; t: Dictionary }> {
  const locale = await getLocale();
  return { locale, t: dictionaries[locale] };
}
