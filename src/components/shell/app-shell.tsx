"use client";

import { Command } from "cmdk";
import { usePathname, useRouter } from "next/navigation";
import { cloneElement, isValidElement, useCallback, useEffect, useState, type ReactNode } from "react";
import { completeProductTourAction } from "@/app/(app)/w/[workspace]/actions";
import { Compass, Menu, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { ProductTour } from "./product-tour";
import { PAGE_TOUR_EVENT, PageTour } from "./page-tour";
import { pageTourKey } from "@/lib/page-tours";
import { Sidebar } from "./sidebar";
import { Assistant, type AssistantContext } from "./assistant";
import { useI18n } from "@/i18n/client";

export interface PaletteExperiment {
  key: string;
  number: number;
  name: string;
}

const SIDEBAR_COLLAPSED_KEY = "kaya_sidebar_collapsed";

export function AppShell({
  assistant,
  slug,
  userEmail,
  switcher,
  topBar,
  billing,
  pendingApprovals,
  running,
  experiments,
  tour,
  children,
}: {
  slug: string;
  userEmail?: string;
  switcher: ReactNode;
  topBar: ReactNode;
  billing?: ReactNode;
  pendingApprovals: number;
  running: number;
  experiments: PaletteExperiment[];
  /** `autoStart` opens the tour on first login; `persist` saves completion for signed-in users. */
  tour: { autoStart: boolean; persist: boolean; firstName: string; pagesSeen: string[] };
  assistant: AssistantContext;
  children: ReactNode;
}) {
  const { t } = useI18n();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(tour.autoStart);
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  // The first-login tour already fills this visit; the page's own tour waits for the next one.
  const [holdPath] = useState(() => (tour.autoStart ? pathname : null));
  const hasPageTour = pageTourKey(pathname) !== null;
  const replayPageTour = useCallback(() => {
    setPaletteOpen(false);
    window.dispatchEvent(new Event(PAGE_TOUR_EVENT));
  }, []);

  const startTour = useCallback(() => {
    setPaletteOpen(false);
    setNavOpen(false);
    setTourOpen(true);
  }, []);

  const closeTour = useCallback(() => {
    setTourOpen(false);
    if (tour.autoStart && tour.persist) void completeProductTourAction();
  }, [tour.autoStart, tour.persist]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
      if (saved !== null) {
        setCollapsed(saved === "true");
      }
    } catch {}
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      } catch {}
      return next;
    });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleCollapsed();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleCollapsed]);

  const switcherForDesktop = isValidElement(switcher)
    ? cloneElement(switcher as React.ReactElement<{ collapsed?: boolean }>, { collapsed })
    : switcher;

  const desktopSidebar = (
    <Sidebar
      slug={slug}
      userEmail={userEmail}
      switcher={switcherForDesktop}
      billing={billing}
      pendingApprovals={pendingApprovals}
      running={running}
      collapsed={collapsed}
      onToggleCollapse={toggleCollapsed}
      onOpenPalette={() => setPaletteOpen(true)}
      onStartTour={startTour}
    />
  );

  const mobileSidebar = (
    <Sidebar
      slug={slug}
      userEmail={userEmail}
      switcher={switcher}
      billing={billing}
      pendingApprovals={pendingApprovals}
      running={running}
      collapsed={false}
      onOpenPalette={() => setPaletteOpen(true)}
      onStartTour={startTour}
    />
  );

  return (
    <div className="flex min-h-screen">
      <aside
        className={cn(
          "sticky top-0 z-40 hidden h-screen shrink-0 border-r border-line bg-canvas lg:block transition-[width] duration-200 ease-in-out",
          collapsed ? "w-16" : "w-60",
        )}
      >
        {desktopSidebar}
      </aside>

      {navOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label={t.shell.nav.navigation}>
          <button type="button" aria-label={t.shell.nav.closeNavigation} className="absolute inset-0 bg-ink/30" onClick={() => setNavOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 border-r border-line bg-canvas" onClick={(e) => (e.target as HTMLElement).closest("a") && setNavOpen(false)}>
            {mobileSidebar}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header data-tour="topbar" className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-canvas/95 px-3 backdrop-blur-sm sm:px-5">
          <button type="button" className="grid size-8 place-items-center rounded-md text-muted hover:bg-sunken lg:hidden" aria-label={t.shell.nav.openNavigation} onClick={() => setNavOpen(true)}>
            <Menu className="size-4" />
          </button>
          <button
            type="button"
            className="hidden size-8 place-items-center rounded-md text-muted hover:bg-sunken hover:text-ink lg:grid"
            aria-label={collapsed ? t.shell.nav.expandSidebar : t.shell.nav.collapseSidebar}
            title={collapsed ? `${t.shell.nav.expandSidebar} (⌘B)` : `${t.shell.nav.collapseSidebar} (⌘B)`}
            onClick={toggleCollapsed}
          >
            {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
          </button>
          {topBar}
          {hasPageTour && (
            <button
              type="button"
              onClick={replayPageTour}
              title={t.pageTours.replay}
              className="grid size-7 shrink-0 place-items-center rounded-md border border-line bg-surface text-muted hover:text-ink"
            >
              <Compass className="size-3.5" />
              <span className="sr-only">{t.pageTours.replay}</span>
            </button>
          )}
        </header>
        <main className="min-w-0 flex-1">{children}</main>
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} slug={slug} experiments={experiments} onStartTour={startTour} onPageTour={hasPageTour ? replayPageTour : undefined} />
      <ProductTour open={tourOpen} slug={slug} firstName={tour.firstName} onClose={closeTour} />
      <PageTour seen={tour.pagesSeen} persist={tour.persist} paused={tourOpen} holdPath={holdPath} />
      {!tourOpen && <Assistant slug={slug} context={assistant} />}
    </div>
  );
}

function CommandPalette({
  open,
  onOpenChange,
  slug,
  experiments,
  onStartTour,
  onPageTour,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slug: string;
  experiments: PaletteExperiment[];
  onStartTour: () => void;
  onPageTour?: () => void;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const n = t.shell.nav;
  const p = t.shell.palette;
  const [query, setQuery] = useState("");
  const base = `/w/${slug}`;
  const go = (href: string) => {
    onOpenChange(false);
    setQuery("");
    router.push(href);
  };

  const pages: [string, string][] = [
    [n.commandCenter, base],
    [n.kai, `${base}/kai`],
    [n.agent, `${base}/agent`],
    [n.strategy, `${base}/strategy`],
    [n.experiments, `${base}/experiments`],
    [n.learnings, `${base}/learnings`],
    [n.analytics, `${base}/analytics`],
    [n.memory, `${base}/memory`],
    [n.integrations, `${base}/integrations`],
    [n.settings, `${base}/settings`],
  ];

  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label={p.label}
      overlayClassName="fixed inset-0 z-50 bg-ink/25"
      contentClassName={cn("fixed top-[14vh] left-1/2 z-50 w-[min(640px,calc(100vw-24px))] -translate-x-1/2 overflow-hidden rounded-lg bg-surface shadow-pop")}
    >
      <Command.Input
        value={query}
        onValueChange={setQuery}
        placeholder={p.placeholder}
        className="h-12 w-full border-b border-line bg-transparent px-4 text-base outline-none placeholder:text-subtle"
      />
      <Command.List className="max-h-[50vh] overflow-y-auto p-1.5 text-sm">
        <Command.Empty className="px-3 py-6 text-muted">{p.empty}</Command.Empty>
        {query.trim().length > 3 && (
          <Command.Group heading={n.kai} className="[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-2xs [&_[cmdk-group-heading]]:text-subtle">
            <PaletteItem value={`ask ${query}`} onSelect={() => go(`${base}/kai?q=${encodeURIComponent(query.trim())}`)}>
              <span className="text-agent font-medium">Kai :</span> {query}
            </PaletteItem>
          </Command.Group>
        )}
        <Command.Group heading={p.goTo} className="[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-2xs [&_[cmdk-group-heading]]:text-subtle">
          {pages.map(([label, href]) => (
            <PaletteItem key={href} value={label} onSelect={() => go(href)}>
              {label}
            </PaletteItem>
          ))}
          <PaletteItem value={n.takeTour} onSelect={onStartTour}>
            {n.takeTour}
          </PaletteItem>
          {onPageTour && (
            <PaletteItem value={t.pageTours.replay} onSelect={onPageTour}>
              {t.pageTours.replay}
            </PaletteItem>
          )}
        </Command.Group>
        {experiments.length > 0 && (
          <Command.Group heading={p.experiments} className="[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-2xs [&_[cmdk-group-heading]]:text-subtle">
            {experiments.map((e) => (
              <PaletteItem key={e.key} value={`${e.key} ${e.name}`} onSelect={() => go(`${base}/experiments/${e.number}`)}>
                <span className="w-16 shrink-0 text-muted tabular">{e.key}</span>
                <span className="truncate">{e.name}</span>
              </PaletteItem>
            ))}
          </Command.Group>
        )}
      </Command.List>
      <button type="button" onClick={() => onOpenChange(false)} className="absolute top-3 right-3 grid size-6 place-items-center rounded-md text-subtle hover:bg-sunken" aria-label={t.common.close}>
        <X className="size-3.5" />
      </button>
    </Command.Dialog>
  );
}

function PaletteItem({ value, onSelect, children }: { value: string; onSelect: () => void; children: ReactNode }) {
  return (
    <Command.Item value={value} onSelect={onSelect} className="flex h-9 cursor-pointer items-center gap-2 rounded-md px-2.5 text-ink data-[selected=true]:bg-sunken">
      {children}
    </Command.Item>
  );
}
