"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, ChevronRight, Shield } from "lucide-react";
import { SiteNav } from "./site-nav";
import { SiteFooter } from "./site-footer";
import { ClosingCta } from "./closing-cta";
import { Reveal, Stagger, StaggerItem } from "./motion";
import { CategoryPillNav, type NavPill } from "./category-pill-nav";
import { InteractiveWorkflowMock } from "./interactive-workflow-mock";
import {
  UnderstandSpot,
  DecideSpot,
  ExperimentSpot,
  ControlSpot,
  LearnSpot,
} from "@/components/brand/clay";
import { USE_CASES, getUseCaseBySlug, type UseCaseItem } from "@/data/use-cases-data";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/cn";
import { OBJECT_BY_SLUG } from "@/components/brand/clay-objects";
import { TONE_CARD, TONE_TILE } from "./nav-data";

const SPOT_COMPONENTS = {
  understand: UnderstandSpot,
  decide: DecideSpot,
  experiment: ExperimentSpot,
  control: ControlSpot,
  learn: LearnSpot,
};

interface UseCaseLayoutProps {
  slug?: string;
  useCase?: UseCaseItem;
  appHref?: string | null;
  demoHref?: string;
}

export function UseCaseLayout({ slug, useCase: initialUseCase, appHref, demoHref }: UseCaseLayoutProps) {
  const { locale } = useI18n();
  const isEn = locale === "en";

  const useCase = initialUseCase ?? (slug ? getUseCaseBySlug(slug) : undefined);
  if (!useCase) return null;

  const SpotIcon = OBJECT_BY_SLUG[useCase.slug] ?? SPOT_COMPONENTS[useCase.spot];

  // All use case pills for seamless tab switching
  const pills: NavPill[] = USE_CASES.map((uc) => ({
    slug: uc.slug,
    href: `/use-cases/${uc.slug}`,
    label: isEn ? uc.kickerEn : uc.kicker,
    icon: uc.icon,
    tone: uc.tone,
  }));

  const problemBullets = isEn ? useCase.problem.bulletsEn : useCase.problem.bullets;

  return (
    <div className="min-h-screen bg-surface text-ink font-sans antialiased selection:bg-lime-soft selection:text-lime-deep">
      <SiteNav appHref={appHref} demoHref={demoHref} />

      <main className="mx-auto max-w-[1360px] px-5 pt-12 sm:pt-18">
        {/* Category Pill Navigation */}
        <div className="mb-8">
          <CategoryPillNav
            items={pills}
            activeSlug={useCase.slug}
            ariaLabel={isEn ? "All use cases" : "Tous les cas d'usage"}
          />
        </div>

        {/* Hero Section */}
        <section className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] pt-4 pb-16">
          <Reveal>
            <div className="inline-flex items-center gap-2 rounded-full border border-line bg-cream px-3 py-1 text-xs font-mono tracking-wide text-ink">
              <span className={cn("size-2 rounded-full", TONE_CARD[useCase.tone])} />
              <span>{isEn ? useCase.eyebrowEn : useCase.eyebrow}</span>
              <span className="text-subtle">·</span>
              <span className="text-muted">{isEn ? useCase.badgeEn : useCase.badge}</span>
            </div>

            <h1 className="mt-4 text-[clamp(40px,5.5vw,78px)] leading-[0.96] font-[560] tracking-[-0.045em] text-ink">
              {isEn ? useCase.titleEn : useCase.title}
            </h1>

            <p className="mt-6 max-w-xl text-lg sm:text-xl leading-relaxed text-muted">
              {isEn ? useCase.leadEn : useCase.lead}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/signup"
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-ink px-5 text-sm font-medium text-white transition-all hover:bg-ink-hover shadow-sm"
              >
                <span>{isEn ? "Start free" : "Démarrer gratuitement"}</span>
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/demo"
                className="inline-flex h-11 items-center rounded-xl bg-cream px-5 text-sm font-medium text-ink transition-colors hover:bg-stone"
              >
                {isEn ? "Explore interactive demo" : "Explorer la démo interactive"}
              </Link>
            </div>

            {/* Proof Stat Pill */}
            <div className="mt-8 inline-flex items-center gap-3 rounded-2xl border border-line bg-cream/60 px-4 py-3">
              <span className="font-mono text-2xl font-bold tracking-tight text-ink">{useCase.stat.value}</span>
              <span className="text-xs text-muted max-w-[280px] leading-snug">
                {isEn ? useCase.stat.labelEn : useCase.stat.label}
              </span>
            </div>
          </Reveal>

          {/* Illustrated Clay Spot Hero visual */}
          <Reveal delay={0.15} className="relative flex justify-center">
            <div className="relative w-full max-w-[420px] aspect-square rounded-[32px] bg-cream/70 p-6 flex flex-col items-center justify-center border border-line shadow-sm">
              <SpotIcon className="w-full h-full max-h-[300px]" />
              <span className="mt-2 font-mono text-[11px] uppercase tracking-wider text-muted">
                {isEn ? "Kaya Cycle" : "Cycle Kaya"} · {isEn ? useCase.kickerEn : useCase.kicker}
              </span>
            </div>
          </Reveal>
        </section>

        {/* Live Interactive Workflow Simulator */}
        <section className="py-12 sm:py-16">
          <Reveal className="text-center mb-8">
            <p className="font-mono text-xs uppercase tracking-widest text-subtle">
              {isEn ? "Direct Product Simulation" : "Simulation Produit Directe"}
            </p>
            <h2 className="mt-2 text-2xl sm:text-4xl font-medium tracking-tight">
              {isEn ? "How Kaya executes on this exact play" : "Comment Kaya opère sur ce cas précis"}
            </h2>
            <p className="mt-2 text-sm text-muted">
              {isEn
                ? "All data below mirrors the exact logic and guardrails of the Kaya engine."
                : "Toutes les données ci-dessous reproduisent fidèlement la logique et les garde-fous du moteur Kaya."}
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <InteractiveWorkflowMock
              title={useCase.mockData.title}
              tag={useCase.mockData.tag}
              status={useCase.mockData.status}
              tone={useCase.tone}
              items={useCase.mockData.items}
              actionLabel={useCase.mockData.actionLabel}
            />
          </Reveal>
        </section>

        {/* Problem vs Kaya Solution Section */}
        <section className="py-16 border-t border-line/60">
          <Reveal>
            <p className="font-mono text-xs uppercase tracking-widest text-subtle">
              {isEn ? "Before / After" : "Avant / Après"}
            </p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-medium tracking-tight">
              {isEn ? "Why legacy approaches fall short" : "Pourquoi les approches classiques échouent"}
            </h2>
          </Reveal>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {/* The Problem */}
            <Reveal delay={0.1} className="rounded-[28px] border border-line bg-cream/40 p-6 sm:p-8">
              <span className="inline-block font-mono text-xs uppercase tracking-wider text-negative font-medium">
                {isEn ? "Without Kaya · The legacy approach" : "Sans Kaya · L'approche classique"}
              </span>
              <h3 className="mt-3 text-xl font-medium tracking-tight text-ink">
                {isEn ? useCase.problem.titleEn : useCase.problem.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {isEn ? useCase.problem.descriptionEn : useCase.problem.description}
              </p>
              <ul className="mt-6 space-y-3">
                {problemBullets.map((bullet, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-ink/80">
                    <span className="text-negative font-bold mt-0.5">✕</span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </Reveal>

            {/* The Kaya Solution */}
            <Reveal delay={0.2} className="rounded-[28px] border border-line bg-lime-soft/60 p-6 sm:p-8">
              <span className="inline-block font-mono text-xs uppercase tracking-wider text-lime-deep font-medium">
                {isEn ? "With Kaya · The deterministic engine" : "Avec Kaya · Le moteur déterministe"}
              </span>
              <h3 className="mt-3 text-xl font-medium tracking-tight text-ink">
                {isEn ? useCase.solution.titleEn : useCase.solution.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-ink/80">
                {isEn ? useCase.solution.descriptionEn : useCase.solution.description}
              </p>
              <div className="mt-6 space-y-4">
                {useCase.solution.features.map((feat, i) => (
                  <div key={i} className="rounded-xl bg-surface/80 p-3.5 border border-line/50">
                    <p className="text-sm font-medium text-ink flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-grass" />
                      {isEn ? feat.titleEn : feat.title}
                    </p>
                    <p className="mt-1 text-xs text-muted leading-relaxed pl-6">
                      {isEn ? feat.descEn : feat.desc}
                    </p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* 4-Step Loop Breakdown */}
        <section className="py-16 border-t border-line/60">
          <Reveal className="text-center max-w-2xl mx-auto">
            <p className="font-mono text-xs uppercase tracking-widest text-subtle">
              {isEn ? "The Growth Cycle" : "Le Cycle de Croissance"}
            </p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-medium tracking-tight">
              {isEn ? "Kaya's 4-step growth loop" : "La boucle en 4 étapes de Kaya"}
            </h2>
            <p className="mt-3 text-sm text-muted">
              {isEn
                ? "Understand → Decide → Experiment → Measure: no guesswork, no hallucinated prompts."
                : "Comprendre → Décider → Expérimenter → Mesurer : aucune étape n'est laissée au hasard ou à l'improvisation d'un prompt."}
            </p>
          </Reveal>

          <Stagger className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" stagger={0.08}>
            {useCase.loopSteps.map((step, idx) => (
              <StaggerItem
                key={idx}
                className="rounded-[24px] border border-line bg-cream/30 p-6 flex flex-col justify-between hover:bg-cream/60 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-subtle">0{idx + 1}</span>
                    <span className="font-mono text-[10px] uppercase tracking-wider rounded-md bg-surface px-2 py-0.5 border border-line">
                      {step.step}
                    </span>
                  </div>
                  <h4 className="mt-6 text-lg font-medium tracking-tight text-ink">
                    {isEn ? step.labelEn : step.label}
                  </h4>
                  <p className="mt-2 text-xs leading-relaxed text-muted">
                    {isEn ? step.descEn : step.desc}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </section>

        {/* Guardrails & Governance Policy */}
        <section className="py-16 border-t border-line/60">
          <div className="rounded-[32px] border border-line bg-surface p-8 sm:p-12 shadow-sm">
            <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto]">
              <div>
                <div className="flex items-center gap-2">
                  <Shield className="size-5 text-lilac-deep" />
                  <span className="font-mono text-xs uppercase tracking-wider text-muted">
                    {isEn ? "Security & Governance" : "Sécurité & Contrôle"}
                  </span>
                </div>
                <h3 className="mt-2 text-2xl sm:text-3xl font-medium tracking-tight">
                  {isEn ? "Your guardrails for this use case" : "Vos garde-fous pour ce cas d'usage"}
                </h3>
                <p className="mt-2 text-sm text-muted max-w-xl">
                  {isEn
                    ? "The agent is never a black box. Every external mutation is governed by deterministic rules hard-coded in our policy engine."
                    : "L'agent n'est pas une boîte noire. Chaque action externe est validée par des règles déterministes codées en dur dans notre moteur de gouvernance."}
                </p>
                <div className="mt-6 space-y-3">
                  {useCase.guardrails.map((g, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm">
                      <span className="font-mono text-xs font-medium text-ink bg-sunken px-2 py-0.5 rounded mt-0.5">
                        {isEn ? g.policyEn : g.policy}
                      </span>
                      <span className="text-muted leading-snug">
                        {isEn ? g.detailEn : g.detail}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <Link
                  href="/signup"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-ink px-6 text-sm font-medium text-white transition-all hover:bg-ink-hover shadow-sm"
                >
                  {isEn ? "Configure my guardrails" : "Configurer mes garde-fous"}
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-cream px-6 text-sm font-medium text-ink transition-colors hover:bg-stone text-center"
                >
                  {isEn ? "View pricing plans" : "Consulter la grille tarifaire"}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="py-16 border-t border-line/60 max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h3 className="text-2xl sm:text-3xl font-medium tracking-tight">
              {isEn ? "Frequently asked questions" : "Questions fréquentes"}
            </h3>
            <p className="mt-2 text-sm text-muted">
              {isEn
                ? "Everything you need to know to get started with this play."
                : "Tout ce qu'il faut savoir pour démarrer avec ce cas d'usage."}
            </p>
          </div>
          <div className="space-y-4">
            {useCase.faqs.map((faq, i) => (
              <details
                key={i}
                className="group rounded-2xl border border-line bg-cream/30 p-5 transition-colors open:bg-cream/60"
              >
                <summary className="flex cursor-pointer items-center justify-between font-medium text-ink text-sm sm:text-base list-none">
                  <span>{isEn ? faq.qEn : faq.q}</span>
                  <ChevronRight className="size-4 text-muted transition-transform group-open:rotate-90" />
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted pt-2 border-t border-line/40">
                  {isEn ? faq.aEn : faq.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* Other Use Cases Navigation */}
        <section className="py-16 border-t border-line/60">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-subtle">
                {isEn ? "Discover other plays" : "Découvrir d'autres cas"}
              </p>
              <h3 className="mt-1 text-2xl font-medium tracking-tight">
                {isEn ? "Every way to grow with Kaya" : "Toutes les façons d'utiliser Kaya"}
              </h3>
            </div>
            <Link href="/use-cases" className="text-sm font-medium text-ink hover:underline flex items-center gap-1">
              {isEn ? "View all use cases" : "Voir tout le hub"} <ArrowRight className="size-3.5" />
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {USE_CASES.filter((u) => u.slug !== useCase.slug)
              .slice(0, 4)
              .map((u) => {
                const Icon = u.icon;
                return (
                  <Link
                    key={u.slug}
                    href={`/use-cases/${u.slug}`}
                    className="group rounded-[24px] border border-line bg-cream/30 p-6 transition-all hover:bg-cream/70 hover:shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <span className={cn("grid size-9 place-items-center rounded-xl text-sm mb-4", TONE_TILE[u.tone])}>
                        <Icon className="size-4" />
                      </span>
                      <p className="font-mono text-[11px] uppercase tracking-wider text-muted">
                        {isEn ? u.kickerEn : u.kicker}
                      </p>
                      <h4 className="mt-1.5 text-base font-medium text-ink group-hover:text-agent transition-colors leading-snug">
                        {isEn ? u.titleEn : u.title}
                      </h4>
                    </div>
                    <span className="mt-6 inline-flex items-center gap-1 text-xs font-medium text-ink/70 group-hover:text-ink">
                      {isEn ? "Read case" : "Lire le cas"}{" "}
                      <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                );
              })}
          </div>
        </section>

        {/* Global Closing CTA */}
        <ClosingCta />
      </main>

      <SiteFooter />
    </div>
  );
}
