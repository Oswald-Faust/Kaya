"use client";

import { ClayBulb, ClayCompass, ClayGears, ClayMegaphone } from "@/components/brand/clay-objects";
import { InView, Reveal, Stagger, StaggerItem } from "@/components/marketing/motion";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/cn";

const MOMENTS = [
  { Obj: ClayGears, tone: "bg-lime-soft" },
  { Obj: ClayMegaphone, tone: "bg-pink-soft" },
  { Obj: ClayBulb, tone: "bg-sun-soft" },
  { Obj: ClayCompass, tone: "bg-blue-soft" },
] as const;

/** How we build Kaya: four habits, each with its own clay object. */
export function AboutCulture() {
  const c = useI18n().t.about.culture;
  return (
    <section className="px-3 sm:px-5">
      <div className="mx-auto max-w-[1360px] rounded-[32px] bg-cream px-5 py-16 sm:px-10 sm:py-20">
        <Reveal className="max-w-2xl">
          <p className="font-mono text-[11px] tracking-[0.12em] text-subtle uppercase">{c.kicker}</p>
          <h2 className="mt-4 text-[clamp(34px,4.2vw,56px)] leading-[1.02] font-medium tracking-[-0.045em]">{c.title}</h2>
          <p className="mt-4 text-lg text-muted">{c.lead}</p>
        </Reveal>
        <InView>
          <Stagger className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" stagger={0.08}>
            {c.moments.map((m, i) => {
              const { Obj, tone } = MOMENTS[i % MOMENTS.length];
              return (
                <StaggerItem key={m.title} className="flex flex-col overflow-hidden rounded-[24px] bg-surface">
                  <div className={cn("px-8 pt-6 pb-2", tone)}>
                    <Obj className="mx-auto w-full max-w-[200px]" />
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-medium tracking-[-0.02em]">{m.title}</h3>
                    <p className="mt-2 text-[15px] leading-relaxed text-muted">{m.caption}</p>
                  </div>
                </StaggerItem>
              );
            })}
          </Stagger>
        </InView>
      </div>
    </section>
  );
}
