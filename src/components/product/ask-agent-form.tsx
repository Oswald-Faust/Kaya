"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowUp } from "lucide-react";
import { askAgentAction } from "@/app/(app)/w/[workspace]/actions";
import { Spinner } from "@/components/ui/button";
import { useI18n } from "@/i18n/client";


export function AskAgentForm({ slug, initial = "" }: { slug: string; initial?: string }) {
  const { t } = useI18n();
  const a = t.app.agent;
  const [value, setValue] = useState(initial);
  const ref = useRef<HTMLTextAreaElement>(null);
  return (
    <form action={askAgentAction.bind(null, slug)} className="rounded-lg border border-line-strong bg-surface focus-within:border-agent">
      <label htmlFor="agent-goal" className="sr-only">
        {a.formLabel}
      </label>
      <textarea
        id="agent-goal"
        ref={ref}
        name="goal"
        rows={3}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) e.currentTarget.form?.requestSubmit();
        }}
        placeholder={a.formPlaceholder}
        className="block w-full resize-none bg-transparent px-3.5 pt-3 text-base outline-none placeholder:text-subtle"
      />
      <div className="flex flex-wrap items-center gap-1.5 px-2.5 pt-1 pb-2.5">
        {a.suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              setValue(s);
              ref.current?.focus();
            }}
            className="h-6 rounded-sm border border-line px-2 text-2xs text-muted hover:border-line-strong hover:text-ink"
          >
            {s}
          </button>
        ))}
        <Submit disabled={value.trim().length < 3} />
      </div>
    </form>
  );
}

function Submit({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  const { t } = useI18n();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      aria-label={t.app.agent.run}
      className="ml-auto inline-flex h-7 items-center gap-1.5 rounded-md bg-agent px-2.5 text-xs font-medium text-white hover:bg-[#2238ad] disabled:opacity-50"
    >
      {pending ? (
        <>
          <Spinner /> {t.app.agent.planning}
        </>
      ) : (
        <>
          {t.app.agent.run} <ArrowUp className="size-3.5" />
        </>
      )}
    </button>
  );
}
