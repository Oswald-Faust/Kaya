import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ArrowRight, Check, X } from "lucide-react";
import { KayaMark, KayaWordmark } from "@/components/brand/logo";
import { SiteNav } from "@/components/marketing/site-nav";
import { SiteFooter } from "@/components/marketing/site-footer";
import { ControlSpot, DecideSpot, ExperimentSpot, LearnSpot, UnderstandSpot } from "@/components/brand/clay";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Brand" };

const CORE = [
  { name: "Ink", hex: "#0B0B0B", role: "Text, primary buttons, the logo tile", className: "bg-ink text-white" },
  { name: "White", hex: "#FFFFFF", role: "Page ground, cards", className: "bg-surface text-ink border border-line" },
  { name: "Cream", hex: "#F7F5F0", role: "Soft sections, footer, app canvas family", className: "bg-cream text-ink" },
  { name: "Stone", hex: "#EDEAE3", role: "Hover grounds, dividers on cream", className: "bg-stone text-ink" },
  { name: "Muted", hex: "#5F5B54", role: "Secondary text (7.0:1 on white)", className: "bg-muted text-white" },
  { name: "Forest", hex: "#24533D", role: "Under the hero illustration only", className: "bg-forest text-white" },
];

const ACCENTS = [
  { name: "Lime", base: "#D4F36B", soft: "#F3FBD6", deep: "#56700F", role: "Signature accent. Highlights, secondary CTA, selection.", cls: ["bg-lime", "bg-lime-soft", "bg-lime-deep"] },
  { name: "Blue", base: "#4D78FF", soft: "#EAF0FF", deep: "#2240B0", role: "Understand. In the product, the agent's presence (#2F56E8).", cls: ["bg-blue", "bg-blue-soft", "bg-blue-deep"] },
  { name: "Tangerine", base: "#FF7A3D", soft: "#FFF0E7", deep: "#B0450F", role: "Decide. Budget, spend, momentum.", cls: ["bg-tangerine", "bg-tangerine-soft", "bg-tangerine-deep"] },
  { name: "Grass", base: "#3DA863", soft: "#E8F6EC", deep: "#1C653A", role: "Experiment. Wins and healthy states.", cls: ["bg-grass", "bg-grass-soft", "bg-grass-deep"] },
  { name: "Lilac", base: "#9C80FF", soft: "#F1EDFF", deep: "#5636BF", role: "Control. Autonomy, policy, trust.", cls: ["bg-lilac", "bg-lilac-soft", "bg-lilac-deep"] },
  { name: "Sun", base: "#FFC83D", soft: "#FFF7DC", deep: "#8A6000", role: "Learn. Memory, briefs, attention needed.", cls: ["bg-sun", "bg-sun-soft", "bg-sun-deep"] },
  { name: "Pink", base: "#FF8FC0", soft: "#FFEEF5", deep: "#B23A70", role: "Illustration only. Playful details.", cls: ["bg-pink", "bg-pink-soft", "bg-pink-deep"] },
];

const TYPE = [
  { name: "Display", spec: "Host Grotesk 560 · 100/96 · −4.5%", sample: "Kaya grows it.", className: "text-[clamp(52px,7vw,100px)] leading-[0.96] font-[560] tracking-[-0.045em]" },
  { name: "Heading 1", spec: "Host Grotesk 500 · 72/72 · −4.5%", sample: "Founders grow on Kaya", className: "text-[clamp(40px,5vw,72px)] leading-none font-medium tracking-[-0.045em]" },
  { name: "Heading 2", spec: "Host Grotesk 500 · 44/46 · −3.5%", sample: "Run experiments, not campaigns", className: "text-[clamp(30px,3.4vw,44px)] leading-[1.04] font-medium tracking-[-0.035em]" },
  { name: "Heading 3", spec: "Host Grotesk 500 · 22/28 · −2%", sample: "Channel fit, scored from 0 to 100", className: "text-[22px] leading-7 font-medium tracking-[-0.02em]" },
  { name: "Body", spec: "Host Grotesk 400 · 17/28 · 0", sample: "Kaya reads your pricing, docs and changelog, then writes down who buys and why they switch.", className: "text-[17px] leading-7 text-muted" },
  { name: "Label", spec: "Geist Mono 400 · 11/16 · +12% · uppercase", sample: "EXP-014 · Winner", className: "font-mono text-[11px] tracking-[0.12em] uppercase" },
];

