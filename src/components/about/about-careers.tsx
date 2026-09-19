"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ClayEnvelopes } from "@/components/brand/clay-objects";
import { InView, Reveal } from "@/components/marketing/motion";
import { useI18n } from "@/i18n/client";

/** No open roles yet: the ask is for design partners, straight to the founders. */
export function AboutCareers() {
  const c = useI18n().t.about.careers;
  return (
    <section id="careers" className="px-3 pt-4 sm:px-5 sm:pt-5">
      <div className="mx-auto grid max-w-[1360px] items-center gap-6 overflow-hidden rounded-[32px] bg-lime-soft px-6 py-12 sm:px-12 lg:grid-cols-[1.2fr_1fr]">
        <Reveal>
          <span className="inline-flex rounded-full bg-lime px-3 py-1 font-mono text-[11px] tracking-[0.12em] uppercase">{c.badge}</span>
          <h2 className="mt-6 text-[clamp(34px,4.2vw,56px)] leading-[1.02] font-medium tracking-[-0.045em]">{c.title}</h2>
          <p className="mt-4 max-w-xl text-lg text-ink/75">{c.lead}</p>
          <p className="mt-2 max-w-xl text-[15px] text-muted">{c.openNote}</p>
          <div className="mt-8 flex flex-wrap gap-2">
            <a href={`mailto:founders@kaya.so?subject=${encodeURIComponent(c.mailSubject.trim())}`} className="inline-flex h-11 items-center gap-2 rounded-xl bg-ink px-5 text-[15px] font-medium text-white transition-colors hover:bg-ink-hover">
              {c.emailFounders}
            </a>
            <Link href="/start" className="inline-flex h-11 items-center gap-2 rounded-xl border border-ink/15 bg-surface px-5 text-[15px] font-medium transition-colors hover:border-ink">
              {c.apply} <ArrowRight className="size-4" />
            </Link>
          </div>
        </Reveal>
        <InView className="flex justify-center">
          <ClayEnvelopes className="w-full max-w-[380px]" />
        </InView>
      </div>
    </section>
  );
}
