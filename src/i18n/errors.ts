import { DomainError, isDomainError, type DomainErrorCode } from "@/server/domain/errors";
import type { Locale } from "./config";
import { dictionaries } from "./dictionaries";
import { en } from "./dictionaries/en";
import { fmt, plural, type PluralForms } from "./format";
import { translateServerText } from "./server-text";

export type ErrorKey = keyof typeof en.errors;
type Vars = Record<string, string | number>;

function render(locale: Locale, key: ErrorKey, vars: Vars): string {
  const template: string | PluralForms = dictionaries[locale].errors[key];
  return typeof template === "string" ? fmt(template, vars) : plural(locale, Number(vars.count ?? 0), template, vars);
}

/** A DomainError whose message can be shown in the user's language. The English message stays for logs. */
export function localizedError(code: DomainErrorCode, key: ErrorKey, vars: Vars = {}): DomainError {
  return new DomainError(code, render("en", key, vars), { i18n: key, vars });
}

/** The user-facing message for an expected error, or null for a bug that should stay generic. */
export function localizeError(error: unknown, locale: Locale): string | null {
  if (!isDomainError(error)) return null;
  const key = error.details?.i18n as ErrorKey | undefined;
  if (key && key in en.errors) return render(locale, key, (error.details?.vars as Vars) ?? {});
  const authKey = error.details?.authKey as keyof typeof en.auth.errors | undefined;
  if (authKey && authKey in en.auth.errors) return dictionaries[locale].auth.errors[authKey];
  return translateServerText(error.message, locale);
}
