"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useScroll, useTransform } from "motion/react";
import { ArrowRight, Check, FlaskConical, Globe, Radar, ShieldCheck, Sparkles } from "lucide-react";
import { StartForm } from "@/components/onboarding/start-form";
import { KayaMark } from "@/components/brand/logo";
import { BrandIcon } from "@/components/brand/brand-logos";
import { EASE } from "@/components/marketing/motion";
import { cn } from "@/lib/cn";

const Hero3DScene = dynamic(() => import("./hero-3d-scene").then((m) => m.Hero3DScene), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 grid place-items-center">
      <KayaMark className="size-40 animate-pulse opacity-80" />
    </div>
  ),
});

const intro = (i: number) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease: EASE, delay: 0.08 * i },
});

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1.5 text-sm text-ink shadow-sm">
      <span className="size-1.5 animate-pulse-dot rounded-full bg-grass" />
      {children}
    </span>
  );
}

function Swoosh() {
  return (
    <svg aria-hidden viewBox="0 0 300 20" preserveAspectRatio="none" className="absolute -bottom-2 left-0 h-[0.22em] w-full">
      <motion.path
        d="M4 14 C 80 4 200 2 296 10"
        fill="none"
        stroke="#d4f36b"
        strokeWidth="10"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, ease: EASE, delay: 0.7 }}
      />
    </svg>
  );
}

/* ───────────── A · Clay 3D ───────────── */

export function HeroClay3D({ demoHref }: { demoHref: string }) {
  const stage = useRef<HTMLDivElement>(null);
  const visible = useInView(stage, { amount: 0.05 });

  return (
    <section className="px-3 sm:px-5">
      <div ref={stage} className="relative mx-auto grid max-w-[1360px] overflow-hidden rounded-[32px] bg-cream lg:min-h-[min(820px,86vh)] lg:grid-cols-[1.05fr_1fr]">
        <div aria-hidden className="bg-dots absolute inset-0 [mask-image:radial-gradient(ellipse_at_75%_50%,black,transparent_65%)]" />
        <div className="relative z-10 flex flex-col justify-center px-6 pt-12 pb-6 sm:px-12 lg:py-20">
          <motion.div {...intro(0)}>
            <Pill>The AI marketing agent for founders</Pill>
          </motion.div>
          <motion.h1 {...intro(1)} className="mt-6 text-[clamp(48px,6.2vw,92px)] leading-[0.95] font-[560] tracking-[-0.05em]">
            Build your product.
            <br />
            <span className="relative inline-block">
              Kaya grows it.
              <Swoosh />
            </span>
          </motion.h1>
          <motion.p {...intro(2)} className="mt-6 max-w-lg text-[clamp(17px,1.4vw,20px)] leading-relaxed text-muted">
            Paste your URL. Kaya reads your product, picks the channels worth your money and runs the experiments that grow revenue. You approve every dollar.
          </motion.p>
          <motion.div {...intro(3)} className="mt-8 max-w-xl rounded-[22px] bg-surface p-2.5 shadow-float">
            <StartForm autoFocus={false} className="" suggestions={["linear.app", "cal.com", "plausible.io"]} />
          </motion.div>
          <motion.div {...intro(4)} className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-muted">
            <Link href={demoHref} className="inline-flex items-center gap-1 font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
              See the live demo <ArrowRight className="size-3.5" />
            </Link>
            <span className="flex items-center gap-2">
              Connects to
              {(["stripe", "googleads", "posthog", "hubspot"] as const).map((b) => (
                <span key={b} className="grid size-7 place-items-center rounded-lg bg-surface shadow-sm">
                  <BrandIcon brand={b} className="size-4" />
                </span>
              ))}
            </span>
          </motion.div>
        </div>
        <div className="relative h-[380px] sm:h-[480px] lg:h-auto">
          <Hero3DScene eventSource={stage} active={visible} />
        </div>
      </div>
    </section>
  );
}

/* ───────────── B · Product in perspective ───────────── */

const FLOATERS = [
  { icon: Radar, title: "Channel fit", body: "Google Search 88 · Meta Ads 22", className: "left-[2%] top-[18%]", tone: "bg-tangerine-soft text-tangerine-deep", delay: 0.6 },
  { icon: FlaskConical, title: "EXP-014 won", body: "+31% trial starts · p = 0.02", className: "right-[1%] top-[10%]", tone: "bg-grass-soft text-grass-deep", delay: 0.8 },
  { icon: ShieldCheck, title: "Needs approval", body: "Google Search $30 → $45/day", className: "right-[4%] bottom-[16%]", tone: "bg-sun-soft text-sun-deep", delay: 1 },
  { icon: Globe, title: "Read tickwarden.com", body: "8 pages, 23 facts with sources", className: "left-[5%] bottom-[10%]", tone: "bg-blue-soft text-blue-deep", delay: 1.2 },
];

