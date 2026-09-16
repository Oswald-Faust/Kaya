"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Building2, CreditCard, LogOut, ShieldCheck, UserRound, Users } from "lucide-react";
import { cn } from "@/lib/cn";

interface Item {
  href: string;
  label: string;
  icon: ReactNode;
}

/** Secondary navigation for settings: a column on desktop, a scrollable tab strip on smaller screens. */
export function SettingsNav({ slug, workspaceName }: { slug: string; workspaceName: string }) {
  const pathname = usePathname();
  const base = `/w/${slug}/settings`;
  const groups: { label: string; items: Item[] }[] = [
    {
      label: "Workspace",
      items: [
        { href: base, label: "General", icon: <Building2 /> },
        { href: `${base}/agent`, label: "Agent & guardrails", icon: <ShieldCheck /> },
        { href: `${base}/team`, label: "Team", icon: <Users /> },
        { href: `${base}/billing`, label: "Plan & billing", icon: <CreditCard /> },
      ],
    },
    { label: "Account", items: [{ href: `${base}/account`, label: "Profile", icon: <UserRound /> }] },
  ];

  return (
    <nav aria-label="Settings" className="shrink-0 lg:sticky lg:top-[88px] lg:w-52 lg:self-start">
      <p className="hidden px-2.5 pb-3 text-lg font-semibold tracking-tight text-ink lg:block">Settings</p>
      <div className="-mx-3 flex gap-1 overflow-x-auto px-3 pb-1 lg:mx-0 lg:flex-col lg:gap-4 lg:overflow-visible lg:px-0 lg:pb-0">
        {groups.map((group) => (
          <div key={group.label} className="flex shrink-0 gap-1 lg:flex-col lg:gap-px">
            <p className="hidden truncate px-2.5 pb-1 text-2xs font-medium text-subtle lg:block">{group.label === "Workspace" ? workspaceName : group.label}</p>
            {group.items.map((item) => {
              const active = item.href === base ? pathname === base : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-8 shrink-0 items-center gap-2.5 rounded-md px-2.5 text-sm whitespace-nowrap transition-colors [&_svg]:size-4 [&_svg]:shrink-0",
                    active ? "bg-surface text-ink shadow-[0_0_0_1px_var(--color-line)]" : "text-muted hover:bg-sunken hover:text-ink",
                  )}
                >
                  <span className={active ? "text-ink" : "text-subtle"}>{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
        <form action="/logout" method="post" className="hidden lg:block">
          <button type="submit" className="flex h-8 w-full items-center gap-2.5 rounded-md px-2.5 text-sm text-muted hover:bg-sunken hover:text-ink [&_svg]:size-4">
            <LogOut className="text-subtle" />
            Sign out
          </button>
        </form>
      </div>
    </nav>
  );
}
