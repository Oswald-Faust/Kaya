"use client";

import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { completeProductTourAction } from "@/app/(app)/w/[workspace]/actions";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { ProductTour } from "./product-tour";
import { Sidebar } from "./sidebar";

export interface PaletteExperiment {
  key: string;
  number: number;
  name: string;
}

export function AppShell({
  slug,
  switcher,
  topBar,
  pendingApprovals,
  running,
  experiments,
  tour,
  children,
}: {
  slug: string;
  switcher: ReactNode;
  topBar: ReactNode;
  pendingApprovals: number;
  running: number;
  experiments: PaletteExperiment[];
  /** `autoStart` opens the tour on first login; `persist` saves completion for signed-in users. */
  tour: { autoStart: boolean; persist: boolean; firstName: string };
  children: ReactNode;
}) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(tour.autoStart);

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
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const sidebar = (
    <Sidebar slug={slug} switcher={switcher} pendingApprovals={pendingApprovals} running={running} onOpenPalette={() => setPaletteOpen(true)} onStartTour={startTour} />
  );

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-r border-line bg-canvas lg:block">{sidebar}</aside>

      {navOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <button type="button" aria-label="Close navigation" className="absolute inset-0 bg-ink/30" onClick={() => setNavOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 border-r border-line bg-canvas" onClick={(e) => (e.target as HTMLElement).closest("a") && setNavOpen(false)}>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header data-tour="topbar" className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-canvas/95 px-3 backdrop-blur-sm sm:px-5">
          <button type="button" className="grid size-8 place-items-center rounded-md text-muted hover:bg-sunken lg:hidden" aria-label="Open navigation" onClick={() => setNavOpen(true)}>
            <Menu className="size-4" />
          </button>
          {topBar}
        </header>
        <main className="min-w-0 flex-1">{children}</main>
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} slug={slug} experiments={experiments} onStartTour={startTour} />
      <ProductTour open={tourOpen} slug={slug} firstName={tour.firstName} onClose={closeTour} />
    </div>
  );
}

function CommandPalette({
  open,
  onOpenChange,
  slug,
  experiments,
  onStartTour,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slug: string;
  experiments: PaletteExperiment[];
  onStartTour: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const base = `/w/${slug}`;
  const go = (href: string) => {
    onOpenChange(false);
    setQuery("");
    router.push(href);
  };

  const pages: [string, string][] = [
    ["Command Center", base],
    ["Agent", `${base}/agent`],
    ["Strategy", `${base}/strategy`],
    ["Experiments", `${base}/experiments`],
    ["Learnings", `${base}/learnings`],
    ["Analytics", `${base}/analytics`],
    ["Business memory", `${base}/memory`],
    ["Integrations", `${base}/integrations`],
    ["Settings", `${base}/settings`],
  ];

  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label="Command palette"
      overlayClassName="fixed inset-0 z-50 bg-ink/25"
      contentClassName={cn("fixed top-[14vh] left-1/2 z-50 w-[min(640px,calc(100vw-24px))] -translate-x-1/2 overflow-hidden rounded-lg bg-surface shadow-pop")}
    >
      <Command.Input
        value={query}
        onValueChange={setQuery}
        placeholder="Jump to a page or experiment, or ask the agent…"
        className="h-12 w-full border-b border-line bg-transparent px-4 text-base outline-none placeholder:text-subtle"
      />
      <Command.List className="max-h-[50vh] overflow-y-auto p-1.5 text-sm">
        <Command.Empty className="px-3 py-6 text-muted">Nothing found. Press Enter to ask the agent.</Command.Empty>
        {query.trim().length > 3 && (
          <Command.Group heading="Agent" className="[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-2xs [&_[cmdk-group-heading]]:text-subtle">
            <PaletteItem value={`ask ${query}`} onSelect={() => go(`${base}/agent?ask=${encodeURIComponent(query.trim())}`)}>
              <span className="text-agent">Ask the agent:</span> {query}
            </PaletteItem>
          </Command.Group>
        )}
        <Command.Group heading="Go to" className="[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-2xs [&_[cmdk-group-heading]]:text-subtle">
          {pages.map(([label, href]) => (
            <PaletteItem key={href} value={label} onSelect={() => go(href)}>
              {label}
            </PaletteItem>
          ))}
          <PaletteItem value="Take the product tour" onSelect={onStartTour}>
            Take the product tour
          </PaletteItem>
        </Command.Group>
        {experiments.length > 0 && (
          <Command.Group heading="Experiments" className="[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-2xs [&_[cmdk-group-heading]]:text-subtle">
            {experiments.map((e) => (
              <PaletteItem key={e.key} value={`${e.key} ${e.name}`} onSelect={() => go(`${base}/experiments/${e.number}`)}>
                <span className="w-16 shrink-0 text-muted tabular">{e.key}</span>
                <span className="truncate">{e.name}</span>
              </PaletteItem>
            ))}
          </Command.Group>
        )}
      </Command.List>
      <button type="button" onClick={() => onOpenChange(false)} className="absolute top-3 right-3 grid size-6 place-items-center rounded-md text-subtle hover:bg-sunken" aria-label="Close">
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
