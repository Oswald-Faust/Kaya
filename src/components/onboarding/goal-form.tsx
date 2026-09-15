"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { saveGoalAction, type FormState } from "@/app/(onboarding)/start/actions";
import { Spinner } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { BUDGET_BANDS, GOAL_TEMPLATES, goalTitle } from "@/server/domain/strategy/goals";

const DEADLINES = [
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
  { days: 180, label: "6 months" },
  { days: 365, label: "12 months" },
];

interface Initial {
  template: string;
  baseline: number | null;
  target: number | null;
  budgetBand: string;
  monthlyBudget: number;
}

export function GoalForm({ slug, initial, today }: { slug: string; initial: Initial | null; today: string }) {
  const [state, action] = useActionState<FormState, FormData>(saveGoalAction.bind(null, slug), { error: null });
  const [templateId, setTemplateId] = useState(initial?.template ?? "first_customers");
  const [baseline, setBaseline] = useState(initial?.baseline !== null && initial?.baseline !== undefined ? String(initial.template === "trial_conversion" ? initial.baseline * 100 : initial.baseline) : "");
  const [target, setTarget] = useState(initial?.target !== null && initial?.target !== undefined ? String(initial.template === "trial_conversion" ? initial.target * 100 : initial.target) : "");
  const [deadline, setDeadline] = useState(90);
  const [band, setBand] = useState(initial?.budgetBand ?? "lt_250");
  const [customBudget, setCustomBudget] = useState(initial?.budgetBand === "custom" ? String(initial.monthlyBudget) : "");
  const [customText, setCustomText] = useState("");

  const template = GOAL_TEMPLATES.find((t) => t.id === templateId)!;
  const pct = template.unit === "pct";
  const prefix = template.unit === "usd" ? "$" : "";
  const suffix = pct ? "%" : "";
  const n = (v: string) => (v.trim() === "" ? null : Number(v) / (pct ? 100 : 1));
  const budget = BUDGET_BANDS.find((b) => b.id === band)?.monthly ?? (customBudget ? Number(customBudget) : null);
  const title = goalTitle(template, n(baseline) ?? template.baseline, n(target) ?? template.target, customText);
  const byDate = new Date(Date.parse(`${today}T00:00:00Z`) + deadline * 86_400_000).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });

  return (
    <form action={action} className="mt-6 space-y-8">
      <input type="hidden" name="template" value={templateId} />
      <input type="hidden" name="budgetBand" value={band} />
      <input type="hidden" name="deadlineDays" value={deadline} />

      <fieldset>
        <legend className="text-sm font-semibold text-ink">Outcome</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2" role="radiogroup">
          {GOAL_TEMPLATES.map((t) => {
            const active = t.id === templateId;
            return (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => {
                  setTemplateId(t.id);
                  setTarget(t.target !== null ? String(t.unit === "pct" ? t.target * 100 : t.target) : "");
                  setBaseline("");
                }}
                className={cn(
                  "flex items-start gap-3 rounded-lg border bg-surface px-3.5 py-3 text-left transition-colors",
                  active ? "border-ink shadow-[0_0_0_1px_var(--color-ink)]" : "border-line hover:border-line-strong",
                )}
              >
                <span className={cn("mt-1 grid size-3.5 shrink-0 place-items-center rounded-full border", active ? "border-ink" : "border-line-strong")}>
                  {active && <span className="size-1.5 rounded-full bg-ink" />}
                </span>
                <span>
                  <span className="block text-sm font-medium text-ink">{t.label}</span>
                  <span className="block text-xs text-muted">{t.description}</span>
                </span>
              </button>
            );
          })}
        </div>

        {(template.asksBaseline || template.asksTarget || template.id === "custom" || template.id === "new_market") && (
          <div className="mt-3 grid gap-3 rounded-lg border border-line bg-surface p-4 sm:grid-cols-2">
            {template.asksBaseline && (
              <NumberField label={template.metric === "mrr" ? "MRR today" : template.metric === "cac" ? "CAC today" : pct ? "Conversion today" : "Today"} name="baseline" value={baseline} onChange={setBaseline} prefix={prefix} suffix={suffix} hint="Leave empty if you don't know. We'll measure it." />
            )}
            {template.asksTarget && <NumberField label="Target" name="target" value={target} onChange={setTarget} prefix={prefix} suffix={suffix} />}
            {(template.id === "custom" || template.id === "new_market") && (
              <label className="block sm:col-span-2">
                <span className="text-xs font-medium text-muted">{template.id === "custom" ? "Describe the goal" : "Which market?"}</span>
                <input
                  name="customText"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder={template.id === "custom" ? "e.g. Get 5 agencies on the annual plan" : "e.g. Germany, or HR teams"}
                  className="mt-1 h-9 w-full rounded-md border border-line-strong px-2.5 text-sm outline-none focus:border-agent"
                />
              </label>
            )}
          </div>
        )}
      </fieldset>

      <fieldset>
        <legend className="text-sm font-semibold text-ink">By when</legend>
        <Chips options={DEADLINES.map((d) => ({ id: String(d.days), label: d.label }))} value={String(deadline)} onChange={(v) => setDeadline(Number(v))} />
      </fieldset>

      <fieldset>
        <legend className="text-sm font-semibold text-ink">Monthly marketing budget</legend>
        <p className="mt-0.5 text-xs text-muted">Enforced in code: daily spend caps and per-experiment limits are derived from it, whatever the agent recommends.</p>
        <Chips options={BUDGET_BANDS.map((b) => ({ id: b.id, label: b.label }))} value={band} onChange={setBand} />
        {band === "custom" && (
          <div className="mt-3 max-w-xs">
            <NumberField label="Budget per month" name="customBudget" value={customBudget} onChange={setCustomBudget} prefix="$" />
          </div>
        )}
      </fieldset>

      <div className="rounded-lg border border-line bg-surface p-4">
        <p className="text-2xs font-medium text-subtle">Your goal</p>
        <p className="mt-1 text-lg font-semibold tracking-tight text-ink">
          {title} by {byDate}
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
          <ShieldCheck className="size-4 text-positive" />
          {budget === null ? "Enter a budget." : budget === 0 ? "Organic only: the agent can't spend money." : `Up to $${budget.toLocaleString("en-US")}/month, max $${Math.round(budget / 20)}/day, max $${Math.round(budget * 0.4)} per experiment.`}
        </p>
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-negative">
          {state.error}
        </p>
      )}
      <div className="flex justify-end">
        <Submit />
      </div>
    </form>
  );
}

