"use client";

import { ControlSpot, DecideSpot, ExperimentSpot, UnderstandSpot } from "@/components/brand/clay";
import { Reveal, Stagger, StaggerItem } from "@/components/marketing/motion";

const VALUES = [
  {
    title: "Proof over promises",
    kicker: "Rigor first",
    tone: "bg-grass-soft border-grass/20",
    textTone: "text-grass-deep",
    desc: "We never sell 'AI-powered magic.' Kaya writes out the statistical formula, shows the sample size, and performs two-proportion z-tests before declaring any experiment a winner.",
    quote: "“Kaya paused the ad. It cost $212 per customer.”",
    renderSpot: () => <ExperimentSpot className="h-32 w-auto mx-auto" />,
  },
  {
    title: "You keep the keys",
    kicker: "Hard governance",
    tone: "bg-lilac-soft border-lilac/20",
    textTone: "text-lilac-deep",
    desc: "Autonomous does not mean uncontrollable. Your daily budget caps and channel allowances are enforced by immutable database rules that no LLM or prompt can override.",
    quote: "“Hard caps are hard caps. The agent proposes, you command.”",
    renderSpot: () => <ControlSpot className="h-32 w-auto mx-auto" />,
  },
  {
    title: "Clear before clever",
    kicker: "Radical clarity",
    tone: "bg-blue-soft border-blue/20",
    textTone: "text-blue-deep",
    desc: "Marketing jargon exists to mask lack of results. Kaya uses plain language, ledger-style tables, and visible formulas so every number can be traced back to its raw event.",
    quote: "“Simple tables with provenance beat 20 colorful charts with no source.”",
    renderSpot: () => <UnderstandSpot className="h-32 w-auto mx-auto" />,
  },
  {
    title: "Playful, never silly",
    kicker: "The craft of building",
    tone: "bg-tangerine-soft border-tangerine/20",
    textTone: "text-tangerine-deep",
    desc: "We are serious about capital and code, but we believe software should feel tactile, responsive, and joyful to use. The clay aesthetic reminds us that growth is something you shape with care.",
    quote: "“Serious about your runway. Warm and human in the details.”",
    renderSpot: () => <DecideSpot className="h-32 w-auto mx-auto" />,
  },
];

export function AboutValues() {
  return (
    <section className="py-20 sm:py-28 bg-surface">
      <div className="mx-auto max-w-[1360px] px-5 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal>
            <p className="font-mono text-xs font-semibold tracking-wider uppercase text-subtle">
              Our Operating Principles
            </p>
            <h2 className="mt-3 text-[clamp(32px,4vw,52px)] leading-[1.05] font-[560] tracking-[-0.04em] text-ink">
              Four rules we never compromise on
            </h2>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="mt-4 text-lg text-muted">
              These principles govern every line of code we write, every model we deploy, and every recommendation Kaya delivers.
            </p>
          </Reveal>
        </div>

        <Stagger className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map((val) => (
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
