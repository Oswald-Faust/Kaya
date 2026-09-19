"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowRight, Check, Play, Send } from "lucide-react";
import { advanceExperimentAction } from "@/app/(app)/w/[workspace]/actions";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n/format";
import { cn } from "@/lib/cn";

const STAGES = ["proposed", "awaiting_approval", "running", "evaluating", "completed"] as const;

export interface StageExperiment {
  id: string;
  key: string;
  number: number;
  status: string;
  outcome: string | null;
}

/**
 * Lifecycle tabs on a run page: shows where the experiment stands and lets the
 * founder send it to Approval or start it, without leaving the run.
 */
export function ExperimentStageTabs({ slug, runId, experiment, canManage, proofLabel, proofExample }: { slug: string; runId: string; experiment: StageExperiment; canManage: boolean; proofLabel: string | null; proofExample: string | null }) {
  const { t } = useI18n();
  const r = t.app.run;
  const stages = t.app.experiment.stages;
  const router = useRouter();
  const [pending, start] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [url, setUrl] = useState("");
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const current = Math.max(0, STAGES.indexOf(experiment.status as (typeof STAGES)[number]));
  const canApprove = canManage && experiment.status === "proposed";
  const canRun = canManage && (experiment.status === "proposed" || experiment.status === "awaiting_approval");

  const go = (target: "approval" | "running") =>
    start(async () => {
      const res = await advanceExperimentAction(slug, { runId, experimentId: experiment.id, target, url: target === "running" ? url : undefined });
      setFeedback(res.ok ? { ok: true, text: res.message ?? "" } : { ok: false, text: res.error });
      if (res.ok) {
        setConfirming(false);
        router.refresh();
      }
    });

  return (
    <section data-tour="run-stage" className="rounded-lg border border-line bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-3">
        <div>
          <h2 className="text-sm font-semibold text-ink">{r.stageTitle}</h2>
          <p className="text-2xs text-muted">{fmt(r.stageHint, { key: experiment.key })}</p>
        </div>
        <Link href={`/w/${slug}/experiments/${experiment.number}`} className="inline-flex items-center gap-1 text-xs font-medium text-agent hover:underline">
          {r.openExperiment} <ArrowRight className="size-3" />
        </Link>
      </div>

      <div role="tablist" aria-label={r.stageTitle} className="mt-3 flex overflow-x-auto border-y border-line">
        {STAGES.map((s, i) => {
          const done = i < current || (i === current && experiment.status === "completed");
          const isCurrent = i === current && experiment.status !== "completed";
          const action = s === "awaiting_approval" && canApprove ? () => go("approval") : s === "running" && canRun ? () => setConfirming(true) : null;
          const label = i === 4 && experiment.outcome ? (experiment.outcome === "winner" ? t.app.common.winner : experiment.outcome === "loser" ? t.app.common.loser : t.app.common.inconclusive) : stages[s];
          return (
            <button
              key={s}
              type="button"
              role="tab"
              aria-selected={isCurrent}
              disabled={!action || pending}
              onClick={action ?? undefined}
              className={cn(
                "flex min-w-[120px] flex-1 items-center gap-2 border-r border-line px-3 py-2.5 text-left text-xs last:border-r-0 disabled:cursor-default",
                isCurrent ? "bg-agent-soft font-medium text-agent" : done ? "text-ink" : "text-subtle",
                action && "cursor-pointer text-ink hover:bg-raised",
              )}
            >
              <span className={cn("grid size-4 shrink-0 place-items-center rounded-full text-[10px]", done ? "bg-ink text-white" : isCurrent ? "bg-agent text-white" : "border border-line-strong")}>
                {done ? <Check className="size-2.5" strokeWidth={3} /> : i + 1}
              </span>
              <span className="truncate">{label}</span>
              {action && (s === "awaiting_approval" ? <Send className="ml-auto size-3 shrink-0 text-agent" /> : <Play className="ml-auto size-3 shrink-0 text-agent" />)}
            </button>
          );
        })}
      </div>

      {confirming && (
        <div className="space-y-2.5 px-4 py-3">
          {proofLabel && (
            <label className="block">
              <span className="text-xs font-medium text-ink">{fmt(r.runningUrlLabel, { label: proofLabel })}</span>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={proofExample ?? "https://"}
                className="mt-1 h-9 w-full rounded-md border border-line-strong bg-surface px-2.5 font-mono text-xs outline-none focus:border-agent"
              />
            </label>
          )}
          <p className="text-2xs text-muted">{r.runningHint}</p>
          <div className="flex gap-2">
            <Button size="sm" variant="primary" pending={pending} onClick={() => go("running")}>
              {r.confirmRunning}
            </Button>
            <Button size="sm" variant="ghost" disabled={pending} onClick={() => setConfirming(false)}>
              {r.cancel}
            </Button>
          </div>
        </div>
      )}

      {(canApprove || canRun) && !confirming && (
        <div className="flex flex-wrap gap-2 px-4 py-3">
          {canApprove && (
            <Button size="sm" variant="secondary" pending={pending} icon={<Send className="size-3.5" />} onClick={() => go("approval")}>
              {r.toApproval}
            </Button>
          )}
          {canRun && (
            <Button size="sm" variant="primary" icon={<Play className="size-3.5" />} disabled={pending} onClick={() => setConfirming(true)}>
              {r.toRunning}
            </Button>
          )}
        </div>
      )}

      {feedback && <p role="status" className={cn("px-4 pb-3 text-xs", feedback.ok ? "text-positive" : "text-negative")}>{feedback.text}</p>}
    </section>
  );
}
