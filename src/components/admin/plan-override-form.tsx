"use client";

import { useActionState } from "react";
import { Check, TriangleAlert } from "lucide-react";
import type { AdminResult } from "@/app/admin/actions";
import { buttonClass, Spinner } from "@/components/ui/button";

type Org = { plan: string; planStatus: string; planInterval: string | null; planActions: number | null; trialEndsAt: Date | null; stripeSubscriptionId: string | null };

const field = "h-9 w-full rounded-lg border border-line bg-surface px-2.5 text-sm outline-none focus:border-ink";

export function PlanOverrideForm({ org, action }: { org: Org; action: (prev: AdminResult | null, form: FormData) => Promise<AdminResult> }) {
  const [state, formAction, pending] = useActionState(action, null);
  return (
    <form action={formAction} className="space-y-3 p-5">
      <div className="grid grid-cols-2 gap-3">
        <label className="space-y-1 text-xs text-muted">
          Plan
          <select name="plan" defaultValue={org.plan} className={field}>
            {["none", "free", "launch", "growth", "scale"].map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-xs text-muted">
          Status
          <select name="planStatus" defaultValue={org.planStatus} className={field}>
            {["none", "trialing", "active", "past_due", "canceled"].map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-xs text-muted">
          Billing
          <select name="planInterval" defaultValue={org.planInterval ?? ""} className={field}>
            <option value="">—</option>
            <option value="month">month</option>
            <option value="year">year</option>
          </select>
        </label>
        <label className="space-y-1 text-xs text-muted">
          Agent actions / mo
          <input name="planActions" type="number" min={0} defaultValue={org.planActions ?? ""} className={field} />
        </label>
        <label className="col-span-2 space-y-1 text-xs text-muted">
          Trial ends
          <input name="trialEndsAt" type="datetime-local" defaultValue={org.trialEndsAt ? new Date(org.trialEndsAt.getTime() - org.trialEndsAt.getTimezoneOffset() * 60_000).toISOString().slice(0, 16) : ""} className={field} />
        </label>
      </div>
      {org.stripeSubscriptionId && <p className="rounded-lg bg-warning-soft px-3 py-2 text-xs text-warning">This organization is billed by Stripe. The next Stripe event will overwrite a manual override.</p>}
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className={buttonClass("primary", "md")}>
          {pending && <Spinner />}
          Save plan
        </button>
        {state && (
          <span role="status" className={`flex items-center gap-1 text-xs ${state.ok ? "text-positive" : "text-negative"}`}>
            {state.ok ? <Check className="size-3.5" /> : <TriangleAlert className="size-3.5" />}
            {state.ok ? state.message : state.error}
          </span>
        )}
      </div>
    </form>
  );
}
