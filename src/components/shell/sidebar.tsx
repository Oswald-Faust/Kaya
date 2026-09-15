"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  Activity,
  Bot,
  BookOpen,
  Brain,
  Compass,
  FileText,
  FlaskConical,
  Gauge,
  Megaphone,
  Plug,
  Search,
  Settings,
  Users,
} from "lucide-react";
import { cn } from "@/lib/cn";

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
  badge?: number;
  exact?: boolean;
}

export function Sidebar({
  slug,
  switcher,
  pendingApprovals,
  running,
  onOpenPalette,
}: {
  slug: string;
  switcher: ReactNode;
  pendingApprovals: number;
  running: number;
  onOpenPalette?: () => void;
}) {
  const base = `/w/${slug}`;
  const primary: NavItem[] = [
    { href: base, label: "Command Center", icon: <Gauge />, exact: true },
    { href: `${base}/agent`, label: "Agent", icon: <Bot />, badge: pendingApprovals },
  ];
  const loop: NavItem[] = [
    { href: `${base}/strategy`, label: "Strategy", icon: <Compass /> },
    { href: `${base}/experiments`, label: "Experiments", icon: <FlaskConical />, badge: running },
    { href: `${base}/learnings`, label: "Learnings", icon: <BookOpen /> },
    { href: `${base}/analytics`, label: "Analytics", icon: <Activity /> },
    { href: `${base}/memory`, label: "Business memory", icon: <Brain /> },
  ];
  const execution: NavItem[] = [
    { href: `${base}/campaigns`, label: "Campaigns", icon: <Megaphone /> },
    { href: `${base}/content`, label: "Content", icon: <FileText /> },
    { href: `${base}/seo`, label: "SEO", icon: <Search /> },
    { href: `${base}/creators`, label: "Creators", icon: <Users /> },
  ];
  const system: NavItem[] = [
    { href: `${base}/integrations`, label: "Integrations", icon: <Plug /> },
    { href: `${base}/settings`, label: "Settings", icon: <Settings /> },
  ];

  return (
    <nav aria-label="Workspace" className="flex h-full flex-col gap-4 px-2.5 py-3">
      <div className="px-1">{switcher}</div>
      {onOpenPalette && (
        <button
          type="button"
          onClick={onOpenPalette}
          className="mx-1 flex h-8 items-center gap-2 rounded-md border border-line bg-surface px-2.5 text-xs text-subtle hover:border-line-strong"
        >
          <Search className="size-3.5" />
          <span className="flex-1 text-left">Search or ask the agent</span>
          <kbd className="rounded-sm border border-line px-1 text-2xs text-muted">⌘K</kbd>
        </button>
      )}
      <NavGroup items={primary} prominent />
      <NavGroup label="Growth loop" items={loop} />
      <NavGroup label="Execution" items={execution} />
      <div className="mt-auto">
        <NavGroup items={system} />
      </div>
    </nav>
  );
}

function NavGroup({ label, items, prominent }: { label?: string; items: NavItem[]; prominent?: boolean }) {
  const pathname = usePathname();
  return (
    <div>
      {label && <p className="px-2.5 pb-1 text-2xs font-medium text-subtle">{label}</p>}
      <ul className="flex flex-col gap-px">
        {items.map((item) => {
          const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex items-center gap-2.5 rounded-md px-2.5 text-sm transition-colors [&_svg]:size-4 [&_svg]:shrink-0",
                  prominent ? "h-8 font-medium" : "h-7",
                  active ? "bg-surface text-ink shadow-[0_0_0_1px_var(--color-line)]" : "text-muted hover:bg-sunken hover:text-ink",
                )}
              >
                <span className={cn(active ? "text-ink" : "text-subtle group-hover:text-muted")}>{item.icon}</span>
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge ? (
                  <span className="grid h-4 min-w-4 place-items-center rounded-sm bg-agent px-1 text-[10px] font-semibold text-white tabular">{item.badge}</span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
