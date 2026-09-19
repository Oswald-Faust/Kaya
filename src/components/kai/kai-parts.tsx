"use client";

import { useState } from "react";
import { BookOpen, BrainCircuit, ChevronDown, Compass, FlaskConical, Lightbulb, Megaphone, Swords, Target, Users } from "lucide-react";
import { cn } from "@/lib/cn";
import type { KaiSource } from "@/server/db/schema";

/**
 * Pieces of the Kai conversation that are about reading, not state: how an
 * answer is laid out, how its sources are shown, and how history is grouped.
 */

const UNVERIFIED = /^(À vérifier|Unverified)\s*:\s*/i;

type Block = { kind: "heading"; text: string } | { kind: "bullet"; text: string; unverified: boolean } | { kind: "text"; text: string; unverified: boolean };

/** Kai writes sections as a title line followed by "• " lines. */
export function parseAnswer(content: string): Block[] {
  const blocks: Block[] = [];
  const lines = content.split("\n");
  lines.forEach((raw, i) => {
    const line = raw.trimEnd();
    if (!line.trim()) return;
    if (line.startsWith("• ")) {
      const text = line.slice(2);
      blocks.push({ kind: "bullet", text: text.replace(UNVERIFIED, ""), unverified: UNVERIFIED.test(text) });
      return;
    }
    const next = lines[i + 1]?.trimStart() ?? "";
    if (next.startsWith("• ") && line.length <= 80) {
      blocks.push({ kind: "heading", text: line });
      return;
    }
    // Lines right under a bullet, with no blank line between (pains, triggers…), belong to it.
    const previous = blocks.at(-1);
    if (previous?.kind === "bullet" && lines[i - 1]?.trim()) {
      previous.text += `\n${line}`;
      return;
    }
    blocks.push({ kind: "text", text: line.replace(UNVERIFIED, ""), unverified: UNVERIFIED.test(line) });
  });
  return blocks;
}

export function KaiAnswer({ content, unverifiedLabel }: { content: string; unverifiedLabel: string }) {
  const blocks = parseAnswer(content);
  const out: React.ReactNode[] = [];
  let bullets: Block[] = [];
  const flush = (key: string) => {
    if (!bullets.length) return;
    out.push(
      <ul key={key} className="space-y-2">
        {bullets.map((b, i) => (
          <li key={i} className="flex gap-2.5">
            <span className="mt-[9px] size-1.5 shrink-0 rounded-full bg-agent/50" />
            <span className="min-w-0 whitespace-pre-wrap">
              {"unverified" in b && b.unverified && <Unverified label={unverifiedLabel} />}
              <Named text={b.text} />
            </span>
          </li>
        ))}
      </ul>,
    );
    bullets = [];
  };
  blocks.forEach((b, i) => {
    if (b.kind === "bullet") {
      bullets.push(b);
      return;
    }
    flush(`ul-${i}`);
    if (b.kind === "heading") {
      out.push(
        <h4 key={i} className="pt-1 text-[13px] font-semibold tracking-[-0.01em] text-ink">
          {b.text}
        </h4>,
      );
    } else {
      out.push(
        <p key={i} className="whitespace-pre-wrap">
          {b.unverified && <Unverified label={unverifiedLabel} />}
          {b.text}
        </p>,
      );
    }
  });
  flush("ul-end");
  return <div className="space-y-3 text-[15px] leading-7 text-ink/90">{out}</div>;
}

/** "Cronitor — Free tier…": the name before the dash is what the eye looks for. */
function Named({ text }: { text: string }) {
  const cut = text.indexOf(" — ");
  if (cut <= 0 || cut > 70) return <>{text}</>;
  return (
    <>
      <span className="font-medium text-ink">{text.slice(0, cut)}</span>
      <span className="text-muted"> — </span>
      {text.slice(cut + 3)}
    </>
  );
}

