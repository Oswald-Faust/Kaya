import Link from "next/link";
import { cn } from "@/lib/cn";
import type { LoopStage, ShellData } from "@/server/services/workspace";

/**
 * The signature element: the product's operating loop as a live, navigable
 * rail. Each stage shows real state and links to the surface that owns it;
 * the stage that needs the founder is marked.
 */
export function GrowthLoop({ slug, data }: { slug: string; data: ShellData }) {
  const base = `/w/${slug}`;
  const c = data.counts;
  const stages: { id: LoopStage; label: string; value: string; href: string }[] = [
    { id: "understand", label: "Understand", value: c.proposedFacts ? `${c.proposedFacts} to review` : `${c.confirmedFacts} facts`, href: `${base}/memory` },
    { id: "decide", label: "Decide", value: c.strategyVersion ? `Strategy v${c.strategyVersion}` : "No strategy", href: `${base}/strategy` },
    { id: "experiment", label: "Experiment", value: `${c.queued} queued`, href: `${base}/experiments` },
    { id: "execute", label: "Execute", value: c.pendingApprovals ? `${c.pendingApprovals} need approval` : `${c.running} running`, href: `${base}/agent` },
    { id: "measure", label: "Measure", value: data.asOf ? "Revenue connected" : "No data yet", href: `${base}/analytics` },
    { id: "learn", label: "Learn", value: `${c.learnings} learnings`, href: `${base}/learnings` },
  ];

  return (
    <ol aria-label="Growth loop" className="flex min-w-0 items-stretch overflow-x-auto">
      {stages.map((s, i) => {
        const attention = data.attention === s.id;
        return (
          <li key={s.id} className="flex min-w-0 items-center">
            <Link
              href={s.href}
              className={cn(
                "group flex flex-col rounded-md px-2.5 py-1 transition-colors hover:bg-sunken",
                attention && "bg-agent-soft hover:bg-agent-soft",
              )}
            >
              <span className={cn("flex items-center gap-1.5 text-2xs font-medium", attention ? "text-agent" : "text-muted")}>
                <span
                  aria-hidden
                  className={cn("size-1.5 rounded-full", attention ? "bg-agent animate-pulse-dot" : "bg-line-strong group-hover:bg-muted")}
                />
                {s.label}
              </span>
              <span className={cn("text-xs whitespace-nowrap tabular", attention ? "font-medium text-agent" : "text-ink")}>{s.value}</span>
            </Link>
            {i < stages.length - 1 && <span aria-hidden className="h-px w-3 shrink-0 bg-line-strong" />}
          </li>
        );
      })}
      <li aria-hidden className="flex items-center pl-1 text-subtle" title="The loop repeats">
        ↺
      </li>
    </ol>
  );
}
