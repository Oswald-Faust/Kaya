"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useInView, useReducedMotion } from "motion/react";
import { ArrowUp, ArrowUpRight, BookOpen, Check, Pause, Play, RotateCcw } from "lucide-react";
import { KaiMark } from "@/components/brand/kai-mark";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n/format";
import type { KaiDemoScenario } from "@/i18n/dictionaries/en/kai";
import { cn } from "@/lib/cn";

/**
 * A Kai conversation that plays itself: the question is typed, Kai reads the
 * memory step by step, the answer streams in with numbered citations, then the
 * sources land. Hovering a citation lights up its source. Everything is derived
 * from one clock, so pausing, replaying or picking a question is just a reset.
 */

const CHAR_MS = 26;
const STEP_MS = 520;
const WORD_MS = 26;
const SOURCE_MS = 140;
const HOLD_MS = 5200;
const TICK_MS = 40;

function timeline(s: KaiDemoScenario) {
  const words = [s.lead, ...s.lines.map((l) => l.text), s.close].map((p) => p.split(" ").length);
  const typed = s.question.length * CHAR_MS + 250;
  const read = typed + s.steps.length * STEP_MS + 150;
  const written = read + words.reduce((a, b) => a + b, 0) * WORD_MS + 200;
  const sourced = written + s.sources.length * SOURCE_MS;
  return { words, typed, read, written, sourced, end: sourced + HOLD_MS };
}

