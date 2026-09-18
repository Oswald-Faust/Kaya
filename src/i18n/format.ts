import type { Locale } from "./config";
import { INTL_LOCALE } from "./config";

/** Fills `{name}` placeholders. Unknown placeholders are left visible so they get noticed. */
export function fmt(template: string, vars: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in vars ? String(vars[key]) : match));
}

export interface PluralForms {
  one: string;
  other: string;
}

/** Chooses the plural form for `count` (French treats 0 and 1 as singular) and fills `{count}`. */
export function plural(locale: Locale, count: number, forms: PluralForms, vars: Record<string, string | number> = {}): string {
  const rule = new Intl.PluralRules(INTL_LOCALE[locale]).select(count);
  return fmt(rule === "one" ? forms.one : forms.other, { count, ...vars });
}
