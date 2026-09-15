import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { channelLabel } from "@/server/domain/channels";
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

const STATUS: Record<ExperimentStatus, { label: string; tone: Tone; live?: boolean }> = {
  idea: { label: "Idea", tone: "outline" },
  proposed: { label: "Proposed", tone: "outline" },
  awaiting_approval: { label: "Awaiting approval", tone: "warning" },
  scheduled: { label: "Scheduled", tone: "neutral" },
  running: { label: "Running", tone: "agent", live: true },
  evaluating: { label: "Evaluating", tone: "agent" },
  completed: { label: "Completed", tone: "neutral" },
  archived: { label: "Archived", tone: "neutral" },
  suppressed: { label: "Suppressed", tone: "neutral" },
};

const OUTCOME: Record<ExperimentOutcome, { label: string; tone: Tone }> = {
  winner: { label: "Winner", tone: "positive" },
  loser: { label: "Loser", tone: "negative" },
  inconclusive: { label: "Inconclusive", tone: "neutral" },
};

export function StatusBadge({ status, outcome }: { status: ExperimentStatus; outcome?: ExperimentOutcome | null }) {
  if (status === "completed" && outcome) {
    const o = OUTCOME[outcome];
    return <Badge tone={o.tone}>{o.label}</Badge>;
  }
  const s = STATUS[status];
  return (
    <Badge tone={s.tone}>
      {s.live && <span className="size-1.5 rounded-full bg-agent animate-pulse-dot" aria-hidden />}
      {s.label}
    </Badge>
  );
}

/** Confidence as a compact 5-segment meter plus the number. */
export function ConfidenceBadge({ value, label = "confidence" }: { value: number; label?: string }) {
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

const CHANNEL_GLYPH: Record<string, string> = {
  google_search: "G",
  seo_content: "S",
  reddit: "R",
  hacker_news: "Y",
  x_organic: "X",
  linkedin: "in",
  meta_ads: "M",
  youtube_creators: "▶",
  email_lifecycle: "@",
  tiktok: "T",
};

export function ChannelBadge({ channel, className }: { channel: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs text-muted whitespace-nowrap", className)}>
      <span
        aria-hidden
        className="grid size-4 place-items-center rounded-sm border border-line bg-surface text-[9px] font-semibold text-ink"
      >
        {CHANNEL_GLYPH[channel] ?? "·"}
      </span>
      {channelLabel(channel)}
    </span>
  );
}

const RISK: Record<RiskClass, { label: string; tone: Tone }> = {
  R0: { label: "R0 Read", tone: "outline" },
  R1: { label: "R1 Draft", tone: "outline" },
  R2: { label: "R2 Publish", tone: "warning" },
  R3: { label: "R3 Spend", tone: "warning" },
  R4: { label: "R4 Sensitive", tone: "negative" },
};

export function RiskBadge({ risk }: { risk: RiskClass }) {
  return <Badge tone={RISK[risk].tone}>{RISK[risk].label}</Badge>;
}

export function DemoBadge() {
  return (
    <Badge tone="outline" className="border-dashed">
      Demo data
    </Badge>
  );
}
