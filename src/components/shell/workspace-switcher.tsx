"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Plus } from "lucide-react";
import { cn } from "@/lib/cn";

export interface SwitcherWorkspace {
  slug: string;
  name: string;
  isDemo: boolean;
}

export function WorkspaceSwitcher({ current, workspaces }: { current: SwitcherWorkspace; workspaces: SwitcherWorkspace[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 w-full items-center gap-2 rounded-md px-1.5 text-left hover:bg-sunken"
      >
        <Monogram name={current.name} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-ink">{current.name}</span>
          {current.isDemo && <span className="block text-2xs text-subtle">Demo workspace</span>}
        </span>
        <ChevronDown className="size-3.5 text-subtle" />
      </button>
      {open && (
        <div role="menu" className="absolute top-10 left-0 z-50 w-60 rounded-lg bg-surface p-1 shadow-pop">
          <p className="px-2 pt-1.5 pb-1 text-2xs font-medium text-subtle">Workspaces</p>
          {workspaces.map((w) => (
            <Link
              key={w.slug}
              role="menuitem"
              href={`/w/${w.slug}`}
              onClick={() => setOpen(false)}
              className={cn("flex h-8 items-center gap-2 rounded-md px-2 text-sm hover:bg-sunken", w.slug === current.slug && "font-medium")}
            >
              <Monogram name={w.name} small />
              <span className="flex-1 truncate">{w.name}</span>
              {w.slug === current.slug && <Check className="size-3.5 text-muted" />}
            </Link>
          ))}
          <div className="my-1 border-t border-line" />
          <Link role="menuitem" href="/start" onClick={() => setOpen(false)} className="flex h-8 items-center gap-2 rounded-md px-2 text-sm text-muted hover:bg-sunken hover:text-ink">
            <Plus className="size-3.5" />
            Grow another product
          </Link>
        </div>
      )}
    </div>
  );
}

function Monogram({ name, small }: { name: string; small?: boolean }) {
  return (
    <span aria-hidden className={cn("grid shrink-0 place-items-center rounded-md bg-ink font-semibold text-white", small ? "size-5 text-[10px]" : "size-6 text-xs")}>
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}
