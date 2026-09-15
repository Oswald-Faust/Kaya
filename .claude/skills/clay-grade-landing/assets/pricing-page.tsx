import type { Metadata } from "next";
import { Ban, Check, Coins, KeyRound, ScrollText, ShieldCheck, Wallet, Zap } from "lucide-react";
import { BrandIcon, CONNECTED } from "@/components/brand/brand-logos";
import { SiteNav } from "@/components/marketing/site-nav";
import { SiteFooter } from "@/components/marketing/site-footer";
import { ClosingCta } from "@/components/marketing/closing-cta";
import { Reveal, Stagger, StaggerItem } from "@/components/marketing/motion";
import { PricingPlans } from "@/components/pricing/pricing-plans";
import { PricingCalculator } from "@/components/pricing/pricing-calculator";
import { COMPARE, PLANS } from "@/components/pricing/plans";
import { Faq } from "@/components/landing/faq";
import { cn } from "@/lib/cn";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Start free. Pay for what the Kaya agent does, never a share of your ad spend.",
};

const PRICING_FAQ = [
  {
    q: "What is an agent action?",
    a: "A tool call that does work: analyzing a page, scoring a channel, drafting an ad, changing a budget or evaluating an experiment. Reading dashboards and your brief is free, and failed or blocked actions are never counted.",
  },
  {
    q: "Does Kaya take a percentage of my ad spend?",
    a: "No. Ad spend is billed by Google, Meta or LinkedIn to your own accounts. Plans set how much spend Kaya may manage under guardrails; they never charge a share of it.",
  },
  {
    q: "What happens if I run out of actions?",
    a: "Kaya keeps reading and reporting, and holds new work until your next cycle or until you move up a tier. Safety actions, like pausing a losing ad, always run.",
  },
  {
    q: "Do unused actions roll over?",
    a: "Monthly plans reset each month. Annual plans receive the year's actions upfront, so quiet months fund busy ones.",
  },
  {
    q: "Can I change plans at any time?",
    a: "Yes. Upgrades apply immediately and are prorated. Downgrades take effect at the next billing date.",
  },
  {
    q: "Is there a free trial?",
    a: "Launch and Growth include a 14-day trial without a card. The Free plan stays free for one product.",
  },
];

