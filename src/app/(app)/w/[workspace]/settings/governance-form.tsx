"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Spinner } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { useI18n } from "@/i18n/client";
import type { AutonomyMode } from "@/server/domain/types";
import { updateGovernanceAction, type GovernanceState } from "./actions";

const MODES: AutonomyMode[] = ["observe", "suggest", "copilot", "autopilot"];

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
  const { t } = useI18n();
  const a = t.settings.agent;

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="autonomyMode" value={mode} />
      <fieldset disabled={disabled}>
        <legend className="text-sm font-semibold text-ink">{a.autonomy}</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2" role="radiogroup">
          {MODES.map((m) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={mode === m}
              onClick={() => setMode(m)}
              className={cn("rounded-lg border bg-surface p-3 text-left transition-colors disabled:opacity-60", mode === m ? "border-ink shadow-[0_0_0_1px_var(--color-ink)]" : "border-line hover:border-line-strong")}
            >
              <span className="flex items-center gap-2 text-sm font-medium text-ink">
                <span className={cn("size-2 rounded-full", mode === m ? "bg-agent" : "bg-line-strong")} />
                {a.modes[m].label}
              </span>
              <span className="mt-1 block text-xs text-muted">{a.modes[m].description}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset disabled={disabled}>
        <legend className="text-sm font-semibold text-ink">{a.guardrails}</legend>
        <p className="mt-0.5 text-xs text-muted">{a.guardrailsHint}</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label={a.monthlyBudget} name="monthlyBudget" defaultValue={values.monthlyBudget} prefix="$" hard={a.hardCap} />
          <Field label={a.maxDailySpend} name="maxDailySpend" defaultValue={values.maxDailySpend} prefix="$" hard={a.hardCap} />
          <Field label={a.maxExperimentBudget} name="maxExperimentBudget" defaultValue={values.maxExperimentBudget} prefix="$" hard={a.hardCap} />
          <Field label={a.maxAutoIncrease} name="maxAutoIncreasePct" defaultValue={Math.round(values.maxAutoIncreasePct * 100)} suffix="%" />
        </div>
        <div className="mt-4 space-y-2">
          <Toggle name="autoPauseLosers" defaultChecked={values.autoPauseLosers} label={a.autoPause} description={a.autoPauseHint} />
          <Toggle name="autoLaunchCampaigns" defaultChecked={values.autoLaunchCampaigns} label={a.autoLaunch} description={a.autoLaunchHint} />
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
            {t.common.saved}
          </p>
        )}
        <Save disabled={disabled} />
      </div>
    </form>
  );
}

function Field({ label, name, defaultValue, prefix, suffix, hard }: { label: string; name: string; defaultValue: number; prefix?: string; suffix?: string; hard?: string }) {
  return (
    <label className="block">
      <span className="flex items-center gap-1.5 text-xs font-medium text-muted">
        {label}
        {hard && <span className="rounded-sm bg-negative-soft px-1 text-[10px] text-negative">{hard}</span>}
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
  const { t } = useI18n();
  return (
    <button type="submit" disabled={disabled || pending} className="inline-flex h-8 items-center gap-2 rounded-md bg-ink px-3 text-sm font-medium text-white hover:bg-ink-hover disabled:opacity-60">
      {pending && <Spinner />}
      {t.settings.agent.saveChanges}
    </button>
  );
}
