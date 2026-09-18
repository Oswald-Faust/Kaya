"use client";

import { useState } from "react";
import { Check, ShieldCheck, Sparkles, AlertCircle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { TONE_CARD, TONE_TILE, type Tone } from "./nav-data";

interface InteractiveWorkflowMockProps {
  title: string;
  tag: string;
  status: string;
  tone: Tone;
  items: { label: string; value: string; hint?: string }[];
  actionLabel: string;
}

export function InteractiveWorkflowMock({
  title,
  tag,
  status,
  tone,
  items,
  actionLabel,
}: InteractiveWorkflowMockProps) {
  const [executed, setExecuted] = useState(false);
  const [activeItem, setActiveItem] = useState<number | null>(null);

  return (
    <div className="relative mx-auto w-full max-w-3xl overflow-hidden rounded-[24px] border border-line bg-surface shadow-float">
      {/* Top Header / Mac Frame */}
      <div className="flex items-center justify-between border-b border-line bg-cream/70 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-line-strong" />
          <span className="size-2.5 rounded-full bg-line-strong" />
          <span className="size-2.5 rounded-full bg-line-strong" />
          <span className="ml-2 font-mono text-[11px] text-muted tracking-tight">agent.kaya.local / workflow</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-0.5 text-[11px] font-mono font-medium text-ink shadow-2xs border border-line/60">
            <ShieldCheck className="size-3 text-grass-deep" />
            {tag}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-lime px-2.5 py-0.5 text-[11px] font-mono font-medium text-ink">
            <span className="size-1.5 rounded-full bg-ink animate-pulse" />
            {executed ? "Exécuté avec succès" : status}
          </span>
        </div>
      </div>

      {/* Main Content Pane */}
      <div className="p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid size-7 place-items-center rounded-lg bg-agent-soft text-agent">
                <Sparkles className="size-4" />
              </span>
              <h3 className="text-xl font-medium tracking-tight text-ink">{title}</h3>
            </div>
            <p className="mt-1 font-mono text-xs text-muted">
              Gouvernance appliquée · Éléments déterministes vérifiés
            </p>
          </div>
          <button
            type="button"
            onClick={() => setExecuted(!executed)}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-medium transition-all shadow-sm",
              executed
                ? "bg-grass text-white"
                : "bg-ink text-white hover:bg-ink-hover active:scale-[0.98]"
            )}
          >
            {executed ? (
              <>
                <Check className="size-3.5" />
                Action validée et archivée
              </>
            ) : (
              <>
                <ArrowRight className="size-3.5" />
                {actionLabel}
              </>
            )}
          </button>
        </div>

        {/* Fact / Step Cards */}
        <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
          {items.map((item, idx) => (
            <div
              key={idx}
              onMouseEnter={() => setActiveItem(idx)}
              onMouseLeave={() => setActiveItem(null)}
              className={cn(
                "rounded-xl border p-3.5 transition-all",
                activeItem === idx
                  ? "border-line-strong bg-raised shadow-2xs"
                  : "border-line/70 bg-cream/40"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-wider text-muted">{item.label}</span>
                {item.hint && (
                  <span className="font-mono text-[10px] rounded bg-white px-1.5 py-0.5 text-subtle border border-line/40">
                    {item.hint}
                  </span>
                )}
              </div>
              <p className="mt-1.5 text-sm font-medium text-ink leading-snug">{item.value}</p>
            </div>
          ))}
        </div>

        {/* Policy Notice Footer */}
        <div className="mt-6 flex items-center justify-between rounded-xl bg-sunken/60 px-4 py-2.5 text-xs text-muted border border-line/50">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-3.5 text-subtle" />
            <span>Aucune action externe n&apos;est mutée sans passage des tests de politique financière.</span>
          </div>
          <span className="hidden font-mono text-[10px] text-subtle sm:inline">SHA-256 Vérifié</span>
        </div>
      </div>
    </div>
  );
}
