"use client";

import { useEffect, useRef, useState } from "react";

export interface PolledStep {
  id: string;
  seq: number;
  kind: string;
  title: string;
  detail: string | null;
  status: string;
}

export interface PolledRun<R> {
  status: string;
  error: string | null;
  result: R | null;
  steps: PolledStep[];
}

const TERMINAL = new Set(["completed", "failed", "cancelled", "awaiting_approval"]);

/** Polls a run until it reaches a terminal state. Backs off on network errors. */
export function useRunPoll<R>(slug: string, runId: string | null, initial: PolledRun<R> | null, intervalMs = 700) {
  const [run, setRun] = useState<PolledRun<R> | null>(initial);
  const [offline, setOffline] = useState(false);
  const failures = useRef(0);

  useEffect(() => {
    if (!runId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      try {
        const res = await fetch(`/api/w/${slug}/runs/${runId}`, { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as PolledRun<R>;
        if (cancelled) return;
        failures.current = 0;
        setOffline(false);
        setRun(data);
        if (TERMINAL.has(data.status)) return;
      } catch {
        failures.current++;
        if (failures.current >= 3) setOffline(true);
      }
      if (!cancelled) timer = setTimeout(tick, intervalMs * Math.min(4, 1 + failures.current));
    };
    if (!initial || !TERMINAL.has(initial.status)) tick();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // initial is only the first snapshot; polling is keyed by the run.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, runId, intervalMs]);

  return { run, offline, done: run ? TERMINAL.has(run.status) : false };
}
