"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView } from "motion/react";
import { ArrowUpRight, Check, Clock, Hand, Mail, Pause, Sparkles } from "lucide-react";
import { BrandIcon, type BrandName } from "@/components/brand/brand-logos";
import { EASE } from "@/components/marketing/motion";
import { cn } from "@/lib/cn";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n/format";
import { formatNumber, formatUsd } from "@/lib/format";

const DURATION = 7000;

const TONES = {
  lime: { soft: "bg-lime-soft", base: "bg-lime" },
  pink: { soft: "bg-pink-soft", base: "bg-pink" },
  blue: { soft: "bg-blue-soft", base: "bg-blue" },
  tangerine: { soft: "bg-tangerine-soft", base: "bg-tangerine" },
  sun: { soft: "bg-sun-soft", base: "bg-sun" },
  grass: { soft: "bg-grass-soft", base: "bg-grass" },
  lilac: { soft: "bg-lilac-soft", base: "bg-lilac" },
} as const;

const TABS = [
  { id: "analysis", tone: "lime", Visual: AnalysisVisual },
  { id: "icp", tone: "pink", Visual: IcpVisual },
  { id: "competitors", tone: "blue", Visual: CompetitorsVisual },
  { id: "strategy", tone: "tangerine", Visual: StrategyVisual },
  { id: "budget", tone: "sun", Visual: BudgetVisual },
  { id: "experiments", tone: "grass", Visual: ExperimentsVisual },
  { id: "ads", tone: "pink", Visual: AdsVisual },
  { id: "seo", tone: "lilac", Visual: SeoVisual },
  { id: "community", tone: "tangerine", Visual: CommunityVisual },
  { id: "email", tone: "blue", Visual: EmailVisual },
  { id: "analytics", tone: "grass", Visual: AnalyticsVisual },
  { id: "brief", tone: "sun", Visual: BriefVisual },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function UseCaseTabs() {
  const { t } = useI18n();
  const copy = t.useCases.tabs;
  const [active, setActive] = useState<TabId>("analysis");
  const [hovering, setHovering] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const pills = useRef<HTMLDivElement>(null);
  const inView = useInView(root, { amount: 0.35 });
  const tab = TABS.find((x) => x.id === active)!;
  const index = TABS.findIndex((x) => x.id === active);
  const paused = hovering || !inView;

  // Deep links from the menu: /#uc-seo selects the SEO tab.
  useEffect(() => {
    const apply = () => {
      const id = window.location.hash.replace("#uc-", "");
      if (TABS.some((x) => x.id === id)) {
        setActive(id as TabId);
        root.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };
    const frame = window.requestAnimationFrame(apply);
    window.addEventListener("hashchange", apply);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("hashchange", apply);
    };
  }, []);

  // Keep the active pill visible inside the horizontal scroller without moving the page.
  useEffect(() => {
    const scroller = pills.current;
    const pill = scroller?.querySelector<HTMLElement>(`[data-tab="${active}"]`);
    if (!scroller || !pill) return;
    scroller.scrollTo({ left: pill.offsetLeft - scroller.clientWidth / 2 + pill.clientWidth / 2, behavior: "smooth" });
  }, [active]);

  const next = () => setActive(TABS[(index + 1) % TABS.length].id);

  return (
    <div ref={root} id="use-cases" className="scroll-mt-28">
      <div className="relative mx-auto mt-5 grid max-w-2xl text-center">
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={tab.id}
            initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
            transition={{ duration: 0.35, ease: EASE }}
            className="text-[clamp(18px,1.7vw,22px)] leading-snug text-muted"
          >
            {copy[tab.id].line}
          </motion.p>
        </AnimatePresence>
      </div>

      <div
        ref={pills}
        role="tablist"
        aria-label={t.useCases.tablist}
        className="mt-8 flex gap-2 overflow-x-auto px-1 pb-2 [mask-image:linear-gradient(to_right,transparent,black_4%,black_96%,transparent)] [scrollbar-width:none]"
      >
        <span aria-hidden className="w-[8%] shrink-0" />
        {TABS.map((tab_) => {
          const selected = tab_.id === active;
          return (
            <button
              key={tab_.id}
              data-tab={tab_.id}
              role="tab"
              id={`tab-${tab_.id}`}
              aria-selected={selected}
              aria-controls={`panel-${tab_.id}`}
              onClick={() => setActive(tab_.id)}
              className={cn(
                "relative shrink-0 overflow-hidden rounded-2xl px-5 py-3 text-[15px] font-medium tracking-[-0.01em] transition-colors",
                selected ? cn(TONES[tab_.tone].soft, "text-ink") : "bg-sunken text-muted hover:text-ink",
              )}
            >
              {selected && (
                <span
                  key={`${tab_.id}-progress`}
                  aria-hidden
                  onAnimationEnd={next}
                  className={cn("absolute inset-0 origin-left opacity-35", TONES[tab_.tone].base)}
                  style={{ animation: `uc-progress ${DURATION}ms linear forwards`, animationPlayState: paused ? "paused" : "running" }}
                />
              )}
              <span className="relative">{copy[tab_.id].label}</span>
            </button>
          );
        })}
        <span aria-hidden className="w-[8%] shrink-0" />
      </div>

      <div
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        className={cn("relative mt-4 overflow-hidden rounded-[28px] transition-colors duration-500", TONES[tab.tone].soft)}
      >
        <div aria-hidden className="bg-dots absolute inset-0" />
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={tab.id}
            role="tabpanel"
            id={`panel-${tab.id}`}
            aria-labelledby={`tab-${tab.id}`}
            initial={{ opacity: 0, y: 18, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.99 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="relative mx-auto min-h-[420px] max-w-5xl p-5 sm:p-12"
          >
            <tab.Visual />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ───────────── Visual building blocks ───────────── */

function Card({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE, delay }}
      className={cn("rounded-2xl border border-line bg-surface p-4 shadow-float sm:p-5", className)}
    >
      {children}
    </motion.div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="font-mono text-[11px] tracking-wide text-subtle uppercase">{children}</p>;
}

function Bar({ value, className }: { value: number; className?: string }) {
  return (
    <div className="mt-1 h-2 overflow-hidden rounded-full bg-sunken">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.9, ease: EASE, delay: 0.2 }}
        className={cn("h-full rounded-full", className)}
      />
    </div>
  );
}

const rise = (i: number) => ({ initial: { opacity: 0, x: -8 }, animate: { opacity: 1, x: 0 }, transition: { duration: 0.35, ease: EASE, delay: 0.15 + i * 0.07 } });

/* ───────────── Visuals ───────────── */

function AnalysisVisual() {
  const c = useI18n().t.useCases.analysis;
  const sources = ["/pricing", "/pricing", "/docs/migrate", "/"];
  const confirmedFlags = [true, true, false, false];
  return (
    <div className="grid gap-3 md:grid-cols-[1.3fr_0.7fr]">
      <Card>
        <Label>{c.memory}</Label>
        <ul className="mt-2 divide-y divide-line">
          {c.facts.map(({ label, value }, i) => {
            const source = sources[i];
            const confirmed = confirmedFlags[i];
            return (
            <motion.li key={label} {...rise(i)} className="flex items-start gap-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-subtle">{label}</p>
                <p className="text-sm text-ink">{value}</p>
                <p className="font-mono text-[10px] text-subtle">{fmt(c.source, { path: source })}</p>
              </div>
              {confirmed ? (
                <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-grass-soft px-2 py-0.5 text-xs text-grass-deep">
                  <Check className="size-3" /> {c.confirmed}
                </span>
              ) : (
                <span className="mt-1 rounded-full border border-line-strong px-2 py-0.5 text-xs text-muted">{c.review}</span>
              )}
            </motion.li>
            );
          })}
        </ul>
      </Card>
      <Card className="self-end" delay={0.15}>
        <Label>{c.crawl}</Label>
        <ul className="mt-2 space-y-1.5 font-mono text-xs text-muted">
          {["/", "/pricing", "/docs", "/docs/migrate", "/changelog", "/blog/cron-alerts"].map((path, i) => (
            <motion.li key={path} {...rise(i)} className="flex items-center gap-2">
              <Check className="size-3 text-grass" />
              {path}
            </motion.li>
          ))}
        </ul>
        <p className="mt-3 rounded-lg bg-sunken px-2.5 py-2 text-xs text-muted">{c.ignored}</p>
      </Card>
    </div>
  );
}

function IcpVisual() {
  const c = useI18n().t.useCases.icp;
  const personas = c.personas;
  return (
    <div className="grid gap-3 md:grid-cols-[1fr_1fr_0.8fr]">
      {personas.map((p, i) => (
        <Card key={p.name} delay={i * 0.12}>
          <div className="flex items-center justify-between">
            <Label>{fmt(c.persona, { index: i + 1 })}</Label>
            <span className="rounded-full bg-pink-soft px-2 py-0.5 text-xs text-pink-deep">{p.share}</span>
          </div>
          <p className="mt-2 text-lg leading-snug font-medium tracking-[-0.02em]">{p.name}</p>
          <p className="mt-3 text-xs text-subtle">{c.pains}</p>
          <ul className="mt-1 space-y-1 text-sm text-ink">
            {p.pains.map((pain, j) => (
              <motion.li key={pain} {...rise(j)}>
                • {pain}
              </motion.li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-subtle">{c.words}</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {p.words.map((w) => (
              <span key={w} className="rounded-full bg-sunken px-2 py-0.5 font-mono text-[11px]">
                {w}
              </span>
            ))}
          </div>
        </Card>
      ))}
      <Card className="self-end bg-ink text-white" delay={0.3}>
        <p className="font-mono text-[11px] tracking-wide text-white/50 uppercase">{c.positioning}</p>
        <p className="mt-2 text-[17px] leading-snug">
          {c.positioningBefore} <span className="text-lime">{c.positioningHighlight}</span>.
        </p>
      </Card>
    </div>
  );
}

function CompetitorsVisual() {
  const c = useI18n().t.useCases.competitors;
  const rows = c.rows;
  return (
    <div className="grid gap-3">
      <Card className="overflow-x-auto p-0 sm:p-0">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b border-line font-mono text-[11px] text-subtle uppercase">
              {c.headers.map((h) => (
                <th key={h} className="px-5 py-3 font-normal">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <motion.tr key={row[0]} {...rise(i)} className="border-b border-line last:border-0">
                <td className="px-5 py-3 font-medium">{row[0]}</td>
                <td className="px-5 py-3 text-muted">{row[1]}</td>
                <td className="px-5 py-3 text-muted">{row[2]}</td>
                <td className="px-5 py-3">
                  <span className="rounded-full bg-blue-soft px-2 py-0.5 text-blue-deep">{row[3]}</span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </Card>
      <div className="grid gap-3 sm:grid-cols-3">
        {c.stats.map(({ value: v, label: l }, i) => (
          <Card key={l} delay={0.2 + i * 0.08}>
            <p className="text-3xl font-medium tracking-[-0.04em] tabular">{v}</p>
            <p className="text-sm text-muted">{l}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

function StrategyVisual() {
  const { t } = useI18n();
  const c = t.useCases.strategy;
  return (
    <div className="grid gap-3 md:grid-cols-[1.2fr_0.8fr]">
      <Card>
        <Label>{c.fit}</Label>
        <ul className="mt-3 space-y-3">
          {(
            [
              [t.common.channels.google_search, 88, "googleads"],
              [t.common.channels.seo_content, 84, "searchconsole"],
              [t.common.channels.hacker_news, 66, "hackernews"],
              [t.common.channels.linkedin, 41, "linkedin"],
              [t.common.channels.meta_ads, 22, "meta"],
            ] as [string, number, BrandName][]
          ).map(([name, score, brand]) => (
            <li key={name}>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-ink">
                  <BrandIcon brand={brand} className="size-4" />
                  {name}
                </span>
                <span className={cn("tabular", score < 40 ? "text-negative" : "text-muted")}>{score}</span>
              </div>
              <Bar value={score} className={score < 40 ? "bg-tangerine" : "bg-ink"} />
            </li>
          ))}
        </ul>
      </Card>
      <Card className="self-end" delay={0.15}>
        <Label>{c.skip}</Label>
        <p className="mt-2 flex items-center gap-2 text-lg font-medium tracking-[-0.02em]">
          <BrandIcon brand="meta" className="size-5" /> Meta Ads
        </p>
        <ul className="mt-2 space-y-1.5 text-sm text-muted">
          {c.reasons.map((r) => (
            <li key={r}>• {r}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function BudgetVisual() {
  const { t, locale } = useI18n();
  const c = t.useCases.budget;
  const usd = (v: number) => formatUsd(v, {}, locale);
  const lines = [
    { name: c.lines[0], amount: 600, min: 300, status: c.funded, tone: "bg-grass-soft text-grass-deep" },
    { name: c.lines[1], amount: 450, min: 0, status: c.funded, tone: "bg-grass-soft text-grass-deep" },
    { name: c.lines[2], amount: 0, min: 400, status: c.tooSmall, tone: "bg-tangerine-soft text-tangerine-deep" },
    { name: c.lines[3], amount: 450, min: 0, status: c.held, tone: "bg-sunken text-muted" },
  ];
  return (
    <div className="grid gap-3 md:grid-cols-[1.3fr_0.7fr]">
      <Card>
        <div className="flex items-baseline justify-between">
          <Label>{c.title}</Label>
          <span className="text-2xl font-medium tracking-[-0.04em] tabular">{usd(1500)}</span>
        </div>
        <div className="mt-4 flex h-4 overflow-hidden rounded-full bg-sunken">
          {[
            [40, "bg-ink"],
            [30, "bg-sun"],
            [30, "bg-stone"],
          ].map(([w, c], i) => (
            <motion.div key={i} initial={{ width: 0 }} animate={{ width: `${w}%` }} transition={{ duration: 0.7, ease: EASE, delay: 0.2 + i * 0.15 }} className={c as string} />
          ))}
        </div>
        <ul className="mt-4 divide-y divide-line">
          {lines.map((l, i) => (
            <motion.li key={l.name} {...rise(i)} className="flex items-center gap-3 py-2.5 text-sm">
              <span className="flex-1">{l.name}</span>
              <span className="w-24 font-mono text-[11px] text-subtle">{fmt(c.min, { amount: usd(l.min) })}</span>
              <span className={cn("rounded-full px-2 py-0.5 text-xs", l.tone)}>
                {l.status}
              </span>
              <span className="w-14 text-right tabular">{usd(l.amount)}</span>
            </motion.li>
          ))}
        </ul>
      </Card>
      <Card className="self-end" delay={0.2}>
        <Label>{c.guardrails}</Label>
        <ul className="mt-2 space-y-2 text-sm">
          <li className="flex justify-between"><span>{c.maxDaily}</span><span className="tabular">{usd(60)}</span></li>
          <li className="flex justify-between"><span>{c.perExperiment}</span><span className="tabular">{usd(500)}</span></li>
          <li className="flex justify-between"><span>{c.autoIncrease}</span><span className="tabular">+20%</span></li>
        </ul>
        <p className="mt-3 text-xs text-muted">{c.checked}</p>
      </Card>
    </div>
  );
}

function ExperimentsVisual() {
  const c = useI18n().t.useCases.experiments;
  return (
    <div className="grid gap-3 md:grid-cols-[1.1fr_0.9fr]">
      <Card>
        <Label>{c.queue}</Label>
        <ul className="mt-2 space-y-2">
          {[
            ["EXP-016", c.items[0], c.running, "bg-blue-soft text-blue-deep"],
            ["EXP-017", c.items[1], c.needsYou, "bg-sun-soft text-sun-deep"],
            ["EXP-018", c.items[2], c.queued, "bg-sunken text-muted"],
            ["EXP-019", c.items[3], c.queued, "bg-sunken text-muted"],
          ].map(([key, title, status, tone], i) => (
            <motion.li key={key} {...rise(i)} className="rounded-xl border border-line px-3 py-2.5">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] text-subtle">{key}</span>
                <span className={cn("ml-auto rounded-full px-2 py-0.5 text-xs", tone)}>{status}</span>
              </div>
              <p className="mt-1 text-sm text-ink">{title}</p>
            </motion.li>
          ))}
        </ul>
      </Card>
      <Card className="self-end" delay={0.15}>
        <div className="flex items-center justify-between">
          <Label>{c.result}</Label>
          <span className="rounded-full bg-grass-soft px-2 py-0.5 text-xs font-medium text-grass-deep">{c.winner}</span>
        </div>
        <p className="mt-2 text-[40px] leading-none font-medium tracking-[-0.05em] text-ink">+31%</p>
        <p className="text-sm text-muted">{c.resultLine}</p>
        <div className="mt-4 flex h-24 items-end gap-3">
          <motion.div initial={{ height: 0 }} animate={{ height: "56%" }} transition={{ duration: 0.8, ease: EASE, delay: 0.3 }} className="flex-1 rounded-lg bg-stone" />
          <motion.div initial={{ height: 0 }} animate={{ height: "100%" }} transition={{ duration: 0.8, ease: EASE, delay: 0.45 }} className="flex-1 rounded-lg bg-grass" />
        </div>
        <p className="mt-2 font-mono text-[11px] text-subtle">z = 2.31 · p = 0.021</p>
      </Card>
    </div>
  );
}

function AdsVisual() {
  const c = useI18n().t.useCases.ads;
  return (
    <div className="grid gap-3 md:grid-cols-[1.2fr_0.8fr]">
      <Card>
        <div className="flex items-center gap-2">
          <BrandIcon brand="googleads" className="size-4" />
          <Label>{c.approval}</Label>
        </div>
        <p className="mt-2 text-xl font-medium tracking-[-0.02em] text-ink">{c.title}</p>
        <ul className="mt-3 space-y-1.5 text-sm">
          {[
            [Check, "text-grass", c.rules[0].rule, c.rules[0].detail],
            [Check, "text-grass", c.rules[1].rule, c.rules[1].detail],
            [Hand, "text-sun-deep", c.rules[2].rule, c.rules[2].detail],
          ].map(([Icon, tone, rule, detail], i) => {
            const I = Icon as typeof Check;
            return (
              <motion.li key={rule as string} {...rise(i)} className="flex items-center gap-2">
                <I className={cn("size-3.5", tone as string)} /> {rule as string}
                <span className="ml-auto text-muted tabular">{detail as string}</span>
              </motion.li>
            );
          })}
        </ul>
        <div className="mt-4 flex gap-2">
          <span className="m-pulse rounded-lg bg-ink px-3 py-1.5 text-sm font-medium text-white">{c.approve}</span>
          <span className="rounded-lg border border-line-strong px-3 py-1.5 text-sm text-muted">{c.reject}</span>
        </div>
      </Card>
      <div className="grid gap-3 self-end">
        <Card delay={0.15}>
          <div className="flex items-center gap-2">
            <BrandIcon brand="meta" className="size-4" />
            <Label>{c.auto}</Label>
          </div>
          <p className="mt-2 flex items-center gap-2 text-sm text-ink">
            <Pause className="size-3.5" /> {c.paused}
          </p>
          <p className="text-xs text-muted">{c.pausedWhy}</p>
        </Card>
        <Card delay={0.25}>
          <div className="flex items-center gap-2">
            <BrandIcon brand="linkedin" className="size-4" />
            <Label>{c.draft}</Label>
          </div>
          <p className="mt-2 text-sm">{c.draftLine}</p>
        </Card>
      </div>
    </div>
  );
}

function SeoVisual() {
  const c = useI18n().t.useCases.seo;
  return (
    <div className="grid gap-3 md:grid-cols-[1.3fr_0.7fr]">
      <Card className="p-0 sm:p-0">
        <div className="flex items-center gap-1.5 border-b border-line px-4 py-2.5">
          <span className="size-2 rounded-full bg-stone" />
          <span className="size-2 rounded-full bg-stone" />
          <span className="size-2 rounded-full bg-stone" />
          <span className="ml-2 font-mono text-[11px] text-subtle">tickwarden.com/vs/cronitor</span>
        </div>
        <div className="p-6">
          <p className="text-3xl font-medium tracking-[-0.04em] text-ink">{c.title}</p>
          <p className="mt-2 text-sm text-muted">{c.lead}</p>
          <div className="mt-5 grid grid-cols-3 gap-2 text-xs">
            {c.features.map((f, i) => (
              <motion.div key={f} {...rise(i)} className="rounded-lg bg-lilac-soft px-2 py-2 text-lilac-deep">
                {f}
              </motion.div>
            ))}
          </div>
        </div>
      </Card>
      <div className="grid gap-3 self-end">
        <Card delay={0.15}>
          <div className="flex items-center gap-2">
            <BrandIcon brand="searchconsole" className="size-4" />
            <Label>{c.opportunity}</Label>
          </div>
          <p className="mt-2 text-sm">{c.opportunityLine}</p>
        </Card>
        <Card delay={0.25}>
          <p className="inline-flex items-center gap-1.5 rounded-full bg-sun-soft px-2.5 py-1 text-xs text-sun-deep">
            <Hand className="size-3" /> {c.waiting}
          </p>
        </Card>
      </div>
    </div>
  );
}

function CommunityVisual() {
  const c = useI18n().t.useCases.community;
  return (
    <div className="grid gap-3 md:grid-cols-[1.25fr_0.75fr]">
      <Card>
        <div className="flex items-center gap-2">
          <BrandIcon brand="hackernews" className="size-4" />
          <Label>{c.draft}</Label>
        </div>
        <p className="mt-3 text-lg leading-snug font-medium tracking-[-0.02em]">{c.title}</p>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {c.body}
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          {c.checks.map((check, i) => (
            <motion.span key={check} {...rise(i)} className="inline-flex items-center gap-1 rounded-full bg-grass-soft px-2 py-1 text-grass-deep">
              <Check className="size-3" /> {check}
            </motion.span>
          ))}
        </div>
      </Card>
      <div className="grid gap-3 self-end">
        <Card delay={0.15}>
          <Label>{c.window}</Label>
          <p className="mt-2 flex items-center gap-2 text-sm">
            <Clock className="size-3.5" /> {c.windowTime}
          </p>
          <p className="text-xs text-muted">{c.windowTip}</p>
        </Card>
        <Card delay={0.25}>
          <div className="flex items-center gap-2">
            <BrandIcon brand="reddit" className="size-4" />
            <Label>{c.rules}</Label>
          </div>
          <p className="mt-2 text-sm text-muted">{c.rulesLine}</p>
        </Card>
      </div>
    </div>
  );
}

function EmailVisual() {
  const c = useI18n().t.useCases.email;
  const events = [true, false, true, false, false];
  return (
    <div className="grid gap-3 md:grid-cols-[1.1fr_0.9fr]">
      <Card>
        <div className="flex items-center gap-2">
          <BrandIcon brand="resend" className="size-4" />
          <Label>{c.sequence}</Label>
        </div>
        <ol className="relative mt-4 space-y-3 before:absolute before:top-2 before:bottom-2 before:left-[13px] before:w-px before:bg-line">
          {c.steps.map(({ title, meta }, i) => (
            <motion.li key={title} {...rise(i)} className="relative flex items-center gap-3">
              <span className={cn("grid size-7 place-items-center rounded-full", events[i] ? "bg-ink text-white" : "bg-blue-soft text-blue-deep")}>
                {events[i] ? <Sparkles className="size-3.5" /> : <Mail className="size-3.5" />}
              </span>
              <div>
                <p className="text-sm">{title}</p>
                <p className="font-mono text-[10px] text-subtle uppercase">{meta}</p>
              </div>
            </motion.li>
          ))}
        </ol>
      </Card>
      <Card className="self-end" delay={0.2}>
        <Label>{c.result}</Label>
        <p className="mt-2 text-[40px] leading-none font-medium tracking-[-0.05em]">{c.resultValue}</p>
        <p className="text-sm text-muted">{c.resultLine}</p>
      </Card>
    </div>
  );
}

function AnalyticsVisual() {
  const { t, locale } = useI18n();
  const c = t.useCases.analytics;
  const funnel = [
    [c.stages[0], 18420, 100],
    [c.stages[1], 612, 62],
    [c.stages[2], 341, 42],
    [c.stages[3], 62, 22],
  ] as const;
  return (
    <div className="grid gap-3 md:grid-cols-[1.1fr_0.9fr]">
      <Card>
        <Label>{c.funnel}</Label>
        <ul className="mt-3 space-y-3">
          {funnel.map(([name, value, width]) => (
            <li key={name}>
              <div className="flex justify-between text-sm">
                <span>{name}</span>
                <span className="tabular">{formatNumber(value, locale)}</span>
              </div>
              <Bar value={width} className="bg-grass" />
            </li>
          ))}
        </ul>
      </Card>
      <Card className="self-end" delay={0.15}>
        <Label>{c.cac}</Label>
        <ul className="mt-2 divide-y divide-line text-sm">
          {(
            [
              ["googleads", c.channels[0], formatUsd(71, {}, locale)],
              ["searchconsole", c.channels[1], formatUsd(38, {}, locale)],
              ["meta", c.channels[2], formatUsd(212, {}, locale)],
            ] as [BrandName, string, string][]
          ).map(([b, name, cac], i) => (
            <motion.li key={name} {...rise(i)} className="flex items-center gap-2 py-2">
              <BrandIcon brand={b} className="size-4" /> {name}
              <span className="ml-auto tabular">{cac}</span>
            </motion.li>
          ))}
        </ul>
        <p className="mt-2 font-mono text-[10px] text-subtle">{c.formula}</p>
      </Card>
    </div>
  );
}

function BriefVisual() {
  const c = useI18n().t.useCases.brief;
  return (
    <Card className="mx-auto max-w-2xl">
      <div className="flex items-center gap-2">
        <span className="grid size-8 place-items-center rounded-lg bg-ink text-white">
          <Sparkles className="size-4" />
        </span>
        <div>
          <p className="text-sm font-medium text-ink">{c.from}</p>
          <p className="text-xs text-subtle">{c.week}</p>
        </div>
      </div>
      <p className="mt-5 text-2xl leading-snug font-medium tracking-[-0.03em] text-ink">{c.headline}</p>
      <ul className="mt-4 space-y-2 text-[15px] text-muted">
        {c.lines.map((line, i) => (
          <motion.li key={line} {...rise(i)}>
            • {line}
          </motion.li>
        ))}
      </ul>
      <p className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-agent">
        {c.waiting} <ArrowUpRight className="size-3.5" />
      </p>
    </Card>
  );
}
