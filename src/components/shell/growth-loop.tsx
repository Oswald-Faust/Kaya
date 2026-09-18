import Link from "next/link";
import { cn } from "@/lib/cn";
import { getI18n } from "@/i18n/server";
import { fmt, plural } from "@/i18n/format";
import type { LoopStage, ShellData } from "@/server/services/workspace";

/**
 * The signature element: the product's operating loop as a live, navigable
 * rail. Each stage shows real state and links to the surface that owns it;
 * the stage that needs the founder is marked.
 */
export async function GrowthLoop({ slug, data }: { slug: string; data: ShellData }) {
  const { t, locale } = await getI18n();
  const l = t.shell.loop;
  const base = `/w/${slug}`;
  const c = data.counts;
  const stages: { id: LoopStage; label: string; value: string; href: string }[] = [
    { id: "understand", label: l.understand, value: c.proposedFacts ? fmt(l.toReview, { count: c.proposedFacts }) : plural(locale, c.confirmedFacts, l.facts), href: `${base}/memory` },
    { id: "decide", label: l.decide, value: c.strategyVersion ? fmt(l.strategyVersion, { version: c.strategyVersion }) : l.noStrategy, href: `${base}/strategy` },
    { id: "experiment", label: l.experiment, value: fmt(l.queued, { count: c.queued }), href: `${base}/experiments` },
    { id: "execute", label: l.execute, value: c.pendingApprovals ? plural(locale, c.pendingApprovals, l.needApproval) : fmt(l.running, { count: c.running }), href: `${base}/agent` },
    { id: "measure", label: l.measure, value: data.asOf ? l.revenueConnected : l.noData, href: `${base}/analytics` },
    { id: "learn", label: l.learn, value: plural(locale, c.learnings, l.learnings), href: `${base}/learnings` },
  ];

  return (
    <ol aria-label={l.label} className="flex min-w-0 items-stretch overflow-x-auto">
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
      <li aria-hidden className="flex items-center pl-1 text-subtle" title={l.repeats}>
        ↺
      </li>
    </ol>
  );
}
