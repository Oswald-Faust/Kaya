"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode, type Ref } from "react";
import { ArrowLeft, ArrowRight, Check, Compass, X } from "lucide-react";
import { markPageTourSeenAction } from "@/app/(app)/w/[workspace]/actions";
import { buttonClass } from "@/components/ui/button";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n/format";
import { cn } from "@/lib/cn";
import { pageTourKey, type PageTourKey } from "@/lib/page-tours";

/**
 * First-visit tour of a single page. The first time someone lands on a page it
 * introduces the page, then spotlights each part of it (anchored on
 * `data-tour`). Steps whose anchor isn't on screen are left out, so an empty
 * workspace gets a shorter tour instead of pointing at nothing.
 */

export const PAGE_TOUR_EVENT = "kaya:page-tour";

const STORAGE_KEY = "kaya:page-tours-seen";
const CARD_WIDTH = 340;
const GAP = 14;
const MARGIN = 16;
const HALO = 6;
/** Pages stream in; give the anchors this long to appear before giving up. */
const WAIT_MS = 4000;

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function visibleElement(target: string): HTMLElement | null {
  for (const el of document.querySelectorAll<HTMLElement>(`[data-tour="${target}"]`)) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) return el;
  }
  return null;
}

function readLocalSeen(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function writeLocalSeen(seen: string[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seen));
  } catch {
    // Private mode or blocked storage: the tour may show again, nothing breaks.
  }
}

