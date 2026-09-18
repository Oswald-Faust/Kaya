import { getI18n } from "@/i18n/server";
import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

const STEPS = [{ id: "analyze" }, { id: "confirm" }, { id: "goal" }, { id: "connect" }, { id: "strategy" }, { id: "plan" }] as const;

export type OnboardingStepId = (typeof STEPS)[number]["id"];

const ORDER: Record<string, number> = { analyze: 0, confirm: 1, goal: 2, connect: 3, strategy: 4, plan: 5, done: 6 };

/** Step rail. Steps the founder already reached stay navigable. */
export async function OnboardingSteps({ slug, current, reached }: { slug: string; current: OnboardingStepId; reached: string }) {
  const { t } = await getI18n();
  const reachedIndex = ORDER[reached] ?? 0;
  return (
    <nav aria-label={t.onboarding.steps.label}>
      <ol className="flex items-center gap-1.5 overflow-x-auto text-sm">
        {STEPS.map((s, i) => {
          const done = i < ORDER[current];
          const active = s.id === current;
          const navigable = i <= reachedIndex && !active;
          const inner = (
            <span
              className={cn(
                "inline-flex h-9 items-center gap-2 rounded-xl px-3 whitespace-nowrap",
                active ? "bg-surface font-medium text-ink shadow-[0_0_0_1px_var(--color-line)]" : done ? "text-muted" : "text-subtle",
                navigable && "hover:text-ink",
              )}
            >
              <span
                className={cn(
                  "grid size-5 place-items-center rounded-full text-[11px] tabular",
                  done ? "bg-ink text-white" : active ? "bg-agent text-white" : "border border-line-strong text-subtle",
                )}
              >
                {done ? <Check className="size-3" strokeWidth={3} /> : i + 1}
              </span>
              {t.onboarding.steps[s.id]}
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
