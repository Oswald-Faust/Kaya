"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Spinner } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { AutonomyMode } from "@/server/domain/types";
import { updateGovernanceAction, type GovernanceState } from "./actions";

const MODES: { id: AutonomyMode; label: string; description: string }[] = [
  { id: "observe", label: "Observe", description: "Reads data and reports. Takes no action, not even drafts." },
  { id: "suggest", label: "Suggest", description: "Creates plans and drafts. Executes nothing." },
  { id: "copilot", label: "Copilot", description: "Prepares everything; publishing and spend wait for your approval." },
  { id: "autopilot", label: "Autopilot", description: "Acts on its own inside the limits below. Sensitive actions still need you." },
];

export interface GovernanceValues {
  autonomyMode: AutonomyMode;
  monthlyBudget: number;
  maxDailySpend: number;
  maxExperimentBudget: number;
  maxAutoIncreasePct: number;
  autoPauseLosers: boolean;
  autoLaunchCampaigns: boolean;
}

export function GovernanceForm({ slug, values, disabled }: { slug: string; values: GovernanceValues; disabled: boolean }) {
  const [state, action] = useActionState<GovernanceState, FormData>(updateGovernanceAction.bind(null, slug), { error: null, saved: false });
  const [mode, setMode] = useState(values.autonomyMode);

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="autonomyMode" value={mode} />
      <fieldset disabled={disabled}>
        <legend className="text-sm font-semibold text-ink">Autonomy mode</legend>
        <div className="mt-2 grid gap-2 md:grid-cols-4" role="radiogroup">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={mode === m.id}
              onClick={() => setMode(m.id)}
              className={cn("rounded-lg border bg-surface p-3 text-left transition-colors disabled:opacity-60", mode === m.id ? "border-ink shadow-[0_0_0_1px_var(--color-ink)]" : "border-line hover:border-line-strong")}
            >
              <span className="flex items-center gap-2 text-sm font-medium text-ink">
                <span className={cn("size-2 rounded-full", mode === m.id ? "bg-agent" : "bg-line-strong")} />
                {m.label}
              </span>
              <span className="mt-1 block text-xs text-muted">{m.description}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset disabled={disabled}>
        <legend className="text-sm font-semibold text-ink">Budget guardrails</legend>
        <p className="mt-0.5 text-xs text-muted">Enforced in application code before every spend action. An approval cannot override a hard cap.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Monthly budget" name="monthlyBudget" defaultValue={values.monthlyBudget} prefix="$" hard />
          <Field label="Max daily ad spend" name="maxDailySpend" defaultValue={values.maxDailySpend} prefix="$" hard />
          <Field label="Max budget per experiment" name="maxExperimentBudget" defaultValue={values.maxExperimentBudget} prefix="$" hard />
          <Field label="Max automatic increase" name="maxAutoIncreasePct" defaultValue={Math.round(values.maxAutoIncreasePct * 100)} suffix="%" />
        </div>
        <div className="mt-4 space-y-2">
          <Toggle name="autoPauseLosers" defaultChecked={values.autoPauseLosers} label="Auto-pause losing campaigns" description="Reducing spend on a loser never waits for approval." />
          <Toggle name="autoLaunchCampaigns" defaultChecked={values.autoLaunchCampaigns} label="Allow Autopilot to launch new paid campaigns" description="Off by default. Scaling existing winners within limits is separate." />
        </div>
      </fieldset>

      <div className="flex items-center justify-end gap-3">
        {state.error && (
          <p role="alert" className="text-sm text-negative">
            {state.error}
          </p>
        )}
        {state.saved && !state.error && (
          <p role="status" className="text-sm text-positive">
            Saved and recorded in the audit log.
          </p>
        )}
        <Save disabled={disabled} />
      </div>
    </form>
  );
}

function Field({ label, name, defaultValue, prefix, suffix, hard }: { label: string; name: string; defaultValue: number; prefix?: string; suffix?: string; hard?: boolean }) {
  return (
    <label className="block">
      <span className="flex items-center gap-1.5 text-xs font-medium text-muted">
        {label}
        {hard && <span className="rounded-sm bg-negative-soft px-1 text-[10px] text-negative">Hard cap</span>}
      </span>
      <span className="mt-1 flex h-9 items-center rounded-md border border-line-strong bg-surface px-2.5 focus-within:border-agent">
        {prefix && <span className="text-sm text-subtle">{prefix}</span>}
        <input name={name} type="number" min={0} step="any" defaultValue={defaultValue} className="h-full min-w-0 flex-1 bg-transparent px-1 text-sm outline-none tabular" />
        {suffix && <span className="text-sm text-subtle">{suffix}</span>}
      </span>
    </label>
  );
}

function Toggle({ name, defaultChecked, label, description }: { name: string; defaultChecked: boolean; label: string; description: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-md px-1 py-1">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="peer sr-only" />
      <span aria-hidden className="relative mt-0.5 h-4 w-7 shrink-0 rounded-full bg-line-strong transition-colors peer-checked:bg-ink peer-focus-visible:outline-2 peer-focus-visible:outline-agent after:absolute after:top-0.5 after:left-0.5 after:size-3 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-3" />
      <span>
        <span className="block text-sm text-ink">{label}</span>
        <span className="block text-xs text-muted">{description}</span>
      </span>
    </label>
  );
}

function Save({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={disabled || pending} className="inline-flex h-8 items-center gap-2 rounded-md bg-ink px-3 text-sm font-medium text-white hover:bg-ink-hover disabled:opacity-60">
      {pending && <Spinner />}
      Save changes
    </button>
  );
}
