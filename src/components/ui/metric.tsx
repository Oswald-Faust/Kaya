import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { formatDelta } from "@/lib/format";

export interface MetricProps {
  label: string;
  value: string;
  delta?: number | null;
  /** When true, a decrease is good (CAC, churn). */
  invert?: boolean;
  hint?: string;
  formula?: string;
  footer?: ReactNode;
  className?: string;
}

export function Metric({ label, value, delta, invert, hint, formula, footer, className }: MetricProps) {
  const good = delta === null || delta === undefined || delta === 0 ? null : invert ? delta < 0 : delta > 0;
  return (
    <div className={cn("min-w-0 px-4 py-3.5", className)} title={formula ? `${label} = ${formula}` : undefined}>
      <div className="flex items-center gap-1 text-sm text-muted">{label}</div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-2xl font-semibold tracking-tight text-ink tabular">{value}</span>
        {delta !== undefined && (
          <span
            className={cn(
              "text-sm font-medium tabular",
              good === null ? "text-subtle" : good ? "text-positive" : "text-negative",
            )}
          >
            {formatDelta(delta)}
          </span>
        )}
      </div>
      {hint && <div className="mt-0.5 truncate text-xs text-subtle">{hint}</div>}
      {footer}
    </div>
  );
}

/** A single row of metrics separated by hairlines, like a ledger strip. */
export function MetricGroup({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 divide-line rounded-lg border border-line bg-surface sm:grid-cols-3 lg:auto-cols-fr lg:grid-flow-col lg:grid-cols-none lg:divide-x [&>*]:border-line max-lg:[&>*]:border-b",
        className,
      )}
    >
      {children}
    </div>
  );
}
