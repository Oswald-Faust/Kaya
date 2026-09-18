"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/client";
import { LanguageSwitcher } from "./language-switcher";
import { KayaWordmark } from "@/components/brand/logo";
import { NAV, resolveHref } from "./nav-data";
import { WordRise } from "./motion";

export function SiteFooter({ demoHref = "/demo" }: { demoHref?: string }) {
  const { t } = useI18n();
  const c = t.marketing.chrome;
  return (
    <footer className="bg-cream">
      <div className="mx-auto max-w-[1360px] px-5 pt-16 pb-10 sm:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.3fr_repeat(5,1fr)]">
          <div>
            <KayaWordmark className="text-[24px]" markClassName="size-7" />
            <p className="mt-3 max-w-xs text-[15px] text-muted">{c.footerTagline}</p>
            <Link href="/pricing" className="mt-5 inline-flex h-10 items-center rounded-xl bg-ink px-4 text-sm font-medium text-white hover:bg-ink-hover">
              {c.seePricing}
            </Link>
          </div>
          {NAV.map((menu) => (
            <div key={menu.id}>
              <p className="font-mono text-[11px] tracking-wide text-subtle uppercase">{t.marketing.nav.menus[menu.id].label}</p>
              <ul className="mt-3 space-y-2 text-[15px]">
                {menu.columns
                  .flatMap((c) => c.items)
                  .filter((it) => !it.soon)
                  .slice(0, 7)
                  .map((it) => (
                    <li key={it.id}>
                      <a href={resolveHref(it.href, demoHref)} className="text-ink/75 transition-colors hover:text-ink">
                        {t.marketing.nav.items[it.id].label}
                      </a>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-16 text-[clamp(96px,22vw,320px)] leading-[0.8] font-semibold tracking-[-0.07em] text-ink select-none">
          <WordRise text="kaya" />
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6 text-sm text-muted">
          <p>© {new Date().getFullYear()} Kaya</p>
          <div className="flex flex-wrap items-center gap-5">
            <Link href="/pricing" className="hover:text-ink">
              {c.pricing}
            </Link>
            <Link href="/brand" className="hover:text-ink">
              {c.brand}
            </Link>
            <span>{c.builtFor}</span>
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </footer>
  );
}
