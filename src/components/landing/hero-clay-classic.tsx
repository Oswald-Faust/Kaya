"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { ArrowRight } from "lucide-react";
import { StartForm } from "@/components/onboarding/start-form";
import { BrandIcon } from "@/components/brand/brand-logos";
import { HeroScene } from "@/components/brand/clay";
import { EASE } from "@/components/marketing/motion";
import { cn } from "@/lib/cn";

const ClayMachineScene = dynamic(() => import("./clay-machine-scene").then((m) => m.ClayMachineScene), {
  ssr: false,
  loading: () => <HeroScene className="absolute inset-0 h-full w-full" />,
});

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E\")";

const intro = (i: number) => ({
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.9, ease: EASE, delay: 0.15 + i * 0.1 },
});

/** Version 2 hero: the Clay layout. A 3D clay machine over a green field, headline bottom-left, product analysis on the right. */
export function HeroClayClassic({ demoHref, underNav = true }: { demoHref: string; underNav?: boolean }) {
  const stage = useRef<HTMLDivElement>(null);
  const visible = useInView(stage, { amount: 0.05 });

  return (
    <section ref={stage} className={cn("relative isolate overflow-hidden bg-[#2b6a4e] text-white", underNav && "-mt-[76px]")}>
      <div className="relative h-[clamp(440px,54vw,760px)]">
        <ClayMachineScene eventSource={stage} active={visible} />
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,transparent_55%,rgb(20_50_36/0.28))]" />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-[38%] bg-gradient-to-b from-transparent via-[#2b6a4e]/70 to-[#2b6a4e]" />
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.16] mix-blend-overlay" style={{ backgroundImage: GRAIN }} />

      <div className="relative mx-auto grid max-w-[1360px] gap-10 px-6 pt-2 pb-44 sm:px-12 md:pb-52 lg:grid-cols-[1.25fr_1fr] lg:items-end">
        <motion.h1 {...intro(0)} className="text-[clamp(50px,7.4vw,112px)] leading-[0.94] font-[560] tracking-[-0.05em]">
          Build your product.
          <br />
          Kaya grows it.
        </motion.h1>

        <div className="max-w-xl lg:pb-2">
          <motion.p {...intro(1)} className="text-[clamp(18px,1.7vw,24px)] leading-snug text-white/90">
            The AI agent that reads your product, picks the channels worth your money and runs the experiments that grow revenue.
          </motion.p>
          <motion.div {...intro(2)} className="mt-6 rounded-[20px] bg-surface p-2 text-ink shadow-[0_24px_60px_-24px_rgb(0_0_0/0.45)]">
            <StartForm autoFocus={false} className="" />
          </motion.div>
          <motion.div {...intro(3)} className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-white/75">
            <Link href={demoHref} className="inline-flex h-10 items-center gap-2 rounded-xl bg-lime px-4 font-medium text-ink transition-[filter] hover:brightness-95">
              Get a demo <ArrowRight className="size-4" />
            </Link>
            <span className="flex items-center gap-2">
              or connect directly with
              {(["stripe", "googleads", "posthog"] as const).map((b) => (
                <span key={b} className="grid size-8 place-items-center rounded-full bg-white/15 backdrop-blur">
                  <span className="grid size-6 place-items-center rounded-full bg-white">
                    <BrandIcon brand={b} className="size-3.5" />
                  </span>
                </span>
              ))}
            </span>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
