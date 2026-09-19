"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowUp, Maximize2, Play, X } from "lucide-react";
import { runExperimentAction } from "@/app/(app)/w/[workspace]/actions";
import { KaiMark } from "@/components/brand/kai-mark";
import { Spinner } from "@/components/ui/button";
import { useI18n } from "@/i18n/client";
import { fmt, plural } from "@/i18n/format";
import { cn } from "@/lib/cn";

export interface AssistantContext {
  /** The action Kai would run first, so it can be started from anywhere. */
  topAction: { id: string; name: string } | null;
  pendingApprovals: number;
  firstName: string;
}

/**
 * Kai: the agent, reachable from every screen. It takes a goal in words or
 * runs the top action directly; both open the run it just started.
 */
export function Assistant({ slug, context }: { slug: string; context: AssistantContext }) {
  const router = useRouter();
  const pathname = usePathname();
  const { t, locale } = useI18n();
  const a = t.app.assistant;
  const k = t.app.kai;
  const [open, setOpen] = useState(false);
  const [goal, setGoal] = useState("");
  const [pending, start] = useTransition();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const ask = (text: string) => {
    const question = text.trim();
    if (question.length < 2) return;
    setOpen(false);
    router.push(`/w/${slug}/kai?q=${encodeURIComponent(question)}`);
  };

  const runTop = () => {
    if (!context.topAction || pending) return;
    start(async () => void (await runExperimentAction(slug, context.topAction!.id)));
  };

  if (pathname === `/w/${slug}/kai`) return null;

  return (
    <>
      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label={a.name}
          className="fixed right-4 bottom-4 z-50 flex max-h-[min(640px,calc(100vh-2rem))] w-[min(400px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-pop"
        >
          <header className="flex items-center gap-2.5 border-b border-line px-4 py-3">
            <KaiMark className="size-7" thinking={pending} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink">{a.name}</p>
              <p className="truncate text-xs text-muted">{k.role}</p>
            </div>
            <Link
              href={`/w/${slug}/kai`}
              onClick={() => setOpen(false)}
              title={k.title}
              aria-label={k.title}
              className="grid size-7 place-items-center rounded-md text-muted hover:bg-sunken hover:text-ink"
            >
              <Maximize2 className="size-3.5" />
            </Link>
            <button type="button" onClick={() => setOpen(false)} aria-label={a.close} className="grid size-7 place-items-center rounded-md text-muted hover:bg-sunken hover:text-ink">
              <X className="size-4" />
            </button>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            <p className="text-lg leading-snug font-medium text-ink">
              {context.firstName ? fmt(a.greeting, { name: context.firstName }) : a.greetingAnonymous}
            </p>
            <p className="mt-1.5 text-sm text-muted">{a.intro}</p>

            {context.pendingApprovals > 0 && (
              <a href={`/w/${slug}#approvals`} onClick={() => setOpen(false)} className="mt-3 flex items-center gap-2 rounded-lg bg-sun-soft px-3 py-2 text-sm font-medium text-sun-deep">
                {plural(locale, context.pendingApprovals, a.waiting)}
              </a>
            )}

            {context.topAction && (
              <button
                type="button"
                onClick={runTop}
                disabled={pending}
                className="mt-3 flex w-full items-start gap-2.5 rounded-lg border border-agent/30 bg-agent-soft px-3 py-2.5 text-left transition-colors hover:border-agent disabled:opacity-60"
              >
                <Play className="mt-0.5 size-4 shrink-0 text-agent" />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-agent">{a.runAction}</span>
                  <span className="block truncate text-xs text-muted">{context.topAction.name}</span>
                </span>
              </button>
            )}

            <p className="mt-5 text-2xs font-medium text-subtle uppercase">{a.suggestionsTitle}</p>
            <ul className="mt-1.5 space-y-1">
              {t.app.kai.suggestions.map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    onClick={() => ask(s)}
                    disabled={pending}
                    className="w-full rounded-lg px-2 py-1.5 text-left text-sm text-ink transition-colors hover:bg-sunken disabled:opacity-60"
                  >
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask(goal);
            }}
            className="border-t border-line p-3"
          >
            <div className="flex items-end gap-2 rounded-xl border border-line-strong bg-canvas px-3 py-2 focus-within:border-agent">
              <label htmlFor="kai-goal" className="sr-only">
                {t.app.kai.placeholder}
              </label>
              <textarea
                id="kai-goal"
                ref={inputRef}
                rows={1}
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    ask(goal);
                  }
                }}
                placeholder={t.app.kai.placeholder}
                className="max-h-28 min-h-[1.5rem] flex-1 resize-none bg-transparent text-sm text-ink outline-none placeholder:text-subtle"
              />
              <button
                type="submit"
                disabled={pending || goal.trim().length < 3}
                aria-label={a.send}
                className="grid size-7 shrink-0 place-items-center rounded-lg bg-agent text-white transition-opacity disabled:opacity-40"
              >
                {pending ? <Spinner className="size-3.5" /> : <ArrowUp className="size-4" />}
              </button>
            </div>
          </form>
        </div>
      )}

      <button
        type="button"
        data-tour="kai-launcher"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={a.open}
        className={cn(
          "fixed right-4 bottom-4 z-40 inline-flex h-12 items-center gap-2 rounded-full bg-ink pr-4 pl-3 text-sm font-medium text-white shadow-pop transition-transform hover:scale-[1.02]",
          open && "pointer-events-none opacity-0",
        )}
      >
        <span className="grid size-7 place-items-center rounded-full bg-white/10">
          <KaiMark className="size-6" thinking={pending} />
        </span>
        {a.open}
        <kbd className="hidden rounded bg-white/10 px-1.5 py-0.5 text-2xs font-normal text-white/70 sm:inline">{a.shortcut}</kbd>
      </button>
    </>
  );
}
