import Link from "next/link";
import type { CSSProperties } from "react";
import { ArrowRight, ArrowUpRight, BookOpen, MessageSquare } from "lucide-react";
import { KaiMark } from "@/components/brand/kai-mark";
import { KaiDemo } from "@/components/marketing/kai-demo";
import { Reveal, Stagger, StaggerItem } from "@/components/marketing/motion";
import { getI18n } from "@/i18n/server";
import { cn } from "@/lib/cn";

/**
 * The break in the home page: after the pastel pillars of the loop, a dark
 * stage for Kai. A tilted band of real questions cuts across its top edge, then
 * a conversation plays itself, then four proofs of what Kai does.
 */
export async function KaiSection({ demoSlug }: { demoSlug: string | null }) {
  const { t } = await getI18n();
  const k = t.kai;
  const questions = k.page.askGroups.flatMap((g) => g.prompts);
  const kaiHref = demoSlug ? `/w/${demoSlug}/kai` : `/demo?to=${encodeURIComponent("/kai")}`;

  return (
    <section id="kai" aria-labelledby="kai-title" className="relative scroll-mt-24 overflow-x-clip px-3 pt-28 sm:px-5 sm:pt-36">
      {/* The cut: a tilted ribbon of questions founders ask Kai. */}
      <div aria-hidden className="pointer-events-none relative z-20 -mb-10 -rotate-2 sm:-mb-12">
        <div className="marquee mx-[-2vw] overflow-hidden bg-lime py-3 shadow-[0_18px_40px_-20px_rgba(11,11,11,0.45)]">
          <ul className="marquee-track flex w-max items-center gap-6" style={{ "--marquee-duration": "70s" } as CSSProperties}>
            {[...questions, ...questions].map((q, i) => (
              <li key={i} className="flex items-center gap-6 text-[15px] font-medium whitespace-nowrap text-ink">
                <KaiMark className="size-5" />
                {q}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="relative mx-auto max-w-[1360px] overflow-hidden rounded-[32px] bg-ink text-white">
        <div aria-hidden className="kai-glow absolute inset-0" />
        <div aria-hidden className="kai-grid absolute inset-0" />

        <div className="relative px-5 pt-24 pb-14 sm:px-10 sm:pt-28 sm:pb-20">
          <Reveal className="flex flex-col items-center text-center">
            <div className="relative">
              <span aria-hidden className="absolute inset-0 -m-3 animate-pulse rounded-[28px] bg-[#4d78ff]/25 blur-xl" />
              <KaiMark className="relative size-16 drop-shadow-[0_12px_30px_rgba(77,120,255,0.45)]" thinking />
            </div>
            <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] py-1 pr-3 pl-1 text-xs text-white/70">
              <span className="rounded-full bg-lime px-2 py-0.5 font-mono text-[10px] tracking-[0.12em] text-ink uppercase">{k.newBadge}</span>
              {k.eyebrow}
            </p>
            <h2 id="kai-title" className="mt-6 max-w-5xl text-balance text-[clamp(40px,5.6vw,80px)] leading-[0.98] font-medium tracking-[-0.045em]">
              {k.section.titleA}
              <br />
              <span className="bg-gradient-to-r from-[#b7c7ff] via-[#c9b8ff] to-[#ffc6a8] bg-clip-text text-transparent">{k.section.titleB}</span>
            </h2>
            <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-white/60">{k.section.body}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              <Link href="/kai" className="inline-flex h-11 items-center gap-2 rounded-xl bg-white px-5 text-[15px] font-medium text-ink transition-colors hover:bg-white/90">
                {k.discover} <ArrowRight className="size-4" />
              </Link>
              <a href={kaiHref} className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/15 px-5 text-[15px] font-medium text-white transition-colors hover:border-white/40">
                {k.tryDemo} <ArrowUpRight className="size-4" />
              </a>
            </div>
          </Reveal>

          <Reveal delay={0.1} y={40} className="mt-14">
            <KaiDemo demoSlug={demoSlug} />
          </Reveal>

          <Stagger className="mx-auto mt-14 grid max-w-[1120px] gap-3 sm:grid-cols-2 lg:grid-cols-4" stagger={0.08}>
            {k.section.bento.map((b) => (
              <StaggerItem key={b.id} className="flex flex-col rounded-[20px] border border-white/[0.08] bg-white/[0.035] p-5 transition-colors hover:border-white/15">
                <BentoVisual id={b.id} honestLine={k.section.honestSample} />
                <p className="mt-5 text-base font-medium tracking-[-0.01em]">{b.title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-white/55">{b.body}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </div>
    </section>
  );
}

/** A small, literal picture of each proof, drawn from the real UI. */
function BentoVisual({ id, honestLine }: { id: string; honestLine: string }) {
  const frame = "h-[88px] rounded-xl border border-white/[0.07] bg-black/30 p-3";
  if (id === "sources") {
    return (
      <div className={cn(frame, "flex flex-col justify-center gap-1.5")}>
        {[
          ["1", "pricing.model", "95%"],
          ["2", "Cronitor", "90%"],
        ].map(([n, label, c]) => (
          <div key={n} className="flex items-center gap-2 rounded-lg bg-white/[0.05] px-2 py-1.5 text-[11px]">
            <span className="grid size-4 place-items-center rounded bg-[#8fa9ff] font-mono text-[9px] text-ink">{n}</span>
            <span className="truncate text-white/75">{label}</span>
            <span className="ml-auto font-mono text-white/40">{c}</span>
          </div>
        ))}
      </div>
    );
  }
  if (id === "honest") {
    return (
      <div className={cn(frame, "flex items-center gap-2")}>
        <KaiMark className="size-6" />
        <p className="line-clamp-3 min-w-0 rounded-xl rounded-tl-sm bg-white/[0.06] px-2.5 py-1.5 text-[11px] leading-snug text-white/70">{honestLine}</p>
      </div>
    );
  }
  if (id === "everywhere") {
    return (
      <div className={cn(frame, "flex items-center justify-center gap-2")}>
        {["⌘", "J"].map((key) => (
          <kbd key={key} className="grid size-11 place-items-center rounded-xl border border-white/15 bg-gradient-to-b from-white/[0.12] to-white/[0.03] font-sans text-lg text-white shadow-[inset_0_-2px_0_rgba(255,255,255,0.08)]">
            {key}
          </kbd>
        ))}
      </div>
    );
  }
  return (
    <div className={cn(frame, "flex flex-col justify-center gap-1.5")}>
      {[0.85, 0.6].map((w, i) => (
        <div key={i} className="flex items-center gap-2 rounded-lg px-1.5 py-1 text-white/60">
          {i === 0 ? <MessageSquare className="size-3.5" /> : <BookOpen className="size-3.5" />}
          <span className="h-1.5 rounded-full bg-white/20" style={{ width: `${w * 100}%` }} />
        </div>
      ))}
    </div>
  );
}
