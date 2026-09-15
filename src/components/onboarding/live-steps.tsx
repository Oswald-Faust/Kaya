"use client";

import { Check, Minus, X } from "lucide-react";
import { cn } from "@/lib/cn";
import type { PolledStep } from "./use-run-poll";

/** Progressive checklist of real run steps, with the next expected step shown as in progress. */
export function LiveSteps({ steps, running, upcoming }: { steps: PolledStep[]; running: boolean; upcoming: string[] }) {
  const pending = running ? upcoming.filter((u) => !steps.some((s) => s.title.toLowerCase().startsWith(u.toLowerCase().slice(0, 12)))) : [];
  const hasRunningStep = steps.some((s) => s.status === "running");

  return (
    <ol className="space-y-0.5" aria-live="polite">
      {steps.map((s) => (
        <li key={s.id} className="grid animate-rise grid-cols-[20px_minmax(0,1fr)] gap-2.5 py-1.5">
          <StepIcon status={s.status} />
          <div className="min-w-0">
            <p className={cn("text-sm", s.status === "failed" ? "text-negative" : s.status === "skipped" ? "text-subtle" : "text-ink")}>{s.title}</p>
            {s.detail && <p className="mt-0.5 line-clamp-2 text-xs text-muted">{s.detail}</p>}
          </div>
        </li>
      ))}
      {!hasRunningStep && pending[0] && (
        <li className="grid grid-cols-[20px_minmax(0,1fr)] gap-2.5 py-1.5">
          <StepIcon status="running" />
          <p className="text-sm text-muted">{pending[0]}…</p>
        </li>
      )}
      {pending.slice(hasRunningStep ? 0 : 1, 4).map((u) => (
        <li key={u} className="grid grid-cols-[20px_minmax(0,1fr)] gap-2.5 py-1.5">
          <span aria-hidden className="mt-1.5 ml-1.5 size-1.5 rounded-full bg-line-strong" />
          <p className="text-sm text-subtle">{u}</p>
        </li>
      ))}
    </ol>
  );
}

function StepIcon({ status }: { status: string }) {
  if (status === "running" || status === "waiting") {
    return (
      <span className="relative mt-0.5 grid size-4 place-items-center" aria-label="In progress">
        <span className="absolute size-4 animate-ping rounded-full bg-agent/25" />
        <span className="size-2 rounded-full bg-agent" />
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className="mt-0.5 grid size-4 place-items-center rounded-full bg-negative text-white" aria-label="Failed">
        <X className="size-2.5" strokeWidth={3} />
      </span>
    );
  }
  if (status === "skipped") {
    return (
      <span className="mt-0.5 grid size-4 place-items-center rounded-full bg-sunken text-subtle" aria-label="Skipped">
        <Minus className="size-2.5" strokeWidth={3} />
      </span>
    );
  }
  return (
    <span className="mt-0.5 grid size-4 place-items-center rounded-full bg-ink text-white" aria-label="Done">
      <Check className="size-2.5" strokeWidth={3} />
    </span>
  );
}
