import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ArrowRight, Check, X } from "lucide-react";
import { KayaMark, KayaWordmark } from "@/components/brand/logo";
import { SiteNav } from "@/components/marketing/site-nav";
import { SiteFooter } from "@/components/marketing/site-footer";
import { ControlSpot, DecideSpot, ExperimentSpot, LearnSpot, UnderstandSpot } from "@/components/brand/clay";
import { getI18n } from "@/i18n/server";
import { cn } from "@/lib/cn";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.brand.metaTitle };
}

const CORE = [
  { name: "Ink", hex: "#0B0B0B", className: "bg-ink text-white" },
  { name: "White", hex: "#FFFFFF", className: "bg-surface text-ink border border-line" },
  { name: "Cream", hex: "#F7F5F0", className: "bg-cream text-ink" },
  { name: "Stone", hex: "#EDEAE3", className: "bg-stone text-ink" },
  { name: "Muted", hex: "#5F5B54", className: "bg-muted text-white" },
  { name: "Forest", hex: "#24533D", className: "bg-forest text-white" },
];

const ACCENTS = [
  { name: "Lime", base: "#D4F36B", soft: "#F3FBD6", deep: "#56700F", cls: ["bg-lime", "bg-lime-soft", "bg-lime-deep"] },
  { name: "Blue", base: "#4D78FF", soft: "#EAF0FF", deep: "#2240B0", cls: ["bg-blue", "bg-blue-soft", "bg-blue-deep"] },
  { name: "Tangerine", base: "#FF7A3D", soft: "#FFF0E7", deep: "#B0450F", cls: ["bg-tangerine", "bg-tangerine-soft", "bg-tangerine-deep"] },
  { name: "Grass", base: "#3DA863", soft: "#E8F6EC", deep: "#1C653A", cls: ["bg-grass", "bg-grass-soft", "bg-grass-deep"] },
  { name: "Lilac", base: "#9C80FF", soft: "#F1EDFF", deep: "#5636BF", cls: ["bg-lilac", "bg-lilac-soft", "bg-lilac-deep"] },
  { name: "Sun", base: "#FFC83D", soft: "#FFF7DC", deep: "#8A6000", cls: ["bg-sun", "bg-sun-soft", "bg-sun-deep"] },
  { name: "Pink", base: "#FF8FC0", soft: "#FFEEF5", deep: "#B23A70", cls: ["bg-pink", "bg-pink-soft", "bg-pink-deep"] },
];

const TYPE = [
  { id: "display", spec: "Host Grotesk 560 · 100/96 · −4.5%", className: "text-[clamp(52px,7vw,100px)] leading-[0.96] font-[560] tracking-[-0.045em]" },
  { id: "h1", spec: "Host Grotesk 500 · 72/72 · −4.5%", className: "text-[clamp(40px,5vw,72px)] leading-none font-medium tracking-[-0.045em]" },
  { id: "h2", spec: "Host Grotesk 500 · 44/46 · −3.5%", className: "text-[clamp(30px,3.4vw,44px)] leading-[1.04] font-medium tracking-[-0.035em]" },
  { id: "h3", spec: "Host Grotesk 500 · 22/28 · −2%", className: "text-[22px] leading-7 font-medium tracking-[-0.02em]" },
  { id: "body", spec: "Host Grotesk 400 · 17/28 · 0", className: "text-[17px] leading-7 text-muted" },
  { id: "label", spec: "Geist Mono 400 · 11/16 · +12% · uppercase", className: "font-mono text-[11px] tracking-[0.12em] uppercase" },
] as const;

const SPOTS = [
  ["understand", "bg-blue-soft", UnderstandSpot],
  ["decide", "bg-tangerine-soft", DecideSpot],
  ["experiment", "bg-grass-soft", ExperimentSpot],
  ["control", "bg-lilac-soft", ControlSpot],
  ["learn", "bg-sun-soft", LearnSpot],
] as const;

