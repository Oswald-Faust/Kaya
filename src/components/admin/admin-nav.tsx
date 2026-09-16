"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Bot, Building2, CreditCard, LayoutDashboard, ServerCog, Users } from "lucide-react";
import { cn } from "@/lib/cn";

const ITEMS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/workspaces", label: "Workspaces", icon: Building2 },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
  { href: "/admin/runs", label: "Agent runs", icon: Bot },
  { href: "/admin/audit", label: "Audit log", icon: Activity },
  { href: "/admin/system", label: "System", icon: ServerCog },
];

export function AdminNav({ badges }: { badges: Partial<Record<string, number>> }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
      {ITEMS.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        const badge = badges[item.href];
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-9 shrink-0 items-center gap-2.5 rounded-lg px-2.5 text-sm transition-colors",
              active ? "bg-ink font-medium text-white" : "text-muted hover:bg-sunken hover:text-ink",
            )}
          >
            <item.icon className="size-4" />
            <span>{item.label}</span>
            {badge ? <span className={cn("ml-auto rounded-full px-1.5 text-2xs tabular", active ? "bg-white/15 text-white" : "bg-negative-soft text-negative")}>{badge}</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}