export function HeroProduct({ demoHref }: { demoHref: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const rotateX = useTransform(scrollYProgress, [0, 1], [24, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.92, 1]);

  return (
    <section className="overflow-hidden px-5 pt-14 pb-10 text-center">
      <motion.div {...intro(0)}>
        <Pill>The AI marketing agent for founders</Pill>
      </motion.div>
      <motion.h1 {...intro(1)} className="mx-auto mt-6 max-w-5xl text-[clamp(48px,7.4vw,112px)] leading-[0.93] font-[560] tracking-[-0.055em]">
        Build your product.
        <br />
        <span className="text-muted">Kaya</span> grows it.
      </motion.h1>
      <motion.p {...intro(2)} className="mx-auto mt-6 max-w-xl text-lg text-muted">
        One agent that plans, launches, measures and learns, tied to Stripe revenue, with you holding the keys.
      </motion.p>
      <motion.div {...intro(3)} className="mt-8 flex flex-wrap justify-center gap-2">
        <Link href="/start" className="inline-flex h-12 items-center gap-2 rounded-xl bg-ink px-6 text-[15px] font-medium text-white hover:bg-ink-hover">
          Analyze my product <ArrowRight className="size-4" />
        </Link>
        <Link href={demoHref} className="inline-flex h-12 items-center rounded-xl bg-lime px-6 text-[15px] font-medium hover:brightness-95">
          See the live demo
        </Link>
      </motion.div>

      <div ref={ref} className="relative mx-auto mt-16 max-w-6xl [perspective:1800px]">
        <motion.div style={{ rotateX, scale }} className="origin-top rounded-[22px] bg-stone p-2 shadow-pop">
          <ProductWindow />
        </motion.div>
        {FLOATERS.map((f) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: [0, -10, 0], scale: 1 }}
            transition={{ opacity: { delay: f.delay, duration: 0.5 }, scale: { delay: f.delay, duration: 0.5, ease: EASE }, y: { delay: f.delay, duration: 5, repeat: Infinity, ease: "easeInOut" } }}
            className={cn("absolute hidden w-64 rounded-2xl bg-surface p-3 text-left shadow-pop md:block", f.className)}
          >
            <p className="flex items-center gap-2 text-sm font-medium">
              <span className={cn("grid size-7 place-items-center rounded-lg", f.tone)}>
                <f.icon className="size-3.5" />
              </span>
              {f.title}
            </p>
            <p className="mt-1 text-xs text-muted">{f.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function ProductWindow() {
  return (
    <div className="grid overflow-hidden rounded-[16px] bg-canvas text-left md:grid-cols-[180px_1fr]">
      <aside className="hidden border-r border-line bg-surface p-4 md:block">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <KayaMark className="size-5" /> Tickwarden
        </p>
        <ul className="mt-5 space-y-1 text-sm text-muted">
          {["Command Center", "Strategy", "Experiments", "Agent", "Learnings", "Analytics"].map((it, i) => (
            <li key={it} className={cn("rounded-lg px-2 py-1.5", i === 0 && "bg-sunken text-ink")}>
              {it}
            </li>
          ))}
        </ul>
      </aside>
      <div className="p-5">
        <div className="flex items-end justify-between">
          <div>
            <p className="font-mono text-[10px] text-subtle uppercase">Goal</p>
            <p className="text-lg font-medium tracking-[-0.02em]">$10k MRR by December 31</p>
          </div>
          <span className="rounded-full bg-grass-soft px-2 py-0.5 text-xs text-grass-deep">On pace · 64%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-sunken">
          <motion.div initial={{ width: 0 }} animate={{ width: "64%" }} transition={{ duration: 1.4, ease: EASE, delay: 0.6 }} className="h-full rounded-full bg-ink" />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            ["MRR", "$6,420", "+12.4%"],
            ["Trial → paid", "18.2%", "+2.1 pts"],
            ["Blended CAC", "$84", "−9%"],
            ["Payback", "3.1 mo", "−0.6"],
          ].map(([l, v, d]) => (
            <div key={l} className="rounded-xl bg-surface p-3">
              <p className="text-xs text-subtle">{l}</p>
              <p className="text-xl font-medium tracking-[-0.03em] tabular">{v}</p>
              <p className="text-xs text-grass-deep">{d}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 flex h-40 items-end gap-1.5 rounded-xl bg-surface p-4">
          {Array.from({ length: 28 }, (_, i) => 30 + i * 2.2 + Math.sin(i * 0.9) * 8).map((h, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${h}%` }}
              transition={{ duration: 0.6, ease: EASE, delay: 0.5 + i * 0.03 }}
              className={cn("flex-1 rounded-t-md", i > 20 ? "bg-blue" : "bg-stone")}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ───────────── C · Type a URL ───────────── */

const DEMOS = [
  { domain: "tickwarden.com", audience: "Backend engineers at small SaaS teams", channel: "Google Search", score: 88, experiment: "“Cronitor alternative” comparison page" },
  { domain: "parcelpilot.io", audience: "Shopify stores shipping 500+ orders a month", channel: "Meta Ads", score: 81, experiment: "UGC videos on delivery-time anxiety" },
  { domain: "inkwell.app", audience: "Freelance writers who invoice clients", channel: "SEO pages", score: 86, experiment: "Free invoice template for writers" },
];

export function HeroTypewriter({ demoHref }: { demoHref: string }) {
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState(0);
  const demo = DEMOS[index];
  const done = typed >= demo.domain.length;

  useEffect(() => {
    let n = 0;
    const type = window.setInterval(() => {
      n += 1;
      setTyped(n);
      if (n >= DEMOS[index].domain.length) window.clearInterval(type);
    }, 75);
    const next = window.setTimeout(() => {
      setTyped(0);
      setIndex((i) => (i + 1) % DEMOS.length);
    }, DEMOS[index].domain.length * 75 + 4600);
    return () => {
      window.clearInterval(type);
      window.clearTimeout(next);
    };
  }, [index]);

  return (
    <section className="px-3 sm:px-5">
      <div className="relative mx-auto max-w-[1360px] overflow-hidden rounded-[32px] bg-lime-soft px-5 pt-16 pb-20 text-center">
        <div aria-hidden className="bg-dots absolute inset-0" />
        <div className="relative">
          <motion.h1 {...intro(0)} className="mx-auto max-w-4xl text-[clamp(46px,6.6vw,100px)] leading-[0.95] font-[560] tracking-[-0.05em]">
            Paste a URL.
            <br />
            Get a growth plan.
          </motion.h1>
          <motion.p {...intro(1)} className="mx-auto mt-5 max-w-lg text-lg text-muted">
            Kaya reads any product and returns who buys, where to find them and the first experiment to run.
          </motion.p>

          <motion.div {...intro(2)} className="mx-auto mt-10 flex max-w-2xl items-center gap-3 rounded-2xl bg-surface p-2 pl-5 text-left shadow-pop">
            <Globe className="size-5 shrink-0 text-subtle" />
            <span className="min-w-0 flex-1 truncate font-mono text-lg">
              https://{demo.domain.slice(0, typed)}
              <span className="ml-0.5 inline-block h-5 w-0.5 translate-y-0.5 animate-pulse bg-ink" />
            </span>
            <Link href="/start" className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-ink px-5 text-[15px] font-medium text-white hover:bg-ink-hover">
              Analyze <ArrowRight className="size-4" />
            </Link>
          </motion.div>

          <div className="mx-auto mt-6 grid min-h-[170px] max-w-4xl gap-3 sm:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {done &&
                [
                  { icon: Sparkles, label: "Who buys", value: demo.audience },
                  { icon: Radar, label: "Best channel", value: `${demo.channel} · ${demo.score}/100` },
                  { icon: FlaskConical, label: "First experiment", value: demo.experiment },
                ].map((card, i) => (
                  <motion.div
                    key={`${demo.domain}-${card.label}`}
                    initial={{ opacity: 0, y: 24, rotate: i === 0 ? -4 : i === 2 ? 4 : 0 }}
                    animate={{ opacity: 1, y: 0, rotate: 0 }}
                    exit={{ opacity: 0, y: -16, scale: 0.96 }}
                    transition={{ duration: 0.5, ease: EASE, delay: 0.12 * i }}
                    className="rounded-2xl bg-surface p-4 text-left shadow-float"
                  >
                    <p className="flex items-center gap-2 font-mono text-[11px] text-subtle uppercase">
                      <card.icon className="size-3.5" /> {card.label}
                    </p>
                    <p className="mt-2 text-[15px] leading-snug">{card.value}</p>
                    <p className="mt-3 inline-flex items-center gap-1 text-xs text-grass-deep">
                      <Check className="size-3" /> with sources
                    </p>
                  </motion.div>
                ))}
            </AnimatePresence>
          </div>
          <p className="mt-6 text-sm text-muted">
            Example products are fictional ·{" "}
            <Link href={demoHref} className="font-medium text-ink underline underline-offset-4">
              open the demo workspace
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
