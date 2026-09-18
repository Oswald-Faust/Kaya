"use client";

import Link from "next/link";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { TONE_TILE, type Tone } from "./nav-data";

export interface NavPill {
  slug: string;
  href: string;
  label: string;
  icon: LucideIcon;
  tone: Tone;
  badge?: string;
}

interface CategoryPillNavProps {
  items: NavPill[];
  activeSlug: string;
  ariaLabel?: string;
}

export function CategoryPillNav({ items, activeSlug, ariaLabel = "Navigation des catégories" }: CategoryPillNavProps) {
  return (
    <nav aria-label={ariaLabel} className="w-full overflow-x-auto pb-3 [scrollbar-width:none] [-ms-overflow-style:none]">
      <ul className="flex items-center gap-2 min-w-max">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = item.slug === activeSlug;
          return (
            <li key={item.slug}>
              <Link
                href={item.href}
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-all",
                  isActive
                    ? "bg-ink text-white shadow-sm"
                    : "bg-cream text-ink/80 hover:bg-stone hover:text-ink"
                )}
              >
                <span
                  className={cn(
                    "grid size-6 place-items-center rounded-lg text-xs transition-colors",
                    isActive ? "bg-white/20 text-white" : TONE_TILE[item.tone]
                  )}
                >
                  <Icon className="size-3.5" />
                </span>
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider",
                      isActive ? "bg-lime text-ink" : "bg-sunken text-muted"
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