export default function PricingPage() {
  const connected = [...CONNECTED];
  return (
    <div className="bg-surface text-ink">
      <SiteNav />

      <main className="mx-auto max-w-[1360px] px-5 pt-14 sm:pt-20">
        <section className="grid items-end gap-8 lg:grid-cols-[1fr_minmax(0,520px)]">
          <Reveal>
            <p className="font-mono text-[11px] tracking-[0.12em] text-subtle uppercase">Pricing</p>
            <h1 className="mt-3 text-[clamp(52px,7vw,104px)] leading-[0.92] font-[560] tracking-[-0.055em]">
              Pricing that
              <br />
              grows with you
            </h1>
            <p className="mt-5 max-w-lg text-lg text-muted">Start free. Pay for what the agent does, never a share of your ad spend.</p>
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
            <h2 className="max-w-3xl text-[clamp(38px,4.6vw,64px)] leading-[1] font-medium tracking-[-0.045em]">You pay for work done, not for seats or spend</h2>
          </Reveal>
          <Stagger className="mt-10 grid gap-3 md:grid-cols-3" stagger={0.1}>
            {[
              [Zap, "bg-lime", "Agent actions", "Each tool call that does work counts once: analyses, drafts, launches, budget changes and evaluations. Idempotency keys mean a retry never counts twice."],
              [Wallet, "bg-tangerine-soft", "Ad spend is yours", "Spend is billed by the ad platforms to your accounts. Kaya never marks it up or takes a percentage; your plan only sets how much it may manage."],
              [KeyRound, "bg-blue-soft", "Your accounts, your keys", "Kaya connects with least-privilege OAuth scopes you can revoke any time. Disconnect and your data export is one click."],
            ].map(([Icon, tone, title, body]) => {
              const I = Icon as typeof Zap;
              return (
                <StaggerItem key={title as string} className={cn("rounded-[24px] p-6 sm:p-8", tone as string)}>
                  <span className="grid size-11 place-items-center rounded-xl bg-surface shadow-sm">
                    <I className="size-5" />
                  </span>
                  <p className="mt-10 text-2xl font-medium tracking-[-0.03em]">{title as string}</p>
                  <p className="mt-2 text-[15px] leading-relaxed text-ink/70">{body as string}</p>
                </StaggerItem>
              );
            })}
          </Stagger>
        </section>

        {/* Calculator */}
        <section className="pt-28 sm:pt-36">
          <Reveal className="flex flex-wrap items-end justify-between gap-6">
            <h2 className="max-w-2xl text-[clamp(38px,4.6vw,64px)] leading-[1] font-medium tracking-[-0.045em]">Estimate your plan</h2>
            <p className="max-w-sm text-muted">Move the sliders. The estimate uses the same formula shown below it.</p>
          </Reveal>
          <Reveal delay={0.1} className="mt-10">
            <PricingCalculator />
          </Reveal>
        </section>

        {/* Compare */}
        <section className="pt-28 sm:pt-36">
          <Reveal>
            <h2 className="text-[clamp(38px,4.6vw,64px)] leading-[1] font-medium tracking-[-0.045em]">Compare plans</h2>
          </Reveal>
          <Reveal delay={0.1} className="mt-10 overflow-x-auto rounded-[24px] border border-line">
            <table className="w-full min-w-[860px] border-collapse text-left text-sm">
              <thead>
                <tr className="bg-cream">
                  <th className="w-[32%] px-5 py-4 font-normal text-muted">Features</th>
                  {PLANS.map((p) => (
                    <th key={p.id} className="px-5 py-4 text-base font-medium tracking-[-0.02em]">
                      {p.name}
                      {p.recommended && <span className="ml-2 rounded-full bg-pink-soft px-2 py-0.5 text-xs font-normal text-pink-deep">Recommended</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              {COMPARE.map((group) => (
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
                            <Check className="size-4 text-grass-deep" aria-label="Included" />
                          ) : v === false ? (
                            <Ban className="size-4 text-line-strong" aria-label="Not included" />
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
            <h2 className="max-w-3xl text-[clamp(38px,4.6vw,64px)] leading-[1] font-medium tracking-[-0.045em]">Safe by design, on every plan</h2>
          </Reveal>
          <Stagger className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" stagger={0.08}>
            {[
              [ShieldCheck, "Hard budget caps", "Daily, monthly and per-experiment limits enforced in code, checked again at execution."],
              [ScrollText, "Append-only audit log", "Every run, tool call, approval and change is recorded and can't be edited."],
              [Coins, "No surprise bills", "Actions stop at your tier. Nothing is charged past it without your upgrade."],
              [KeyRound, "Revocable access", "Least-privilege OAuth scopes. Disconnect any integration in one click."],
            ].map(([Icon, title, body]) => {
              const I = Icon as typeof ShieldCheck;
              return (
                <StaggerItem key={title as string} className="rounded-[24px] bg-cream p-6">
                  <I className="size-5 text-lilac-deep" />
                  <p className="mt-6 text-lg font-medium tracking-[-0.02em]">{title as string}</p>
                  <p className="mt-1 text-sm text-muted">{body as string}</p>
                </StaggerItem>
              );
            })}
          </Stagger>
        </section>

        {/* FAQ */}
        <section className="grid gap-10 pt-28 sm:pt-36 lg:grid-cols-[0.8fr_1.2fr]">
          <Reveal>
            <h2 className="text-[clamp(38px,4.4vw,60px)] leading-[1] font-medium tracking-[-0.045em]">
              Pricing
              <br />
              questions
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <Faq questions={PRICING_FAQ} />
          </Reveal>
        </section>
      </main>

      <ClosingCta title="Start free. Grow into it." />
      <SiteFooter />
    </div>
  );
}
