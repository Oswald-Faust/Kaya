"use client";

import { Reveal } from "@/components/marketing/motion";
import Image from "next/image";
import { useI18n } from "@/i18n/client";


const CULTURE_MOMENTS = [
  {
    image: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&auto=format&fit=crop&q=80",
    className: "md:col-span-2 md:row-span-2",
  },
  {
    image: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=600&auto=format&fit=crop&q=80",
    className: "md:col-span-1 md:row-span-1",
  },
  {
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&auto=format&fit=crop&q=80",
    className: "md:col-span-1 md:row-span-1",
  },
  {
    image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80",
    className: "md:col-span-2 md:row-span-1",
  },
];

export function AboutCulture() {
  const c = useI18n().t.about.culture;
  return (
    <section className="py-20 sm:py-28 bg-cream border-t border-line">
      <div className="mx-auto max-w-[1360px] px-5 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal>
            <p className="font-mono text-xs font-semibold tracking-wider uppercase text-subtle">
              {c.kicker}
            </p>
            <h2 className="mt-3 text-[clamp(32px,4vw,52px)] leading-[1.05] font-[560] tracking-[-0.04em] text-ink">
              {c.title}
            </h2>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="mt-4 text-lg text-muted">
              {c.lead}
            </p>
          </Reveal>
        </div>

        {/* Photo Gallery Grid (Clay style) */}
        <div className="mt-14 grid gap-5 md:grid-cols-3 md:grid-rows-2">
          {CULTURE_MOMENTS.map((base, idx) => ({ ...base, ...c.moments[idx] })).map((item, idx) => (
            <Reveal key={item.title} delay={0.05 * idx} className={item.className}>
              <div className="group relative h-72 md:h-full min-h-[260px] w-full overflow-hidden rounded-2xl border border-line bg-stone shadow-sm">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover grayscale contrast-105 transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent p-6 flex flex-col justify-end text-white">
                  <p className="font-[560] text-lg text-white drop-shadow-sm">{item.title}</p>
                  <p className="text-xs text-white/80 mt-1 max-w-md drop-shadow-sm leading-relaxed">
                    {item.caption}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
