"use client";

import { useState, useTransition, type ReactNode } from "react";
import { Check, TriangleAlert } from "lucide-react";
import type { AdminResult } from "@/app/admin/actions";
import { buttonClass, Spinner, type ButtonVariant } from "@/components/ui/button";
import { cn } from "@/lib/cn";

/**
 * Runs a bound admin server action. Destructive actions ask for confirmation
 * first (typing the confirm word when `typeToConfirm` is set).
 */
export function ActionButton({
  action,
  children,
  icon,
  variant = "secondary",
  confirm,
  typeToConfirm,
  className,
}: {
  action: () => Promise<AdminResult | undefined | void>;
  children: ReactNode;
  icon?: ReactNode;
  variant?: ButtonVariant;
  confirm?: string;
  typeToConfirm?: string;
  className?: string;
}) {
  const [pending, start] = useTransition();
  const [asking, setAsking] = useState(false);
  const [typed, setTyped] = useState("");
  const [result, setResult] = useState<AdminResult | null>(null);

  const go = () =>
    start(async () => {
      const r = await action();
      setAsking(false);
      setTyped("");
      if (r) {
        setResult(r);
        setTimeout(() => setResult(null), 4000);
      }
    });

  return (
    <span className={cn("relative inline-flex flex-col items-start", className)}>
      {asking ? (
        <span className="flex flex-wrap items-center gap-2 rounded-md border border-line-strong bg-surface p-1.5 shadow-pop">
          <span className="px-1 text-xs text-muted">{confirm}</span>
          {typeToConfirm && (
            <input
              autoFocus
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={`Type ${typeToConfirm}`}
              aria-label={`Type ${typeToConfirm} to confirm`}
              className="h-7 w-36 rounded-md border border-line px-2 text-xs outline-none focus:border-ink"
            />
          )}
          <button type="button" onClick={() => setAsking(false)} className={buttonClass("ghost", "sm")}>
            Cancel
          </button>
          <button type="button" disabled={pending || (typeToConfirm !== undefined && typed !== typeToConfirm)} onClick={go} className={buttonClass(variant === "danger" ? "danger" : "primary", "sm")}>
            {pending && <Spinner />}
            Confirm
          </button>
        </span>
      ) : (
        <button type="button" disabled={pending} onClick={() => (confirm ? setAsking(true) : go())} className={buttonClass(variant, "sm")}>
          {pending ? <Spinner /> : icon}
          {children}
        </button>
      )}
      {result && (
        <span role="status" className={cn("absolute top-full left-0 z-10 mt-1 flex items-center gap-1 rounded-md px-2 py-1 text-2xs whitespace-nowrap shadow-pop", result.ok ? "bg-ink text-white" : "bg-negative-soft text-negative")}>
          {result.ok ? <Check className="size-3" /> : <TriangleAlert className="size-3" />}
          {result.ok ? (result.message ?? "Done.") : result.error}
        </span>
      )}
    </span>
  );
}
