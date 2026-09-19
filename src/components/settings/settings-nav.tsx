"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Building2, CreditCard, Languages, LogOut, ShieldCheck, UserRound, Users } from "lucide-react";
import { cn } from "@/lib/cn";
import { useI18n } from "@/i18n/client";

interface Item {
  href: string;
  label: string;
  icon: ReactNode;
}

/** Secondary navigation for settings: a column on desktop, a scrollable tab strip on smaller screens. */
export function SettingsNav({ slug, workspaceName }: { slug: string; workspaceName: string }) {
  const pathname = usePathname();
  const { t } = useI18n();
  const n = t.settings.nav;
  const base = `/w/${slug}/settings`;
  const groups: { id: string; label: string; items: Item[] }[] = [
    {
      id: "workspace",
      label: workspaceName,
      items: [
        { href: base, label: n.general, icon: <Building2 /> },
        { href: `${base}/agent`, label: n.agent, icon: <ShieldCheck /> },
        { href: `${base}/team`, label: n.team, icon: <Users /> },
        { href: `${base}/billing`, label: n.billing, icon: <CreditCard /> },
      ],
    },
    {
      id: "account",
      label: n.account,
      items: [
        { href: `${base}/account`, label: n.profile, icon: <UserRound /> },
        { href: `${base}/preferences`, label: n.preferences, icon: <Languages /> },
      ],
    },
  ];

  return (
    <nav data-tour="set-nav" aria-label={t.settings.title} className="shrink-0 lg:sticky lg:top-[88px] lg:w-52 lg:self-start">
      <p className="hidden px-2.5 pb-3 text-lg font-semibold tracking-tight text-ink lg:block">{t.settings.title}</p>
      <div className="-mx-3 flex gap-1 overflow-x-auto px-3 pb-1 lg:mx-0 lg:flex-col lg:gap-4 lg:overflow-visible lg:px-0 lg:pb-0">
        {groups.map((group) => (
          <div key={group.id} className="flex shrink-0 gap-1 lg:flex-col lg:gap-px">
            <p className="hidden truncate px-2.5 pb-1 text-2xs font-medium text-subtle lg:block">{group.label}</p>
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
            {n.signOut}
          </button>
        </form>
      </div>
    </nav>
  );
}