export function PageTour({
  seen: initialSeen,
  persist,
  paused,
  holdPath,
}: {
  /** Pages already toured, from the account. */
  seen: string[];
  /** Signed-in users save to their account; guests keep it in this browser. */
  persist: boolean;
  /** True while something else (the first-login tour) owns the screen. */
  paused: boolean;
  /** A path where the tour must not open by itself on this visit. */
  holdPath: string | null;
}) {
  const pathname = usePathname();
  const key = pageTourKey(pathname);
  const { t } = useI18n();
  // Nothing here is rendered, so reading the browser's copy up front can't cause a hydration mismatch.
  const [seen, setSeen] = useState(() => new Set([...initialSeen, ...(persist || typeof window === "undefined" ? [] : readLocalSeen())]));
  const [opened, setOpen] = useState<{ key: PageTourKey; steps: string[] } | null>(null);
  // Leaving the page drops its tour.
  const open = opened && opened.key === key ? opened : null;

  const available = useCallback((page: PageTourKey) => Object.keys(t.pageTours.pages[page].steps).filter((target) => visibleElement(target)), [t]);

  // Waits for the page's anchors, then opens. Resolves with the steps found.
  const waitForSteps = useCallback(
    (page: PageTourKey, onReady: (steps: string[]) => void) => {
      const started = Date.now();
      let last = -1;
      let stableSince = 0;
      const timer = window.setInterval(() => {
        const steps = available(page);
        if (steps.length !== last) {
          last = steps.length;
          stableSince = Date.now();
        }
        const settled = steps.length > 0 && Date.now() - stableSince >= 800;
        if (settled || Date.now() - started > WAIT_MS) {
          window.clearInterval(timer);
          if (steps.length > 0) onReady(steps);
        }
      }, 150);
      return () => window.clearInterval(timer);
    },
    [available],
  );

  useEffect(() => {
    if (!key || paused || open || seen.has(key) || pathname === holdPath) return;
    return waitForSteps(key, (steps) => setOpen({ key, steps }));
  }, [key, paused, open, seen, pathname, holdPath, waitForSteps]);

  useEffect(() => {
    const replay = () => {
      if (!key) return;
      const steps = available(key);
      if (steps.length > 0) setOpen({ key, steps });
    };
    window.addEventListener(PAGE_TOUR_EVENT, replay);
    return () => window.removeEventListener(PAGE_TOUR_EVENT, replay);
  }, [key, available]);

  const close = useCallback(() => {
    if (!open) return;
    const page = open.key;
    setOpen(null);
    if (seen.has(page)) return;
    const next = new Set([...seen, page]);
    setSeen(next);
    if (persist) void markPageTourSeenAction(page);
    else writeLocalSeen([...next]);
  }, [open, seen, persist]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div key={open.key} className="fixed inset-0 z-[60]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          <TourFlow page={open.key} steps={open.steps} available={available} onClose={close} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function TourFlow({ page, steps: initialSteps, available, onClose }: { page: PageTourKey; steps: string[]; available: (page: PageTourKey) => string[]; onClose: () => void }) {
  const [steps, setSteps] = useState(initialSteps);
  const [index, setIndex] = useState(-1);
  // Sections that finished streaming after the tour opened join it on the way.
  const next = useCallback(() => {
    const fresh = available(page);
    const list = fresh.length >= steps.length ? fresh : steps;
    const at = index < 0 ? -1 : list.indexOf(steps[index]);
    if (list !== steps) setSteps(list);
    if (at < list.length - 1) setIndex(at + 1);
    else onClose();
  }, [available, page, steps, index, onClose]);
  const back = useCallback(() => setIndex((i) => Math.max(-1, i - 1)), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        back();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, back, onClose]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  if (index < 0) return <IntroCard page={page} count={steps.length} onStart={next} onSkip={onClose} />;
  return <Spotlight page={page} target={steps[index]} index={index} total={steps.length} onNext={next} onBack={back} onSkip={onClose} />;
}

function IntroCard({ page, count, onStart, onSkip }: { page: PageTourKey; count: number; onStart: () => void; onSkip: () => void }) {
  const { t } = useI18n();
  const p = t.pageTours;
  const copy = p.pages[page];
  const reduce = useReducedMotion();
  return (
    <>
      <div className="absolute inset-0 bg-ink/45" aria-hidden />
      <div className="absolute inset-0 grid place-items-center overflow-y-auto p-4">
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="page-tour-title"
          initial={reduce ? false : { opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.3, ease: [0.2, 0.7, 0.2, 1] }}
          className="relative w-full max-w-sm rounded-lg bg-surface p-6 shadow-pop"
        >
          <button type="button" onClick={onSkip} aria-label={p.close} className="absolute top-3 right-3 grid size-7 place-items-center rounded-md text-subtle hover:bg-sunken hover:text-ink">
            <X className="size-4" />
          </button>
          <span className="grid size-10 place-items-center rounded-lg bg-agent-soft text-agent">
            <Compass className="size-5" />
          </span>
          <p className="mt-4 text-xs font-medium text-agent">{p.label}</p>
          <h2 id="page-tour-title" className="mt-1 text-2xl font-semibold tracking-tight text-ink">
            {copy.name}
          </h2>
          <p className="mt-2 text-base text-muted">{copy.intro}</p>
          <p className="mt-3 text-xs text-subtle">{fmt(p.introMeta, { count })}</p>
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={onSkip} className={buttonClass("ghost", "md", "w-full sm:w-auto")}>
              {p.skip}
            </button>
            <AutoFocusButton onClick={onStart} className={buttonClass("primary", "md", "w-full sm:w-auto")}>
              {p.start}
              <ArrowRight className="size-4" />
            </AutoFocusButton>
          </div>
        </motion.div>
      </div>
    </>
  );
}

type Side = "bottom" | "top" | "right" | "left" | "inside";

function place(rect: Rect, viewport: { width: number; height: number }, cardHeight: number) {
  const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), Math.max(min, max));
  const width = Math.min(CARD_WIDTH, viewport.width - MARGIN * 2);
  const centerX = clamp(rect.left + rect.width / 2 - width / 2, MARGIN, viewport.width - width - MARGIN);
  const centerY = clamp(rect.top + rect.height / 2 - cardHeight / 2, MARGIN, viewport.height - cardHeight - MARGIN);
  const below = rect.top + rect.height + GAP;
  const above = rect.top - GAP - cardHeight;
  const right = rect.left + rect.width + GAP;
  const left = rect.left - GAP - width;

  const options: { side: Side; fits: boolean; top: number; left: number; arrow: number }[] = [
    { side: "bottom", fits: below + cardHeight <= viewport.height - MARGIN, top: below, left: centerX, arrow: clamp(rect.left + rect.width / 2 - centerX, 20, width - 20) },
    { side: "top", fits: above >= MARGIN + 56, top: above, left: centerX, arrow: clamp(rect.left + rect.width / 2 - centerX, 20, width - 20) },
    { side: "right", fits: right + width <= viewport.width - MARGIN, top: centerY, left: right, arrow: clamp(rect.top + rect.height / 2 - centerY, 20, cardHeight - 20) },
    { side: "left", fits: left >= MARGIN, top: centerY, left, arrow: clamp(rect.top + rect.height / 2 - centerY, 20, cardHeight - 20) },
  ];
  const chosen = options.find((o) => o.fits);
  if (chosen) return { ...chosen, width };
  // The target fills the screen: sit the card inside it, at the bottom.
  return { side: "inside" as Side, top: viewport.height - cardHeight - MARGIN * 2, left: centerX, arrow: 0, width };
}

