import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** The base container. Hairline border, no shadow; hierarchy comes from type and spacing. */
export function Panel({ children, className, as: As = "section", id, tour }: { children: ReactNode; className?: string; as?: "section" | "div" | "article"; id?: string; /** Anchor for the page tour. */ tour?: string }) {
  return (
    <As id={id} data-tour={tour} className={cn("rounded-lg border border-line bg-surface", className)}>
      {children}
    </As>
  );
}

export function PanelHeader({
  title,
  description,
  count,
  actions,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  count?: number;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex items-start justify-between gap-4 px-4 pt-3.5 pb-3", className)}>
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
          {title}
          {count !== undefined && <span className="text-sm font-normal text-subtle tabular">{count}</span>}
        </h2>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-1.5">{actions}</div>}
    </header>
  );
}

export function Divider({ className }: { className?: string }) {
  return <hr className={cn("border-line", className)} />;
}
