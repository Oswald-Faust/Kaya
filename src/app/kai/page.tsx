import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Archive, BookOpen, Check, CircleHelp, Lock, MessageSquare, Minus, Pencil, Play, Plus, Search, ShieldCheck, TriangleAlert } from "lucide-react";
import { KaiMark } from "@/components/brand/kai-mark";
import { KayaMark } from "@/components/brand/logo";
import { Faq } from "@/components/landing/faq";
import { ClosingCta } from "@/components/marketing/closing-cta";
import { KaiDemo } from "@/components/marketing/kai-demo";
import { InView, Reveal, Stagger, StaggerItem } from "@/components/marketing/motion";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteNav } from "@/components/marketing/site-nav";
import { getI18n } from "@/i18n/server";
import { cn } from "@/lib/cn";
import { getMarketingLinks } from "@/server/marketing";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.kai.metaTitle, description: t.kai.metaDescription, openGraph: { title: t.kai.metaTitle, description: t.kai.metaDescription } };
}

const HOW_TONES = [
  { card: "bg-blue-soft", num: "bg-blue text-white", chip: "bg-white/80 text-blue-deep" },
  { card: "bg-lilac-soft", num: "bg-lilac text-white", chip: "bg-white/80 text-lilac-deep" },
  { card: "bg-tangerine-soft", num: "bg-tangerine text-white", chip: "bg-white/80 text-tangerine-deep" },
] as const;

const HONEST_ICONS = { sources: BookOpen, unverified: TriangleAlert, unknown: CircleHelp, private: Lock } as const;

