"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Check, ChevronDown, Lock, Rocket, TrendingUp } from "lucide-react";
import { chooseFreeAction, startTrialAction } from "@/app/(onboarding)/start/actions";
import { EASE } from "@/components/marketing/motion";
import { PLANS, priceFor } from "@/components/pricing/plans";
import { Spinner } from "@/components/ui/button";
import { cn } from "@/lib/cn";

const OFFER = PLANS.filter((p) => p.id === "launch" || p.id === "growth");
const ICON = { launch: Rocket, growth: TrendingUp } as const;
const HEAD = { launch: "bg-grass-deep", growth: "bg-pink-deep" } as const;

export function PlanPicker({ slug, recommended, trialUsed, currentPlan, cardRequired }: { slug: string; recommended: "launch" | "growth"; trialUsed: boolean; currentPlan: string; cardRequired: boolean }) {
  const [annual, setAnnual] = useState(true);
  const [tiers, setTiers] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);

  const run = (key: string, fn: () => Promise<{ ok: boolean; error?: string } | void>) => {
    setBusy(key);
    start(async () => {
      const result = await fn();
      if (result && !result.ok) setError(result.error ?? "Something went wrong.");
      setBusy(null);
    });
  };

  return (
    <section className="rounded-[32px] border border-line bg-surface p-5 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-medium tracking-[-0.03em]">{trialUsed ? "Choose your plan" : "Start your 14-day free trial"}</h2>
          <p className="text-[15px] text-muted">Recommended for your strategy: {recommended === "growth" ? "Growth" : "Launch"}</p>
        </div>
        <div role="radiogroup" aria-label="Billing period" className="inline-flex rounded-xl bg-sunken p-1 text-sm">
          {[
            [false, "Monthly"],
            [true, "Annual · save 10%"],
          ].map(([value, label]) => (
            <button
              key={label as string}
              role="radio"
              aria-checked={annual === value}
              onClick={() => setAnnual(value as boolean)}
              className={cn("relative rounded-lg px-3 py-1.5 font-medium", annual === value ? "text-ink" : "text-muted")}
            >
              {annual === value && <motion.span layoutId="plan-billing" className="absolute inset-0 rounded-lg bg-surface shadow-sm" transition={{ duration: 0.25, ease: EASE }} />}
              <span className="relative">{label as string}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {OFFER.map((plan) => {
          const id = plan.id as "launch" | "growth";
          const Icon = ICON[id];
          const tierIndex = tiers[id] ?? 0;
          const tier = plan.tiers![tierIndex];
          const price = priceFor(tier, annual);
          const isRecommended = id === recommended;
          return (
            <article key={id} className={cn("flex flex-col rounded-[24px] bg-cream p-2", isRecommended && "ring-2 ring-ink")}>
              <div className={cn("relative rounded-[18px] p-5 text-white", HEAD[id])}>
                {isRecommended && <span className="absolute top-4 right-4 rounded-full bg-surface px-2.5 py-1 text-xs font-medium text-ink">Recommended</span>}
                <Icon className="size-5" />
                <p className="mt-3 text-xl font-medium">{plan.name}</p>
                <p className="mt-1 text-sm text-white/80">{plan.tagline}</p>
              </div>
              <div className="flex flex-1 flex-col px-3 pt-5 pb-3">
                <div className="flex h-11 items-end gap-1 overflow-hidden">
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span key={price} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} transition={{ duration: 0.25, ease: EASE }} className="text-[38px] leading-none font-medium tracking-[-0.05em] tabular">
                      ${price}
                    </motion.span>
                  </AnimatePresence>
                  <span className="pb-1 text-muted">/mo{trialUsed ? (annual ? ", billed yearly" : "") : " after trial"}</span>
                </div>
                <label className="relative mt-4 block">
                  <span className="sr-only">Agent actions</span>
                  <select
                    value={tierIndex}
                    onChange={(e) => setTiers((t) => ({ ...t, [id]: Number(e.target.value) }))}
                    className="h-11 w-full appearance-none rounded-xl border border-line bg-surface pr-9 pl-3 text-sm outline-none focus:border-ink"
                  >
                    {plan.tiers!.map((t, idx) => (
                      <option key={t.actions} value={idx}>
                        {t.actions.toLocaleString("en-US")} agent actions/mo
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-subtle" />
                </label>
                <ul className="mt-5 flex-1 space-y-2">
                  {plan.features.slice(0, 6).map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 size-3.5 shrink-0 text-grass-deep" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => run(id, () => startTrialAction(slug, id, annual ? "year" : "month", tier.actions))}
                  className={cn(
                    "mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-xl text-[15px] font-medium transition-colors disabled:opacity-70",
                    isRecommended ? "bg-ink text-white hover:bg-ink-hover" : "border border-line-strong bg-surface hover:border-ink",
                  )}
                >
                  {busy === id ? <Spinner /> : null}
                  {trialUsed ? `Continue with ${plan.name}` : "Start 14-day free trial"}
                  {busy !== id && <ArrowRight className="size-4" />}
                </button>
                <p className="mt-2.5 flex items-center justify-center gap-1.5 text-xs text-subtle">
                  {cardRequired ? (
                    <>
                      <Lock className="size-3" />
                      {trialUsed ? "Secure checkout by Stripe" : `$0 today · then $${annual ? price * 12 : price}/${annual ? "year" : "month"}`}
                    </>
                  ) : (
                    "No card required"
                  )}
                </p>
              </div>
            </article>
          );
        })}
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-negative-soft px-3 py-2.5 text-sm text-negative">
          {error}
        </p>
      )}

      {currentPlan !== "free" && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-raised px-5 py-4">
          <p className="text-sm text-muted">
            <span className="font-medium text-ink">Not ready?</span> Stay on Free: you keep the analysis, the top channel and the first experiment. The rest stays locked.
          </p>
          <button type="button" disabled={pending} onClick={() => run("free", () => chooseFreeAction(slug))} className="inline-flex items-center gap-2 text-sm font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
            {busy === "free" && <Spinner />}
            Continue with Free
          </button>
        </div>
      )}
    </section>
  );
}
