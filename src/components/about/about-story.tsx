"use client";

import { Reveal, Stagger, StaggerItem } from "@/components/marketing/motion";
import { Check, X, ArrowRight, Brain, Target, FlaskConical, ShieldCheck, Sprout } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/i18n/client";


const LOOP_STEPS = [
  {
    step: "01",
    tone: "bg-blue-soft text-blue-deep border-blue/20",
    icon: Brain,
  },
  {
    step: "02",
    tone: "bg-tangerine-soft text-tangerine-deep border-tangerine/20",
    icon: Target,
  },
  {
    step: "03",
    tone: "bg-grass-soft text-grass-deep border-grass/20",
    icon: FlaskConical,
  },
  {
    step: "04",
    tone: "bg-lilac-soft text-lilac-deep border-lilac/20",
    icon: ShieldCheck,
  },
  {
    step: "05",
    tone: "bg-sun-soft text-sun-deep border-sun/20",
    icon: Sprout,
  },
];

export function AboutStory() {
  const st = useI18n().t.about.story;
  return (
    <section className="bg-cream py-20 sm:py-28 border-y border-line">
      <div className="mx-auto max-w-[1360px] px-5 sm:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <p className="font-mono text-xs font-semibold tracking-wider uppercase text-subtle">
              {st.kicker}
            </p>
            <h2 className="mt-3 text-[clamp(32px,4vw,56px)] leading-[1.05] font-[560] tracking-[-0.04em] text-ink">
              {st.titleLine1}
              <br className="hidden sm:inline" />
              {st.titleLine2}
            </h2>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="mt-5 text-lg text-muted leading-relaxed">
              {st.lead}
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
                <h3 className="text-xl font-[560] tracking-tight text-ink">{st.legacyTitle}</h3>
              </div>
              <p className="mt-3 text-sm text-muted">
                {st.legacyLead}
              </p>
              <ul className="mt-6 space-y-3.5 text-sm text-ink/80">
                {st.legacy.map((item) => (
                  <li key={item.strong} className="flex items-start gap-3">
                    <span className="mt-1 flex size-4 shrink-0 items-center justify-center rounded-full bg-negative-soft text-negative text-xs font-bold">✕</span>
                    <span><strong>{item.strong}</strong> {item.text}</span>
                  </li>
                ))}
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
                <h3 className="text-xl font-[560] tracking-tight text-ink">{st.kayaTitle}</h3>
              </div>
              <p className="mt-3 text-sm text-muted">
                {st.kayaLead}
              </p>
              <ul className="mt-6 space-y-3.5 text-sm text-ink/80">
                {st.kaya.map((item) => (
                  <li key={item.strong} className="flex items-start gap-3">
                    <span className="mt-1 flex size-4 shrink-0 items-center justify-center rounded-full bg-agent text-white text-xs font-bold">✓</span>
                    <span><strong>{item.strong}</strong> {item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>

        {/* The 5 Loop Steps */}
        <div className="mt-20">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-wider text-subtle">{st.underHood}</p>
              <h3 className="text-2xl font-[560] tracking-tight text-ink mt-1">{st.pillarsTitle}</h3>
            </div>
            <Link
              href="/demo"
              className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-agent hover:underline"
            >
              <span>{st.explore}</span>
              <ArrowRight className="size-4" />
            </Link>
          </div>

          <Stagger className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {LOOP_STEPS.map((item, i) => {
              const Icon = item.icon;
              const copy = st.steps[i];
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
                      <h4 className="mt-4 text-base font-[560] text-ink">{copy.name}</h4>
                      <p className="font-mono text-[11px] text-muted uppercase tracking-wider mt-0.5">{copy.role}</p>
                      <p className="mt-3 text-xs leading-relaxed text-muted">{copy.desc}</p>
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