function Spotlight({
  page,
  target,
  index,
  total,
  onNext,
  onBack,
  onSkip,
}: {
  page: PageTourKey;
  target: string;
  index: number;
  total: number;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}) {
  const reduce = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<Rect | null>(null);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [cardHeight, setCardHeight] = useState(200);

  useLayoutEffect(() => {
    const el = visibleElement(target);
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // Tall sections are framed to the part that's on screen.
      const top = Math.max(r.top, 64);
      const bottom = Math.min(r.bottom, vh - 8);
      setRect({ top: top - HALO, left: r.left - HALO, width: r.width + HALO * 2, height: Math.max(bottom - top, 24) + HALO * 2 });
      setViewport({ width: window.innerWidth, height: vh });
    };
    const fixed = getComputedStyle(el).position === "fixed";
    if (!fixed) {
      const r = el.getBoundingClientRect();
      const fitsOnScreen = r.top >= 72 && r.bottom <= window.innerHeight - 16;
      if (!fitsOnScreen) el.scrollIntoView({ block: r.height > window.innerHeight * 0.6 ? "start" : "center", behavior: "instant" });
      // The sticky top bar would cover a section scrolled to the very top.
      if (r.height > window.innerHeight * 0.6) window.scrollBy({ top: -72, behavior: "instant" });
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [target]);

  useLayoutEffect(() => {
    if (cardRef.current) setCardHeight(cardRef.current.offsetHeight);
  }, [target, rect, viewport]);

  const spot = rect ? place(rect, viewport, cardHeight) : null;
  const spring = reduce ? { duration: 0 } : { type: "spring" as const, stiffness: 380, damping: 36 };
  const card = <StepCard cardRef={cardRef} page={page} target={target} index={index} total={total} onNext={onNext} onBack={onBack} onSkip={onSkip} side={spot?.side} arrow={spot?.arrow} />;

  if (!rect || !spot) {
    return (
      <>
        <div className="absolute inset-0 bg-ink/45" aria-hidden />
        <div className="absolute inset-x-0 bottom-0 flex justify-center p-4 sm:inset-0 sm:items-center">{card}</div>
      </>
    );
  }

  return (
    <>
      <motion.div
        aria-hidden
        className="pointer-events-none absolute rounded-lg ring-2 ring-agent"
        style={{ boxShadow: "0 0 0 9999px rgb(11 11 11 / 0.45)" }}
        initial={false}
        animate={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }}
        transition={spring}
      />
      <motion.div className="absolute" style={{ width: spot.width }} initial={false} animate={{ top: spot.top, left: spot.left }} transition={spring}>
        {card}
      </motion.div>
    </>
  );
}

function StepCard({
  cardRef,
  page,
  target,
  index,
  total,
  onNext,
  onBack,
  onSkip,
  side,
  arrow,
}: {
  cardRef: Ref<HTMLDivElement>;
  page: PageTourKey;
  target: string;
  index: number;
  total: number;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  side?: Side;
  arrow?: number;
}) {
  const { t } = useI18n();
  const p = t.pageTours;
  const copy = (p.pages[page].steps as Record<string, { title: string; body: string }>)[target];
  const last = index === total - 1;
  const arrowClass = side === "bottom" ? "-top-1.5" : side === "top" ? "-bottom-1.5" : side === "right" ? "-left-1.5" : side === "left" ? "-right-1.5" : null;
  const vertical = side === "right" || side === "left";

  return (
    <div
      ref={cardRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="page-tour-step-title"
      aria-describedby="page-tour-step-body"
      className="relative w-full rounded-lg bg-surface shadow-pop sm:w-[340px]"
    >
      {arrowClass && arrow !== undefined && (
        <span aria-hidden className={cn("absolute size-3 rotate-45 bg-surface", arrowClass)} style={vertical ? { top: arrow - 6 } : { left: arrow - 6 }} />
      )}
      <div key={target} className="animate-rise p-4">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-2xs font-medium text-agent">{p.pages[page].name}</p>
            <h3 id="page-tour-step-title" className="mt-0.5 text-lg font-semibold tracking-tight text-ink">
              {copy?.title}
            </h3>
          </div>
          <button type="button" onClick={onSkip} aria-label={p.close} className="-mt-1 -mr-1.5 grid size-7 shrink-0 place-items-center rounded-md text-subtle hover:bg-sunken hover:text-ink">
            <X className="size-3.5" />
          </button>
        </div>
        <p id="page-tour-step-body" className="mt-2 text-sm leading-relaxed text-muted">
          {copy?.body}
        </p>
      </div>
      <div className="flex items-center gap-2 border-t border-line px-4 py-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="text-2xs text-subtle tabular">{fmt(p.stepOf, { index: index + 1, total })}</span>
          <div className="flex gap-0.5" aria-hidden>
            {Array.from({ length: total }, (_, i) => (
              <span key={i} className={cn("h-1 flex-1 rounded-full transition-colors", i <= index ? "bg-ink" : "bg-sunken")} />
            ))}
          </div>
        </div>
        <button type="button" onClick={onBack} aria-label={p.previous} className={buttonClass("secondary", "sm", "px-2")}>
          <ArrowLeft className="size-3.5" />
        </button>
        <AutoFocusButton key={target} onClick={onNext} className={buttonClass("primary", "sm")}>
          {last ? p.finish : p.next}
          {last ? <Check className="size-3.5" /> : <ArrowRight className="size-3.5" />}
        </AutoFocusButton>
      </div>
    </div>
  );
}

function AutoFocusButton({ onClick, className, children }: { onClick: () => void; className: string; children: ReactNode }) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, []);
  return (
    <button ref={ref} type="button" onClick={onClick} className={className}>
      {children}
    </button>
  );
}
