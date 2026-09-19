"use client";

import { Reveal, Stagger, StaggerItem } from "@/components/marketing/motion";
import { BookOpen, Gauge, Languages, Layers, Lock, ScrollText } from "lucide-react";
import { useI18n } from "@/i18n/client";


const STATS = [
  {
    icon: Gauge,
    tone: "bg-grass-soft text-grass-deep border-grass/20",
  },
  {
    icon: Layers,
    tone: "bg-lilac-soft text-lilac-deep border-lilac/20",
  },
  {
    icon: Lock,
    tone: "bg-blue-soft text-blue-deep border-blue/20",
  },
  {
    icon: ScrollText,
    tone: "bg-tangerine-soft text-tangerine-deep border-tangerine/20",
  },
  {
    icon: BookOpen,
    tone: "bg-sun-soft text-sun-deep border-sun/20",
  },
  {
    icon: Languages,
    tone: "bg-pink-soft text-pink-deep border-pink/20",
  },
];

export function AboutNumbers() {
  const n = useI18n().t.about.numbers;
  return (
    <section className="py-20 sm:py-28 bg-surface">
      <div className="mx-auto max-w-[1360px] px-5 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal>
            <p className="font-mono text-xs font-semibold tracking-wider uppercase text-subtle">
              {n.kicker}
            </p>
            <h2 className="mt-3 text-[clamp(32px,4vw,52px)] leading-[1.05] font-[560] tracking-[-0.04em] text-ink">
              {n.title}
            </h2>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="mt-4 text-lg text-muted">
              {n.lead}
            </p>
          </Reveal>
        </div>

        <Stagger className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {STATS.map((base, i) => ({ ...base, ...n.stats[i] })).map((stat) => {
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
