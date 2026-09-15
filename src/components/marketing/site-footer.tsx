import Link from "next/link";
import { KayaWordmark } from "@/components/brand/logo";
import { NAV, resolveHref } from "./nav-data";
import { WordRise } from "./motion";

export function SiteFooter({ demoHref = "/demo" }: { demoHref?: string }) {
  return (
    <footer className="bg-cream">
      <div className="mx-auto max-w-[1360px] px-5 pt-16 pb-10 sm:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.3fr_repeat(5,1fr)]">
          <div>
            <KayaWordmark className="text-[24px]" markClassName="size-7" />
            <p className="mt-3 max-w-xs text-[15px] text-muted">The AI agent that does your marketing, so you can keep building.</p>
            <Link href="/pricing" className="mt-5 inline-flex h-10 items-center rounded-xl bg-ink px-4 text-sm font-medium text-white hover:bg-ink-hover">
              See pricing
            </Link>
          </div>
          {NAV.map((menu) => (
            <div key={menu.id}>
              <p className="font-mono text-[11px] tracking-wide text-subtle uppercase">{menu.label}</p>
              <ul className="mt-3 space-y-2 text-[15px]">
                {menu.columns
                  .flatMap((c) => c.items)
                  .filter((it) => !it.soon)
                  .slice(0, 7)
                  .map((it) => (
                    <li key={it.label}>
                      <a href={resolveHref(it.href, demoHref)} className="text-ink/75 transition-colors hover:text-ink">
                        {it.label}
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
          <div className="flex gap-5">
            <Link href="/pricing" className="hover:text-ink">
              Pricing
            </Link>
            <Link href="/brand" className="hover:text-ink">
              Brand
            </Link>
            <span>Built for founders who build.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
