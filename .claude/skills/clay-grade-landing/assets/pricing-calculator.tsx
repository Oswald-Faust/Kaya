"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { EASE } from "@/components/marketing/motion";
import { estimateActions, priceFor, recommendPlan, type Usage } from "./plans";

const INPUTS: { key: keyof Usage; label: string; min: number; max: number; step: number; format: (v: number) => string }[] = [
  { key: "products", label: "Products", min: 1, max: 10, step: 1, format: (v) => String(v) },
  { key: "experiments", label: "Experiments running at once", min: 1, max: 40, step: 1, format: (v) => String(v) },
  { key: "channels", label: "Active channels", min: 1, max: 10, step: 1, format: (v) => String(v) },
  { key: "spend", label: "Monthly ad spend Kaya manages", min: 0, max: 50000, step: 500, format: (v) => `$${v.toLocaleString("en-US")}` },
];

export function PricingCalculator() {
  const [usage, setUsage] = useState<Usage>({ products: 1, experiments: 6, channels: 3, spend: 2000 });
  const { parts, total } = estimateActions(usage);
  const { plan, tier } = recommendPlan(usage);
  const price = tier ? priceFor(tier, true) : null;

  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="rounded-[24px] border border-line bg-surface p-6 sm:p-8">
        <div className="space-y-7">
          {INPUTS.map((input) => (
            <label key={input.key} className="block">
              <span className="flex items-baseline justify-between">
                <span className="text-[15px]">{input.label}</span>
                <span className="text-lg font-medium tracking-[-0.02em] tabular">{input.format(usage[input.key])}</span>
              </span>
              <input
                type="range"
                min={input.min}
                max={input.max}
                step={input.step}
                value={usage[input.key]}
                onChange={(e) => setUsage((u) => ({ ...u, [input.key]: Number(e.target.value) }))}
                className="mt-3 w-full accent-ink"
              />
            </label>
          ))}
        </div>
        <div className="mt-8 rounded-2xl bg-sunken p-4 font-mono text-xs leading-relaxed text-muted">
          <p>
            products {usage.products} × 150 = {parts.products.toLocaleString("en-US")}
          </p>
          <p>
            experiments {usage.experiments} × 180 = {parts.experiments.toLocaleString("en-US")}
          </p>
          <p>
            channels {usage.channels} × 120 = {parts.channels.toLocaleString("en-US")}
          </p>
          <p>
            ad spend ${usage.spend.toLocaleString("en-US")} ÷ 1,000 × 60 = {parts.spend.toLocaleString("en-US")}
          </p>
          <p className="mt-1 text-ink">≈ {total.toLocaleString("en-US")} agent actions / month</p>
        </div>
      </div>

      <div className="flex flex-col justify-between rounded-[24px] bg-lime p-6 sm:p-8">
        <div>
          <p className="font-mono text-[11px] tracking-wide text-ink/60 uppercase">Recommended plan</p>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={`${plan.id}-${tier?.actions ?? "custom"}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3, ease: EASE }}>
              <p className="mt-2 text-[56px] leading-none font-medium tracking-[-0.05em]">{plan.name}</p>
              <p className="mt-3 text-lg">
                {price === null ? "Custom volume" : price === 0 ? "Free" : `$${price}/mo billed yearly`}
                {tier && <span className="text-ink/60"> · {tier.actions.toLocaleString("en-US")} actions</span>}
              </p>
            </motion.div>
          </AnimatePresence>
          <p className="mt-6 max-w-sm text-sm text-ink/70">
            An estimate from typical usage. Reads, briefs, dashboards and blocked actions are free, so most workspaces use less.
          </p>
        </div>
        <Link href={`#plan-${plan.id}`} className="mt-8 inline-flex h-11 w-fit items-center gap-2 rounded-xl bg-ink px-5 text-[15px] font-medium text-white hover:bg-ink-hover">
          See {plan.name} <ArrowRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}