function Chips({ options, value, onChange }: { options: { id: string; label: string }[]; value: string; onChange: (id: string) => void }) {
  return (
    <div className="mt-2 flex flex-wrap gap-2" role="radiogroup">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={o.id === value}
          onClick={() => onChange(o.id)}
          className={cn("h-8 rounded-md border px-3 text-sm transition-colors", o.id === value ? "border-ink bg-ink text-white" : "border-line-strong bg-surface text-ink hover:bg-raised")}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function NumberField({ label, name, value, onChange, prefix, suffix, hint }: { label: string; name: string; value: string; onChange: (v: string) => void; prefix?: string; suffix?: string; hint?: string }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted">{label}</span>
      <span className="mt-1 flex h-9 items-center rounded-md border border-line-strong bg-surface px-2.5 focus-within:border-agent">
        {prefix && <span className="text-sm text-subtle">{prefix}</span>}
        <input name={name} inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value.replace(/[^\d.]/g, ""))} className="h-full min-w-0 flex-1 bg-transparent px-1 text-sm outline-none tabular" />
        {suffix && <span className="text-sm text-subtle">{suffix}</span>}
      </span>
      {hint && <span className="mt-1 block text-2xs text-subtle">{hint}</span>}
    </label>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="inline-flex h-9 items-center gap-2 rounded-md bg-ink px-4 text-sm font-medium text-white hover:bg-ink-hover disabled:opacity-70">
      {pending && <Spinner />}
      Continue to data <ArrowRight className="size-4" />
    </button>
  );
}
