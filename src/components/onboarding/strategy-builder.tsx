"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Sparkles } from "lucide-react";
import { startStrategyAction } from "@/app/(onboarding)/start/actions";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/states";
import { LiveSteps } from "./live-steps";
import { useRunPoll, type PolledStep } from "./use-run-poll";

const UPCOMING = [
  "Reading confirmed business memory",
  "Scoring channel fit",
  "Allocating the budget",
  "Choosing positioning and messaging",
  "Identifying the growth bottleneck",
  "Designing first experiments",
  "Saving the strategy",
];

export function StrategyBuilder({
  slug,
  runId: initialRunId,
  initialSteps,
  lastError,
  inputs,
}: {
  slug: string;
  runId: string | null;
  initialSteps: PolledStep[];
  lastError: string | null;
  inputs: [string, string][];
}) {
  const router = useRouter();
  const [runId, setRunId] = useState(initialRunId);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const { run } = useRunPoll(slug, runId, runId ? { status: "running", error: null, result: null, steps: initialSteps } : null, 600);

  useEffect(() => {
    if (run?.status === "completed") router.refresh();
  }, [run?.status, router]);

  const building = Boolean(runId) && run?.status !== "failed";
  const failure = run?.status === "failed" ? run.error : !runId ? lastError : null;

  return (
    <div className="mx-auto mt-10 grid max-w-3xl gap-8 md:grid-cols-[minmax(0,1fr)_280px]">
      <section>
        <p className="text-xs text-muted">{building ? "Building" : "Last step"}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{building ? "Turning what we know into a strategy" : "Build your first strategy"}</h1>
        <p className="mt-1.5 text-base text-muted">
          Channel fit is scored in code from your audience, price point, budget and evidence. Every recommendation comes with its reasons, and nothing launches without your approval.
        </p>

        {building ? (
          <div className="mt-6 rounded-lg border border-line bg-surface p-4">
            <LiveSteps steps={run?.steps ?? initialSteps} running upcoming={UPCOMING} />
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {failure && <Notice tone="error" title="The last attempt stopped">{failure}</Notice>}
            {error && <Notice tone="error" title="Couldn't start">{error}</Notice>}
            <Button
              size="lg"
              variant="primary"
              pending={pending}
              icon={<Sparkles className="size-4" />}
              onClick={() =>
                start(async () => {
                  const r = await startStrategyAction(slug);
                  if (r.ok) {
                    setError(null);
                    setRunId(r.runId);
                  } else setError(r.error);
                })
              }
            >
              {failure ? "Try again" : "Build my strategy"}
            </Button>
          </div>
        )}
      </section>

      <aside className="rounded-lg border border-line bg-surface p-4 md:mt-8 md:self-start">
        <p className="text-2xs font-medium text-subtle">Built from</p>
        <dl className="mt-2 space-y-2.5">
          {inputs.map(([k, v]) => (
            <div key={k}>
              <dt className="text-2xs text-muted">{k}</dt>
              <dd className="text-sm text-ink">{v}</dd>
            </div>
          ))}
        </dl>
      </aside>
    </div>
  );
}
