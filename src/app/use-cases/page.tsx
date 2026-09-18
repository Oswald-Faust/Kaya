import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { SiteNav } from "@/components/marketing/site-nav";
import { SiteFooter } from "@/components/marketing/site-footer";
import { ClosingCta } from "@/components/marketing/closing-cta";
import { Reveal, Stagger, StaggerItem } from "@/components/marketing/motion";
import { USE_CASES } from "@/data/use-cases-data";
import { cn } from "@/lib/cn";
import { TONE_TILE } from "@/components/marketing/nav-data";

export const metadata: Metadata = {
  title: "Cas d'usage · Kaya — Le système de croissance IA pour vos logiciels",
  description:
    "Découvrez comment Kaya aide les fondateurs à trouver leurs 100 premiers clients, scaler le search payant, optimiser leur budget et convertir leurs essais en abonnés payants.",
};

export default function UseCasesIndexPage() {
  const getCustomers = USE_CASES.filter((u) => u.category === "getCustomers");
  const growWhatYouHave = USE_CASES.filter((u) => u.category === "growWhatYouHave");

  return (
    <div className="min-h-screen bg-surface text-ink font-sans antialiased selection:bg-lime-soft selection:text-lime-deep">
      <SiteNav />

      <main className="mx-auto max-w-[1360px] px-5 pt-14 sm:pt-20">
        {/* Header */}
        <section className="max-w-3xl">
          <Reveal>
            <div className="inline-flex items-center gap-2 rounded-full border border-line bg-cream px-3 py-1 text-xs font-mono tracking-wide text-ink">
              <Sparkles className="size-3 text-agent" />
              <span>Cas d&apos;usage Kaya</span>
            </div>
            <h1 className="mt-4 text-[clamp(44px,6.2vw,84px)] leading-[0.94] font-[560] tracking-[-0.05em] text-ink">
              Ce que Kaya fait concrètement pour votre produit
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-muted leading-relaxed">
              Pas de théories abstraites. Choisissez votre priorité de croissance actuelle et découvrez le plan d&apos;action précis exécuté par l&apos;agent sous vos garde-fous.
            </p>
          </Reveal>
        </section>

        {/* Section 1: Trouver des clients (Get Customers) */}
        <section className="pt-20 sm:pt-28">
          <Reveal>
            <div className="flex items-baseline justify-between border-b border-line pb-4 mb-8">
              <div>
                <span className="font-mono text-xs uppercase tracking-wider text-muted">Axe 01</span>
                <h2 className="text-2xl sm:text-3xl font-medium tracking-tight mt-1">Trouver des clients</h2>
              </div>
              <span className="text-xs text-muted font-mono">{getCustomers.length} cas d&apos;usage</span>
            </div>
          </Reveal>

          <Stagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4" stagger={0.08}>
            {getCustomers.map((uc) => {
              const Icon = uc.icon;
              return (
                <StaggerItem key={uc.slug}>
                  <Link
                    href={`/use-cases/${uc.slug}`}
                    className="group flex h-full flex-col justify-between rounded-[28px] border border-line bg-cream/30 p-6 sm:p-7 transition-all hover:bg-cream/70 hover:shadow-xs hover:border-line-strong"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-5">
                        <span className={cn("grid size-10 place-items-center rounded-xl", TONE_TILE[uc.tone])}>
                          <Icon className="size-5" />
                        </span>
                        <span className="font-mono text-[10px] uppercase tracking-wider rounded-md bg-surface px-2 py-0.5 border border-line text-muted">
                          {uc.badge}
                        </span>
                      </div>
                      <p className="font-mono text-xs uppercase tracking-wider text-muted">{uc.kicker}</p>
                      <h3 className="mt-2 text-lg font-medium tracking-tight text-ink group-hover:text-agent transition-colors leading-snug">
                        {uc.title}
                      </h3>
                      <p className="mt-3 text-xs sm:text-sm text-muted leading-relaxed line-clamp-3">
                        {uc.lead}
                      </p>
                    </div>

                    <div className="mt-8 pt-4 border-t border-line/40 flex items-center justify-between">
                      <span className="font-mono text-xs font-semibold text-ink">{uc.stat.value}</span>
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-ink group-hover:translate-x-0.5 transition-transform">
                        Explorer <ArrowRight className="size-3" />
                      </span>
                    </div>
                  </Link>
                </StaggerItem>
              );
            })}
          </Stagger>
        </section>

        {/* Section 2: Faire grandir l'existant (Grow What You Have) */}
        <section className="pt-20 sm:pt-28">
          <Reveal>
            <div className="flex items-baseline justify-between border-b border-line pb-4 mb-8">
              <div>
                <span className="font-mono text-xs uppercase tracking-wider text-muted">Axe 02</span>
                <h2 className="text-2xl sm:text-3xl font-medium tracking-tight mt-1">Faire grandir l&apos;existant</h2>
              </div>
              <span className="text-xs text-muted font-mono">{growWhatYouHave.length} cas d&apos;usage</span>
            </div>
          </Reveal>

          <Stagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4" stagger={0.08}>
            {growWhatYouHave.map((uc) => {
              const Icon = uc.icon;
              return (
                <StaggerItem key={uc.slug}>
                  <Link
                    href={`/use-cases/${uc.slug}`}
                    className="group flex h-full flex-col justify-between rounded-[28px] border border-line bg-cream/30 p-6 sm:p-7 transition-all hover:bg-cream/70 hover:shadow-xs hover:border-line-strong"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-5">
                        <span className={cn("grid size-10 place-items-center rounded-xl", TONE_TILE[uc.tone])}>
                          <Icon className="size-5" />
                        </span>
                        <span className="font-mono text-[10px] uppercase tracking-wider rounded-md bg-surface px-2 py-0.5 border border-line text-muted">
                          {uc.badge}
                        </span>
                      </div>
                      <p className="font-mono text-xs uppercase tracking-wider text-muted">{uc.kicker}</p>
                      <h3 className="mt-2 text-lg font-medium tracking-tight text-ink group-hover:text-agent transition-colors leading-snug">
                        {uc.title}
                      </h3>
                      <p className="mt-3 text-xs sm:text-sm text-muted leading-relaxed line-clamp-3">
                        {uc.lead}
                      </p>
                    </div>

                    <div className="mt-8 pt-4 border-t border-line/40 flex items-center justify-between">
                      <span className="font-mono text-xs font-semibold text-ink">{uc.stat.value}</span>
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-ink group-hover:translate-x-0.5 transition-transform">
                        Explorer <ArrowRight className="size-3" />
                      </span>
                    </div>
                  </Link>
                </StaggerItem>
              );
            })}
          </Stagger>
        </section>

        {/* Global Closing CTA */}
        <div className="pt-20 sm:pt-28">
          <ClosingCta />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
