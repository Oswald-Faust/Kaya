"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, ChevronRight, Layers, ShieldCheck, Sparkles } from "lucide-react";
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
import { SOLUTIONS, getSolutionBySlug, type SolutionItem } from "@/data/solutions-data";
import { cn } from "@/lib/cn";
import { TONE_CARD, TONE_TILE } from "./nav-data";

const SPOT_COMPONENTS = {
  understand: UnderstandSpot,
  decide: DecideSpot,
  experiment: ExperimentSpot,
  control: ControlSpot,
  learn: LearnSpot,
};

const CATEGORY_NAMES = {
  byStage: "Par étape",
  byProduct: "Par produit",
  byTeam: "Par équipe",
};

interface SolutionLayoutProps {
  slug?: string;
  solution?: SolutionItem;
}

export function SolutionLayout({ slug, solution: initialSolution }: SolutionLayoutProps) {
  const solution = initialSolution ?? (slug ? getSolutionBySlug(slug) : undefined);
  if (!solution) return null;

  const SpotIcon = SPOT_COMPONENTS[solution.spot];

  // All solutions in the same category for the pill nav
  const categoryPills: NavPill[] = SOLUTIONS.filter(
    (s) => s.category === solution.category
  ).map((s) => ({
    slug: s.slug,
    href: `/solutions/${s.slug}`,
    label: s.kicker,
    icon: s.icon,
    tone: s.tone,
    badge: s.id === "mobileApps" || s.id === "agencies" ? "Bientôt" : undefined,
  }));

  return (
    <div className="min-h-screen bg-surface text-ink font-sans antialiased selection:bg-lime-soft selection:text-lime-deep">
      <SiteNav />

      <main className="mx-auto max-w-[1360px] px-5 pt-12 sm:pt-18">
        {/* Category Pills Navigation */}
        <div className="mb-8">
          <div className="flex items-center justify-between pb-2">
            <span className="font-mono text-xs uppercase tracking-wider text-muted">
              Solutions · {CATEGORY_NAMES[solution.category]}
            </span>
            <div className="flex items-center gap-3 text-xs">
              <Link
                href="/solutions/pre-launch"
                className={cn("hover:underline", solution.category === "byStage" ? "font-semibold text-ink" : "text-muted")}
              >
                Par étape
              </Link>
              <span className="text-subtle">·</span>
              <Link
                href="/solutions/b2b-saas"
                className={cn("hover:underline", solution.category === "byProduct" ? "font-semibold text-ink" : "text-muted")}
              >
                Par produit
              </Link>
              <span className="text-subtle">·</span>
              <Link
                href="/solutions/solo-founders"
                className={cn("hover:underline", solution.category === "byTeam" ? "font-semibold text-ink" : "text-muted")}
              >
                Par équipe
              </Link>
            </div>
          </div>
          <CategoryPillNav
            items={categoryPills}
            activeSlug={solution.slug}
            ariaLabel={`Solutions ${CATEGORY_NAMES[solution.category]}`}
          />
        </div>

        {/* Hero Section */}
        <section className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] pt-4 pb-16">
          <Reveal>
            <div className="inline-flex items-center gap-2 rounded-full border border-line bg-cream px-3 py-1 text-xs font-mono tracking-wide text-ink">
              <span className={cn("size-2 rounded-full", TONE_CARD[solution.tone])} />
              <span>{solution.eyebrow}</span>
              <span className="text-subtle">·</span>
              <span className="text-muted">{solution.badge}</span>
            </div>

            <h1 className="mt-4 text-[clamp(40px,5.5vw,78px)] leading-[0.96] font-[560] tracking-[-0.045em] text-ink">
              {solution.title}
            </h1>

            <p className="mt-6 max-w-xl text-lg sm:text-xl leading-relaxed text-muted">
              {solution.lead}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/signup"
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-ink px-5 text-sm font-medium text-white transition-all hover:bg-ink-hover shadow-sm"
              >
                <span>Démarrer avec cette solution</span>
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/demo"
                className="inline-flex h-11 items-center rounded-xl bg-cream px-5 text-sm font-medium text-ink transition-colors hover:bg-stone"
              >
                Voir l&apos;espace de démo
              </Link>
            </div>

            {/* Stat Pill */}
            <div className="mt-8 inline-flex items-center gap-3 rounded-2xl border border-line bg-cream/60 px-4 py-3">
              <span className="font-mono text-2xl font-bold tracking-tight text-ink">{solution.stat.value}</span>
              <span className="text-xs text-muted max-w-[280px] leading-snug">{solution.stat.label}</span>
            </div>
          </Reveal>

          {/* Clay Spot Hero Card */}
          <Reveal delay={0.15} className="relative flex justify-center">
            <div className="relative w-full max-w-[420px] aspect-square rounded-[32px] bg-cream/70 p-6 flex flex-col items-center justify-center border border-line shadow-sm">
              <SpotIcon className="w-full h-full max-h-[300px]" />
              <span className="mt-2 font-mono text-[11px] uppercase tracking-wider text-muted">
                Kaya Solution · {solution.kicker}
              </span>
            </div>
          </Reveal>
        </section>

        {/* Interactive Simulator */}
        <section className="py-12 sm:py-16">
          <Reveal className="text-center mb-8">
            <p className="font-mono text-xs uppercase tracking-widest text-subtle">Simulation Produit Directe</p>
            <h2 className="mt-2 text-2xl sm:text-4xl font-medium tracking-tight">
              L&apos;agent Kaya configuré pour {solution.kicker.toLowerCase()}
            </h2>
            <p className="mt-2 text-sm text-muted">
              Découvrez les règles d&apos;autonomie et les actions adaptées à votre profil.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <InteractiveWorkflowMock
              title={solution.mockData.title}
              tag={solution.mockData.tag}
              status={solution.mockData.status}
              tone={solution.tone}
              items={solution.mockData.items}
              actionLabel={solution.mockData.actionLabel}
            />
          </Reveal>
        </section>

        {/* Pains & Roadblock Section */}
        <section className="py-16 border-t border-line/60">
          <div className="grid gap-8 lg:grid-cols-[1fr_1fr] items-start">
            <Reveal>
              <span className="font-mono text-xs uppercase tracking-wider text-negative font-medium">
                Le blocage fréquent
              </span>
              <h3 className="mt-2 text-3xl font-medium tracking-tight text-ink">{solution.pains.title}</h3>
              <p className="mt-3 text-base text-muted leading-relaxed">
                Sans un système d&apos;exploitation de croissance dédié, les équipes perdent des semaines sur des tâches administratives au lieu de valider leurs hypothèses.
              </p>
            </Reveal>

            <Reveal delay={0.1} className="rounded-[28px] border border-line bg-cream/40 p-6 sm:p-8">
              <h4 className="font-mono text-xs uppercase tracking-wider text-muted mb-4">Symptômes identifiés</h4>
              <ul className="space-y-4">
                {solution.pains.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-ink/80">
                    <span className="text-negative font-bold mt-0.5">✕</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </section>

        {/* Playbook Breakdown */}
        <section className="py-16 border-t border-line/60">
          <Reveal className="text-center max-w-2xl mx-auto mb-12">
            <p className="font-mono text-xs uppercase tracking-widest text-subtle">Feuille de route</p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-medium tracking-tight">
              {solution.playbook.title}
            </h2>
            <p className="mt-3 text-sm text-muted">{solution.playbook.description}</p>
          </Reveal>

          <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" stagger={0.08}>
            {solution.playbook.steps.map((step, idx) => (
              <StaggerItem
                key={idx}
                className="rounded-[24px] border border-line bg-cream/30 p-6 flex flex-col justify-between hover:bg-cream/60 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-subtle">Étape {idx + 1}</span>
                    <span className="font-mono text-[10px] uppercase tracking-wider rounded-md bg-surface px-2 py-0.5 border border-line">
                      {step.step}
                    </span>
                  </div>
                  <h4 className="mt-5 text-lg font-medium tracking-tight text-ink">{step.label}</h4>
                  <p className="mt-2 text-xs leading-relaxed text-muted">{step.detail}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </section>

        {/* Recommended Integrations */}
        <section className="py-16 border-t border-line/60">
          <div className="rounded-[32px] border border-line bg-surface p-8 sm:p-10 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div>
                <span className="font-mono text-xs uppercase tracking-wider text-muted">Écosystème</span>
                <h3 className="mt-1 text-2xl font-medium tracking-tight">Intégrations clés pour cette solution</h3>
                <p className="mt-1 text-sm text-muted">
                  Kaya se branche sur vos outils existants via des adaptateurs à permissions strictes.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {solution.recommendedIntegrations.map((tool, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-cream px-3.5 py-2 text-xs font-medium text-ink shadow-2xs"
                  >
                    <CheckCircle2 className="size-3.5 text-grass" />
                    {tool}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="py-16 border-t border-line/60 max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h3 className="text-2xl sm:text-3xl font-medium tracking-tight">Questions fréquentes</h3>
            <p className="mt-2 text-sm text-muted">Détails sur l&apos;implémentation de cette solution.</p>
          </div>
          <div className="space-y-4">
            {solution.faqs.map((faq, i) => (
              <details
                key={i}
                className="group rounded-2xl border border-line bg-cream/30 p-5 transition-colors open:bg-cream/60"
              >
                <summary className="flex cursor-pointer items-center justify-between font-medium text-ink text-sm sm:text-base list-none">
                  <span>{faq.q}</span>
                  <ChevronRight className="size-4 text-muted transition-transform group-open:rotate-90" />
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted pt-2 border-t border-line/40">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Other Solutions Exploration */}
        <section className="py-16 border-t border-line/60">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-subtle">Explorer d&apos;autres profils</p>
              <h3 className="mt-1 text-2xl font-medium tracking-tight">Toutes les solutions Kaya</h3>
            </div>
            <Link href="/solutions" className="text-sm font-medium text-ink hover:underline flex items-center gap-1">
              Voir le hub solutions <ArrowRight className="size-3.5" />
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SOLUTIONS.filter((s) => s.slug !== solution.slug)
              .slice(0, 3)
              .map((s) => {
                const Icon = s.icon;
                return (
                  <Link
                    key={s.slug}
                    href={`/solutions/${s.slug}`}
                    className="group rounded-[24px] border border-line bg-cream/30 p-6 transition-all hover:bg-cream/70 hover:shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className={cn("grid size-9 place-items-center rounded-xl text-sm", TONE_TILE[s.tone])}>
                          <Icon className="size-4" />
                        </span>
                        <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
                          {CATEGORY_NAMES[s.category]}
                        </span>
                      </div>
                      <h4 className="text-base font-medium text-ink group-hover:text-agent transition-colors leading-snug">
                        {s.title}
                      </h4>
                      <p className="mt-2 text-xs text-muted line-clamp-2">{s.lead}</p>
                    </div>
                    <span className="mt-6 inline-flex items-center gap-1 text-xs font-medium text-ink/70 group-hover:text-ink">
                      Voir la solution <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
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
