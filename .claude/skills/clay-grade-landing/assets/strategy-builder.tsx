"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { motion } from "motion/react";
import { BadgeCheck, CalendarDays, Coins, FlaskConical, MessageSquareQuote, PlugZap, Radar, Sparkles, Target, TriangleAlert, Wallet } from "lucide-react";
import { startStrategyAction } from "@/app/(onboarding)/start/actions";
import { DecideSpot, ExperimentSpot } from "@/components/brand/clay";
import { EASE, InView } from "@/components/marketing/motion";
import { Spinner } from "@/components/ui/button";
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

const OUTPUTS = [
  { icon: Radar, label: "Channel fit scores", tone: "bg-tangerine-soft text-tangerine-deep" },
  { icon: Coins, label: "Budget split", tone: "bg-sun-soft text-sun-deep" },
  { icon: MessageSquareQuote, label: "Positioning", tone: "bg-blue-soft text-blue-deep" },
  { icon: TriangleAlert, label: "Growth bottleneck", tone: "bg-pink-soft text-pink-deep" },
  { icon: CalendarDays, label: "30 / 60 / 90 plan", tone: "bg-lilac-soft text-lilac-deep" },
  { icon: FlaskConical, label: "First experiments", tone: "bg-grass-soft text-grass-deep" },
];

export function StrategyBuilder({
  slug,
  productName,
  runId: initialRunId,
  initialSteps,
  lastError,
  inputs,
}: {
  slug: string;
  productName: string;
  runId: string | null;
  initialSteps: PolledStep[];
  lastError: string | null;
  inputs: { goal: string; budget: string; facts: string; data: string };
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
  const steps = run?.steps ?? initialSteps;
  const done = steps.filter((s) => s.status === "done").length;
  const progress = Math.min(1, done / UPCOMING.length);

  const facts = [
    { icon: Target, label: "Goal", value: inputs.goal },
    { icon: Wallet, label: "Budget", value: inputs.budget },
    { icon: BadgeCheck, label: "Confirmed facts", value: inputs.facts },
    { icon: PlugZap, label: "Connected data", value: inputs.data },
  ];

  return (
    <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }} className="mt-10 overflow-hidden rounded-[32px] border border-line bg-surface shadow-float">
      <div className="grid lg:grid-cols-[1.15fr_0.85fr]">
        <div className="p-7 sm:p-12">
          <p className="inline-flex items-center gap-2 rounded-full bg-sunken px-3 py-1.5 text-sm text-muted">
            <span className="size-1.5 animate-pulse-dot rounded-full bg-agent" />
            {building ? "Building your strategy" : "Last step"}
          </p>
          <h1 className="mt-5 text-[clamp(34px,4vw,56px)] leading-[1.02] font-medium tracking-[-0.045em]">
            {building ? (
              <>
                Turning what we know
                <br />
                into a plan for {productName}
              </>
            ) : (
              <>
                {productName}&apos;s strategy
                <br />
                <span className="text-muted">is one click away.</span>
              </>
            )}
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
            Channel fit is scored in code from your audience, price point, budget and evidence. Every recommendation comes with its reasons, and nothing launches without your approval.
          </p>

          {building ? (
            <div className="mt-8">
              <div className="flex items-baseline justify-between text-sm">
                <span className="font-medium">
                  {done} of {UPCOMING.length} steps
                </span>
                <span className="text-muted tabular">{Math.round(progress * 100)}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-sunken">
                <motion.div className="h-full rounded-full bg-ink" animate={{ width: `${Math.max(progress, 0.06) * 100}%` }} transition={{ duration: 0.6, ease: EASE }} />
              </div>
              <div className="mt-6 rounded-2xl border border-line bg-raised p-5">
                <LiveSteps steps={steps} running upcoming={UPCOMING} />
              </div>
            </div>
          ) : (
            <>
              <dl className="mt-8 grid gap-3 sm:grid-cols-2">
                {facts.map((f, i) => (
                  <motion.div
                    key={f.label}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, ease: EASE, delay: 0.15 + i * 0.07 }}
                    className="flex items-start gap-3 rounded-2xl bg-raised p-4"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface shadow-sm">
                      <f.icon className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <dt className="text-sm text-muted">{f.label}</dt>
                      <dd className="truncate text-[15px] font-medium text-ink">{f.value}</dd>
                    </div>
                  </motion.div>
                ))}
              </dl>

              <div className="mt-8 space-y-3">
                {failure && <Notice tone="error" title="The last attempt stopped">{failure}</Notice>}
                {error && <Notice tone="error" title="Couldn't start">{error}</Notice>}
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    start(async () => {
                      const r = await startStrategyAction(slug);
                      if (r.ok) {
                        setError(null);
                        setRunId(r.runId);
                      } else setError(r.error);
                    })
                  }
                  className="inline-flex h-14 items-center gap-2.5 rounded-2xl bg-ink px-7 text-base font-medium text-white shadow-pop transition-transform hover:-translate-y-0.5 hover:bg-ink-hover disabled:opacity-70"
                >
                  {pending ? <Spinner className="size-4" /> : <Sparkles className="size-5 text-lime" />}
                  {failure ? "Try again" : "Build my strategy"}
                </button>
                <p className="text-sm text-subtle">About 20 seconds · Nothing launches without your approval</p>
              </div>
            </>
          )}
        </div>

        <InView className="relative flex min-h-[340px] items-center justify-center overflow-hidden bg-lime-soft p-8">
          <div aria-hidden className="bg-dots absolute inset-0" />
          <motion.div
            className="relative w-full max-w-[420px]"
            animate={building ? { rotate: [0, -2, 2, 0], scale: [1, 1.02, 1] } : undefined}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
          >
            <DecideSpot className="w-full" />
            <div className="absolute -right-4 -bottom-10 w-44 sm:w-52">
              <ExperimentSpot className="w-full" />
            </div>
          </motion.div>
        </InView>
      </div>

      <div className="border-t border-line bg-raised px-7 py-6 sm:px-12">
        <p className="font-mono text-[11px] tracking-[0.12em] text-subtle uppercase">What you&apos;ll get</p>
        <ul className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {OUTPUTS.map((o, i) => {
            const ready = building && i < done;
            return (
              <li key={o.label} className="flex items-center gap-2.5 rounded-xl bg-surface p-3">
                <span className={`grid size-8 shrink-0 place-items-center rounded-lg ${o.tone}`}>
                  <o.icon className="size-4" />
                </span>
                <span className="text-sm leading-tight font-medium">{o.label}</span>
                {ready && <BadgeCheck className="ml-auto size-4 text-grass-deep" />}
              </li>
            );
          })}
        </ul>
      </div>
    </motion.section>
  );
}
