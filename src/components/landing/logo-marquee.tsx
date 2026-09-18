"use client";

import type { CSSProperties } from "react";
import { useI18n } from "@/i18n/client";
import type { Dictionary } from "@/i18n/dictionaries";
import { BRANDS, BrandIcon, brandStatus, type BrandName } from "@/components/brand/brand-logos";
import { cn } from "@/lib/cn";

type Tile =
  | { kind: "logo"; brand: BrandName }
  | { kind: "wide"; brand: BrandName; text: MarqueeKey }
  | { kind: "stat"; value: string; label: MarqueeKey; note: MarqueeKey; tone: string };

type MarqueeKey = keyof Dictionary["hero"]["marquee"];

const ROWS: { direction: "left" | "right"; duration: string; tiles: Tile[] }[] = [
  {
    direction: "left",
    duration: "80s",
    tiles: [
      { kind: "wide", brand: "stripe", text: "stripe" },
      { kind: "logo", brand: "googleads" },
      { kind: "logo", brand: "meta" },
      { kind: "stat", value: "+31%", label: "stat1", note: "demoNote", tone: "bg-lime-soft" },
      { kind: "logo", brand: "posthog" },
      { kind: "logo", brand: "linkedin" },
      { kind: "wide", brand: "googleanalytics", text: "googleanalytics" },
      { kind: "logo", brand: "shopify" },
      { kind: "logo", brand: "producthunt" },
      { kind: "logo", brand: "x" },
      { kind: "logo", brand: "webflow" },
    ],
  },
  {
    direction: "right",
    duration: "95s",
    tiles: [
      { kind: "wide", brand: "hubspot", text: "hubspot" },
      { kind: "logo", brand: "framer" },
      { kind: "logo", brand: "wordpress" },
      { kind: "stat", value: "$0", label: "stat2", note: "codeNote", tone: "bg-blue-soft" },
      { kind: "logo", brand: "resend" },
      { kind: "logo", brand: "brevo" },
      { kind: "logo", brand: "plausible" },
      { kind: "wide", brand: "searchconsole", text: "searchconsole" },
      { kind: "logo", brand: "paddle" },
      { kind: "logo", brand: "lemonsqueezy" },
      { kind: "logo", brand: "tiktok" },
      { kind: "logo", brand: "reddit" },
    ],
  },
  {
    direction: "left",
    duration: "88s",
    tiles: [
      { kind: "wide", brand: "github", text: "github" },
      { kind: "logo", brand: "hackernews" },
      { kind: "logo", brand: "notion" },
      { kind: "logo", brand: "zapier" },
      { kind: "stat", value: "13", label: "stat3", note: "demoNote", tone: "bg-sun-soft" },
      { kind: "logo", brand: "mixpanel" },
      { kind: "logo", brand: "youtube" },
      { kind: "wide", brand: "revenuecat", text: "revenuecat" },
      { kind: "logo", brand: "loops" },
      { kind: "logo", brand: "mailchimp" },
      { kind: "logo", brand: "appstore" },
      { kind: "logo", brand: "googleplay" },
      { kind: "logo", brand: "intercom" },
    ],
  },
];

const BADGE = {
  connected: null,
  channel: { label: "channel", className: "bg-tangerine-soft text-tangerine-deep" },
  soon: { label: "soon", className: "bg-sunken text-subtle" },
} as const;

function TileView({ tile }: { tile: Tile }) {
  const m = useI18n().t.hero.marquee;
  if (tile.kind === "stat") {
    return (
      <div className={cn("flex h-[96px] w-[300px] shrink-0 items-center gap-4 rounded-2xl px-5", tile.tone)}>
        <span className="text-[40px] leading-none font-medium tracking-[-0.05em] tabular">{tile.value}</span>
        <span className="text-sm leading-snug">
          {m[tile.label]}
          <span className="block font-mono text-[10px] text-subtle uppercase">{m[tile.note]}</span>
        </span>
      </div>
    );
  }
  const badge = BADGE[brandStatus(tile.brand)];
  const name = BRANDS[tile.brand].title;
  return (
    <div className={cn("relative flex h-[96px] shrink-0 items-center rounded-2xl bg-surface px-5", tile.kind === "wide" ? "w-[440px] gap-5" : "w-[210px] justify-center")}>
      <span className="flex shrink-0 items-center gap-2 text-[16px] font-semibold tracking-[-0.03em] text-ink/85">
        <BrandIcon brand={tile.brand} className="size-5" />
        {name}
      </span>
      {tile.kind === "wide" && <span className="text-sm leading-snug text-muted">{m[tile.text]}</span>}
      {badge && <span className={cn("absolute top-2 right-2 rounded-full px-1.5 py-0.5 font-mono text-[9px] tracking-wide uppercase", badge.className)}>{m[badge.label]}</span>}
    </div>
  );
}

export function LogoMarquee() {
  return (
    <div className="space-y-2 [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]">
      {ROWS.map((row, r) => (
        <div key={r} className="marquee overflow-hidden">
          <ul className="marquee-track flex w-max gap-2" data-direction={row.direction} style={{ "--marquee-duration": row.duration } as CSSProperties}>
            {[...row.tiles, ...row.tiles].map((tile, i) => (
              <li key={i} aria-hidden={i >= row.tiles.length || undefined}>
                <TileView tile={tile} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
