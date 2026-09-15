"use client";

import { useState } from "react";
import { Ban, Check, Hand } from "lucide-react";
import { cn } from "@/lib/cn";

type Mode = "observe" | "suggest" | "copilot" | "autopilot";
type Outcome = "auto" | "ask" | "block";

const MODES: { id: Mode; label: string; line: string }[] = [
  { id: "observe", label: "Observe", line: "Reads and reports. Touches nothing." },
  { id: "suggest", label: "Suggest", line: "Prepares the work. You press go." },
  { id: "copilot", label: "Copilot", line: "Drafts and cuts losers on its own. Asks before publishing or spending." },
  { id: "autopilot", label: "Autopilot", line: "Acts inside your guardrails. Still asks for anything sensitive." },
];

// Mirrors the policy engine in src/server/domain/governance/policy.ts.
const ACTIONS: { label: string; risk: string; outcomes: Record<Mode, Outcome> }[] = [
  { label: "Analyze metrics and write the brief", risk: "R0 · Read", outcomes: { observe: "auto", suggest: "auto", copilot: "auto", autopilot: "auto" } },
  { label: "Draft ad copy and landing pages", risk: "R1 · Draft", outcomes: { observe: "block", suggest: "auto", copilot: "auto", autopilot: "auto" } },
  { label: "Pause an ad that is losing money", risk: "R3 · Spend down", outcomes: { observe: "block", suggest: "auto", copilot: "auto", autopilot: "auto" } },
  { label: "Publish an SEO page", risk: "R2 · Publish", outcomes: { observe: "block", suggest: "ask", copilot: "ask", autopilot: "auto" } },
  { label: "Raise a budget up to +20%", risk: "R3 · Spend", outcomes: { observe: "block", suggest: "ask", copilot: "ask", autopilot: "auto" } },
  { label: "Launch a new paid campaign", risk: "R3 · Spend", outcomes: { observe: "block", suggest: "ask", copilot: "ask", autopilot: "ask" } },
  { label: "Spend past your monthly cap", risk: "Hard limit", outcomes: { observe: "block", suggest: "block", copilot: "block", autopilot: "block" } },
];

const OUTCOME = {
  auto: { label: "Runs", icon: Check, className: "bg-grass-soft text-grass-deep" },
  ask: { label: "Asks you", icon: Hand, className: "bg-sun-soft text-sun-deep" },
  block: { label: "Blocked", icon: Ban, className: "bg-sunken text-subtle" },
} as const;

export function AutonomyDial() {
  const [mode, setMode] = useState<Mode>("copilot");
  const current = MODES.find((m) => m.id === mode)!;

  return (
    <div className="rounded-3xl border border-line bg-surface p-2 shadow-float">
      <div role="radiogroup" aria-label="Autonomy mode" className="grid grid-cols-4 gap-1 rounded-2xl bg-sunken p-1">
        {MODES.map((m) => (
          <button
            key={m.id}
            role="radio"
            aria-checked={mode === m.id}
            onClick={() => setMode(m.id)}
            className={cn(
              "rounded-xl px-1 py-2 text-sm font-medium transition-all",
              mode === m.id ? "bg-ink text-white shadow-sm" : "text-muted hover:text-ink",
            )}
          >
            {m.label}
          </button>
        ))}
      </div>
      <p key={mode} className="animate-feed-in px-3 pt-4 pb-2 text-[15px] text-muted">
        {current.line}
      </p>
      <ul className="divide-y divide-line px-1">
        {ACTIONS.map((action) => {
          const outcome = OUTCOME[action.outcomes[mode]];
          return (
            <li key={action.label} className="flex items-center gap-3 px-2 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-ink">{action.label}</p>
                <p className="font-mono text-[10px] text-subtle">{action.risk}</p>
              </div>
              <span key={mode + action.label} className={cn("inline-flex w-[92px] animate-feed-in items-center gap-1 rounded-full px-2 py-1 text-xs font-medium", outcome.className)}>
                <outcome.icon className="size-3" />
                {outcome.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
