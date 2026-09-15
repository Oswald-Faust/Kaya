import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

const STEPS = [
  { id: "analyze", label: "Analyze" },
  { id: "confirm", label: "Confirm" },
  { id: "goal", label: "Goal" },
  { id: "connect", label: "Connect" },
  { id: "strategy", label: "Strategy" },
] as const;

export type OnboardingStepId = (typeof STEPS)[number]["id"];

const ORDER: Record<string, number> = { analyze: 0, confirm: 1, goal: 2, connect: 3, strategy: 4, done: 5 };

/** Step rail. Steps the founder already reached stay navigable. */
export function OnboardingSteps({ slug, current, reached }: { slug: string; current: OnboardingStepId; reached: string }) {
  const reachedIndex = ORDER[reached] ?? 0;
  return (
    <nav aria-label="Setup progress">
      <ol className="flex items-center gap-1 overflow-x-auto text-xs">
        {STEPS.map((s, i) => {
          const done = i < ORDER[current];
          const active = s.id === current;
          const navigable = i <= reachedIndex && !active;
          const inner = (
            <span
              className={cn(
                "inline-flex h-7 items-center gap-1.5 rounded-md px-2 whitespace-nowrap",
                active ? "bg-surface font-medium text-ink shadow-[0_0_0_1px_var(--color-line)]" : done ? "text-muted" : "text-subtle",
                navigable && "hover:text-ink",
              )}
            >
              <span
                className={cn(
                  "grid size-4 place-items-center rounded-full text-[10px] tabular",
                  done ? "bg-ink text-white" : active ? "bg-agent text-white" : "border border-line-strong text-subtle",
                )}
              >
                {done ? <Check className="size-2.5" strokeWidth={3} /> : i + 1}
              </span>
              {s.label}
            </span>
          );
          return (
            <li key={s.id} className="flex items-center gap-1">
              {navigable ? (
                <Link href={`/start/${slug}/${s.id}`} aria-current={active ? "step" : undefined}>
                  {inner}
                </Link>
              ) : (
                <span aria-current={active ? "step" : undefined}>{inner}</span>
              )}
              {i < STEPS.length - 1 && <span aria-hidden className="h-px w-4 bg-line-strong" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
