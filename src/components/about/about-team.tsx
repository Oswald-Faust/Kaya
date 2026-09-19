"use client";

import { Reveal, Stagger, StaggerItem } from "@/components/marketing/motion";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/cn";

/** Portrait grounds, one clay tint per founder. Replace with a photo once we have one. */
const PORTRAITS = [
  { ground: "bg-lime-soft", ink: "text-lime-deep", dot: "bg-lime" },
  { ground: "bg-lilac-soft", ink: "text-lilac-deep", dot: "bg-lilac" },
] as const;

/**
 * The founders, laid out like IntegratedBio's team block: the intro on the
 * left, one card per founder on the right, and their shared line underneath.
 */
export function AboutTeam() {
  const tm = useI18n().t.about.team;
  return (
    <section id="team" className="scroll-mt-24 px-3 py-20 sm:px-5 sm:py-28">
      <div className="mx-auto max-w-[1360px]">
        <Reveal>
          <h2 className="text-[clamp(44px,6vw,88px)] leading-[0.95] font-medium tracking-[-0.05em]">
            {tm.title}
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-4 lg:grid-cols-[0.8fr_2fr]">
          <Reveal className="flex flex-col rounded-[28px] border border-line bg-surface p-6 sm:p-7">
            <span className="inline-flex w-fit items-center gap-2 rounded-md border border-line bg-cream px-2 py-1 font-mono text-[11px] tracking-[0.12em] uppercase">
              <span className="size-1.5 rounded-sm bg-grass" />
              {tm.kicker}
            </span>
            <p className="mt-6 text-[17px] leading-relaxed text-ink/80">{tm.lead}</p>
          </Reveal>

          <Stagger className="grid gap-4 sm:grid-cols-2" stagger={0.1}>
            {tm.members.map((m, i) => {
              const p = PORTRAITS[i % PORTRAITS.length];
              return (
                <StaggerItem key={m.name} className="flex flex-col rounded-[28px] border border-line bg-surface p-3">
                  <div className={cn("relative grid aspect-[4/3] place-items-center overflow-hidden rounded-[20px]", p.ground)}>
                    <span aria-hidden className={cn("text-[clamp(88px,10vw,140px)] leading-none font-medium tracking-[-0.06em]", p.ink)}>
                      {m.initials}
                    </span>
                    <span aria-hidden className={cn("absolute top-4 right-4 size-3 rounded-full", p.dot)} />
                  </div>
                  <div className="flex flex-1 flex-col px-3 pt-5 pb-3">
                    <h3 className="text-2xl font-medium tracking-[-0.03em]">{m.name}</h3>
                    <p className="mt-1 font-mono text-[11px] tracking-[0.12em] text-subtle uppercase">{m.role}</p>
                    <p className="mt-4 text-[15px] leading-relaxed text-muted">{m.bio}</p>
                  </div>
                </StaggerItem>
              );
            })}
          </Stagger>
        </div>

        <Reveal className="mx-auto mt-20 max-w-3xl text-center">
          <p className="text-[clamp(26px,3vw,40px)] leading-[1.15] font-medium tracking-[-0.03em]">“{tm.quote}”</p>
          <p className="mt-4 text-sm text-muted">{tm.quoteBy}</p>
        </Reveal>
      </div>
    </section>
  );
}
