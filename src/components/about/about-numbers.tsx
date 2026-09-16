"use client";

import { Reveal, Stagger, StaggerItem } from "@/components/marketing/motion";
import { ShieldCheck, Cpu, Coins, Lock, CheckCircle2, Zap } from "lucide-react";

const STATS = [
  {
    number: "0%",
    label: "Ad spend commission",
    desc: "We never take a cut of your media budget. Whether you spend $500 or $50,000, Kaya charges only for agent compute.",
    icon: Coins,
    tone: "bg-grass-soft text-grass-deep border-grass/20",
  },
  {
    number: "100%",
    label: "Deterministic policy guardrails",
    desc: "Daily spend limits and channel allowances are enforced by immutable rules. An LLM cannot hallucinate past your budget cap.",
    icon: Lock,
    tone: "bg-lilac-soft text-lilac-deep border-lilac/20",
  },
  {
    number: "89+",
    label: "Unit & causal simulation tests",
    desc: "Our evaluation suite verifies analytics math, two-proportion z-tests, and Poisson rate models before any code reaches production.",
    icon: Cpu,
    tone: "bg-blue-soft text-blue-deep border-blue/20",
  },
  {
    number: "40+",
    label: "Marketing & data integrations",
    desc: "From Google Ads and Meta to Stripe, PostHog, Simple Analytics, and Resend — Kaya connects directly to your existing growth stack.",
    icon: Zap,
    tone: "bg-tangerine-soft text-tangerine-deep border-tangerine/20",
  },
  {
    number: "14 days",
    label: "To first winning signal",
    desc: "Our average time from URL crawl to a ranked experiment yielding statistically significant lift in conversion or payback.",
    icon: CheckCircle2,
    tone: "bg-sun-soft text-sun-deep border-sun/20",
  },
  {
    number: "100%",
    label: "Immutable audit trail",
    desc: "Every tool call, approval, and external ad change is permanently sealed with a database-level append-only trigger.",
    icon: ShieldCheck,
    tone: "bg-pink-soft text-pink-deep border-pink/20",
  },
];

export function AboutNumbers() {
  return (
    <section className="py-20 sm:py-28 bg-surface">
      <div className="mx-auto max-w-[1360px] px-5 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal>
            <p className="font-mono text-xs font-semibold tracking-wider uppercase text-subtle">
              Proof Over Promises
            </p>
            <h2 className="mt-3 text-[clamp(32px,4vw,52px)] leading-[1.05] font-[560] tracking-[-0.04em] text-ink">
              Rigor quantified
            </h2>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="mt-4 text-lg text-muted">
              We hold our software to the same exacting standards we apply to your growth capital.
            </p>
          </Reveal>
        </div>

        <Stagger className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {STATS.map((stat) => {
            const Icon = stat.icon;
            return (
              <StaggerItem key={stat.label}>
                <div className="flex h-full flex-col justify-between rounded-2xl border border-line bg-surface p-7 transition-transform hover:-translate-y-1 hover:shadow-sm">
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-[clamp(44px,4vw,56px)] leading-none font-[560] tracking-tight text-ink">
                        {stat.number}
                      </p>
                      <div className={`flex size-10 items-center justify-center rounded-xl border ${stat.tone}`}>
                        <Icon className="size-5" />
                      </div>
                    </div>
                    <h3 className="mt-4 text-base font-[560] text-ink">{stat.label}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{stat.desc}</p>
                  </div>
                </div>
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
}
