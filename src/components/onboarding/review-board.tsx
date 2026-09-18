"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import { ArrowRight, Check, Pencil, Plus, X } from "lucide-react";
import {
  addCompetitorAction,
  addContextAction,
  confirmFactsAction,
  correctFactAction,
  finishReviewAction,
  rejectFactAction,
  reviewCompetitorAction,
  reviewIcpAction,
  type MutationResult,
} from "@/app/(onboarding)/start/actions";
import { ConfidenceBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { useI18n } from "@/i18n/client";
import { fmt, plural } from "@/i18n/format";

export interface FactView {
  id: string;
  category: string;
  statement: string;
  kind: string;
  status: string;
  confidence: number;
  sourceLabel: string;
  evidence: string | null;
}

export interface IcpView {
  id: string;
  name: string;
  description: string;
  confidence: number;
  status: string;
  priority: number;
}

export interface CompetitorView {
  id: string;
  name: string;
  positioning: string | null;
  confidence: number;
  status: string;
}


const SECTIONS: { id: "identity" | "pricing" | "features" | "brand" | "context"; categories: string[] }[] = [
  { id: "identity", categories: ["identity", "positioning"] },
  { id: "pricing", categories: ["pricing"] },
  { id: "features", categories: ["feature"] },
  { id: "brand", categories: ["brand", "channel", "traction", "market"] },
  { id: "context", categories: ["context"] },
];

function useMutation() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const run = (fn: () => Promise<MutationResult>, onOk?: () => void) =>
    start(async () => {
      const r = await fn();
      if (r.ok) {
        setError(null);
        onOk?.();
        router.refresh();
      } else setError(r.error);
    });
  return { pending, error, run };
}

