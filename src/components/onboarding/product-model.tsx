"use client";

import type { ReactNode } from "react";
import { AlertTriangle, Check, Quote } from "lucide-react";
import { ChannelBadge, ConfidenceBadge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/states";
import { cn } from "@/lib/cn";
import type { ExtractionResult } from "@/server/domain/types";

function formatPlanPrice(price: number | null, period: string | null): string {
  if (price === null) return "Price not shown";
  if (price === 0) return "Free";
  return `$${Number.isInteger(price) ? price : price.toFixed(2)}${period === "year" ? "/yr" : period === "one_time" ? "" : "/mo"}`;
}

/**
 * The living product model. Blocks fill in as the analysis produces them;
 * empty findings are shown as honest "not found" states, never invented.
 */
export function ProductModel({ extraction: x, partial }: { extraction: ExtractionResult | null; partial: boolean }) {
  const name = x?.productName.value;
  return (
    <div className="space-y-3">
      <Block ready={Boolean(x)} label="Identity" className="p-5">
        {x && (
          <div className="flex items-start gap-4">
            <Mark name={name || "?"} logo={x.logoUrl} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <h2 className="text-xl font-semibold tracking-tight">{name || "Unnamed product"}</h2>
                {x.category.value && (
                  <span className="inline-flex items-center gap-2 text-xs text-muted">
                    {x.category.value} <ConfidenceBadge value={x.category.confidence} />
                  </span>
                )}
              </div>
              {x.oneLiner.value ? <p className="mt-1.5 text-base text-ink/85">{x.oneLiner.value}</p> : <NotFound>No clear one-line description on the site.</NotFound>}
            </div>
          </div>
        )}
      </Block>

      <div className="grid gap-3 md:grid-cols-2">
        <Block ready={Boolean(x)} label="Value proposition">
          {x &&
            (x.valueProposition.value ? (
              <>
                <p className="flex gap-2 text-base font-medium text-ink">
                  <Quote className="mt-1 size-3.5 shrink-0 text-subtle" aria-hidden />
                  {x.valueProposition.value}
                </p>
                <Meta confidence={x.valueProposition.confidence} evidence={x.valueProposition.evidence} />
              </>
            ) : (
              <NotFound>Your headline doesn&apos;t state a clear benefit. Strategy will propose one.</NotFound>
            ))}
        </Block>

        <Block ready={Boolean(x)} label="Who we think buys">
          {x &&
            (x.audiences.length ? (
              <ul className="space-y-2.5">
                {x.audiences.map((a, i) => (
                  <li key={a.name}>
                    <div className="flex items-center justify-between gap-3">
                      <p className={cn("text-sm", i === 0 ? "font-semibold text-ink" : "text-ink")}>
                        {i === 0 && <span className="mr-1.5 text-2xs font-medium text-agent">Primary</span>}
                        {a.name}
                      </p>
                      <ConfidenceBadge value={a.confidence} />
                    </div>
                    {a.evidence && <p className="mt-0.5 truncate text-xs text-muted">“{a.evidence}”</p>}
                  </li>
                ))}
              </ul>
            ) : (
              <NotFound>No audience is named on the site.</NotFound>
            ))}
        </Block>

        <Block ready={Boolean(x)} label="Core features">
          {x &&
            (x.features.length ? (
              <ul className="space-y-1.5">
                {x.features.map((f) => (
                  <li key={f.value} className="flex items-start gap-2 text-sm text-ink">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-positive" aria-hidden />
                    <span className="min-w-0 flex-1">{f.value}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <NotFound>No feature list found.</NotFound>
            ))}
        </Block>

        <Block ready={Boolean(x)} label="Pricing">
          {x && (
            <>
              <p className="text-sm font-medium text-ink">{x.pricing.model.value}</p>
              {x.pricing.plans.length > 0 ? (
                <table className="mt-2 w-full text-sm">
                  <tbody className="divide-y divide-line">
                    {x.pricing.plans.map((p) => (
                      <tr key={p.name}>
                        <td className="py-1.5 text-ink">{p.name}</td>
                        <td className="py-1.5 text-right text-ink tabular">{formatPlanPrice(p.price, p.period)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <NotFound>No prices found. You can add them in review.</NotFound>
              )}
              {x.pricing.freeTrial && <p className="mt-2 text-xs text-muted">Free trial: “{x.pricing.freeTrial.evidence ?? "yes"}”</p>}
            </>
          )}
        </Block>

        <Block ready={Boolean(x)} label="Likely competitors">
          {x &&
            (x.competitors.length ? (
              <ul className="space-y-2">
                {x.competitors.map((c) => (
                  <li key={c.name} className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm text-ink">{c.name}</p>
                      <p className="truncate text-xs text-muted">{c.reason}</p>
                    </div>
                    <ConfidenceBadge value={c.confidence} />
                  </li>
                ))}
              </ul>
            ) : (
              <NotFound>No competitors named on the site. Add the ones buyers compare you with.</NotFound>
            ))}
        </Block>

        <Block ready={Boolean(x)} label="Voice and existing channels">
          {x && (
            <>
              {x.brand.traits.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {x.brand.traits.map((trait) => (
                    <span key={trait} className="rounded-sm bg-sunken px-1.5 py-0.5 text-xs text-ink">
                      {trait}
                    </span>
                  ))}
                </div>
              )}
              {x.brand.voiceSummary && <p className="mt-1.5 text-xs text-muted">{x.brand.voiceSummary}</p>}
              <div className="mt-3 border-t border-line pt-2.5">
                {x.channels.length ? (
                  <ul className="space-y-1.5">
                    {x.channels.map((c) => (
                      <li key={c.channel} className="flex items-center justify-between gap-3">
                        <ChannelBadge channel={c.channel} />
                        <span className="truncate text-xs text-muted">{c.signal}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <NotFound>No existing acquisition channels detected.</NotFound>
                )}
              </div>
            </>
          )}
        </Block>
      </div>

      {x && x.warnings.length > 0 && (
        <div className="rounded-lg border border-warning/25 bg-warning-soft px-4 py-3">
          <p className="flex items-center gap-2 text-sm font-medium text-warning">
            <AlertTriangle className="size-4" /> Worth knowing
          </p>
          <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-sm text-ink/80">
            {x.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      )}
      {partial && x && <p className="text-xs text-subtle">Still working. Findings update as more of the site is read.</p>}
    </div>
  );
}

function Block({ ready, label, children, className }: { ready: boolean; label: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-lg border border-line bg-surface p-4", ready && "animate-rise", className)}>
      <p className="mb-2.5 text-2xs font-medium text-subtle">{label}</p>
      {ready ? (
        children
      ) : (
        <div className="space-y-2" aria-hidden>
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
        </div>
      )}
    </div>
  );
}

function Meta({ confidence, evidence }: { confidence: number; evidence?: string }) {
  return (
    <div className="mt-2 flex items-center gap-3">
      <ConfidenceBadge value={confidence} />
      {evidence && <span className="truncate text-xs text-muted">Source: “{evidence}”</span>}
    </div>
  );
}

function NotFound({ children }: { children: ReactNode }) {
  return <p className="text-sm text-subtle">{children}</p>;
}

function Mark({ name, logo }: { name: string; logo: string | null }) {
  if (logo) {
    // eslint-disable-next-line @next/next/no-img-element -- external favicon from the analyzed site; not optimizable
    return <img src={logo} alt="" referrerPolicy="no-referrer" className="size-11 shrink-0 rounded-lg border border-line bg-surface object-contain p-1.5" />;
  }
  return <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-ink text-lg font-semibold text-white">{name.slice(0, 1).toUpperCase()}</span>;
}
