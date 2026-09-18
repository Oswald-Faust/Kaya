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
  Sparkles,
  Users,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useI18n } from "@/i18n/client";

interface NavItem {
  href: string;
  /** Anchor for the product tour. */
  tour?: string;
  label: string;
  icon: ReactNode;
  badge?: number;
  exact?: boolean;
}

export function Sidebar({
  slug,
  switcher,
  billing,
  pendingApprovals,
  running,
  onOpenPalette,
  onStartTour,
}: {
  slug: string;
  switcher: ReactNode;
  billing?: ReactNode;
  pendingApprovals: number;
  running: number;
  onOpenPalette?: () => void;
  onStartTour?: () => void;
}) {
  const { t } = useI18n();
  const n = t.shell.nav;
  const base = `/w/${slug}`;
  const primary: NavItem[] = [
    { href: base, label: n.commandCenter, tour: "command-center", icon: <Gauge />, exact: true },
    { href: `${base}/agent`, label: n.agent, tour: "agent", icon: <Bot />, badge: pendingApprovals },
  ];
  const loop: NavItem[] = [
    { href: `${base}/strategy`, label: n.strategy, tour: "strategy", icon: <Compass /> },
    { href: `${base}/experiments`, label: n.experiments, tour: "experiments", icon: <FlaskConical />, badge: running },
    { href: `${base}/learnings`, label: n.learnings, tour: "learnings", icon: <BookOpen /> },
    { href: `${base}/analytics`, label: n.analytics, tour: "analytics", icon: <Activity /> },
    { href: `${base}/memory`, label: n.memory, tour: "memory", icon: <Brain /> },
  ];
  const execution: NavItem[] = [
    { href: `${base}/campaigns`, label: n.campaigns, icon: <Megaphone /> },
    { href: `${base}/content`, label: n.content, icon: <FileText /> },
    { href: `${base}/seo`, label: n.seo, icon: <Search /> },
    { href: `${base}/creators`, label: n.creators, icon: <Users /> },
  ];
  const system: NavItem[] = [
    { href: `${base}/integrations`, label: n.integrations, tour: "integrations", icon: <Plug /> },
    { href: `${base}/settings`, label: n.settings, tour: "settings", icon: <Settings /> },
  ];

  return (
    <nav aria-label={n.workspace} className="flex h-full flex-col gap-4 px-2.5 py-3">
      <div className="px-1">{switcher}</div>
      {onOpenPalette && (
        <button
          type="button"
          data-tour="search"
          onClick={onOpenPalette}
          className="mx-1 flex h-8 items-center gap-2 rounded-md border border-line bg-surface px-2.5 text-xs text-subtle hover:border-line-strong"
        >
          <Search className="size-3.5" />
          <span className="flex-1 text-left">{n.search}</span>
          <kbd className="rounded-sm border border-line px-1 text-2xs text-muted">⌘K</kbd>
        </button>
      )}
      <NavGroup items={primary} prominent />
      <NavGroup label={n.growthLoop} items={loop} />
      <NavGroup label={n.execution} items={execution} tour="execution" />
      <div className="mt-auto flex flex-col gap-2">
        {onStartTour && (
          <button
            type="button"
            onClick={onStartTour}
            className="mx-1 flex h-7 items-center gap-2 rounded-md px-1.5 text-xs text-subtle hover:bg-sunken hover:text-ink [&_svg]:size-3.5"
          >
            <Sparkles />
            <span>{n.takeTour}</span>
          </button>
        )}
        {billing && <div className="mx-1">{billing}</div>}
        <NavGroup items={system} />
      </div>
    </nav>
  );
}

function NavGroup({ label, items, prominent, tour }: { label?: string; items: NavItem[]; prominent?: boolean; tour?: string }) {
  const pathname = usePathname();
  return (
    <div data-tour={tour}>
      {label && <p className="px-2.5 pb-1 text-2xs font-medium text-subtle">{label}</p>}
      <ul className="flex flex-col gap-px">
        {items.map((item) => {
          const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                data-tour={item.tour}
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
