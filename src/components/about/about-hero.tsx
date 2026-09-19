"use client";

import { ClayDoodleCircle, ClaySquiggle, ClayStar } from "@/components/brand/clay";
import { KayaMark } from "@/components/brand/logo";
import { Reveal } from "@/components/marketing/motion";
import { Sparkles, ArrowRight, ShieldCheck, Heart } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/i18n/client";


export function AboutHero() {
  const h = useI18n().t.about.hero;
  return (
    <section className="relative overflow-hidden pt-12 pb-20 sm:pt-16 sm:pb-28">
      {/* Decorative Clay elements floating */}
      <div className="pointer-events-none absolute -top-6 left-6 hidden lg:block animate-pulse duration-1000">
        <ClaySquiggle tone="lime" width={140} height={50} className="rotate-[-12deg]" />
      </div>
      <div className="pointer-events-none absolute top-28 right-8 hidden lg:block animate-bounce duration-1000">
        <ClayStar tone="sun" size={48} className="rotate-12" />
      </div>
      <div className="pointer-events-none absolute bottom-4 left-1/4 hidden lg:block">
        <ClayStar tone="tangerine" size={32} className="-rotate-6" />
      </div>

      <div className="mx-auto max-w-[1360px] px-5 sm:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          {/* Left Column: Title & Mission */}
          <div>
            <Reveal>
              <div className="inline-flex items-center gap-2 rounded-full border border-line bg-cream px-3.5 py-1 text-xs font-medium text-ink">
                <span className="flex size-2 rounded-full bg-agent animate-ping" />
                <span>{h.badge}</span>
              </div>
            </Reveal>

            <Reveal delay={0.08}>
              <h1 className="relative mt-6 text-[clamp(46px,6.2vw,92px)] leading-[0.94] font-[560] tracking-[-0.045em] text-ink">
                {h.titleAbout}{" "}
                <span className="relative inline-block whitespace-nowrap">
                  Kaya
                  <ClayDoodleCircle className="absolute -inset-x-4 -inset-y-2 pointer-events-none" />
                </span>
              </h1>
            </Reveal>

            <Reveal delay={0.16}>
              <p className="mt-6 text-xl sm:text-2xl font-normal leading-snug tracking-[-0.02em] text-muted max-w-xl">
                {h.lead}
              </p>
            </Reveal>

            <Reveal delay={0.24}>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href="/start"
                  className="inline-flex h-12 items-center gap-2 rounded-xl bg-ink px-6 text-base font-medium text-white transition-all hover:bg-ink-hover hover:gap-3"
                >
                  <span>{h.experience}</span>
                  <ArrowRight className="size-4" />
                </Link>
                <a
                  href="#team"
                  className="inline-flex h-12 items-center rounded-xl border border-line bg-surface px-6 text-base font-medium text-ink transition-colors hover:bg-cream"
                >
                  {h.meetTeam}
                </a>
              </div>
            </Reveal>

            <Reveal delay={0.32}>
              <div className="mt-10 flex items-center gap-6 border-t border-line pt-6 text-sm text-muted">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-grass-deep" />
                  <span>{h.trust[0]}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-sun-deep" />
                  <span>{h.trust[1]}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Heart className="size-4 text-pink-deep" />
                  <span>{h.trust[2]}</span>
                </div>
              </div>
            </Reveal>
          </div>

          {/* Right Column: Tactile Clay Founder's Letter inside Envelope (Clay.com signature) */}
          <Reveal delay={0.2}>
            <div className="relative mx-auto w-full max-w-[540px]">
              {/* Envelope back flap shadow & ground */}
              <div className="absolute -inset-2 rounded-3xl bg-stone/70 blur-xl transform -rotate-1" />

              {/* Envelope card body */}
              <div className="relative rounded-3xl border border-line-strong/60 bg-[#FAF7F2] p-6 sm:p-9 shadow-lg">
                {/* Envelope top seal & stamp */}
                <div className="flex items-center justify-between border-b border-line/80 pb-5">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-ink text-white shadow-sm">
                      <KayaMark className="size-6" />
                    </div>
                    <div>
                      <p className="font-mono text-xs tracking-wider uppercase text-subtle">{h.noteKicker}</p>
                      <p className="text-xs text-muted">{h.noteFrom}</p>
                    </div>
                  </div>
                  {/* Clay Wax Seal */}
                  <div className="flex size-10 items-center justify-center rounded-full bg-tangerine-soft border border-tangerine/30 shadow-inner">
                    <ClayStar tone="tangerine" size={24} />
                  </div>
                </div>

                {/* Letter Body */}
                <div className="mt-6 space-y-4 text-[15px] sm:text-[16px] leading-relaxed text-ink/90 font-[450]">
                  {h.letter.map((para) => (
                    <p key={para}>{para}</p>
                  ))}
                  <p>
                    {h.letterBuiltBefore} <span className="font-semibold text-ink">Kaya</span> {h.letterBuiltAfter}
                  </p>
                  <p className="font-medium text-ink">{h.letterClosing}</p>
                </div>

                {/* Founder Signature footer */}
                <div className="mt-7 flex items-end justify-between border-t border-line/70 pt-5">
                  <div>
                    <p className="font-serif italic text-2xl tracking-wide text-ink select-none font-medium whitespace-nowrap">
                      {h.signature}
                    </p>
                    <p className="font-mono text-[11px] uppercase tracking-wider text-muted mt-1">
                      {h.places}
                    </p>
                  </div>
                  <div className="rounded-lg bg-lime-soft px-3 py-1.5 font-mono text-[11px] font-medium text-lime-deep border border-lime/30">
                    {h.version}
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
