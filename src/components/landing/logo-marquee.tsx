import type { CSSProperties } from "react";
import { BRANDS, BrandIcon, brandStatus, type BrandName } from "@/components/brand/brand-logos";
import { cn } from "@/lib/cn";

type Tile =
  | { kind: "logo"; brand: BrandName }
  | { kind: "wide"; brand: BrandName; text: string }
  | { kind: "stat"; value: string; label: string; note: string; tone: string };

const ROWS: { direction: "left" | "right"; duration: string; tiles: Tile[] }[] = [
  {
    direction: "left",
    duration: "80s",
    tiles: [
      { kind: "wide", brand: "stripe", text: "Revenue truth: MRR, churn and payback from real invoices." },
      { kind: "logo", brand: "googleads" },
      { kind: "logo", brand: "meta" },
      { kind: "stat", value: "+31%", label: "trial starts from one comparison page", note: "Tickwarden demo", tone: "bg-lime-soft" },
      { kind: "logo", brand: "posthog" },
      { kind: "logo", brand: "linkedin" },
      { kind: "wide", brand: "googleanalytics", text: "Experiments measured in signups and customers, not impressions." },
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
      { kind: "wide", brand: "hubspot", text: "Syncs signups and deals so CAC counts real customers." },
      { kind: "logo", brand: "framer" },
      { kind: "logo", brand: "wordpress" },
      { kind: "stat", value: "$0", label: "spent without your approval in Copilot mode", note: "Enforced in code", tone: "bg-blue-soft" },
      { kind: "logo", brand: "resend" },
      { kind: "logo", brand: "brevo" },
      { kind: "logo", brand: "plausible" },
      { kind: "wide", brand: "searchconsole", text: "Finds the queries worth writing a page for." },
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
      { kind: "wide", brand: "github", text: "Reads your changelog to learn what just shipped." },
      { kind: "logo", brand: "hackernews" },
      { kind: "logo", brand: "notion" },
      { kind: "logo", brand: "zapier" },
      { kind: "stat", value: "13", label: "experiments judged with real statistics", note: "Tickwarden demo", tone: "bg-sun-soft" },
      { kind: "logo", brand: "mixpanel" },
      { kind: "logo", brand: "youtube" },
      { kind: "wide", brand: "revenuecat", text: "Mobile subscriptions alongside web revenue." },
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
  channel: { label: "Channel", className: "bg-tangerine-soft text-tangerine-deep" },
  soon: { label: "Soon", className: "bg-sunken text-subtle" },
} as const;

function TileView({ tile }: { tile: Tile }) {
  if (tile.kind === "stat") {
    return (
      <div className={cn("flex h-[96px] w-[300px] shrink-0 items-center gap-4 rounded-2xl px-5", tile.tone)}>
        <span className="text-[40px] leading-none font-medium tracking-[-0.05em] tabular">{tile.value}</span>
        <span className="text-sm leading-snug">
          {tile.label}
          <span className="block font-mono text-[10px] text-subtle uppercase">{tile.note}</span>
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
      {tile.kind === "wide" && <span className="text-sm leading-snug text-muted">{tile.text}</span>}
      {badge && <span className={cn("absolute top-2 right-2 rounded-full px-1.5 py-0.5 font-mono text-[9px] tracking-wide uppercase", badge.className)}>{badge.label}</span>}
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
