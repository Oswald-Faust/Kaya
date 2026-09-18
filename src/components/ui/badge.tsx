"use client";

import type { ReactNode } from "react";
import { BrandIcon, type BrandName } from "@/components/brand/brand-logos";
import { cn } from "@/lib/cn";
import { useI18n } from "@/i18n/client";
import type { ExperimentOutcome, ExperimentStatus, RiskClass } from "@/server/domain/types";

type Tone = "neutral" | "agent" | "positive" | "negative" | "warning" | "outline";

const tones: Record<Tone, string> = {
  neutral: "bg-sunken text-muted",
  agent: "bg-agent-soft text-agent",
  positive: "bg-positive-soft text-positive",
  negative: "bg-negative-soft text-negative",
  warning: "bg-warning-soft text-warning",
  outline: "border border-line text-muted",
};

export function Badge({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 shrink-0 items-center gap-1 rounded-sm px-1.5 text-2xs font-medium whitespace-nowrap",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

const STATUS: Record<ExperimentStatus, { tone: Tone; live?: boolean }> = {
  idea: { tone: "outline" },
  proposed: { tone: "outline" },
  awaiting_approval: { tone: "warning" },
  scheduled: { tone: "neutral" },
  running: { tone: "agent", live: true },
  evaluating: { tone: "agent" },
  completed: { tone: "neutral" },
  archived: { tone: "neutral" },
  suppressed: { tone: "neutral" },
};

const OUTCOME: Record<ExperimentOutcome, Tone> = { winner: "positive", loser: "negative", inconclusive: "neutral" };

export function StatusBadge({ status, outcome }: { status: ExperimentStatus; outcome?: ExperimentOutcome | null }) {
  const { t } = useI18n();
  if (status === "completed" && outcome) {
    return <Badge tone={OUTCOME[outcome]}>{t.ui.outcome[outcome]}</Badge>;
  }
  const s = STATUS[status];
  return (
    <Badge tone={s.tone}>
      {s.live && <span className="size-1.5 rounded-full bg-agent animate-pulse-dot" aria-hidden />}
      {t.ui.status[status]}
    </Badge>
  );
}

/** Confidence as a compact 5-segment meter plus the number. */
export function ConfidenceBadge({ value, label: custom }: { value: number; label?: string }) {
  const { t } = useI18n();
  const label = custom ?? t.ui.confidence;
  const filled = Math.round(value * 5);
  const tone = value >= 0.75 ? "bg-ink" : value >= 0.5 ? "bg-muted" : "bg-subtle";
  return (
    <span className="inline-flex items-center gap-1.5 text-2xs text-muted tabular" title={`${Math.round(value * 100)}% ${label}`}>
      <span className="flex gap-px" aria-hidden>
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className={cn("h-2.5 w-[3px] rounded-[1px]", i < filled ? tone : "bg-line")} />
        ))}
      </span>
      {Math.round(value * 100)}%
      <span className="sr-only">{label}</span>
    </span>
  );
}

/** Channels that belong to a platform show that platform's logo. */
const CHANNEL_BRAND: Record<string, BrandName> = {
  google_search: "googleads",
  reddit: "reddit",
  hacker_news: "hackernews",
  x_organic: "x",
  linkedin: "linkedin",
  meta_ads: "meta",
  youtube_creators: "youtube",
  tiktok: "tiktok",
  product_hunt: "producthunt",
  instagram: "instagram",
  discord: "discord",
};

/** The rest are surfaces the founder owns, so they keep a letter. */
const CHANNEL_GLYPH: Record<string, string> = {
  seo_content: "S",
  email_lifecycle: "@",
};

export function ChannelBadge({ channel, className }: { channel: string; className?: string }) {
  const { t } = useI18n();
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs text-muted whitespace-nowrap", className)}>
      <span aria-hidden className="grid size-4 shrink-0 place-items-center rounded-sm border border-line bg-surface text-[9px] font-semibold text-ink">
        {CHANNEL_BRAND[channel] ? <BrandIcon brand={CHANNEL_BRAND[channel]} className="size-2.5" /> : (CHANNEL_GLYPH[channel] ?? "·")}
      </span>
      {t.common.channels[channel] ?? channel}
    </span>
  );
}

const RISK: Record<RiskClass, Tone> = { R0: "outline", R1: "outline", R2: "warning", R3: "warning", R4: "negative" };

export function RiskBadge({ risk }: { risk: RiskClass }) {
  const { t } = useI18n();
  return <Badge tone={RISK[risk]}>{t.ui.risk[risk]}</Badge>;
}

export function DemoBadge() {
  const { t } = useI18n();
  return (
    <Badge tone="outline" className="border-dashed">
      {t.common.demoData}
    </Badge>
  );
}