export function ReviewBoard({ slug, facts, icps, competitors, warnings }: { slug: string; facts: FactView[]; icps: IcpView[]; competitors: CompetitorView[]; warnings: string[] }) {
  const bulk = useMutation();
  const { t, locale } = useI18n();
  const c = t.onboarding.confirm;
  const reviewable = facts.length + icps.length + competitors.length;
  const reviewed = facts.filter((f) => f.status === "confirmed").length + icps.filter((i) => i.status === "confirmed").length + competitors.filter((c) => c.status === "confirmed").length;
  const highConfidence = facts.filter((f) => f.status === "proposed" && f.kind === "verified" && f.confidence >= 0.8);
  const remaining = reviewable - reviewed;

  return (
    <div className="mt-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-surface px-4 py-3">
        <div className="min-w-[200px] flex-1">
          <p className="text-sm text-ink tabular">
            {fmt(c.confirmedOf, { reviewed, total: reviewable })}
          </p>
          <div className="mt-1.5 h-1 w-full max-w-xs overflow-hidden rounded-full bg-sunken">
            <div className="h-full rounded-full bg-positive transition-[width] duration-500" style={{ width: `${reviewable ? (reviewed / reviewable) * 100 : 0}%` }} />
          </div>
        </div>
        {highConfidence.length > 0 && (
          <Button size="sm" variant="secondary" pending={bulk.pending} icon={<Check className="size-3.5" />} onClick={() => bulk.run(() => confirmFactsAction(slug, highConfidence.map((f) => f.id)))}>
            {fmt(c.confirmVerbatim, { count: highConfidence.length })}
          </Button>
        )}
        {bulk.error && <p className="w-full text-xs text-negative">{bulk.error}</p>}
      </div>

      {warnings.length > 0 && (
        <ul className="space-y-1 rounded-lg border border-warning/25 bg-warning-soft px-4 py-3 text-sm text-ink/80">
          {warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      )}

      <FactSection slug={slug} title={c.sections.identity} facts={facts.filter((f) => SECTIONS[0].categories.includes(f.category))} />

      <section aria-labelledby="audience-title">
        <h2 id="audience-title" className="mb-2 text-sm font-semibold text-ink">
          {c.whoBuys}
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          {icps.map((icp, i) => (
            <IcpCard key={icp.id} slug={slug} icp={icp} primary={i === 0} />
          ))}
          {icps.length === 0 && <p className="text-sm text-muted">{c.noAudience}</p>}
        </div>
      </section>

      {SECTIONS.slice(1, 3).map((s) => (
        <FactSection key={s.id} slug={slug} title={c.sections[s.id]} facts={facts.filter((f) => s.categories.includes(f.category))} />
      ))}

      <CompetitorSection slug={slug} competitors={competitors} />

      {SECTIONS.slice(3).map((s) => (
        <FactSection key={s.id} slug={slug} title={c.sections[s.id]} facts={facts.filter((f) => s.categories.includes(f.category))} hideWhenEmpty />
      ))}

      <AddContext slug={slug} />

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/95 backdrop-blur-sm">
        <form action={finishReviewAction.bind(null, slug)} className="mx-auto flex max-w-[920px] flex-wrap items-center justify-between gap-3 px-5 py-3">
          <p className="text-sm text-muted">
            {remaining > 0 ? plural(locale, remaining, c.remaining) : c.allReviewed}
          </p>
          <button type="submit" className="inline-flex h-9 items-center gap-2 rounded-md bg-ink px-4 text-sm font-medium text-white hover:bg-ink-hover">
            {c.continue} <ArrowRight className="size-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

function FactSection({ slug, title, facts, hideWhenEmpty }: { slug: string; title: string; facts: FactView[]; hideWhenEmpty?: boolean }) {
  const c = useI18n().t.onboarding.confirm;
  if (hideWhenEmpty && facts.length === 0) return null;
  return (
    <section aria-label={title}>
      <h2 className="mb-2 text-sm font-semibold text-ink">{title}</h2>
      <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
        {facts.map((f) => (
          <FactRow key={f.id} slug={slug} fact={f} />
        ))}
        {facts.length === 0 && <li className="px-4 py-3 text-sm text-subtle">{c.nothingFound}</li>}
      </ul>
    </section>
  );
}

function FactRow({ slug, fact }: { slug: string; fact: FactView }) {
  const m = useMutation();
  const c = useI18n().t.onboarding.confirm;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(fact.statement);
  const confirmed = fact.status === "confirmed";

  return (
    <li className={cn("group px-4 py-3", confirmed && "bg-raised/60")}>
      {editing ? (
        <div>
          <label className="sr-only" htmlFor={`fact-${fact.id}`}>
            {c.correct}
          </label>
          <textarea
            id={`fact-${fact.id}`}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={2}
            autoFocus
            className="w-full resize-none rounded-md border border-agent bg-surface px-2.5 py-1.5 text-sm outline-none"
          />
          <div className="mt-2 flex gap-2">
            <Button size="sm" variant="primary" pending={m.pending} onClick={() => m.run(() => correctFactAction(slug, fact.id, draft), () => setEditing(false))}>
              {c.saveCorrection}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
              {c.cancel}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className={cn("text-sm", confirmed ? "text-ink" : "text-ink/90")}>{fact.statement}</p>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-2xs text-muted">
              <span className={cn(fact.kind === "user_correction" && "text-agent")}>{(c.kinds as Record<string, string>)[fact.kind] ?? fact.kind}</span>
              {fact.kind !== "user_correction" && <ConfidenceBadge value={fact.confidence} />}
              <span>{fact.sourceLabel}</span>
              {fact.evidence && <span className="max-w-full truncate">“{fact.evidence}”</span>}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {confirmed ? (
              <span className="inline-flex h-7 items-center gap-1 px-2 text-xs font-medium text-positive">
                <Check className="size-3.5" /> {c.confirmed}
              </span>
            ) : (
              <IconButton label={c.confirmAction} onClick={() => m.run(() => confirmFactsAction(slug, [fact.id]))} disabled={m.pending} tone="positive">
                <Check />
              </IconButton>
            )}
            <IconButton label={c.edit} onClick={() => setEditing(true)} disabled={m.pending}>
              <Pencil />
            </IconButton>
            <IconButton label={c.remove} onClick={() => m.run(() => rejectFactAction(slug, fact.id))} disabled={m.pending}>
              <X />
            </IconButton>
          </div>
        </div>
      )}
      {m.error && <p className="mt-1 text-xs text-negative">{m.error}</p>}
    </li>
  );
}

function IcpCard({ slug, icp, primary }: { slug: string; icp: IcpView; primary: boolean }) {
  const m = useMutation();
  const c = useI18n().t.onboarding.confirm;
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(icp.name);
  const confirmed = icp.status === "confirmed";
  return (
    <article className={cn("rounded-lg border bg-surface p-4", primary ? "border-line-strong md:col-span-2" : "border-line")}>
      <p className={cn("text-2xs font-medium", primary ? "text-agent" : "text-subtle")}>{primary ? c.primaryAudience : c.alsoPossible}</p>
      {editing ? (
        <div className="mt-2 flex flex-wrap gap-2">
          <label htmlFor={`icp-${icp.id}`} className="sr-only">
            {c.audienceName}
          </label>
          <input id={`icp-${icp.id}`} value={name} onChange={(e) => setName(e.target.value)} autoFocus className="h-9 min-w-0 flex-1 rounded-md border border-agent px-2.5 text-base outline-none" />
          <Button size="md" variant="primary" pending={m.pending} onClick={() => m.run(() => reviewIcpAction(slug, icp.id, "confirmed", name), () => setEditing(false))}>
            {c.save}
          </Button>
          <Button size="md" variant="ghost" onClick={() => setEditing(false)}>
            {c.cancel}
          </Button>
        </div>
      ) : (
        <p className={cn("mt-1 font-semibold tracking-tight text-ink", primary ? "text-xl" : "text-base")}>{icp.name}</p>
      )}
      <p className="mt-1 text-sm text-muted">{icp.description}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {!confirmed && <ConfidenceBadge value={icp.confidence} />}
        <span className="ml-auto flex gap-1.5">
          {confirmed ? (
            <span className="inline-flex h-7 items-center gap-1 px-2 text-xs font-medium text-positive">
              <Check className="size-3.5" /> {c.confirmed}
            </span>
          ) : (
            <Button size="sm" variant="primary" pending={m.pending} onClick={() => m.run(() => reviewIcpAction(slug, icp.id, "confirmed"))}>
              {c.confirmAction}
            </Button>
          )}
          {!editing && (
            <Button size="sm" variant="secondary" onClick={() => setEditing(true)} disabled={m.pending}>
              {c.edit}
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => m.run(() => reviewIcpAction(slug, icp.id, "rejected"))} disabled={m.pending}>
            {c.notThem}
          </Button>
        </span>
      </div>
      {m.error && <p className="mt-2 text-xs text-negative">{m.error}</p>}
    </article>
  );
}

function CompetitorSection({ slug, competitors }: { slug: string; competitors: CompetitorView[] }) {
  const m = useMutation();
  const c = useI18n().t.onboarding.confirm;
  const [name, setName] = useState("");
  return (
    <section aria-labelledby="competitors-title">
      <h2 id="competitors-title" className="mb-2 text-sm font-semibold text-ink">
        {c.competitorsTitle}
      </h2>
      <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
        {competitors.map((c) => (
          <CompetitorRow key={c.id} slug={slug} competitor={c} />
        ))}
        <li className="px-4 py-2.5">
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (name.trim()) m.run(() => addCompetitorAction(slug, name), () => setName(""));
            }}
          >
            <label htmlFor="new-competitor" className="sr-only">
              {c.addCompetitor}
            </label>
            <input id="new-competitor" value={name} onChange={(e) => setName(e.target.value)} placeholder={c.addCompetitor} className="h-8 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-subtle" />
            <Button type="submit" size="sm" variant="ghost" pending={m.pending} icon={<Plus className="size-3.5" />}>
              {c.add}
            </Button>
          </form>
          {m.error && <p className="text-xs text-negative">{m.error}</p>}
        </li>
      </ul>
    </section>
  );
}

function CompetitorRow({ slug, competitor: c }: { slug: string; competitor: CompetitorView }) {
  const m = useMutation();
  const copy = useI18n().t.onboarding.confirm;
  const confirmed = c.status === "confirmed";
  return (
    <li className={cn("flex items-center gap-3 px-4 py-2.5", confirmed && "bg-raised/60")}>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-ink">{c.name}</p>
        {c.positioning && <p className="truncate text-2xs text-muted">{c.positioning}</p>}
      </div>
      {!confirmed && <ConfidenceBadge value={c.confidence} />}
      {confirmed ? (
        <span className="inline-flex h-7 items-center gap-1 px-2 text-xs font-medium text-positive">
          <Check className="size-3.5" /> {copy.confirmed}
        </span>
      ) : (
        <IconButton label={fmt(copy.confirmName, { name: c.name })} onClick={() => m.run(() => reviewCompetitorAction(slug, c.id, "confirmed"))} disabled={m.pending} tone="positive">
          <Check />
        </IconButton>
      )}
      <IconButton label={fmt(copy.removeName, { name: c.name })} onClick={() => m.run(() => reviewCompetitorAction(slug, c.id, "rejected"))} disabled={m.pending}>
        <X />
      </IconButton>
    </li>
  );
}

function AddContext({ slug }: { slug: string }) {
  const m = useMutation();
  const c = useI18n().t.onboarding.confirm;
  const [text, setText] = useState("");
  return (
    <section aria-labelledby="context-title" className="rounded-lg border border-dashed border-line-strong bg-surface p-4">
      <h2 id="context-title" className="text-sm font-semibold text-ink">
        {c.contextTitle}
      </h2>
      <p className="mt-0.5 text-xs text-muted">{c.contextHint}</p>
      <label htmlFor="context" className="sr-only">
        {c.addContext}
      </label>
      <textarea
        id="context"
        rows={3}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={c.contextPlaceholder}
        className="mt-2 w-full resize-none rounded-md border border-line-strong px-2.5 py-2 text-sm outline-none focus:border-agent"
      />
      <div className="mt-2 flex items-center justify-between">
        {m.error ? <p className="text-xs text-negative">{m.error}</p> : <span />}
        <Button size="sm" variant="secondary" pending={m.pending} disabled={text.trim().length < 4} onClick={() => m.run(() => addContextAction(slug, text), () => setText(""))}>
          {c.saveContext}
        </Button>
      </div>
    </section>
  );
}

function IconButton({ label, onClick, disabled, tone, children }: { label: string; onClick: () => void; disabled?: boolean; tone?: "positive"; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "grid size-7 place-items-center rounded-md text-subtle transition-colors hover:bg-sunken disabled:opacity-50 [&_svg]:size-3.5",
        tone === "positive" ? "hover:text-positive" : "hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}
