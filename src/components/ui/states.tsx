import type { ReactNode } from "react";
import { AlertTriangle, Lock, PlugZap } from "lucide-react";
import { cn } from "@/lib/cn";

export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-start gap-2 px-4 py-8", className)}>
      {icon && <div className="text-subtle">{icon}</div>}
      <p className="text-sm font-medium text-ink">{title}</p>
      {description && <p className="max-w-md text-sm text-muted">{description}</p>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-sunken", className)} aria-hidden />;
}

type NoticeTone = "warning" | "error" | "disconnected" | "forbidden" | "agent";

const NOTICE: Record<NoticeTone, { className: string; icon: ReactNode }> = {
  warning: { className: "border-warning/30 bg-warning-soft text-warning", icon: <AlertTriangle className="size-4" /> },
  error: { className: "border-negative/30 bg-negative-soft text-negative", icon: <AlertTriangle className="size-4" /> },
  disconnected: { className: "border-line bg-raised text-muted", icon: <PlugZap className="size-4" /> },
  forbidden: { className: "border-line bg-raised text-muted", icon: <Lock className="size-4" /> },
  agent: { className: "border-agent-line bg-agent-soft text-agent", icon: null },
};

export function Notice({
  tone = "warning",
  title,
  children,
  action,
  className,
}: {
  tone?: NoticeTone;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  const t = NOTICE[tone];
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cn("flex items-start gap-3 rounded-md border px-3 py-2.5", t.className, className)}>
      {t.icon && <span className="mt-0.5 shrink-0">{t.icon}</span>}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{title}</p>
        {children && <div className="mt-0.5 text-sm text-ink/80">{children}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
