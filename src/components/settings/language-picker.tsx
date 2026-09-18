"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { Spinner } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { setLocaleAction } from "@/app/actions/locale";
import { useI18n } from "@/i18n/client";
import { LOCALE_NAMES, LOCALES, type Locale } from "@/i18n/config";
import { formatDate, formatUsd } from "@/lib/format";

const SAMPLE_DATE = new Date("2026-03-14T00:00:00Z");

/** Squarespace/Telegram pattern: native name first, then the name in the current language; applies immediately. */
export function LanguagePicker({ saved }: { saved: boolean }) {
  const router = useRouter();
  const { t, locale } = useI18n();
  const p = t.settings.preferences;
  const [pendingLocale, setPendingLocale] = useState<Locale | null>(null);
  const [pending, start] = useTransition();

  return (
    <div>
      <div role="radiogroup" aria-label={p.languageTitle} className="divide-y divide-line">
        {LOCALES.map((l) => {
          const active = l === locale;
          return (
            <button
              key={l}
              type="button"
              role="radio"
              aria-checked={active}
              lang={l}
              disabled={pending}
              onClick={() => {
                if (active && saved) return;
                setPendingLocale(l);
                start(async () => {
                  await setLocaleAction(l);
                  router.refresh();
                });
              }}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-raised disabled:cursor-wait"
            >
              <span className={cn("grid size-4 shrink-0 place-items-center rounded-full border", active ? "border-ink bg-ink" : "border-line-strong bg-surface")}>
                {active && <span className="size-1.5 rounded-full bg-white" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-ink">{LOCALE_NAMES[l].native}</span>
                <span className="block text-xs text-muted">
                  {formatDate(SAMPLE_DATE, { weekday: "long", day: "numeric", month: "long" }, l)} · {formatUsd(12480, {}, l)}
                </span>
              </span>
              {pending && pendingLocale === l ? (
                <Spinner className="text-subtle" />
              ) : (
                active && (
                  <span className="flex items-center gap-1 text-xs text-positive">
                    <Check className="size-3.5" />
                    {p.current}
                  </span>
                )
              )}
            </button>
          );
        })}
      </div>
      <p className="border-t border-line px-4 py-2.5 text-xs text-muted">{saved ? p.savedOnAccount : p.fromBrowser}</p>
    </div>
  );
}