export function KaiDemo({ demoSlug, className }: { demoSlug: string | null; className?: string }) {
  const { t } = useI18n();
  const d = t.kai.demo;
  const scenarios = d.scenarios;
  const reduce = useReducedMotion();
  const root = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const inView = useInView(root, { amount: 0.35 });
  const [{ index, elapsed }, setClock] = useState({ index: 0, elapsed: 0 });
  const [paused, setPaused] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [cite, setCite] = useState<number | null>(null);

  const scenario = scenarios[index];
  const tl = useMemo(() => timeline(scenario), [scenario]);
  const playing = inView && !paused && !hovering && !reduce;
  const now = reduce ? tl.sourced : elapsed;

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(
      () =>
        setClock((c) => {
          const next = c.elapsed + TICK_MS;
          // At the end of a conversation, move on to the next question.
          if (next >= timeline(scenarios[c.index]).end) return { index: (c.index + 1) % scenarios.length, elapsed: 0 };
          return { index: c.index, elapsed: next };
        }),
      TICK_MS,
    );
    return () => window.clearInterval(timer);
  }, [playing, scenarios]);

  // Like a real chat, the conversation follows the newest line.
  useEffect(() => {
    const el = body.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [now, index]);

  const pick = (i: number) => {
    setClock({ index: i, elapsed: 0 });
    setCite(null);
  };

  const typedChars = Math.min(scenario.question.length, Math.floor(now / CHAR_MS));
  const questionDone = now >= tl.typed;
  const stepsDone = questionDone ? Math.floor((now - tl.typed) / STEP_MS) : -1;
  const reading = questionDone && now < tl.read;
  const wordsWritten = now >= tl.read ? Math.floor((now - tl.read) / WORD_MS) : -1;
  // Paragraph n starts after every word of the paragraphs before it.
  const reveal = (text: string, n: number) => {
    if (wordsWritten < 0) return null;
    const before = tl.words.slice(0, n).reduce((a, b) => a + b, 0);
    const words = text.split(" ");
    const shown = Math.max(0, Math.min(words.length, wordsWritten - before));
    return { text: words.slice(0, shown).join(" "), done: shown === words.length, started: shown > 0 };
  };
  const lead = reveal(scenario.lead, 0);
  const lines = scenario.lines.map((l, i) => ({ line: l, shown: reveal(l.text, i + 1) }));
  const close = reveal(scenario.close, scenario.lines.length + 1);
  const writing = now >= tl.read && now < tl.written;
  const sourcesShown = now >= tl.written ? Math.min(scenario.sources.length, Math.floor((now - tl.written) / SOURCE_MS) + 1) : 0;
  const progress = Math.min(1, now / tl.end);

  const askHref = (() => {
    const path = `/kai?q=${encodeURIComponent(scenario.question)}`;
    return demoSlug ? `/w/${demoSlug}${path}` : `/demo?to=${encodeURIComponent(path)}`;
  })();

  return (
    <div ref={root} className={cn("text-white", className)} onMouseEnter={() => setHovering(true)} onMouseLeave={() => setHovering(false)}>
      {/* Questions */}
      <div role="tablist" aria-label={d.label} className="flex flex-wrap items-center justify-center gap-2">
        {scenarios.map((s, i) => {
          const active = i === index;
          return (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => pick(i)}
              className={cn(
                "relative overflow-hidden rounded-full border px-4 py-2 text-sm transition-colors",
                active ? "border-white/25 bg-white/10 text-white" : "border-white/10 text-white/55 hover:border-white/20 hover:text-white/85",
              )}
            >
              {s.chip}
              {active && !reduce && <span aria-hidden className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-[#8fa9ff]" style={{ transform: `scaleX(${progress})` }} />}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          aria-label={paused ? d.play : d.pause}
          className="grid size-9 place-items-center rounded-full border border-white/10 text-white/55 transition-colors hover:border-white/20 hover:text-white"
        >
          {paused ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
        </button>
      </div>

      {/* Window */}
      <div className="relative mx-auto mt-6 max-w-[880px]">
        <div aria-hidden className="absolute -inset-x-10 -top-10 bottom-0 -z-10 rounded-[48px] bg-[radial-gradient(60%_50%_at_50%_30%,rgba(77,120,255,0.28),transparent_70%)] blur-2xl" />
        <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[#0f0f12]/95 shadow-[0_40px_120px_-40px_rgba(47,86,232,0.55)] backdrop-blur">
          <header className="flex items-center gap-3 border-b border-white/[0.07] px-4 py-3 sm:px-5">
            <KaiMark className="size-8" thinking={reading || writing} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{d.windowTitle}</p>
              <p className="truncate text-xs text-white/45">{d.windowSub}</p>
            </div>
            <span className="hidden items-center gap-1.5 rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-white/60 sm:inline-flex">
              <span className="size-1.5 rounded-full bg-[#7ee2a8]" />
              {d.memory}
            </span>
            <button type="button" onClick={() => pick(index)} aria-label={d.replay} className="grid size-8 place-items-center rounded-lg text-white/45 transition-colors hover:bg-white/5 hover:text-white">
              <RotateCcw className="size-3.5" />
            </button>
          </header>

          <div
            ref={body}
            className="h-[500px] overflow-hidden scroll-smooth px-4 py-5 [mask-image:linear-gradient(to_bottom,transparent,#000_28px,#000)] sm:h-[480px] sm:px-8"
            aria-live="off"
          >
            <div key={scenario.id} className="mx-auto flex max-w-[640px] flex-col gap-4">
              {/* The question */}
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-white/[0.08] px-4 py-2.5 text-[15px] leading-relaxed text-white/90">
                  <span className={cn(!questionDone && "kai-caret")}>{scenario.question.slice(0, typedChars)}</span>
                </div>
              </div>

              {/* Kai reads its memory */}
              {questionDone && (
                <div className="flex gap-3">
                  <KaiMark className="mt-0.5 size-7" thinking={reading || writing} />
                  <div className="min-w-0 flex-1">
                    <ol className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-white/50">
                      {scenario.steps.map((step, i) => {
                        const done = i < stepsDone || now >= tl.read;
                        const active = i === stepsDone && !done;
                        if (i > stepsDone && now < tl.read) return null;
                        return (
                          <li key={step} className="flex animate-rise items-center gap-1.5">
                            <span className={cn("grid size-3.5 place-items-center rounded-full", done ? "bg-[#8fa9ff]/20 text-[#b7c7ff]" : "border border-white/20")}>
                              {done ? <Check className="size-2.5" strokeWidth={3} /> : active ? <span className="size-1.5 animate-pulse rounded-full bg-[#8fa9ff]" /> : null}
                            </span>
                            {step}
                          </li>
                        );
                      })}
                    </ol>

                    {/* The answer */}
                    {lead?.started && (
                      <div className="mt-3 space-y-2.5 text-[15px] leading-relaxed text-white/85">
                        <p className={cn(!lead.done && "kai-caret")}>{lead.text}</p>
                        {lines.some((l) => l.shown?.started) && (
                          <ul className="space-y-2">
                            {lines.map(({ line, shown }, i) =>
                              shown?.started ? (
                                <li key={i} className="flex gap-2.5">
                                  <span className="mt-[9px] size-1.5 shrink-0 rounded-full bg-white/35" />
                                  <span>
                                    {line.unverified && shown.done && (
                                      <span className="mr-1.5 rounded-md bg-[#ffb58f]/15 px-1.5 py-0.5 align-[1px] font-mono text-[10px] tracking-wide text-[#ffc6a8] uppercase">{d.unverified}</span>
                                    )}
                                    <span className={cn(!shown.done && "kai-caret")}>{shown.text}</span>
                                    {shown.done &&
                                      line.cite.map((n) => (
                                        <button
                                          key={n}
                                          type="button"
                                          onMouseEnter={() => setCite(n)}
                                          onMouseLeave={() => setCite(null)}
                                          onFocus={() => setCite(n)}
                                          onBlur={() => setCite(null)}
                                          aria-label={`${n}`}
                                          className={cn(
                                            "ml-1 inline-grid size-[18px] place-items-center rounded-md align-[1px] font-mono text-[10px] transition-colors",
                                            cite === n ? "bg-[#8fa9ff] text-[#0b0b0b]" : "bg-white/10 text-white/70",
                                          )}
                                        >
                                          {n}
                                        </button>
                                      ))}
                                  </span>
                                </li>
                              ) : null,
                            )}
                          </ul>
                        )}
                        {close?.started && <p className={cn("text-white/60", !close.done && "kai-caret")}>{close.text}</p>}
                      </div>
                    )}

                    {/* Sources */}
                    {sourcesShown > 0 && (
                      <div className="mt-4">
                        <p className="flex items-center gap-1.5 text-[11px] text-white/45">
                          <BookOpen className="size-3" />
                          {fmt(d.sourcesTitle, { count: scenario.sources.length })}
                        </p>
                        <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                          {scenario.sources.slice(0, sourcesShown).map((s, i) => (
                            <li
                              key={i}
                              className={cn(
                                "animate-rise rounded-xl border px-3 py-2 transition-colors",
                                cite === i + 1 ? "border-[#8fa9ff]/60 bg-[#8fa9ff]/10" : "border-white/[0.08] bg-white/[0.03]",
                              )}
                            >
                              <p className="flex items-center gap-2 text-[11px] text-white/45">
                                <span className="grid size-4 place-items-center rounded bg-white/10 font-mono text-[9px] text-white/70">{i + 1}</span>
                                {d.types[s.type]}
                                {s.confidence !== undefined && <span className="ml-auto tabular-nums">{fmt(d.confidence, { value: s.confidence })}</span>}
                              </p>
                              <p className="mt-1 truncate text-[13px] font-medium text-white/85">{s.label}</p>
                              <p className="truncate text-xs text-white/50">{s.detail}</p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Composer */}
          <div className="border-t border-white/[0.07] p-3 sm:px-5">
            <a href={askHref} className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] py-2 pr-2 pl-4 transition-colors hover:border-white/25">
              <span className="min-w-0 flex-1 truncate text-sm text-white/40">{d.placeholder}</span>
              <span className="hidden items-center gap-1 text-xs text-white/55 group-hover:text-white sm:inline-flex">
                {t.kai.tryDemo}
                <ArrowUpRight className="size-3.5" />
              </span>
              <span className="grid size-8 place-items-center rounded-xl bg-white text-[#0b0b0b]">
                <ArrowUp className="size-4" />
              </span>
            </a>
          </div>
        </div>
        <p className="mt-3 text-center font-mono text-[10px] tracking-[0.12em] text-white/35 uppercase">{d.fictional}</p>
      </div>
    </div>
  );
}
