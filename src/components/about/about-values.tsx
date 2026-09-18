"use client";

import { ControlSpot, DecideSpot, ExperimentSpot, UnderstandSpot } from "@/components/brand/clay";
import { Reveal, Stagger, StaggerItem } from "@/components/marketing/motion";
import { useI18n } from "@/i18n/client";


const VALUES = [
  {
    tone: "bg-grass-soft border-grass/20",
    textTone: "text-grass-deep",
    renderSpot: () => <ExperimentSpot className="h-32 w-auto mx-auto" />,
  },
  {
    tone: "bg-lilac-soft border-lilac/20",
    textTone: "text-lilac-deep",
    renderSpot: () => <ControlSpot className="h-32 w-auto mx-auto" />,
  },
  {
    tone: "bg-blue-soft border-blue/20",
    textTone: "text-blue-deep",
    renderSpot: () => <UnderstandSpot className="h-32 w-auto mx-auto" />,
  },
  {
    tone: "bg-tangerine-soft border-tangerine/20",
    textTone: "text-tangerine-deep",
    renderSpot: () => <DecideSpot className="h-32 w-auto mx-auto" />,
  },
];

export function AboutValues() {
  const v = useI18n().t.about.values;
  return (
    <section className="py-20 sm:py-28 bg-surface">
      <div className="mx-auto max-w-[1360px] px-5 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal>
            <p className="font-mono text-xs font-semibold tracking-wider uppercase text-subtle">
              {v.kicker}
            </p>
            <h2 className="mt-3 text-[clamp(32px,4vw,52px)] leading-[1.05] font-[560] tracking-[-0.04em] text-ink">
              {v.title}
            </h2>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="mt-4 text-lg text-muted">
              {v.lead}
            </p>
          </Reveal>
        </div>

        <Stagger className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map((val, i) => ({ ...val, ...v.items[i] })).map((val) => (
            <StaggerItem key={val.title}>
              <div className={`flex h-full flex-col justify-between rounded-2xl border p-6 sm:p-7 ${val.tone} transition-transform hover:-translate-y-1`}>
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <span className={`font-mono text-[11px] font-semibold uppercase tracking-wider ${val.textTone}`}>
                      {val.kicker}
                    </span>
                  </div>
                  <div className="my-3 flex items-center justify-center">
                    {val.renderSpot()}
                  </div>
                  <h3 className="mt-4 text-xl font-[560] tracking-tight text-ink">{val.title}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-ink/75">{val.desc}</p>
                </div>
                <div className="mt-6 border-t border-ink/10 pt-4">
                  <p className="font-mono text-xs italic text-ink/80">{val.quote}</p>
                </div>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