function Unverified({ label }: { label: string }) {
  return <span className="mr-1.5 rounded-md bg-sun-soft px-1.5 py-0.5 align-[1px] font-mono text-[10px] tracking-wide text-sun-deep uppercase">{label}</span>;
}

const SOURCE_ICON: Record<KaiSource["type"], typeof BookOpen> = {
  fact: BookOpen,
  icp: Users,
  persona: Users,
  competitor: Swords,
  learning: Lightbulb,
  strategy: Compass,
  metric: Target,
  brand: Megaphone,
};

export function KaiSources({ sources, labels }: { sources: KaiSource[]; labels: { title: string; showAll: string; showLess: string; types: Record<KaiSource["type"], string> } }) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const visible = open ? sources : sources.slice(0, 3);
  return (
    <div className="mt-4">
      <p className="flex items-center gap-1.5 text-xs text-muted">
        <BrainCircuit className="size-3.5 text-agent" />
        {labels.title}
      </p>
      <ul className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {visible.map((s, i) => {
          const Icon = SOURCE_ICON[s.type] ?? BookOpen;
          const isOpen = expanded === i;
          return (
            <li key={i} className={cn(isOpen && "sm:col-span-2 xl:col-span-3")}>
              <button
                type="button"
                onClick={() => setExpanded(isOpen ? null : i)}
                aria-expanded={isOpen}
                className={cn("w-full rounded-xl border px-3 py-2 text-left transition-colors", isOpen ? "border-agent/40 bg-agent-soft/50" : "border-line bg-surface hover:border-line-strong")}
              >
                <span className="flex items-center gap-2 text-[11px] text-muted">
                  <span className="grid size-4 place-items-center rounded bg-sunken font-mono text-[9px] text-ink">{i + 1}</span>
                  <Icon className="size-3" />
                  {labels.types[s.type] ?? s.type}
                  {typeof s.confidence === "number" && (
                    <span className="ml-auto flex items-center gap-1.5 tabular-nums">
                      <span className="h-1 w-8 overflow-hidden rounded-full bg-sunken">
                        <span className={cn("block h-full rounded-full", s.confidence >= 0.7 ? "bg-positive" : "bg-sun")} style={{ width: `${Math.round(s.confidence * 100)}%` }} />
                      </span>
                      {Math.round(s.confidence * 100)}%
                    </span>
                  )}
                </span>
                <span className={cn("mt-1 block text-[13px] font-medium text-ink", !isOpen && "truncate")}>{s.label}</span>
                {s.detail && <span className={cn("mt-0.5 block text-xs leading-5 whitespace-pre-wrap text-muted", !isOpen && "line-clamp-1")}>{s.detail}</span>}
              </button>
            </li>
          );
        })}
      </ul>
      {sources.length > 3 && (
        <button type="button" onClick={() => setOpen((o) => !o)} className="mt-2 inline-flex items-center gap-1 text-xs text-muted hover:text-ink">
          {open ? labels.showLess : labels.showAll}
          <ChevronDown className={cn("size-3 transition-transform", open && "rotate-180")} />
        </button>
      )}
    </div>
  );
}

/** Today, yesterday, this week, then older: how people remember a conversation. */
export function groupConversations<T extends { updatedAt: Date | string }>(items: T[], labels: { today: string; yesterday: string; week: string; older: string }, now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const day = 86_400_000;
  const groups: { label: string; items: T[] }[] = [
    { label: labels.today, items: [] },
    { label: labels.yesterday, items: [] },
    { label: labels.week, items: [] },
    { label: labels.older, items: [] },
  ];
  for (const item of items) {
    const t = new Date(item.updatedAt).getTime();
    const bucket = t >= start ? 0 : t >= start - day ? 1 : t >= start - 6 * day ? 2 : 3;
    groups[bucket].items.push(item);
  }
  return groups.filter((g) => g.items.length);
}

export const STARTER_ICONS = { customers: Users, pricing: Target, competitors: Swords, strategy: Compass, learnings: FlaskConical } as const;