export default async function BrandPage() {
  const { t } = await getI18n();
  const b = t.brand;
  return (
    <div className="min-h-screen bg-surface text-ink">
      <SiteNav />

      <main className="mx-auto max-w-[1200px] px-5 pb-24">
        <section className="grid gap-10 py-20 lg:grid-cols-[1.2fr_1fr] lg:items-end">
          <div>
            <p className="font-mono text-[11px] tracking-[0.12em] text-subtle uppercase">{b.kicker}</p>
            <h1 className="mt-4 text-[clamp(56px,9vw,128px)] leading-[0.9] font-[560] tracking-[-0.055em]">Kaya</h1>
            <p className="mt-6 max-w-xl text-xl leading-relaxed text-muted">
              {b.intro}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {b.principles.map((p, i) => (
              <div key={p} className={cn("flex aspect-square flex-col justify-between rounded-2xl p-4", ["bg-lime", "bg-cream", "bg-ink text-white"][i])}>
                <span className="font-mono text-[11px] opacity-60">0{i + 1}</span>
                <span className="text-lg leading-tight font-medium tracking-[-0.03em]">{p}</span>
              </div>
            ))}
          </div>
        </section>

        <Block id="logo" kicker="01" title={b.logo.title}>
          <p className="max-w-2xl text-[17px] leading-7 text-muted">
            {b.logo.body}
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
              <p className="ml-auto max-w-[10rem] text-sm text-muted">{b.logo.markAlone}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                "hue-rotate-90",
                "scale-x-150",
                "drop-shadow-[0_6px_6px_rgb(255_122_61)]",
                "rotate-12",
              ].map((cls, i) => [b.logo.donts[i], cls]).map(([rule, cls]) => (
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

        <Block id="color" kicker="02" title={b.color.title}>
          <p className="max-w-2xl text-[17px] leading-7 text-muted">
            {b.color.body}
          </p>
          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-6">
            {CORE.map((c) => (
              <div key={c.name} className="overflow-hidden rounded-2xl border border-line">
                <div className={cn("flex h-28 items-end p-3 text-sm font-medium", c.className)}>{c.name}</div>
                <div className="p-3">
                  <p className="font-mono text-xs">{c.hex}</p>
                  <p className="mt-1 text-xs leading-snug text-muted">{b.color.core[c.name]}</p>
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
                    {a.base} · {b.color.soft} {a.soft} · {b.color.deep} {a.deep}
                  </p>
                  <p className="mt-1 text-xs leading-snug text-muted">{b.color.accents[a.name]}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <Rule ok>{b.color.rules[0]}</Rule>
            <Rule ok>{b.color.rules[1]}</Rule>
            <Rule>{b.color.rules[2]}</Rule>
          </div>
        </Block>

        <Block id="type" kicker="03" title={b.type.title}>
          <p className="max-w-2xl text-[17px] leading-7 text-muted">
            {b.type.body}
          </p>
          <div className="mt-8 divide-y divide-line border-y border-line">
            {TYPE.map((ty) => (
              <div key={ty.id} className="grid gap-3 py-6 md:grid-cols-[220px_1fr] md:items-baseline">
                <div>
                  <p className="text-sm font-medium">{b.type.names[ty.id]}</p>
                  <p className="font-mono text-[11px] text-subtle">{ty.spec}</p>
                </div>
                <p className={ty.className}>{b.type.samples[ty.id]}</p>
              </div>
            ))}
          </div>
        </Block>

        <Block id="clay" kicker="04" title={b.clay.title}>
          <p className="max-w-2xl text-[17px] leading-7 text-muted">
            {b.clay.body}
          </p>
          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-5">
            {SPOTS.map(([label, tone, Spot]) => (
              <div key={label} className={cn("rounded-2xl p-3", tone)}>
                <Spot className="w-full" />
                <p className="px-1 pb-1 text-sm font-medium">{b.clay.spots[label]}</p>
              </div>
            ))}
          </div>
        </Block>

        <Block id="interface" kicker="05" title={b.ui.title}>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-line p-6">
              <p className="font-mono text-[11px] text-subtle uppercase">{b.ui.buttons}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex h-11 items-center gap-2 rounded-xl bg-ink px-5 text-[15px] font-medium text-white">
                  {b.ui.startFree} <ArrowRight className="size-4" />
                </span>
                <span className="inline-flex h-11 items-center rounded-xl border border-line-strong px-5 text-[15px] font-medium">{b.ui.seeDemo}</span>
                <span className="inline-flex h-11 items-center rounded-xl bg-lime px-5 text-[15px] font-medium">{b.ui.liveDemo}</span>
              </div>
              <p className="mt-4 text-sm text-muted">{b.ui.buttonsNote}</p>
            </div>
            <div className="rounded-2xl border border-line p-6">
              <p className="font-mono text-[11px] text-subtle uppercase">{b.ui.tags}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-blue px-3 py-1 font-mono text-[11px] tracking-[0.12em] text-white uppercase">{b.ui.tagUnderstand}</span>
                <span className="rounded-full bg-grass-soft px-2.5 py-1 text-xs text-grass-deep">{b.ui.tagWinner}</span>
                <span className="rounded-full bg-sun-soft px-2.5 py-1 text-xs text-sun-deep">{b.ui.tagNeedsYou}</span>
                <span className="rounded-full bg-sunken px-2.5 py-1 text-xs text-muted">{b.ui.tagQueued}</span>
              </div>
              <p className="mt-4 text-sm text-muted">{b.ui.tagsNote}</p>
            </div>
            <div className="rounded-2xl border border-line p-6">
              <p className="font-mono text-[11px] text-subtle uppercase">{b.ui.shape}</p>
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
              <p className="mt-4 text-sm text-muted">{b.ui.shapeNote}</p>
            </div>
          </div>
        </Block>

        <Block id="voice" kicker="06" title={b.voice.title}>
          <div className="grid gap-3 md:grid-cols-3">
            {b.voice.items.map(([name, rule, good, bad]) => (
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