/** The Kai page: what Kai is, how it answers, what to ask it and why it can be trusted. */
export default async function KaiPage() {
  const [{ t }, links] = await Promise.all([getI18n(), getMarketingLinks()]);
  const k = t.kai;
  const p = k.page;
  const { demoSlug } = links;
  const inDemo = (path: string) => (demoSlug ? `/w/${demoSlug}${path}` : `/demo?to=${encodeURIComponent(path)}`);
  const ask = (q: string) => inDemo(`/kai?q=${encodeURIComponent(q)}`);

  return (
    <div className="min-h-screen bg-surface text-ink antialiased">
      <SiteNav appHref={links.appHref} demoHref={links.demoHref} />

      <main id="main-content">
        {/* ───────── Hero: a dark stage with a live conversation ───────── */}
        <section className="px-3 pt-3 sm:px-5">
          <div className="relative mx-auto max-w-[1400px] overflow-hidden rounded-[32px] bg-ink text-white">
            <div aria-hidden className="kai-glow absolute inset-0" />
            <div aria-hidden className="kai-grid absolute inset-0" />
            <div className="relative px-5 pt-16 pb-14 sm:px-10 sm:pt-24 sm:pb-20">
              <Reveal className="flex flex-col items-center text-center">
                <div className="relative">
                  <span aria-hidden className="absolute inset-0 -m-4 animate-pulse rounded-[32px] bg-[#4d78ff]/30 blur-2xl" />
                  <KaiMark className="relative size-20 drop-shadow-[0_16px_36px_rgba(77,120,255,0.5)]" thinking />
                </div>
                <p className="mt-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] py-1 pr-3 pl-1 text-xs text-white/70">
                  <span className="rounded-full bg-lime px-2 py-0.5 font-mono text-[10px] tracking-[0.12em] text-ink uppercase">{k.newBadge}</span>
                  {k.eyebrow}
                </p>
                <h1 className="mt-6 max-w-5xl text-[clamp(46px,7vw,104px)] leading-[0.95] font-medium tracking-[-0.05em]">
                  {p.heroTitleA}
                  <br />
                  <span className="bg-gradient-to-r from-[#b7c7ff] via-[#c9b8ff] to-[#ffc6a8] bg-clip-text text-transparent">{p.heroTitleB}</span>
                </h1>
                <p className="mt-7 max-w-2xl text-lg leading-relaxed text-white/60">{p.heroBody}</p>
                <div className="mt-9 flex flex-wrap justify-center gap-2">
                  <a href={inDemo("/kai")} className="inline-flex h-12 items-center gap-2 rounded-xl bg-white px-6 text-[15px] font-medium text-ink transition-colors hover:bg-white/90">
                    <Play className="size-4" /> {k.tryDemo}
                  </a>
                  <Link href="/start" className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/15 px-6 text-[15px] font-medium text-white transition-colors hover:border-white/40">
                    {k.startFree} <ArrowRight className="size-4" />
                  </Link>
                </div>
                <p className="mt-5 font-mono text-[11px] tracking-[0.12em] text-white/40 uppercase">{p.heroNote}</p>
              </Reveal>
              <Reveal delay={0.15} y={48} className="mt-16">
                <KaiDemo demoSlug={demoSlug} />
              </Reveal>
            </div>
          </div>
        </section>

        {/* ───────── How Kai answers ───────── */}
        <section className="mx-auto max-w-[1360px] px-5 pt-28 sm:pt-36">
          <Reveal className="text-center">
            <p className="font-mono text-[11px] tracking-[0.12em] text-subtle uppercase">{p.howEyebrow}</p>
            <h2 className="mx-auto mt-4 max-w-3xl text-[clamp(38px,4.8vw,64px)] leading-[1] font-medium tracking-[-0.045em]">{p.howTitle}</h2>
          </Reveal>
          <InView amount={0.2}>
            <Stagger className="relative mt-14 grid gap-4 lg:grid-cols-3" stagger={0.14}>
              {p.how.map((step, i) => {
                const tone = HOW_TONES[i];
                return (
                  <StaggerItem key={step.id} className={cn("relative flex flex-col rounded-[28px] p-7 sm:p-8", tone.card)}>
                    <div className="flex items-center justify-between">
                      <span className={cn("grid size-10 place-items-center rounded-2xl font-mono text-sm", tone.num)}>0{i + 1}</span>
                      {i < 2 && <ArrowRight aria-hidden className="hidden size-5 text-ink/25 lg:block" />}
                      {i === 2 && <KaiMark className="size-10" />}
                    </div>
                    <h3 className="mt-8 text-2xl font-medium tracking-[-0.03em]">{step.title}</h3>
                    <p className="mt-2 text-[15px] leading-relaxed text-muted">{step.body}</p>
                    <ul className="mt-6 flex flex-wrap gap-1.5">
                      {step.chips.map((chip) => (
                        <li key={chip} className={cn("rounded-full px-2.5 py-1 text-xs font-medium", tone.chip)}>
                          {chip}
                        </li>
                      ))}
                    </ul>
                  </StaggerItem>
                );
              })}
            </Stagger>
          </InView>
        </section>

        {/* ───────── What you can ask ───────── */}
        <section id="ask" className="px-3 pt-28 sm:px-5 sm:pt-36">
          <div className="mx-auto max-w-[1360px] rounded-[32px] bg-cream px-5 py-14 sm:px-10 sm:py-20">
            <Reveal className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="font-mono text-[11px] tracking-[0.12em] text-subtle uppercase">{p.askEyebrow}</p>
                <h2 className="mt-4 max-w-2xl text-[clamp(36px,4.4vw,58px)] leading-[1] font-medium tracking-[-0.045em]">{p.askTitle}</h2>
              </div>
              <p className="max-w-sm text-[15px] text-muted">{p.askBody}</p>
            </Reveal>
            <Stagger className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" stagger={0.06}>
              {p.askGroups.map((group) => (
                <StaggerItem key={group.id} className="rounded-[24px] bg-surface p-5 shadow-[0_1px_0_rgba(11,11,11,0.04)]">
                  <p className="flex items-center gap-2 text-sm font-medium">
                    <KaiMark className="size-6" />
                    {group.title}
                  </p>
                  <ul className="mt-4 space-y-1">
                    {group.prompts.map((prompt) => (
                      <li key={prompt}>
                        <a href={ask(prompt)} className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] text-ink/85 transition-colors hover:bg-cream hover:text-ink">
                          <span className="flex-1">{prompt}</span>
                          <ArrowUpRight className="size-4 shrink-0 text-subtle transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-ink" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>

        {/* ───────── Honest by design ───────── */}
        <section className="mx-auto grid max-w-[1360px] items-center gap-12 px-5 pt-28 sm:pt-36 lg:grid-cols-[1fr_1.1fr]">
          <Reveal>
            <p className="font-mono text-[11px] tracking-[0.12em] text-subtle uppercase">{p.honestEyebrow}</p>
            <h2 className="mt-4 text-[clamp(36px,4.4vw,58px)] leading-[1] font-medium tracking-[-0.045em]">
              {p.honestTitleA}
              <br />
              <span className="text-agent">{p.honestTitleB}</span>
            </h2>
            {/* The refusal, as it appears in Kai. */}
            <div className="mt-10 max-w-md space-y-3 rounded-[24px] border border-line bg-surface p-4 shadow-float">
              <div className="flex justify-end">
                <p className="rounded-2xl rounded-tr-md bg-sunken px-3.5 py-2 text-sm">{p.unknownQuestion}</p>
              </div>
              <div className="flex gap-2.5">
                <KaiMark className="mt-0.5 size-7" />
                <p className="text-sm leading-relaxed text-ink/85">{p.unknownAnswer}</p>
              </div>
            </div>
          </Reveal>
          <Stagger className="grid gap-3 sm:grid-cols-2" stagger={0.08}>
            {p.honest.map((item) => {
              const Icon = HONEST_ICONS[item.id as keyof typeof HONEST_ICONS] ?? ShieldCheck;
              return (
                <StaggerItem key={item.id} className="rounded-[24px] border border-line bg-surface p-6 transition-colors hover:border-line-strong">
                  <span className="grid size-10 place-items-center rounded-2xl bg-agent-soft text-agent">
                    <Icon className="size-[18px]" />
                  </span>
                  <h3 className="mt-6 text-lg font-medium tracking-[-0.02em]">{item.title}</h3>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-muted">{item.body}</p>
                </StaggerItem>
              );
            })}
          </Stagger>
        </section>

        {/* ───────── History & everywhere ───────── */}
        <section className="mx-auto grid max-w-[1360px] gap-4 px-3 pt-28 sm:px-5 sm:pt-36 lg:grid-cols-2">
          <Reveal className="flex flex-col overflow-hidden rounded-[32px] bg-lilac-soft p-7 sm:p-10">
            <p className="font-mono text-[11px] tracking-[0.12em] text-lilac-deep uppercase">{p.historyEyebrow}</p>
            <h2 className="mt-4 text-[clamp(30px,3.2vw,44px)] leading-[1.02] font-medium tracking-[-0.04em]">{p.historyTitle}</h2>
            <p className="mt-3 max-w-md text-[15px] text-muted">{p.historyBody}</p>
            <ul className="mt-6 grid gap-2 sm:grid-cols-2">
              {p.historyPoints.map((point) => (
                <li key={point} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 size-4 shrink-0 text-lilac-deep" />
                  {point}
                </li>
              ))}
            </ul>
            <HistoryMock copy={p.historyMock} />
          </Reveal>
          <Reveal delay={0.08} className="flex flex-col overflow-hidden rounded-[32px] bg-blue-soft p-7 sm:p-10">
            <p className="font-mono text-[11px] tracking-[0.12em] text-blue-deep uppercase">{p.everywhereEyebrow}</p>
            <h2 className="mt-4 text-[clamp(30px,3.2vw,44px)] leading-[1.02] font-medium tracking-[-0.04em]">{p.everywhereTitle}</h2>
            <p className="mt-3 max-w-md text-[15px] text-muted">{p.everywhereBody}</p>
            <EverywhereMock copy={p.everywhereMock} />
          </Reveal>
        </section>

        {/* ───────── Kai vs a generic chatbot ───────── */}
        <section className="mx-auto max-w-[1000px] px-5 pt-28 sm:pt-36">
          <Reveal className="text-center">
            <p className="font-mono text-[11px] tracking-[0.12em] text-subtle uppercase">{p.compareEyebrow}</p>
            <h2 className="mt-4 text-[clamp(36px,4.4vw,58px)] leading-[1] font-medium tracking-[-0.045em]">{p.compareTitle}</h2>
          </Reveal>
          <Reveal delay={0.1} className="mt-12 overflow-hidden rounded-[28px] border border-line">
            <table className="w-full text-left text-[15px]">
              <thead>
                <tr className="border-b border-line bg-cream">
                  <th className="px-5 py-4 font-normal text-muted sm:px-7">
                    <span className="sr-only">{p.compareEyebrow}</span>
                  </th>
                  <th className="w-28 px-3 py-4 text-center font-medium sm:w-40">
                    <span className="inline-flex items-center gap-2">
                      <KaiMark className="size-6" />
                      {p.compareKai}
                    </span>
                  </th>
                  <th className="w-28 px-3 py-4 text-center font-normal text-muted sm:w-40">{p.compareGeneric}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {p.compare.map((row) => (
                  <tr key={row.label}>
                    <td className="px-5 py-4 sm:px-7">{row.label}</td>
                    <td className="px-3 py-4 text-center">
                      <span className="mx-auto grid size-7 place-items-center rounded-full bg-ink text-white">
                        <Check className="size-4" />
                      </span>
                    </td>
                    <td className="px-3 py-4 text-center text-subtle">
                      <Minus className="mx-auto size-4" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Reveal>
        </section>

        {/* ───────── FAQ ───────── */}
        <section className="mx-auto grid max-w-[1360px] gap-10 px-5 pt-28 sm:pt-36 lg:grid-cols-[0.8fr_1.2fr]">
          <Reveal>
            <h2 className="text-[clamp(36px,4.4vw,58px)] leading-[1] font-medium tracking-[-0.045em]">{p.faqTitle}</h2>
            <a href={inDemo("/kai")} className="mt-8 inline-flex items-center gap-2 text-[15px] font-medium underline decoration-line-strong underline-offset-4 hover:decoration-ink">
              {k.tryDemo} <ArrowUpRight className="size-4" />
            </a>
          </Reveal>
          <Reveal delay={0.1}>
            <Faq questions={p.faq} />
          </Reveal>
        </section>

        <ClosingCta demoHref={inDemo("/kai")} title={p.ctaTitle} />
      </main>

      <SiteFooter />
    </div>
  );
}

function HistoryMock({ copy }: { copy: { title: string; new: string; search: string; items: string[]; dates: string[]; archived: string } }) {
  return (
    <div className="mt-8 -mb-16 rounded-t-[24px] border border-b-0 border-lilac/20 bg-surface p-4 shadow-float sm:-mb-20">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-sm font-medium">
          <MessageSquare className="size-4 text-muted" />
          {copy.title}
        </p>
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-2.5 py-1.5 text-xs text-white">
          <Plus className="size-3.5" />
          {copy.new}
        </span>
      </div>
      <div className="mt-3 flex items-center gap-2 rounded-xl border border-line px-3 py-2 text-xs text-subtle">
        <Search className="size-3.5" />
        {copy.search}
      </div>
      <ul className="mt-3 space-y-1">
        {copy.items.map((item, i) => (
          <li key={item} className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5", i === 0 && "bg-lilac-soft/60 ring-1 ring-lilac/20")}>
            <MessageSquare className="size-3.5 shrink-0 text-subtle" />
            <span className="min-w-0 flex-1 truncate text-sm">{item}</span>
            <span className="text-[11px] text-subtle">{copy.dates[i]}</span>
            {i === 0 && (
              <span className="flex gap-1 text-subtle">
                <Pencil className="size-3.5" />
                <Archive className="size-3.5" />
              </span>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-2 flex items-center gap-2 px-3 text-xs text-subtle">
        <Archive className="size-3.5" />
        {copy.archived}
      </p>
    </div>
  );
}

function EverywhereMock({ copy }: { copy: { greeting: string; run: string; runSub: string; waiting: string; placeholder: string } }) {
  return (
    <div className="relative mt-8 flex-1">
      {/* A glimpse of the app behind the panel. */}
      <div aria-hidden className="absolute inset-0 -mb-16 rounded-t-[24px] border border-b-0 border-blue/15 bg-surface/70 p-4 sm:-mb-20">
        <div className="flex gap-2">
          <KayaMark className="size-6" />
          <span className="h-6 w-28 rounded-md bg-sunken" />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-14 rounded-xl bg-sunken" />
          ))}
        </div>
      </div>
      <div className="relative mt-10 ml-auto max-w-[340px] rounded-[20px] border border-line bg-surface shadow-pop">
        <div className="flex items-center gap-2.5 border-b border-line px-4 py-3">
          <KaiMark className="size-7" />
          <p className="text-sm font-semibold">Kai</p>
          <kbd className="ml-auto rounded-md border border-line px-1.5 py-0.5 font-sans text-[11px] text-muted">⌘J</kbd>
        </div>
        <div className="space-y-2.5 px-4 py-4">
          <p className="text-[15px] font-medium">{copy.greeting}</p>
          <p className="rounded-lg bg-sun-soft px-3 py-2 text-xs font-medium text-sun-deep">{copy.waiting}</p>
          <div className="flex items-start gap-2.5 rounded-lg border border-agent/30 bg-agent-soft px-3 py-2.5">
            <Play className="mt-0.5 size-4 shrink-0 text-agent" />
            <span className="min-w-0">
              <span className="block text-sm font-medium text-agent">{copy.run}</span>
              <span className="block truncate text-xs text-muted">{copy.runSub}</span>
            </span>
          </div>
        </div>
        <div className="border-t border-line p-3">
          <div className="rounded-xl border border-line-strong px-3 py-2 text-sm text-subtle">{copy.placeholder}</div>
        </div>
      </div>
    </div>
  );
}
