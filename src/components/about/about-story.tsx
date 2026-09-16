"use client";

import { Reveal, Stagger, StaggerItem } from "@/components/marketing/motion";
import { Check, X, ArrowRight, Brain, Target, FlaskConical, ShieldCheck, Sprout } from "lucide-react";
import Link from "next/link";

const LOOP_STEPS = [
  {
    step: "01",
    name: "Understand",
    role: "Deep Grounding",
    desc: "Crawls your live website, extracts value props, pricing, and ICP triggers, grounding every marketing decision in your real product.",
    tone: "bg-blue-soft text-blue-deep border-blue/20",
    icon: Brain,
  },
  {
    step: "02",
    name: "Decide",
    role: "Channel Fit & Budget",
    desc: "Evaluates 10+ growth channels against your economics. Says 'don't do LinkedIn right now' when CAC doesn't fit your price tier.",
    tone: "bg-tangerine-soft text-tangerine-deep border-tangerine/20",
    icon: Target,
  },
  {
    step: "03",
    name: "Experiment",
    role: "Statistical Rigor",
    desc: "Generates ranked variants and runs structured experiments evaluated by two-proportion z-tests and Poisson rate models.",
    tone: "bg-grass-soft text-grass-deep border-grass/20",
    icon: FlaskConical,
  },
  {
    step: "04",
    name: "Control",
    role: "Hard Governance",
    desc: "Every dollar is bounded by hard policy caps. Risky actions require explicit founder sign-off. The model never runs rogue.",
    tone: "bg-lilac-soft text-lilac-deep border-lilac/20",
    icon: ShieldCheck,
  },
  {
    step: "05",
    name: "Learn",
    role: "Compounding Memory",
    desc: "Winning tactics are promoted into your strategy; disproved ones are suppressed forever so you never repeat a costly mistake.",
    tone: "bg-sun-soft text-sun-deep border-sun/20",
    icon: Sprout,
  },
];

export function AboutStory() {
  return (
    <section className="bg-cream py-20 sm:py-28 border-y border-line">
      <div className="mx-auto max-w-[1360px] px-5 sm:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <p className="font-mono text-xs font-semibold tracking-wider uppercase text-subtle">
              The Architecture of Growth
            </p>
            <h2 className="mt-3 text-[clamp(32px,4vw,56px)] leading-[1.05] font-[560] tracking-[-0.04em] text-ink">
              Marketing was engineered for big departments.
              <br className="hidden sm:inline" />
              We re-engineered it as an autonomous loop.
            </h2>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="mt-5 text-lg text-muted leading-relaxed">
              When a software engineer writes code, git tracks the history, CI verifies correctness, and tests prevent regression. We asked: why shouldn&apos;t growth have the same discipline?
            </p>
          </Reveal>
        </div>

        {/* Contrast Table: Old Way vs Kaya Way */}
        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {/* The Old Way */}
          <Reveal delay={0.12}>
            <div className="h-full rounded-2xl border border-line bg-surface p-7 sm:p-9 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-negative-soft text-negative">
                  <X className="size-5" />
                </div>
                <h3 className="text-xl font-[560] tracking-tight text-ink">The Legacy Way</h3>
              </div>
              <p className="mt-3 text-sm text-muted">
                Fragmented tools, vague agencies, and guesswork that drains founder focus.
              </p>
              <ul className="mt-6 space-y-3.5 text-sm text-ink/80">
                <li className="flex items-start gap-3">
                  <span className="mt-1 flex size-4 shrink-0 items-center justify-center rounded-full bg-negative-soft text-negative text-xs font-bold">✕</span>
                  <span><strong>15 fragmented dashboards:</strong> Google Ads, Meta, LinkedIn, GA4, PostHog, spreadsheets that never match up.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 flex size-4 shrink-0 items-center justify-center rounded-full bg-negative-soft text-negative text-xs font-bold">✕</span>
                  <span><strong>Agency tax:</strong> Retainers of $5,000/mo plus 15–20% of your ad spend, whether campaigns convert or not.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 flex size-4 shrink-0 items-center justify-center rounded-full bg-negative-soft text-negative text-xs font-bold">✕</span>
                  <span><strong>Hallucinatory AI tools:</strong> Generic copy generators without knowledge of your pricing, margins, or ICPs.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 flex size-4 shrink-0 items-center justify-center rounded-full bg-negative-soft text-negative text-xs font-bold">✕</span>
                  <span><strong>No institutional memory:</strong> The same failed keyword or campaign gets funded again six months later.</span>
                </li>
              </ul>
            </div>
          </Reveal>

          {/* The Kaya Way */}
          <Reveal delay={0.18}>
            <div className="h-full rounded-2xl border border-agent-line/70 bg-gradient-to-br from-surface to-blue-soft/30 p-7 sm:p-9 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-agent text-white shadow-sm">
                  <Check className="size-5" />
                </div>
                <h3 className="text-xl font-[560] tracking-tight text-ink">The Kaya Agent Loop</h3>
              </div>
              <p className="mt-3 text-sm text-muted">
                One continuous, closed loop that grounds, decides, tests, and learns autonomously.
              </p>
              <ul className="mt-6 space-y-3.5 text-sm text-ink/80">
                <li className="flex items-start gap-3">
                  <span className="mt-1 flex size-4 shrink-0 items-center justify-center rounded-full bg-agent text-white text-xs font-bold">✓</span>
                  <span><strong>Single Command Center:</strong> One unified source of truth with 6 core outcome metrics and causal modeling.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 flex size-4 shrink-0 items-center justify-center rounded-full bg-agent text-white text-xs font-bold">✓</span>
                  <span><strong>0% fee on ad spend:</strong> You pay for agent compute, never a tax on your marketing capital.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 flex size-4 shrink-0 items-center justify-center rounded-full bg-agent text-white text-xs font-bold">✓</span>
                  <span><strong>Grounded in your code & site:</strong> Facts are extracted, proven by real URLs, and verified against your margins.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 flex size-4 shrink-0 items-center justify-center rounded-full bg-agent text-white text-xs font-bold">✓</span>
                  <span><strong>Permanent compounding memory:</strong> Every experiment generates a learning that updates the strategy permanently.</span>
                </li>
              </ul>
            </div>
          </Reveal>
        </div>

        {/* The 5 Loop Steps */}
        <div className="mt-20">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-wider text-subtle">How it works under the hood</p>
              <h3 className="text-2xl font-[560] tracking-tight text-ink mt-1">The Five Pillars of Kaya</h3>
            </div>
            <Link
              href="/#pillar-understand"
              className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-agent hover:underline"
            >
              <span>Explore full interactive tour</span>
              <ArrowRight className="size-4" />
            </Link>
          </div>

          <Stagger className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {LOOP_STEPS.map((item) => {
              const Icon = item.icon;
              return (
                <StaggerItem key={item.step}>
                  <div className="flex h-full flex-col justify-between rounded-xl border border-line bg-surface p-5 transition-transform hover:-translate-y-1 hover:shadow-sm">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-semibold text-subtle">{item.step}</span>
                        <div className={`flex size-7 items-center justify-center rounded-lg border ${item.tone}`}>
                          <Icon className="size-4" />
                        </div>
                      </div>
                      <h4 className="mt-4 text-base font-[560] text-ink">{item.name}</h4>
                      <p className="font-mono text-[11px] text-muted uppercase tracking-wider mt-0.5">{item.role}</p>
                      <p className="mt-3 text-xs leading-relaxed text-muted">{item.desc}</p>
                    </div>
                  </div>
                </StaggerItem>
              );
            })}
          </Stagger>
        </div>
      </div>
    </section>
  );
}
