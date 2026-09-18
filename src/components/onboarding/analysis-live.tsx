"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ArrowRight, RotateCcw } from "lucide-react";
import { retryAnalysisAction } from "@/app/(onboarding)/start/actions";
import { Notice } from "@/components/ui/states";
import type { AnalysisRunResult } from "@/server/intelligence/analyze";
import { LiveSteps } from "./live-steps";
import { ProductModel } from "./product-model";
import { useRunPoll, type PolledRun } from "./use-run-poll";
import { useI18n } from "@/i18n/client";
import { fmt, plural } from "@/i18n/format";
import { en } from "@/i18n/dictionaries/en";


export function AnalysisLive({ slug, runId, initial }: { slug: string; runId: string; initial: PolledRun<AnalysisRunResult> }) {
  const router = useRouter();
  const { t, locale } = useI18n();
  const a = t.onboarding.analyze;
  const upcoming = en.onboarding.analyze.upcoming.map((match, i) => ({ match, label: a.upcoming[i] }));
  const { run, offline } = useRunPoll<AnalysisRunResult>(slug, runId, initial);
  const status = run?.status ?? "queued";
  const result = run?.result ?? null;
  const running = status === "queued" || status === "running" || status === "planning";
  const completed = status === "completed";
  const failed = status === "failed";

  useEffect(() => {
    if (completed) router.prefetch(`/start/${slug}/confirm`);
  }, [completed, router, slug]);

  const host = result?.host ?? "";
  const name = result?.extraction?.productName.value || result?.manual?.name || host;

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)] lg:gap-8">
      <section aria-labelledby="analysis-title" className="lg:sticky lg:top-6 lg:self-start">
        <p className="text-xs text-muted">{completed ? a.complete : failed ? a.stopped : a.analyzing}</p>
        <h1 id="analysis-title" className="mt-1 truncate text-2xl font-semibold tracking-tight">
          {host || a.yourProduct}
        </h1>
        {result && (result.pagesRead > 0 || result.pagesFound > 0) && (
          <p className="mt-1 text-xs text-muted tabular">
            {plural(locale, result.pagesRead, a.pagesRead)}
            {result.pagesFound > result.pagesRead ? fmt(a.ofFound, { count: result.pagesFound }) : ""}
            {result.extractor === "llm" ? a.refined : ""}
          </p>
        )}
        <div className="mt-5 border-t border-line pt-3">
          <LiveSteps steps={run?.steps ?? []} running={running} upcoming={upcoming} />
        </div>
        {offline && <p className="mt-3 text-xs text-warning">{a.offline}</p>}
      </section>

      <section aria-label={a.learnedLabel} className="min-w-0">
        {failed ? (
          <div className="space-y-4">
            <Notice tone="error" title={a.failedTitle}>
              {run?.error ?? a.failedDefault} {a.failedHint}
            </Notice>
            <div className="flex flex-wrap gap-2">
              <form action={retryAnalysisAction.bind(null, slug)}>
                <button type="submit" className="inline-flex h-8 items-center gap-1.5 rounded-md bg-ink px-3 text-sm font-medium text-white hover:bg-ink-hover">
                  <RotateCcw className="size-3.5" /> {a.retry}
                </button>
              </form>
              <Link href="/start" className="inline-flex h-8 items-center rounded-md border border-line-strong bg-surface px-3 text-sm hover:bg-raised">
                {a.describe}
              </Link>
            </div>
            {result?.extraction && <ProductModel extraction={result.extraction} partial />}
          </div>
        ) : (
          <ProductModel extraction={result?.extraction ?? null} partial={!completed} />
        )}
      </section>

      {completed && (
        <div className="fixed inset-x-0 bottom-0 z-20 animate-rise border-t border-line bg-surface/95 backdrop-blur-sm">
          <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-3 px-5 py-3">
            <p className="text-sm text-muted">
              <span className="font-medium text-ink">{fmt(a.learned, { count: result?.factCount ?? a.several, name })}</span> {a.notTrue}
            </p>
            <Link href={`/start/${slug}/confirm`} className="inline-flex h-9 items-center gap-2 rounded-md bg-ink px-4 text-sm font-medium text-white hover:bg-ink-hover">
              {a.review} <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
