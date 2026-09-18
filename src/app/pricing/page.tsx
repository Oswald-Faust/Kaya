import type { Metadata } from "next";
import { Ban, Check, Coins, KeyRound, ScrollText, ShieldCheck, Wallet, Zap } from "lucide-react";
import { BrandIcon, CONNECTED } from "@/components/brand/brand-logos";
import { SiteNav } from "@/components/marketing/site-nav";
import { SiteFooter } from "@/components/marketing/site-footer";
import { ClosingCta } from "@/components/marketing/closing-cta";
import { Reveal, Stagger, StaggerItem } from "@/components/marketing/motion";
import { PricingPlans } from "@/components/pricing/pricing-plans";
import { PricingCalculator } from "@/components/pricing/pricing-calculator";
import { PLANS } from "@/components/pricing/plans";
import { getI18n } from "@/i18n/server";
import { Faq } from "@/components/landing/faq";
import { cn } from "@/lib/cn";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.pricing.metaTitle, description: t.pricing.metaDescription };
}

const HOW = [
  { icon: Zap, tone: "bg-lime" },
  { icon: Wallet, tone: "bg-tangerine-soft" },
  { icon: KeyRound, tone: "bg-blue-soft" },
];
const TRUST = [ShieldCheck, ScrollText, Coins, KeyRound];

export default async function PricingPage() {
  const { t } = await getI18n();
  const pg = t.pricing.page;
  const connected = [...CONNECTED];
  return (
    <div className="bg-surface text-ink">
      <SiteNav />

      <main className="mx-auto max-w-[1360px] px-5 pt-14 sm:pt-20">
        <section className="grid items-end gap-8 lg:grid-cols-[1fr_minmax(0,520px)]">
          <Reveal>
            <p className="font-mono text-[11px] tracking-[0.12em] text-subtle uppercase">{pg.eyebrow}</p>
            <h1 className="mt-3 text-[clamp(52px,7vw,104px)] leading-[0.92] font-[560] tracking-[-0.055em]">
              {pg.titleLine1}
              <br />
              {pg.titleLine2}
            </h1>
            <p className="mt-5 max-w-lg text-lg text-muted">{pg.lead}</p>
          </Reveal>
          <Reveal delay={0.15} className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
            <ul className="marquee-track flex w-max gap-6 py-2" style={{ ["--marquee-duration" as string]: "40s" }}>
              {[...connected, ...connected].map((b, i) => (
                <li key={i} aria-hidden={i >= connected.length || undefined} className="grid size-12 place-items-center rounded-2xl bg-cream">
                  <BrandIcon brand={b} className="size-6" />
                </li>
              ))}
            </ul>
          </Reveal>
        </section>

        <section className="mt-12">
          <PricingPlans />
        </section>

        {/* How pricing works */}
        <section className="pt-28 sm:pt-36">
          <Reveal>
            <h2 className="max-w-3xl text-[clamp(38px,4.6vw,64px)] leading-[1] font-medium tracking-[-0.045em]">{pg.howTitle}</h2>
          </Reveal>
          <Stagger className="mt-10 grid gap-3 md:grid-cols-3" stagger={0.1}>
            {pg.how.map(({ title, body }, i) => {
              const { icon: I, tone } = HOW[i];
              return (
                <StaggerItem key={title} className={cn("rounded-[24px] p-6 sm:p-8", tone)}>
                  <span className="grid size-11 place-items-center rounded-xl bg-surface shadow-sm">
                    <I className="size-5" />
                  </span>
                  <p className="mt-10 text-2xl font-medium tracking-[-0.03em]">{title}</p>
                  <p className="mt-2 text-[15px] leading-relaxed text-ink/70">{body}</p>
                </StaggerItem>
              );
            })}
          </Stagger>
        </section>

        {/* Calculator */}
        <section className="pt-28 sm:pt-36">
          <Reveal className="flex flex-wrap items-end justify-between gap-6">
            <h2 className="max-w-2xl text-[clamp(38px,4.6vw,64px)] leading-[1] font-medium tracking-[-0.045em]">{pg.estimateTitle}</h2>
            <p className="max-w-sm text-muted">{pg.estimateLead}</p>
          </Reveal>
          <Reveal delay={0.1} className="mt-10">
            <PricingCalculator />
          </Reveal>
        </section>

        {/* Compare */}
        <section className="pt-28 sm:pt-36">
          <Reveal>
            <h2 className="text-[clamp(38px,4.6vw,64px)] leading-[1] font-medium tracking-[-0.045em]">{pg.compareTitle}</h2>
          </Reveal>
          <Reveal delay={0.1} className="mt-10 overflow-x-auto rounded-[24px] border border-line">
            <table className="w-full min-w-[860px] border-collapse text-left text-sm">
              <thead>
                <tr className="bg-cream">
                  <th className="w-[32%] px-5 py-4 font-normal text-muted">{pg.features}</th>
                  {PLANS.map((p) => (
                    <th key={p.id} className="px-5 py-4 text-base font-medium tracking-[-0.02em]">
                      {p.name}
                      {p.recommended && <span className="ml-2 rounded-full bg-pink-soft px-2 py-0.5 text-xs font-normal text-pink-deep">{t.pricing.cards.recommended}</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              {t.pricing.compare.map((group) => (
                <tbody key={group.group}>
                  <tr>
                    <td colSpan={5} className="border-t border-line bg-surface px-5 pt-6 pb-2 font-mono text-[11px] tracking-[0.12em] text-subtle uppercase">
                      {group.group}
                    </td>
                  </tr>
                  {group.rows.map((row) => (
                    <tr key={row.label} className="border-t border-line/70 transition-colors hover:bg-raised">
                      <td className="px-5 py-3">{row.label}</td>
                      {row.values.map((v, i) => (
                        <td key={i} className="px-5 py-3">
                          {v === true ? (
                            <Check className="size-4 text-grass-deep" aria-label={pg.included} />
                          ) : v === false ? (
                            <Ban className="size-4 text-line-strong" aria-label={pg.notIncluded} />
                          ) : (
                            <span className="tabular">{v}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              ))}
            </table>
          </Reveal>
        </section>

        {/* Trust */}
        <section className="pt-28 sm:pt-36">
          <Reveal>
            <h2 className="max-w-3xl text-[clamp(38px,4.6vw,64px)] leading-[1] font-medium tracking-[-0.045em]">{pg.trustTitle}</h2>
          </Reveal>
          <Stagger className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" stagger={0.08}>
            {pg.trust.map(({ title, body }, i) => {
              const I = TRUST[i];
              return (
                <StaggerItem key={title} className="rounded-[24px] bg-cream p-6">
                  <I className="size-5 text-lilac-deep" />
                  <p className="mt-6 text-lg font-medium tracking-[-0.02em]">{title}</p>
                  <p className="mt-1 text-sm text-muted">{body}</p>
                </StaggerItem>
              );
            })}
          </Stagger>
        </section>

        {/* FAQ */}
        <section className="grid gap-10 pt-28 sm:pt-36 lg:grid-cols-[0.8fr_1.2fr]">
          <Reveal>
            <h2 className="text-[clamp(38px,4.4vw,60px)] leading-[1] font-medium tracking-[-0.045em]">
              {pg.faqTitleLine1}
              <br />
              {pg.faqTitleLine2}
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <Faq questions={t.pricing.faq} />
          </Reveal>
        </section>
      </main>

      <ClosingCta title={pg.closing} />
      <SiteFooter />
    </div>
  );
}
