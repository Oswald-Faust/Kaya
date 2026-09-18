"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/client";
import { ArrowRight } from "lucide-react";
import { HillsStrip } from "@/components/brand/clay";
import { InView, Reveal } from "./motion";

export function ClosingCta({ demoHref = "/demo", title }: { demoHref?: string; title?: string }) {
  const { t } = useI18n();
  const c = t.marketing.chrome;
  return (
    <section className="relative mt-28 overflow-hidden text-center sm:mt-36">
      <Reveal className="mx-auto max-w-3xl px-5">
        <h2 className="text-[clamp(42px,5.8vw,80px)] leading-[0.98] font-medium tracking-[-0.045em]">{title ?? c.ctaTitle}</h2>
        <p className="mt-5 text-lg text-muted">{c.ctaLead}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          <Link href="/start" className="inline-flex h-11 items-center gap-2 rounded-xl bg-ink px-5 text-[15px] font-medium text-white transition-colors hover:bg-ink-hover">
            {c.ctaAnalyze} <ArrowRight className="size-4" />
          </Link>
          <Link href={demoHref} className="inline-flex h-11 items-center rounded-xl border border-line-strong bg-surface px-5 text-[15px] font-medium transition-colors hover:border-ink">
            {c.getDemo}
          </Link>
        </div>
      </Reveal>
      <InView amount={0.1}>
        <HillsStrip className="mt-10 h-[180px] w-full sm:h-[240px]" />
      </InView>
    </section>
  );
}
