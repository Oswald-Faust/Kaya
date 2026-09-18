"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, ChevronDown, Menu, X } from "lucide-react";
import { KayaWordmark } from "@/components/brand/logo";
import { ControlSpot, DecideSpot, ExperimentSpot, LearnSpot, UnderstandSpot } from "@/components/brand/clay";
import { NAV, TONE_CARD, TONE_TILE, resolveHref, type NavItem, type NavMenu } from "./nav-data";
import { EASE } from "./motion";
import { cn } from "@/lib/cn";
import { useI18n } from "@/i18n/client";
import { LanguageSwitcher } from "./language-switcher";

const SPOTS = { understand: UnderstandSpot, decide: DecideSpot, experiment: ExperimentSpot, control: ControlSpot, learn: LearnSpot };
const COLS: Record<number, string> = { 1: "grid-cols-1", 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4" };

function SmartLink({ href, className, onClick, children }: { href: string; className?: string; onClick?: () => void; children: ReactNode }) {
  // Hash links on the home page must be real anchors so `hashchange` fires (tabs listen to it).
  if (href.includes("#")) {
    return (
      <a href={href} className={className} onClick={onClick}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}

export function SiteNav({ appHref = null, demoHref = "/demo" }: { appHref?: string | null; demoHref?: string }) {
  const { t } = useI18n();
  const c = t.marketing.chrome;
  const nav = t.marketing.nav;
  const [open, setOpen] = useState<string | null>(null);
  const [mobile, setMobile] = useState(false);
  const closeTimer = useRef<number | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(null);
        setMobile(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobile ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobile]);

  const cancelClose = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = window.setTimeout(() => setOpen(null), 160);
  };
  const close = () => {
    setOpen(null);
    setMobile(false);
  };

  const menu = NAV.find((m) => m.id === open);

  return (
    <header className="sticky top-0 z-50 h-[76px] px-3 pt-3">
      <div
        onMouseEnter={cancelClose}
        onMouseLeave={scheduleClose}
        className={cn("mx-auto max-w-[1360px] overflow-hidden rounded-2xl bg-surface/95 shadow-float backdrop-blur transition-shadow", menu && "shadow-pop")}
      >
        <nav aria-label={c.main} className="flex h-14 items-center gap-1 pr-2 pl-4">
          <Link href="/" aria-label={c.home} onClick={close} className="mr-5">
            <KayaWordmark />
          </Link>
          <ul className="hidden items-center gap-0.5 text-[15px] lg:flex">
            {NAV.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  aria-expanded={open === m.id}
                  aria-controls={`menu-${m.id}`}
                  onMouseEnter={() => setOpen(m.id)}
                  onClick={() => setOpen((v) => (v === m.id ? null : m.id))}
                  className={cn("inline-flex items-center gap-1 rounded-lg px-3 py-1.5 transition-colors hover:bg-sunken", open === m.id ? "text-ink" : "text-ink/80")}
                >
                  {nav.menus[m.id].label}
                  <ChevronDown className={cn("size-3.5 text-subtle transition-transform", open === m.id && "rotate-180")} />
                </button>
              </li>
            ))}
            <li>
              <Link href="/pricing" onMouseEnter={() => setOpen(null)} className="rounded-lg px-3 py-1.5 text-ink/80 transition-colors hover:bg-sunken">
                {c.pricing}
              </Link>
            </li>
          </ul>

          <div className="ml-auto flex items-center gap-1.5">
            <LanguageSwitcher className="hidden sm:block" />
            {appHref ? (
              <Link href={appHref} className="inline-flex h-9 items-center rounded-xl bg-ink px-3.5 text-sm font-medium text-white transition-colors hover:bg-ink-hover">
                {c.openWorkspace}
              </Link>
            ) : (
              <>
                <Link href="/login" className="hidden rounded-lg px-3 py-1.5 text-[15px] transition-colors hover:bg-sunken md:inline-flex">
                  {c.logIn}
                </Link>
                <Link href={demoHref} className="hidden h-9 items-center rounded-xl bg-sunken px-3.5 text-sm font-medium transition-colors hover:bg-stone sm:inline-flex">
                  {c.getDemo}
                </Link>
                <Link href="/signup" className="inline-flex h-9 items-center rounded-xl bg-ink px-3.5 text-sm font-medium text-white transition-colors hover:bg-ink-hover">
                  {c.startFree}
                </Link>
              </>
            )}
            <button
              type="button"
              aria-label={mobile ? c.closeMenu : c.openMenu}
              aria-expanded={mobile}
              onClick={() => setMobile((v) => !v)}
              className="grid size-9 place-items-center rounded-xl transition-colors hover:bg-sunken lg:hidden"
            >
              {mobile ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </nav>

        <AnimatePresence initial={false}>
          {menu && (
            <motion.div
              key="panel"
              id={`menu-${menu.id}`}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.28, ease: EASE }}
              className="hidden lg:block"
            >
              <MegaPanel menu={menu} demoHref={demoHref} onNavigate={close} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {mobile && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: EASE }}
            className="fixed inset-x-3 top-[76px] bottom-3 z-50 overflow-y-auto rounded-2xl bg-surface p-3 shadow-pop lg:hidden"
          >
            {NAV.map((m) => (
              <details key={m.id} className="group border-b border-line">
                <summary className="flex cursor-pointer list-none items-center justify-between px-2 py-4 text-lg font-medium [&::-webkit-details-marker]:hidden">
                  {nav.menus[m.id].label}
                  <ChevronDown className="size-4 text-subtle transition-transform group-open:rotate-180" />
                </summary>
                <div className="space-y-4 px-2 pb-4">
                  {m.columns.map((col) => (
                    <div key={col.id}>
                      <p className="font-mono text-[11px] tracking-wide text-subtle uppercase">{nav.columns[col.id]}</p>
                      <ul className="mt-2 space-y-1">
                        {col.items.map((it) => (
                          <li key={it.id}>
                            <MenuItem item={it} demoHref={demoHref} onNavigate={close} />
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </details>
            ))}
            <Link href="/pricing" onClick={close} className="block border-b border-line px-2 py-4 text-lg font-medium">
              {c.pricing}
            </Link>
            <div className="mt-4 grid gap-2">
              {appHref ? (
                <Link href={appHref} onClick={close} className="flex h-12 items-center justify-center rounded-xl bg-ink font-medium text-white">
                  {c.openWorkspace}
                </Link>
              ) : (
                <>
                  <Link href="/login" onClick={close} className="flex h-12 items-center justify-center rounded-xl border border-line font-medium">
                    {c.logIn}
                  </Link>
                  <Link href={demoHref} onClick={close} className="flex h-12 items-center justify-center rounded-xl bg-sunken font-medium">
                    {c.getDemo}
                  </Link>
                  <Link href="/signup" onClick={close} className="flex h-12 items-center justify-center rounded-xl bg-ink font-medium text-white">
                    {c.startFree}
                  </Link>
                </>
              )}
              <LanguageSwitcher className="mt-2 sm:hidden" align="left" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function MenuItem({ item, demoHref, onNavigate }: { item: NavItem; demoHref: string; onNavigate: () => void }) {
  const { t } = useI18n();
  const copy: { label: string; desc?: string } = t.marketing.nav.items[item.id];
  const inner = (
    <>
      <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl transition-transform group-hover/item:scale-105", TONE_TILE[item.tone])}>
        <item.icon className="size-[18px]" />
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-2 text-[15px] text-ink">
          {copy.label}
          {item.soon && <span className="rounded-full bg-sunken px-1.5 py-0.5 font-mono text-[9px] tracking-wide text-subtle uppercase">{t.marketing.chrome.soon}</span>}
        </span>
        {copy.desc && <span className="block text-[13px] leading-snug text-muted">{copy.desc}</span>}
      </span>
    </>
  );
  const className = cn("group/item flex items-center gap-3 rounded-xl p-1.5 transition-colors", item.soon ? "cursor-default opacity-70" : "hover:bg-sunken");
  if (item.soon) return <span className={className}>{inner}</span>;
  return (
    <SmartLink href={resolveHref(item.href, demoHref)} className={className} onClick={onNavigate}>
      {inner}
    </SmartLink>
  );
}

function MegaPanel({ menu, demoHref, onNavigate }: { menu: NavMenu; demoHref: string; onNavigate: () => void }) {
  const Spot = SPOTS[menu.featured.spot];
  const { t } = useI18n();
  const copy = t.marketing.nav;
  return (
    <div className="grid gap-6 border-t border-line p-5 lg:grid-cols-[1fr_320px]">
      <div className={cn("grid gap-6", COLS[menu.columns.length])}>
        {menu.columns.map((col, i) => (
          <motion.div key={col.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: EASE, delay: 0.04 * i }}>
            <p className="px-1.5 font-mono text-[11px] tracking-[0.12em] text-subtle uppercase">{copy.columns[col.id]}</p>
            <ul className="mt-2 space-y-0.5">
              {col.items.map((it) => (
                <li key={it.id}>
                  <MenuItem item={it} demoHref={demoHref} onNavigate={onNavigate} />
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>
      <SmartLink
        href={resolveHref(menu.featured.href, demoHref)}
        onClick={onNavigate}
        className={cn("group relative flex min-h-[240px] flex-col justify-end overflow-hidden rounded-2xl p-5", TONE_CARD[menu.featured.tone])}
      >
        <div data-inview="true" className="absolute -top-6 -right-6 w-56 transition-transform duration-500 group-hover:scale-105">
          <Spot className="w-full" />
        </div>
        <p className="relative font-mono text-[11px] tracking-[0.12em] text-ink/60 uppercase">{copy.menus[menu.id].kicker}</p>
        <p className="relative mt-1 max-w-[16rem] text-lg leading-snug font-medium tracking-[-0.02em] text-ink">{copy.menus[menu.id].title}</p>
        <ArrowRight className="relative mt-3 size-4 transition-transform group-hover:translate-x-1" />
      </SmartLink>
    </div>
  );
}
