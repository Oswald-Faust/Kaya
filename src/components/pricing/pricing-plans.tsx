"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Building2, Check, ChevronDown, Rocket, Sprout, TrendingUp } from "lucide-react";
import { EASE } from "@/components/marketing/motion";
import { PLANS, priceFor, type PlanId } from "./plans";
import { cn } from "@/lib/cn";

const HEAD = {
  blue: "bg-blue-deep",
  grass: "bg-grass-deep",
  pink: "bg-pink-deep",
  lilac: "bg-lilac-deep",
} as const;

const ICONS: Record<PlanId, typeof Sprout> = { free: Sprout, launch: Rocket, growth: TrendingUp, scale: Building2 };

export function PricingPlans() {
  const [annual, setAnnual] = useState(true);
  const [tiers, setTiers] = useState<Record<string, number>>({});

  return (
    <div>
      <div className="flex justify-end">
        <div role="radiogroup" aria-label="Billing period" className="inline-flex rounded-xl bg-sunken p-1 text-sm">
          {[
            [false, "Monthly"],
            [true, "Annual"],
          ].map(([value, label]) => (
            <button
              key={label as string}
              role="radio"
              aria-checked={annual === value}
              onClick={() => setAnnual(value as boolean)}
              className={cn("relative rounded-lg px-4 py-2 font-medium transition-colors", annual === value ? "text-ink" : "text-muted hover:text-ink")}
            >
              {annual === value && <motion.span layoutId="billing" className="absolute inset-0 rounded-lg bg-surface shadow-sm" transition={{ duration: 0.3, ease: EASE }} />}
              <span className="relative">
                {label as string}
                {value && <span className="ml-1.5 text-grass-deep">Save 10%</span>}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {PLANS.map((plan, i) => {
          const Icon = ICONS[plan.id];
          const tierIndex = tiers[plan.id] ?? 0;
          const tier = plan.tiers?.[tierIndex];
          const price = tier ? priceFor(tier, annual) : null;
          return (
            <motion.article
              key={plan.id}
              id={`plan-${plan.id}`}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, ease: EASE, delay: i * 0.08 }}
              className={cn("flex scroll-mt-28 flex-col rounded-[24px] bg-cream p-2", plan.recommended && "ring-2 ring-pink-deep")}
            >
              <div className={cn("relative rounded-[18px] p-5 text-white", HEAD[plan.tone])}>
                {plan.recommended && <span className="absolute top-4 right-4 rounded-full bg-surface px-2.5 py-1 text-xs font-medium text-pink-deep">Recommended</span>}
                <span className="grid size-10 place-items-center rounded-xl bg-white/15">
                  <Icon className="size-5" />
                </span>
                <p className="mt-4 text-xl font-medium tracking-[-0.02em]">{plan.name}</p>
                <p className="mt-1 min-h-[40px] text-sm leading-snug text-white/80">{plan.tagline}</p>
              </div>

              <div className="flex flex-1 flex-col px-3 pt-5 pb-3">
                <div className="flex h-12 items-end gap-1 overflow-hidden">
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                      key={price ?? "custom"}
                      initial={{ y: 24, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -24, opacity: 0 }}
                      transition={{ duration: 0.3, ease: EASE }}
                      className="text-[40px] leading-none font-medium tracking-[-0.05em] tabular"
                    >
                      {price === null ? "Custom" : price === 0 ? "Free" : `$${price}`}
                    </motion.span>
                  </AnimatePresence>
                  {price !== null && price > 0 && <span className="pb-1 text-muted">/mo</span>}
                </div>
                <p className="mt-1 h-5 text-xs text-muted">
                  {price === null ? "Volume and terms fit to you" : price === 0 ? "Forever, for one product" : annual ? `Billed yearly · $${(price * 12).toLocaleString("en-US")}/yr` : "Billed monthly"}
                </p>

                <div className="mt-4">
                  {plan.tiers && plan.tiers.length > 1 ? (
                    <label className="relative block">
                      <span className="sr-only">Agent actions for {plan.name}</span>
                      <select
                        value={tierIndex}
                        onChange={(e) => setTiers((t) => ({ ...t, [plan.id]: Number(e.target.value) }))}
                        className="h-11 w-full appearance-none rounded-xl border border-line bg-surface pr-9 pl-3 text-sm outline-none focus:border-ink"
                      >
                        {plan.tiers.map((t, idx) => (
                          <option key={t.actions} value={idx}>
                            {t.actions.toLocaleString("en-US")} agent actions/mo
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-subtle" />
                    </label>
                  ) : (
                    <p className="flex h-11 items-center rounded-xl border border-line bg-surface px-3 text-sm">
                      {plan.tiers ? `${plan.tiers[0].actions.toLocaleString("en-US")} agent actions/mo` : "Custom agent actions"}
                    </p>
                  )}
                </div>

                <p className="mt-6 text-xs text-subtle">{plan.intro}</p>
                <ul className="mt-2 flex-1 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 size-3.5 shrink-0 text-grass-deep" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.cta.href}
                  className={cn(
                    "mt-6 inline-flex h-11 items-center justify-center rounded-xl text-[15px] font-medium transition-colors",
                    plan.recommended ? "bg-ink text-white hover:bg-ink-hover" : "border border-line-strong bg-surface hover:border-ink",
                  )}
                >
                  {plan.cta.label}
                </Link>
                {plan.id === "launch" || plan.id === "growth" ? (
                  <p className="mt-2 text-center text-xs text-muted">No card for the trial</p>
                ) : (
                  <p className="mt-2 h-4" />
                )}
              </div>
            </motion.article>
          );
        })}
      </div>
    </div>
  );
}
