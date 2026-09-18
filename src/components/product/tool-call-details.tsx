"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { RiskBadge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import type { RiskClass } from "@/server/domain/types";
import { useI18n } from "@/i18n/client";

export interface ToolCallView {
  id: string;
  tool: string;
  capability: string;
  risk: RiskClass;
  status: string;
  input: unknown;
  output: unknown;
  error: string | null;
  adapter: string | null;
  isDemo: boolean;
  dryRun: boolean;
  durationMs: number | null;
  idempotencyKey: string;
}

const STATUS_TONE: Record<string, string> = {
  succeeded: "text-positive",
  awaiting_approval: "text-warning",
  blocked: "text-negative",
  failed: "text-negative",
  rejected: "text-muted",
};


/** Readable by default; technical details (schemas, payloads, idempotency) on demand. */
export function ToolCallDetails({ call }: { call: ToolCallView }) {
  const [open, setOpen] = useState(false);
  const tl = useI18n().t.app.timeline;
  return (
    <div className="rounded-md border border-line bg-raised">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full flex-wrap items-center gap-x-2.5 gap-y-1 px-2.5 py-1.5 text-left text-2xs"
      >
        <ChevronRight className={cn("size-3 text-subtle transition-transform", open && "rotate-90")} />
        <code className="font-medium text-ink">{call.tool}</code>
        <RiskBadge risk={call.risk} />
        <span className={STATUS_TONE[call.status] ?? "text-muted"}>{tl.toolStatus[call.status] ?? call.status}</span>
        {call.isDemo && <span className="rounded-sm border border-dashed border-line-strong px-1 text-muted">{tl.demoConnection}</span>}
        {call.dryRun && <span className="text-muted">{tl.dryRun}</span>}
        {call.durationMs !== null && <span className="ml-auto text-subtle tabular">{call.durationMs} ms</span>}
      </button>
      {open && (
        <div className="space-y-2 border-t border-line px-2.5 py-2 text-2xs">
          <dl className="grid grid-cols-[96px_minmax(0,1fr)] gap-x-2 gap-y-1 text-muted">
            <dt>{tl.capability}</dt>
            <dd className="text-ink">{call.capability}</dd>
            {call.adapter && (
              <>
                <dt>{tl.adapter}</dt>
                <dd className="text-ink">{call.adapter}</dd>
              </>
            )}
            <dt>{tl.idempotency}</dt>
            <dd className="truncate text-ink" title={call.idempotencyKey}>
              {call.idempotencyKey}
            </dd>
          </dl>
          {call.error && <p className="text-negative">{call.error}</p>}
          <Payload label={tl.input} value={call.input} />
          {call.output !== null && call.output !== undefined && <Payload label={tl.output} value={call.output} />}
        </div>
      )}
    </div>
  );
}

function Payload({ label, value }: { label: string; value: unknown }) {
  return (
    <div>
      <p className="mb-0.5 text-muted">{label}</p>
      <pre className="max-h-56 overflow-auto rounded-sm bg-surface p-2 text-[11px] leading-4 text-ink">{JSON.stringify(value, null, 2)}</pre>
    </div>
  );
}
