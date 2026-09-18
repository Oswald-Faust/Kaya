"use client";

import { useState } from "react";
import { Ban, Check, Hand } from "lucide-react";
import { cn } from "@/lib/cn";
import { useI18n } from "@/i18n/client";

type Mode = "observe" | "suggest" | "copilot" | "autopilot";
type Outcome = "auto" | "ask" | "block";

const MODES: Mode[] = ["observe", "suggest", "copilot", "autopilot"];

// Mirrors the policy engine in src/server/domain/governance/policy.ts.
const ACTIONS: { outcomes: Record<Mode, Outcome> }[] = [
  { outcomes: { observe: "auto", suggest: "auto", copilot: "auto", autopilot: "auto" } },
  { outcomes: { observe: "block", suggest: "auto", copilot: "auto", autopilot: "auto" } },
  { outcomes: { observe: "block", suggest: "auto", copilot: "auto", autopilot: "auto" } },
  { outcomes: { observe: "block", suggest: "ask", copilot: "ask", autopilot: "auto" } },
  { outcomes: { observe: "block", suggest: "ask", copilot: "ask", autopilot: "auto" } },
  { outcomes: { observe: "block", suggest: "ask", copilot: "ask", autopilot: "ask" } },
  { outcomes: { observe: "block", suggest: "block", copilot: "block", autopilot: "block" } },
];

const OUTCOME = {
  auto: { icon: Check, className: "bg-grass-soft text-grass-deep" },
  ask: { icon: Hand, className: "bg-sun-soft text-sun-deep" },
  block: { icon: Ban, className: "bg-sunken text-subtle" },
} as const;

export function AutonomyDial() {
  const { t } = useI18n();
  const d = t.hero.dial;
  const [mode, setMode] = useState<Mode>("copilot");

  return (
    <div className="rounded-3xl border border-line bg-surface p-2 shadow-float">
      <div role="radiogroup" aria-label={d.label} className="grid grid-cols-4 gap-1 rounded-2xl bg-sunken p-1">
        {MODES.map((m) => (
          <button
            key={m}
            role="radio"
            aria-checked={mode === m}
            onClick={() => setMode(m)}
            className={cn(
              "rounded-xl px-1 py-2 text-sm font-medium transition-all",
              mode === m ? "bg-ink text-white shadow-sm" : "text-muted hover:text-ink",
            )}
          >
            {d.modes[m].label}
          </button>
        ))}
      </div>
      <p key={mode} className="animate-feed-in px-3 pt-4 pb-2 text-[15px] text-muted">
        {d.modes[mode].line}
      </p>
      <ul className="divide-y divide-line px-1">
        {ACTIONS.map((action, i) => {
          const outcome = OUTCOME[action.outcomes[mode]];
          const copy = d.actions[i];
          return (
            <li key={copy.label} className="flex items-center gap-3 px-2 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-ink">{copy.label}</p>
                <p className="font-mono text-[10px] text-subtle">{copy.risk}</p>
              </div>
              <span key={mode + copy.label} className={cn("inline-flex w-[92px] animate-feed-in items-center gap-1 rounded-full px-2 py-1 text-xs font-medium", outcome.className)}>
                <outcome.icon className="size-3" />
                {d.outcomes[action.outcomes[mode]]}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
