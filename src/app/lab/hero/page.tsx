import Link from "next/link";
import type { Metadata } from "next";
import { HeroClay3D, HeroProduct, HeroTypewriter } from "@/components/landing/hero-variants";
import { HeroClayClassic } from "@/components/landing/hero-clay-classic";
import { SiteNav } from "@/components/marketing/site-nav";

export const metadata: Metadata = { title: "Hero proposals", robots: { index: false } };

const VARIANTS = [
  {
    key: "a",
    name: "A · Clay 3D",
    note: "Real-time 3D: the Kaya mark's three clay pills grow out of an ink slab and follow the cursor, with floating clay shapes. The URL field sits in the hero so visitors can start immediately. Inspired by Spline and Clay's clay objects.",
    Hero: HeroClay3D,
  },
  {
    key: "b",
    name: "B · Product in perspective",
    note: "A big centered headline, then the Command Center tilted in 3D that straightens as you scroll, with agent events floating around it. Inspired by Ramp, Maze and Sana.",
    Hero: HeroProduct,
  },
  {
    key: "c",
    name: "C · Type a URL",
    note: "The product demonstrates itself: a URL types out and three result cards fan in (who buys, best channel, first experiment), cycling through fictional products. Inspired by Firecrawl and V7.",
    Hero: HeroTypewriter,
  },
  {
    key: "clay",
    name: "D · Clay classic (version 2 at /v2)",
    note: "The Clay layout: a real-time 3D clay machine (physics balls, rocking seesaw, spinning pinwheel, curly tube, stairs) over a speckled green field, headline bottom-left, product analysis on the right.",
    Hero: ({ demoHref }: { demoHref: string }) => <HeroClayClassic demoHref={demoHref} underNav={false} />,
  },
];

export default function HeroLab() {
  return (
    <div className="bg-surface pb-24">
      <SiteNav />
      <div className="mx-auto max-w-[1360px] px-5 pt-10">
        <p className="font-mono text-[11px] tracking-[0.12em] text-subtle uppercase">Hero lab</p>
        <h1 className="mt-2 text-5xl font-medium tracking-[-0.045em]">Four hero directions</h1>
        <p className="mt-3 max-w-2xl text-muted">
          Preview each one on the real page with <code className="rounded bg-sunken px-1.5 py-0.5 font-mono text-sm">/?hero=a</code>,{" "}
          <code className="rounded bg-sunken px-1.5 py-0.5 font-mono text-sm">?hero=b</code> or <code className="rounded bg-sunken px-1.5 py-0.5 font-mono text-sm">?hero=c</code>.
        </p>
      </div>
      {VARIANTS.map(({ key, name, note, Hero }) => (
        <section key={key} className="mt-16">
          <div className="mx-auto mb-5 flex max-w-[1360px] flex-wrap items-end justify-between gap-4 px-5">
            <div>
              <h2 className="text-2xl font-medium tracking-[-0.03em]">{name}</h2>
              <p className="mt-1 max-w-3xl text-sm text-muted">{note}</p>
            </div>
            <Link href={`/?hero=${key}`} className="rounded-xl bg-ink px-4 py-2 text-sm font-medium text-white">
              Open on the home page
            </Link>
          </div>
          <Hero demoHref="/start" />
        </section>
      ))}
    </div>
  );
}
