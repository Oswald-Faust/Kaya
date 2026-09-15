import { BookOpen, Check, Database, Eye, ListChecks, ShieldAlert, Wrench, X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { ToolCallDetails, type ToolCallView } from "./tool-call-details";

export interface TimelineStep {
  id: string;
  seq: number;
  kind: string;
  title: string;
  detail: string | null;
  status: string;
  startedAt: Date | null;
}

const KIND_ICON: Record<string, ReactNode> = {
  context: <Database />,
  plan: <ListChecks />,
  tool: <Wrench />,
  approval: <ShieldAlert />,
  observation: <Eye />,
  learning: <BookOpen />,
  message: <Eye />,
};

const KIND_LABEL: Record<string, string> = {
  context: "Context",
  plan: "Plan",
  tool: "Action",
  approval: "Approval",
  observation: "Observation",
  learning: "Learning",
  message: "Message",
};

/** Execution timeline: every step the agent took, with the tool calls underneath it. */
export function ActivityTimeline({ steps, toolCalls }: { steps: TimelineStep[]; toolCalls: (ToolCallView & { stepId: string | null })[] }) {
  if (steps.length === 0) {
    return <p className="px-1 py-4 text-sm text-muted">No steps recorded yet.</p>;
  }
  return (
    <ol className="relative">
      {steps.map((step, i) => {
        const calls = toolCalls.filter((c) => c.stepId === step.id);
        return (
          <li key={step.id} className="relative grid grid-cols-[28px_minmax(0,1fr)] gap-3 pb-4 last:pb-0">
            {i < steps.length - 1 && <span aria-hidden className="absolute top-7 bottom-0 left-[13.5px] w-px bg-line" />}
            <StepMarker kind={step.kind} status={step.status} />
            <div className="min-w-0 pt-0.5">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-2xs text-subtle">{KIND_LABEL[step.kind] ?? step.kind}</span>
                <span className={cn("text-sm", step.status === "failed" ? "text-negative" : "text-ink", step.status === "skipped" && "text-subtle line-through")}>
                  {step.title}
                </span>
                {step.status === "waiting" && <span className="text-2xs font-medium text-agent">Waiting for you</span>}
                {step.startedAt && (
                  <time className="ml-auto text-2xs text-subtle tabular" dateTime={step.startedAt.toISOString()}>
                    {step.startedAt.toISOString().slice(11, 19)}
                  </time>
                )}
              </div>
              {step.detail && <p className="mt-0.5 text-xs text-muted">{step.detail}</p>}
              {calls.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  {calls.map((c) => (
                    <ToolCallDetails key={c.id} call={c} />
                  ))}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function StepMarker({ kind, status }: { kind: string; status: string }) {
  const base = "relative z-10 grid size-7 place-items-center rounded-full border [&_svg]:size-3.5";
  if (status === "waiting") {
    return (
      <span className={cn(base, "border-agent-line bg-agent-soft text-agent")}>
        {KIND_ICON[kind]}
        <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-agent animate-pulse-dot" aria-hidden />
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className={cn(base, "border-negative/30 bg-negative-soft text-negative")}>
        <X />
      </span>
    );
  }
  if (status === "running") {
    return <span className={cn(base, "border-line-strong bg-surface text-muted")}>{KIND_ICON[kind]}</span>;
  }
  return (
    <span className={cn(base, "border-line bg-surface text-muted")}>
      {KIND_ICON[kind]}
      {status === "done" && (
        <span className="absolute -right-1 -bottom-1 grid size-3.5 place-items-center rounded-full bg-surface text-positive [&_svg]:size-2.5" aria-hidden>
          <Check strokeWidth={3} />
        </span>
      )}
    </span>
  );
}
