"use client";

import { useActionState, useId, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowRight } from "lucide-react";
import { startAnalysisAction, type FormState } from "@/app/(onboarding)/start/actions";
import { Spinner } from "@/components/ui/button";
import { useI18n } from "@/i18n/client";

export function StartForm({
  autoFocus = true,
  tone = "light",
  className = "mt-8",
  suggestions,
}: {
  autoFocus?: boolean;
  tone?: "light" | "dark";
  className?: string;
  /** Example domains that fill the URL field when clicked. */
  suggestions?: string[];
}) {
  const { t } = useI18n();
  const f = t.hero.startForm;
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const errorId = useId();
  const link = tone === "dark" ? "text-white/60 decoration-white/25 hover:text-white" : "text-muted decoration-line-strong hover:text-ink";
  const [mode, setMode] = useState<"url" | "manual">("url");
  const [state, action] = useActionState<FormState, FormData>(startAnalysisAction, { error: null });

  return (
    <form action={action} className={className}>
      <input type="hidden" name="mode" value={mode} />
      {mode === "url" ? (
        <>
          <label htmlFor={inputId} className="sr-only">
            {f.urlLabel}
          </label>
          <div className="flex flex-col gap-2 rounded-lg border border-line-strong bg-surface p-1.5 focus-within:border-agent focus-within:shadow-[0_0_0_3px_var(--color-agent-soft)] sm:flex-row sm:items-center">
            <input
              ref={inputRef}
              id={inputId}
              name="url"
              type="text"
              inputMode="url"
              autoComplete="url"
              autoFocus={autoFocus}
              required
              spellCheck={false}
              placeholder={f.urlPlaceholder}
              aria-invalid={Boolean(state.error) || undefined}
              aria-describedby={state.error ? errorId : undefined}
              className="h-11 min-w-0 flex-1 bg-transparent px-3 text-lg text-ink outline-none placeholder:text-subtle"
            />
            <Submit label={f.analyze} pendingLabel={f.starting} />
          </div>
          {suggestions?.length ? (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted">
              <span>{f.try}</span>
              {suggestions.map((domain) => (
                <button
                  key={domain}
                  type="button"
                  onClick={() => {
                    if (!inputRef.current) return;
                    inputRef.current.value = `https://${domain}`;
                    inputRef.current.focus();
                  }}
                  className="rounded-full border border-line bg-surface px-3 py-1 font-mono text-xs text-ink transition-colors hover:border-ink"
                >
                  {domain}
                </button>
              ))}
            </div>
          ) : null}
          <button type="button" onClick={() => setMode("manual")} className={`mt-3 text-sm underline underline-offset-4 ${link}`}>
            {f.noWebsite}
          </button>
        </>
      ) : (
        <div className="space-y-3 rounded-lg border border-line-strong bg-surface p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-medium text-muted">{f.productName}</span>
              <input name="name" required className="mt-1 h-9 w-full rounded-md border border-line-strong px-2.5 text-sm outline-none focus:border-agent" />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-muted">{f.website}</span>
              <input name="url" inputMode="url" placeholder="https://" className="mt-1 h-9 w-full rounded-md border border-line-strong px-2.5 text-sm outline-none focus:border-agent" />
            </label>
          </div>
          <label className="block">
            <span className="text-xs font-medium text-muted">{f.describe}</span>
            <textarea
              name="description"
              required
              rows={5}
              placeholder={f.describePlaceholder}
              className="mt-1 w-full resize-none rounded-md border border-line-strong px-2.5 py-2 text-sm outline-none focus:border-agent"
            />
          </label>
          <div className="flex items-center justify-between gap-3">
            <button type="button" onClick={() => setMode("url")} className="text-sm text-muted hover:text-ink">
              {f.useUrl}
            </button>
            <Submit label={f.analyzeDescription} pendingLabel={f.starting} />
          </div>
        </div>
      )}
      {state.error && (
        <p id={errorId} role="alert" className={`mt-3 text-sm ${tone === "dark" ? "text-[#ff9b8f]" : "text-negative"}`}>
          {state.error}
        </p>
      )}
    </form>
  );
}

function Submit({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-md bg-ink px-4 text-base font-medium text-white transition-colors hover:bg-ink-hover disabled:opacity-70"
    >
      {pending ? <Spinner /> : null}
      {pending ? pendingLabel : label}
      {!pending && <ArrowRight className="size-4" />}
    </button>
  );
}
