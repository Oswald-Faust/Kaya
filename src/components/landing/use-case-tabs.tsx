"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView } from "motion/react";
import { ArrowUpRight, Check, Clock, Hand, Mail, Pause, Sparkles } from "lucide-react";
import { BrandIcon, type BrandName } from "@/components/brand/brand-logos";
import { EASE } from "@/components/marketing/motion";
import { cn } from "@/lib/cn";

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
  { id: "analysis", label: "Product analysis", tone: "lime", line: "Turn a URL into a business model you can trust, with a source for every fact.", Visual: AnalysisVisual },
  { id: "icp", label: "ICP & positioning", tone: "pink", line: "Find the buyers who convert, the pains they feel and the words they use.", Visual: IcpVisual },
  { id: "competitors", label: "Competitor map", tone: "blue", line: "Map who you're compared with and the wedge that wins the switch.", Visual: CompetitorsVisual },
  { id: "strategy", label: "Channel strategy", tone: "tangerine", line: "Score every channel from 0 to 100 and know which ones to skip for now.", Visual: StrategyVisual },
  { id: "budget", label: "Budget allocation", tone: "sun", line: "Split a small budget where tests can reach significance, and keep a reserve.", Visual: BudgetVisual },
  { id: "experiments", label: "Experiments", tone: "grass", line: "Run a ranked queue of experiments tied to signups and revenue.", Visual: ExperimentsVisual },
  { id: "ads", label: "Paid ads", tone: "pink", line: "Launch and scale Google, Meta and LinkedIn ads inside hard budget caps.", Visual: AdsVisual },
  { id: "seo", label: "SEO pages", tone: "lilac", line: "Publish comparison and use-case pages that match buying intent.", Visual: SeoVisual },
  { id: "community", label: "Community launches", tone: "tangerine", line: "Draft launches for Hacker News, Reddit and Product Hunt that respect each community.", Visual: CommunityVisual },
  { id: "email", label: "Lifecycle email", tone: "blue", line: "Turn trials into customers with emails that react to what users do.", Visual: EmailVisual },
  { id: "analytics", label: "Analytics", tone: "grass", line: "See the funnel and what each channel really costs, with every formula shown.", Visual: AnalyticsVisual },
  { id: "brief", label: "Weekly brief", tone: "sun", line: "Read one brief on Monday: what changed, why, and what needs you.", Visual: BriefVisual },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function UseCaseTabs() {
  const [active, setActive] = useState<TabId>("analysis");
  const [hovering, setHovering] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const pills = useRef<HTMLDivElement>(null);
  const inView = useInView(root, { amount: 0.35 });
  const tab = TABS.find((t) => t.id === active)!;
  const index = TABS.findIndex((t) => t.id === active);
  const paused = hovering || !inView;

  // Deep links from the menu: /#uc-seo selects the SEO tab.
  useEffect(() => {
    const apply = () => {
      const id = window.location.hash.replace("#uc-", "");
      if (TABS.some((t) => t.id === id)) {
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
            {tab.line}
          </motion.p>
        </AnimatePresence>
      </div>

      <div
        ref={pills}
        role="tablist"
        aria-label="What Kaya does"
        className="mt-8 flex gap-2 overflow-x-auto px-1 pb-2 [mask-image:linear-gradient(to_right,transparent,black_4%,black_96%,transparent)] [scrollbar-width:none]"
      >
        <span aria-hidden className="w-[8%] shrink-0" />
        {TABS.map((t) => {
          const selected = t.id === active;
          return (
            <button
              key={t.id}
              data-tab={t.id}
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={selected}
              aria-controls={`panel-${t.id}`}
              onClick={() => setActive(t.id)}
              className={cn(
                "relative shrink-0 overflow-hidden rounded-2xl px-5 py-3 text-[15px] font-medium tracking-[-0.01em] transition-colors",
                selected ? cn(TONES[t.tone].soft, "text-ink") : "bg-sunken text-muted hover:text-ink",
              )}
            >
              {selected && (
                <span
                  key={`${t.id}-progress`}
                  aria-hidden
                  onAnimationEnd={next}
                  className={cn("absolute inset-0 origin-left opacity-35", TONES[t.tone].base)}
                  style={{ animation: `uc-progress ${DURATION}ms linear forwards`, animationPlayState: paused ? "paused" : "running" }}
                />
              )}
              <span className="relative">{t.label}</span>
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
  return (
    <div className="grid gap-3 md:grid-cols-[1.3fr_0.7fr]">
      <Card>
        <Label>Business memory · tickwarden.com</Label>
        <ul className="mt-2 divide-y divide-line">
          {[
            ["Audience", "Backend engineers at 5–50 person SaaS teams", "/pricing", true],
            ["Price", "Free for 20 monitors · Team $29/mo", "/pricing", true],
            ["Compared with", "Cronitor, Healthchecks.io", "/docs/migrate", false],
            ["Wedge", "Alerts when a job never starts", "/", false],
          ].map(([label, value, source, confirmed], i) => (
            <motion.li key={label as string} {...rise(i)} className="flex items-start gap-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-subtle">{label}</p>
                <p className="text-sm text-ink">{value}</p>
                <p className="font-mono text-[10px] text-subtle">source {source}</p>
              </div>
              {confirmed ? (
                <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-grass-soft px-2 py-0.5 text-xs text-grass-deep">
                  <Check className="size-3" /> Confirmed
                </span>
              ) : (
                <span className="mt-1 rounded-full border border-line-strong px-2 py-0.5 text-xs text-muted">Review</span>
              )}
            </motion.li>
          ))}
        </ul>
      </Card>
      <Card className="self-end" delay={0.15}>
        <Label>Crawl</Label>
        <ul className="mt-2 space-y-1.5 font-mono text-xs text-muted">
          {["/", "/pricing", "/docs", "/docs/migrate", "/changelog", "/blog/cron-alerts"].map((path, i) => (
            <motion.li key={path} {...rise(i)} className="flex items-center gap-2">
              <Check className="size-3 text-grass" />
              {path}
            </motion.li>
          ))}
        </ul>
        <p className="mt-3 rounded-lg bg-sunken px-2.5 py-2 text-xs text-muted">1 hidden instruction in page text ignored</p>
      </Card>
    </div>
  );
}

function IcpVisual() {
  const personas = [
    {
      name: "The on-call backend lead",
      share: "62% of trials",
      pains: ["A nightly job silently stopped for 3 days", "Alert fatigue from uptime tools"],
      words: ["cron didn't run", "heartbeat", "missed job"],
    },
    {
      name: "The solo SaaS founder",
      share: "24% of trials",
      pains: ["Backups and billing jobs nobody watches", "Cronitor feels pricey for 10 jobs"],
      words: ["cheap cron monitoring", "simple alerts"],
    },
  ];
  return (
    <div className="grid gap-3 md:grid-cols-[1fr_1fr_0.8fr]">
      {personas.map((p, i) => (
        <Card key={p.name} delay={i * 0.12}>
          <div className="flex items-center justify-between">
            <Label>Persona {i + 1}</Label>
            <span className="rounded-full bg-pink-soft px-2 py-0.5 text-xs text-pink-deep">{p.share}</span>
          </div>
          <p className="mt-2 text-lg leading-snug font-medium tracking-[-0.02em]">{p.name}</p>
          <p className="mt-3 text-xs text-subtle">Pains</p>
          <ul className="mt-1 space-y-1 text-sm text-ink">
            {p.pains.map((pain, j) => (
              <motion.li key={pain} {...rise(j)}>
                • {pain}
              </motion.li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-subtle">Words they search</p>
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
        <p className="font-mono text-[11px] tracking-wide text-white/50 uppercase">Positioning</p>
        <p className="mt-2 text-[17px] leading-snug">
          For backend teams who can&apos;t afford a silent failure, Tickwarden is the monitor that notices when a job <span className="text-lime">never starts</span>.
        </p>
      </Card>
    </div>
  );
}

function CompetitorsVisual() {
  const rows = [
    ["Cronitor", "$21/mo for 10 jobs", "Mature integrations", "Flat team pricing"],
    ["Healthchecks.io", "Free tier, open source", "Self-hosting", "Missed-start alerts in 1 min"],
    ["Better Stack", "Bundled with uptime", "All-in-one suite", "Built only for jobs"],
  ];
  return (
    <div className="grid gap-3">
      <Card className="overflow-x-auto p-0 sm:p-0">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b border-line font-mono text-[11px] text-subtle uppercase">
              <th className="px-5 py-3 font-normal">Competitor</th>
              <th className="px-5 py-3 font-normal">Price</th>
              <th className="px-5 py-3 font-normal">Their strength</th>
              <th className="px-5 py-3 font-normal">Your wedge</th>
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
        {[
          ["41%", "of trial signups mention a competitor"],
          ["3", "comparison pages worth writing"],
          ["1", "claim to avoid: “unlimited monitors”"],
        ].map(([v, l], i) => (
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
  return (
    <div className="grid gap-3 md:grid-cols-[1.2fr_0.8fr]">
      <Card>
        <Label>Channel fit</Label>
        <ul className="mt-3 space-y-3">
          {(
            [
              ["Google Search", 88, "googleads"],
              ["SEO pages", 84, "searchconsole"],
              ["Hacker News", 66, "hackernews"],
              ["LinkedIn", 41, "linkedin"],
              ["Meta Ads", 22, "meta"],
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
        <Label>Don&apos;t use right now</Label>
        <p className="mt-2 flex items-center gap-2 text-lg font-medium tracking-[-0.02em]">
          <BrandIcon brand="meta" className="size-5" /> Meta Ads
        </p>
        <ul className="mt-2 space-y-1.5 text-sm text-muted">
          <li>• Needs ~$500/mo to exit learning</li>
          <li>• Buyers search before they scroll</li>
          <li>• Revisit after 50 paying customers</li>
        </ul>
      </Card>
    </div>
  );
}

function BudgetVisual() {
  const lines = [
    { name: "Google Search", amount: 600, min: 300, status: "Funded" },
    { name: "SEO pages", amount: 450, min: 0, status: "Funded" },
    { name: "YouTube creators", amount: 0, min: 400, status: "Too small to learn" },
    { name: "Reserve", amount: 450, min: 0, status: "Held" },
  ];
  return (
    <div className="grid gap-3 md:grid-cols-[1.3fr_0.7fr]">
      <Card>
        <div className="flex items-baseline justify-between">
          <Label>Budget · this month</Label>
          <span className="text-2xl font-medium tracking-[-0.04em] tabular">$1,500</span>
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
              <span className="w-24 font-mono text-[11px] text-subtle">min ${l.min}</span>
              <span className={cn("rounded-full px-2 py-0.5 text-xs", l.status === "Funded" ? "bg-grass-soft text-grass-deep" : l.status === "Held" ? "bg-sunken text-muted" : "bg-tangerine-soft text-tangerine-deep")}>
                {l.status}
              </span>
              <span className="w-14 text-right tabular">${l.amount}</span>
            </motion.li>
          ))}
        </ul>
      </Card>
      <Card className="self-end" delay={0.2}>
        <Label>Guardrails</Label>
        <ul className="mt-2 space-y-2 text-sm">
          <li className="flex justify-between"><span>Max daily spend</span><span className="tabular">$60</span></li>
          <li className="flex justify-between"><span>Per experiment</span><span className="tabular">$500</span></li>
          <li className="flex justify-between"><span>Auto increase</span><span className="tabular">+20%</span></li>
        </ul>
        <p className="mt-3 text-xs text-muted">Checked again at the moment of spending.</p>
      </Card>
    </div>
  );
}

function ExperimentsVisual() {
  return (
    <div className="grid gap-3 md:grid-cols-[1.1fr_0.9fr]">
      <Card>
        <Label>Queue · ranked</Label>
        <ul className="mt-2 space-y-2">
          {[
            ["EXP-016", "“Cronitor alternative” comparison page", "Running", "bg-blue-soft text-blue-deep"],
            ["EXP-017", "Search ads on “cron job monitoring”", "Needs you", "bg-sun-soft text-sun-deep"],
            ["EXP-018", "Show HN: open-source heartbeat CLI", "Queued", "bg-sunken text-muted"],
            ["EXP-019", "Onboarding email: first failed job alert", "Queued", "bg-sunken text-muted"],
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
          <Label>EXP-014 · result</Label>
          <span className="rounded-full bg-grass-soft px-2 py-0.5 text-xs font-medium text-grass-deep">Winner</span>
        </div>
        <p className="mt-2 text-[40px] leading-none font-medium tracking-[-0.05em] text-ink">+31%</p>
        <p className="text-sm text-muted">trial starts from a comparison page</p>
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
  return (
    <div className="grid gap-3 md:grid-cols-[1.2fr_0.8fr]">
      <Card>
        <div className="flex items-center gap-2">
          <BrandIcon brand="googleads" className="size-4" />
          <Label>Approval · spend</Label>
        </div>
        <p className="mt-2 text-xl font-medium tracking-[-0.02em] text-ink">Raise Google Search from $30 to $45/day</p>
        <ul className="mt-3 space-y-1.5 text-sm">
          {[
            [Check, "text-grass", "Max daily spend", "$45 of $60"],
            [Check, "text-grass", "Monthly budget", "$1,180 of $1,500"],
            [Hand, "text-sun-deep", "Automatic increase limit", "+50% vs +20%"],
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
          <span className="m-pulse rounded-lg bg-ink px-3 py-1.5 text-sm font-medium text-white">Approve</span>
          <span className="rounded-lg border border-line-strong px-3 py-1.5 text-sm text-muted">Reject</span>
        </div>
      </Card>
      <div className="grid gap-3 self-end">
        <Card delay={0.15}>
          <div className="flex items-center gap-2">
            <BrandIcon brand="meta" className="size-4" />
            <Label>Done automatically</Label>
          </div>
          <p className="mt-2 flex items-center gap-2 text-sm text-ink">
            <Pause className="size-3.5" /> Paused “Retargeting — v2”
          </p>
          <p className="text-xs text-muted">CAC $212 after 9 days, 2.5× target.</p>
        </Card>
        <Card delay={0.25}>
          <div className="flex items-center gap-2">
            <BrandIcon brand="linkedin" className="size-4" />
            <Label>Draft ready</Label>
          </div>
          <p className="mt-2 text-sm">3 ad variants for “Heads of Platform”</p>
        </Card>
      </div>
    </div>
  );
}

function SeoVisual() {
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
          <p className="text-3xl font-medium tracking-[-0.04em] text-ink">Tickwarden vs Cronitor</p>
          <p className="mt-2 text-sm text-muted">Alerts when a job never starts, flat pricing for teams, and a 2-minute migration.</p>
          <div className="mt-5 grid grid-cols-3 gap-2 text-xs">
            {["Missed-start alerts", "Flat $29 team plan", "Import from Cronitor"].map((f, i) => (
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
            <Label>Opportunity</Label>
          </div>
          <p className="mt-2 text-sm">“cronitor alternative” · 1.3k searches/mo · position 34 → target 5</p>
        </Card>
        <Card delay={0.25}>
          <p className="inline-flex items-center gap-1.5 rounded-full bg-sun-soft px-2.5 py-1 text-xs text-sun-deep">
            <Hand className="size-3" /> Waiting for you to publish
          </p>
        </Card>
      </div>
    </div>
  );
}

function CommunityVisual() {
  return (
    <div className="grid gap-3 md:grid-cols-[1.25fr_0.75fr]">
      <Card>
        <div className="flex items-center gap-2">
          <BrandIcon brand="hackernews" className="size-4" />
          <Label>Draft · you post it</Label>
        </div>
        <p className="mt-3 text-lg leading-snug font-medium tracking-[-0.02em]">Show HN: Tickwarden – get alerted when a cron job never starts</p>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          I kept finding out about broken backups days later. Tickwarden pings you when an expected heartbeat doesn&apos;t arrive. The CLI is open source; the hosted version is free for 20 monitors…
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          {["No superlatives", "Maker story first", "Link to source"].map((c, i) => (
            <motion.span key={c} {...rise(i)} className="inline-flex items-center gap-1 rounded-full bg-grass-soft px-2 py-1 text-grass-deep">
              <Check className="size-3" /> {c}
            </motion.span>
          ))}
        </div>
      </Card>
      <div className="grid gap-3 self-end">
        <Card delay={0.15}>
          <Label>Best window</Label>
          <p className="mt-2 flex items-center gap-2 text-sm">
            <Clock className="size-3.5" /> Tuesday, 8:00 PT
          </p>
          <p className="text-xs text-muted">Reply to every comment for 3 hours.</p>
        </Card>
        <Card delay={0.25}>
          <div className="flex items-center gap-2">
            <BrandIcon brand="reddit" className="size-4" />
            <Label>r/devops rules</Label>
          </div>
          <p className="mt-2 text-sm text-muted">Self-promotion only on Saturdays. Queued a helpful post instead.</p>
        </Card>
      </div>
    </div>
  );
}

function EmailVisual() {
  const steps = [
    ["Trial started", "trigger", ""],
    ["Add your first monitor", "Day 0 · 61% open", ""],
    ["First alert fired", "event", ""],
    ["Invite your on-call team", "+ 2 hours · 48% open", ""],
    ["Your trial ends Friday", "Day 12 · 18.2% convert", ""],
  ];
  return (
    <div className="grid gap-3 md:grid-cols-[1.1fr_0.9fr]">
      <Card>
        <div className="flex items-center gap-2">
          <BrandIcon brand="resend" className="size-4" />
          <Label>Trial to paid · sequence</Label>
        </div>
        <ol className="relative mt-4 space-y-3 before:absolute before:top-2 before:bottom-2 before:left-[13px] before:w-px before:bg-line">
          {steps.map(([title, meta], i) => (
            <motion.li key={title} {...rise(i)} className="relative flex items-center gap-3">
              <span className={cn("grid size-7 place-items-center rounded-full", meta === "trigger" || meta === "event" ? "bg-ink text-white" : "bg-blue-soft text-blue-deep")}>
                {meta === "trigger" || meta === "event" ? <Sparkles className="size-3.5" /> : <Mail className="size-3.5" />}
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
        <Label>Result vs. last month</Label>
        <p className="mt-2 text-[40px] leading-none font-medium tracking-[-0.05em]">+2.1 pts</p>
        <p className="text-sm text-muted">trial → paid, from 16.1% to 18.2%</p>
      </Card>
    </div>
  );
}

function AnalyticsVisual() {
  const funnel = [
    ["Visitors", 18420, 100],
    ["Signups", 612, 62],
    ["Activated", 341, 42],
    ["Paid", 62, 22],
  ] as const;
  return (
    <div className="grid gap-3 md:grid-cols-[1.1fr_0.9fr]">
      <Card>
        <Label>Funnel · 30 days</Label>
        <ul className="mt-3 space-y-3">
          {funnel.map(([name, value, width]) => (
            <li key={name}>
              <div className="flex justify-between text-sm">
                <span>{name}</span>
                <span className="tabular">{value.toLocaleString("en-US")}</span>
              </div>
              <Bar value={width} className="bg-grass" />
            </li>
          ))}
        </ul>
      </Card>
      <Card className="self-end" delay={0.15}>
        <Label>CAC by channel</Label>
        <ul className="mt-2 divide-y divide-line text-sm">
          {(
            [
              ["googleads", "Google Search", "$71"],
              ["searchconsole", "SEO pages", "$38"],
              ["meta", "Meta Ads", "$212"],
            ] as [BrandName, string, string][]
          ).map(([b, name, cac], i) => (
            <motion.li key={name} {...rise(i)} className="flex items-center gap-2 py-2">
              <BrandIcon brand={b} className="size-4" /> {name}
              <span className="ml-auto tabular">{cac}</span>
            </motion.li>
          ))}
        </ul>
        <p className="mt-2 font-mono text-[10px] text-subtle">CAC = paid spend ÷ new paying customers</p>
      </Card>
    </div>
  );
}

function BriefVisual() {
  return (
    <Card className="mx-auto max-w-2xl">
      <div className="flex items-center gap-2">
        <span className="grid size-8 place-items-center rounded-lg bg-ink text-white">
          <Sparkles className="size-4" />
        </span>
        <div>
          <p className="text-sm font-medium text-ink">Kaya · Monday brief</p>
          <p className="text-xs text-subtle">Tickwarden · week 15</p>
        </div>
      </div>
      <p className="mt-5 text-2xl leading-snug font-medium tracking-[-0.03em] text-ink">Signups −14% this week. It&apos;s mostly one paused campaign.</p>
      <ul className="mt-4 space-y-2 text-[15px] text-muted">
        {[
          "The Google campaign paused on day 3 explains 80% of the drop.",
          "Organic signups are up 9%, led by the Cronitor comparison page.",
          "MRR is $6,420, on pace for $10k by December 31.",
        ].map((line, i) => (
          <motion.li key={line} {...rise(i)}>
            • {line}
          </motion.li>
        ))}
      </ul>
      <p className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-agent">
        1 approval waiting <ArrowUpRight className="size-3.5" />
      </p>
    </Card>
  );
}