const SPOTS = [
  ["Understand", "bg-blue-soft", UnderstandSpot],
  ["Decide", "bg-tangerine-soft", DecideSpot],
  ["Experiment", "bg-grass-soft", ExperimentSpot],
  ["Control", "bg-lilac-soft", ControlSpot],
  ["Learn", "bg-sun-soft", LearnSpot],
] as const;

export default function BrandPage() {
  return (
    <div className="min-h-screen bg-surface text-ink">
      <SiteNav />

      <main className="mx-auto max-w-[1200px] px-5 pb-24">
        <section className="grid gap-10 py-20 lg:grid-cols-[1.2fr_1fr] lg:items-end">
          <div>
            <p className="font-mono text-[11px] tracking-[0.12em] text-subtle uppercase">Brand guidelines · v1 · September 2026</p>
            <h1 className="mt-4 text-[clamp(56px,9vw,128px)] leading-[0.9] font-[560] tracking-[-0.055em]">Kaya</h1>
            <p className="mt-6 max-w-xl text-xl leading-relaxed text-muted">
              Kaya is the AI agent that does marketing for people who build products. The identity is black and white, warm, and a little playful: serious about money, never stiff about it.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {["Clear before clever", "Proof over promises", "Playful, never silly"].map((p, i) => (
              <div key={p} className={cn("flex aspect-square flex-col justify-between rounded-2xl p-4", ["bg-lime", "bg-cream", "bg-ink text-white"][i])}>
                <span className="font-mono text-[11px] opacity-60">0{i + 1}</span>
                <span className="text-lg leading-tight font-medium tracking-[-0.03em]">{p}</span>
              </div>
            ))}
          </div>
        </section>

        <Block id="logo" kicker="01" title="Logo">
          <p className="max-w-2xl text-[17px] leading-7 text-muted">
            Three clay pills rising on an ink tile: a product that grows one step at a time. The wordmark is always lowercase, set in Host Grotesk Semibold at −5% tracking. Keep clear space equal to the height of the first pill around the logo.
          </p>
          <div className="mt-8 grid gap-3 md:grid-cols-4">
            <LogoTile className="bg-surface border border-line"><KayaWordmark className="text-[34px]" markClassName="size-10" /></LogoTile>
            <LogoTile className="bg-cream"><KayaWordmark className="text-[34px]" markClassName="size-10" /></LogoTile>
            <LogoTile className="bg-lime"><KayaWordmark className="text-[34px]" markClassName="size-10" /></LogoTile>
            <LogoTile className="bg-ink"><KayaWordmark className="text-[34px] text-white" markClassName="size-10 ring-1 ring-white/15 rounded-[11px]" /></LogoTile>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-[1fr_2fr]">
            <div className="flex items-end gap-6 rounded-2xl border border-line p-6">
              {(
                [
                  [48, "size-12"],
                  [32, "size-8"],
                  [20, "size-5"],
                  [16, "size-4"],
                ] as const
              ).map(([s, cls]) => (
                <div key={s} className="text-center">
                  <KayaMark className={cn("mx-auto", cls)} />
                  <p className="mt-2 font-mono text-[10px] text-subtle">{s}px</p>
                </div>
              ))}
              <p className="ml-auto max-w-[10rem] text-sm text-muted">The mark alone works for app icons, favicons and avatars. Never smaller than 16px.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ["Don't recolor the pills", "hue-rotate-90"],
                ["Don't stretch", "scale-x-150"],
                ["Don't add effects", "drop-shadow-[0_6px_6px_rgb(255_122_61)]"],
                ["Don't rotate", "rotate-12"],
              ].map(([rule, cls]) => (
                <div key={rule} className="flex flex-col items-center justify-between gap-3 rounded-2xl bg-cream p-4 text-center">
                  <KayaMark className={cn("mt-3 size-10", cls)} />
                  <p className="flex items-center gap-1 text-xs text-negative">
                    <X className="size-3" /> {rule}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Block>

        <Block id="color" kicker="02" title="Color">
          <p className="max-w-2xl text-[17px] leading-7 text-muted">
            Black and white carry the brand. Cream warms it. Each accent owns one idea of the growth loop and is used one at a time per surface: a soft tint for the ground, the base for shapes, the deep shade for text on that tint.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-6">
            {CORE.map((c) => (
              <div key={c.name} className="overflow-hidden rounded-2xl border border-line">
                <div className={cn("flex h-28 items-end p-3 text-sm font-medium", c.className)}>{c.name}</div>
                <div className="p-3">
                  <p className="font-mono text-xs">{c.hex}</p>
                  <p className="mt-1 text-xs leading-snug text-muted">{c.role}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {ACCENTS.map((a) => (
              <div key={a.name} className="overflow-hidden rounded-2xl border border-line">
                <div className="grid h-32 grid-cols-[2fr_1fr]">
                  <div className={cn("flex items-end p-3 text-sm font-medium", a.cls[0], a.name === "Lime" || a.name === "Sun" ? "text-ink" : "text-white")}>{a.name}</div>
                  <div className="grid grid-rows-2">
                    <div className={a.cls[1]} />
                    <div className={a.cls[2]} />
                  </div>
                </div>
                <div className="p-3">
                  <p className="font-mono text-[11px] text-muted">
                    {a.base} · soft {a.soft} · deep {a.deep}
                  </p>
                  <p className="mt-1 text-xs leading-snug text-muted">{a.role}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <Rule ok>Deep shades on their soft tint for text (all pass WCAG AA).</Rule>
            <Rule ok>Ink on Lime and Sun; white on Blue, Grass, Lilac and Tangerine at 18px+.</Rule>
            <Rule>Never place two accents side by side as grounds, or accent text on white below 18px.</Rule>
          </div>
        </Block>

        <Block id="type" kicker="03" title="Typography">
          <p className="max-w-2xl text-[17px] leading-7 text-muted">
            One family does everything. Host Grotesk is friendly at display sizes and precise at 13px in the product. Headlines are tight and never bold: 500–560 with negative tracking. Geist Mono labels numbers, IDs and small caps.
          </p>
          <div className="mt-8 divide-y divide-line border-y border-line">
            {TYPE.map((t) => (
              <div key={t.name} className="grid gap-3 py-6 md:grid-cols-[220px_1fr] md:items-baseline">
                <div>
                  <p className="text-sm font-medium">{t.name}</p>
                  <p className="font-mono text-[11px] text-subtle">{t.spec}</p>
                </div>
                <p className={t.className}>{t.sample}</p>
              </div>
            ))}
          </div>
        </Block>

        <Block id="clay" kicker="04" title="Clay illustration">
          <p className="max-w-2xl text-[17px] leading-7 text-muted">
            Kaya&apos;s world is made of clay: soft matte objects lit from the top left, with a light grain and a soft shadow. One idea per scene, drawn from the palette, placed on its own tint. Illustrations explain; they never decorate a number.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-5">
            {SPOTS.map(([label, tone, Spot]) => (
              <div key={label} className={cn("rounded-2xl p-3", tone)}>
                <Spot className="w-full" />
                <p className="px-1 pb-1 text-sm font-medium">{label}</p>
              </div>
            ))}
          </div>
        </Block>

        <Block id="interface" kicker="05" title="Interface">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-line p-6">
              <p className="font-mono text-[11px] text-subtle uppercase">Buttons</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex h-11 items-center gap-2 rounded-xl bg-ink px-5 text-[15px] font-medium text-white">
                  Start free <ArrowRight className="size-4" />
                </span>
                <span className="inline-flex h-11 items-center rounded-xl border border-line-strong px-5 text-[15px] font-medium">See demo</span>
                <span className="inline-flex h-11 items-center rounded-xl bg-lime px-5 text-[15px] font-medium">Live demo</span>
              </div>
              <p className="mt-4 text-sm text-muted">Black leads. White follows. Lime only once per view, on dark or illustrated grounds.</p>
            </div>
            <div className="rounded-2xl border border-line p-6">
              <p className="font-mono text-[11px] text-subtle uppercase">Tags and status</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-blue px-3 py-1 font-mono text-[11px] tracking-[0.12em] text-white uppercase">Understand</span>
                <span className="rounded-full bg-grass-soft px-2.5 py-1 text-xs text-grass-deep">Winner</span>
                <span className="rounded-full bg-sun-soft px-2.5 py-1 text-xs text-sun-deep">Needs you</span>
                <span className="rounded-full bg-sunken px-2.5 py-1 text-xs text-muted">Queued</span>
              </div>
              <p className="mt-4 text-sm text-muted">Status colors appear only where they carry meaning.</p>
            </div>
            <div className="rounded-2xl border border-line p-6">
              <p className="font-mono text-[11px] text-subtle uppercase">Shape</p>
              <div className="mt-4 flex items-end gap-3">
                {[
                  ["12", "rounded-xl"],
                  ["16", "rounded-2xl"],
                  ["28", "rounded-[28px]"],
                  ["32", "rounded-[32px]"],
                ].map(([r, cls]) => (
                  <div key={r} className="text-center">
                    <div className={cn("size-14 bg-cream ring-1 ring-line", cls)} />
                    <p className="mt-1 font-mono text-[10px] text-subtle">{r}px</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm text-muted">Controls 12px, cards 16px, panels 28px, sections 32px. The product app stays tighter (4–8px).</p>
            </div>
          </div>
        </Block>

        <Block id="voice" kicker="06" title="Voice">
          <div className="grid gap-3 md:grid-cols-3">
            {[
              ["Plain", "Say what Kaya does in words a founder uses.", "Kaya paused the ad. It cost $212 per customer.", "Leveraging AI-driven optimization to maximize ROAS."],
              ["Specific", "Numbers, sources and reasons beat adjectives.", "+31% trial starts, p = 0.02, over 14 days.", "Massive growth, instantly."],
              ["Honest", "Say what's uncertain or blocked.", "Not enough data yet. We'll know by Friday.", "Your campaign is crushing it!"],
            ].map(([name, rule, good, bad]) => (
              <div key={name} className="rounded-2xl bg-cream p-6">
                <p className="text-xl font-medium tracking-[-0.03em]">{name}</p>
                <p className="mt-1 text-sm text-muted">{rule}</p>
                <p className="mt-4 flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 size-4 shrink-0 text-grass-deep" /> {good}
                </p>
                <p className="mt-2 flex items-start gap-2 text-sm text-muted">
                  <X className="mt-0.5 size-4 shrink-0 text-negative" /> <span className="line-through decoration-negative/40">{bad}</span>
                </p>
              </div>
            ))}
          </div>
        </Block>
      </main>
      <SiteFooter />
    </div>
  );
}

function Block({ id, kicker, title, children }: { id: string; kicker: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20 border-t border-line py-16">
      <div className="mb-6 flex items-baseline gap-4">
        <span className="font-mono text-xs text-subtle">{kicker}</span>
        <h2 className="text-[clamp(34px,4vw,52px)] leading-none font-medium tracking-[-0.045em]">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function LogoTile({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("grid aspect-[4/3] place-items-center rounded-2xl", className)}>{children}</div>;
}

function Rule({ ok = false, children }: { ok?: boolean; children: ReactNode }) {
  return (
    <p className={cn("flex items-start gap-2 rounded-2xl p-4 text-sm", ok ? "bg-grass-soft text-grass-deep" : "bg-negative-soft text-negative")}>
      {ok ? <Check className="mt-0.5 size-4 shrink-0" /> : <X className="mt-0.5 size-4 shrink-0" />}
      {children}
    </p>
  );
}
