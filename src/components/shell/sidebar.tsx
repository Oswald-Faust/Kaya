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
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Plug,
  Search,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { KaiMark } from "@/components/brand/kai-mark";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n/format";

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
  userEmail,
  switcher,
  billing,
  pendingApprovals,
  running,
  collapsed = false,
  onToggleCollapse,
  onOpenPalette,
  onStartTour,
}: {
  slug: string;
  userEmail?: string;
  switcher: ReactNode;
  billing?: ReactNode;
  pendingApprovals: number;
  running: number;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onOpenPalette?: () => void;
  onStartTour?: () => void;
}) {
  const { t } = useI18n();
  const n = t.shell.nav;
  const base = `/w/${slug}`;
  const primary: NavItem[] = [
    { href: base, label: n.commandCenter, tour: "command-center", icon: <Gauge />, exact: true },
    { href: `${base}/kai`, label: n.kai, tour: "kai", icon: <KaiMark tile={false} className="size-[18px]" /> },
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
    <nav
      aria-label={n.workspace}
      data-collapsed={collapsed ? "true" : undefined}
      className={cn("flex h-full flex-col gap-4 py-3", collapsed ? "px-1.5" : "px-2.5")}
    >
      <div className={cn(collapsed ? "flex justify-center px-0" : "px-1")}>{switcher}</div>
      {onOpenPalette && (
        collapsed ? (
          <button
            type="button"
            data-tour="search"
            onClick={onOpenPalette}
            title={`${n.search} (⌘K)`}
            aria-label={n.search}
            className="mx-auto flex size-8 items-center justify-center rounded-md border border-line bg-surface text-subtle hover:border-line-strong hover:text-ink"
          >
            <Search className="size-3.5" />
          </button>
        ) : (
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
        )
      )}
      <NavGroup items={primary} prominent collapsed={collapsed} />
      <NavGroup label={n.growthLoop} items={loop} collapsed={collapsed} />
      <NavGroup label={n.execution} items={execution} tour="execution" collapsed={collapsed} />
      <div className="mt-auto flex flex-col gap-2">
        {onStartTour && (
          collapsed ? (
            <button
              type="button"
              onClick={onStartTour}
              title={n.takeTour}
              aria-label={n.takeTour}
              className="mx-auto flex size-8 items-center justify-center rounded-md text-subtle hover:bg-sunken hover:text-ink [&_svg]:size-3.5"
            >
              <Sparkles />
            </button>
          ) : (
            <button
              type="button"
              onClick={onStartTour}
              className="mx-1 flex h-7 items-center gap-2 rounded-md px-1.5 text-xs text-subtle hover:bg-sunken hover:text-ink [&_svg]:size-3.5"
            >
              <Sparkles />
              <span>{n.takeTour}</span>
            </button>
          )
        )}
        {billing && (
          <div
            className={cn(
              collapsed
                ? "flex justify-center [&_a]:mx-auto [&_a]:size-8 [&_a]:justify-center [&_a]:p-0 [&_a>span]:hidden [&_form]:w-auto [&_form>button]:mx-auto [&_form>button]:size-8 [&_form>button]:justify-center [&_form>button]:p-0 [&_form>button>span]:hidden"
                : "mx-1",
            )}
          >
            {billing}
          </div>
        )}
        <NavGroup items={system} collapsed={collapsed} />
        {collapsed ? (
          <div className="flex flex-col items-center gap-1 pt-1 border-t border-line/60">
            {userEmail !== undefined && (
              <form action="/logout" method="post">
                <button
                  type="submit"
                  title={userEmail ? fmt(t.common.logOutUser, { email: userEmail }) : t.common.logOut}
                  aria-label={t.common.logOut}
                  className="mx-auto grid size-8 place-items-center rounded-md text-subtle hover:bg-sunken hover:text-ink transition-colors"
                >
                  <LogOut className="size-4" />
                  <span className="sr-only">{t.common.logOut}</span>
                </button>
              </form>
            )}
            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                title={n.expandSidebar}
                aria-label={n.expandSidebar}
                className="mx-auto grid size-8 place-items-center rounded-md text-subtle hover:bg-sunken hover:text-ink transition-colors"
              >
                <PanelLeftOpen className="size-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="mx-1 flex items-center justify-between pt-1 border-t border-line/60">
            {userEmail !== undefined && (
              <form action="/logout" method="post">
                <button
                  type="submit"
                  title={userEmail ? fmt(t.common.logOutUser, { email: userEmail }) : t.common.logOut}
                  className="flex h-7 items-center gap-2 rounded-md px-1.5 text-xs text-subtle hover:bg-sunken hover:text-ink transition-colors [&_svg]:size-3.5"
                >
                  <LogOut />
                  <span>{t.common.logOut}</span>
                </button>
              </form>
            )}
            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                title={n.collapseSidebar}
                aria-label={n.collapseSidebar}
                className="ml-auto grid size-7 place-items-center rounded-md text-subtle hover:bg-sunken hover:text-ink transition-colors"
              >
                <PanelLeftClose className="size-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

function NavGroup({
  label,
  items,
  prominent,
  tour,
  collapsed,
}: {
  label?: string;
  items: NavItem[];
  prominent?: boolean;
  tour?: string;
  collapsed?: boolean;
}) {
  const pathname = usePathname();
  return (
    <div data-tour={tour}>
      {label && (
        collapsed ? (
          <div className="mx-2 my-1 border-t border-line/60" />
        ) : (
          <p className="px-2.5 pb-1 text-2xs font-medium text-subtle">{label}</p>
        )
      )}
      <ul className="flex flex-col gap-px">
        {items.map((item) => {
          const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                data-tour={item.tour}
                aria-current={active ? "page" : undefined}
                title={collapsed ? item.label : undefined}
                aria-label={item.label}
                className={cn(
                  "group relative flex items-center rounded-md transition-colors [&_svg]:size-4 [&_svg]:shrink-0",
                  collapsed ? "mx-auto size-8 justify-center p-0" : "gap-2.5 px-2.5 text-sm",
                  !collapsed && (prominent ? "h-8 font-medium" : "h-7"),
                  active ? "bg-surface text-ink shadow-[0_0_0_1px_var(--color-line)]" : "text-muted hover:bg-sunken hover:text-ink",
                )}
              >
                <span className={cn(active ? "text-ink" : "text-subtle group-hover:text-muted")}>{item.icon}</span>
                {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                {item.badge ? (
                  collapsed ? (
                    <span
                      className="absolute top-1 right-1 size-2 rounded-full bg-agent ring-2 ring-canvas"
                      aria-label={`${item.badge}`}
                    />
                  ) : (
                    <span className="grid h-4 min-w-4 place-items-center rounded-sm bg-agent px-1 text-[10px] font-semibold text-white tabular">
                      {item.badge}
                    </span>
                  )
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
