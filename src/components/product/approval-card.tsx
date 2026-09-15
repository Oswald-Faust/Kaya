"use client";

import { useState, useTransition } from "react";
import { ShieldCheck } from "lucide-react";
import { decideApprovalAction } from "@/app/(app)/w/[workspace]/actions";
import { Button } from "@/components/ui/button";
import { RiskBadge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import type { PolicyDecision, RiskClass } from "@/server/domain/types";

export interface ApprovalCardData {
  id: string;
  title: string;
  change: string | null;
  reason: string;
  risk: RiskClass;
  experimentKey: string | null;
  policyDecision: PolicyDecision;
  createdAt: string;
}

export function ApprovalCard({ slug, approval, compact }: { slug: string; approval: ApprovalCardData; compact?: boolean }) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");
  const [showPolicy, setShowPolicy] = useState(false);

  const decide = (decision: "approved" | "rejected") =>
    start(async () => {
      const r = await decideApprovalAction({ slug, approvalId: approval.id, decision, note: note || undefined });
      setResult(r.ok ? { ok: true, text: r.message ?? "Done." } : { ok: false, text: r.error });
    });

  if (result?.ok) {
    return (
      <div role="status" className="rounded-md border border-line bg-raised px-3 py-2.5 text-sm text-muted">
        <span className="font-medium text-ink">{approval.title}</span> · {result.text}
      </div>
    );
  }

  const failedChecks = approval.policyDecision.checks.filter((c) => !c.passed);

  return (
    <article className={cn("rounded-md border border-line bg-surface", compact ? "p-3" : "p-4")}>
      <div className="flex items-center gap-2 text-2xs text-muted">
        <span className="font-medium text-agent">Agent wants to</span>
        <RiskBadge risk={approval.risk} />
        {approval.experimentKey && <span className="tabular">{approval.experimentKey}</span>}
      </div>
      <h3 className="mt-1.5 text-sm font-semibold text-ink">{approval.title}</h3>
      {approval.change && <p className="mt-0.5 text-sm font-medium text-ink tabular">{approval.change}</p>}
      <p className="mt-1.5 text-sm text-muted">{approval.reason}</p>

      <button type="button" onClick={() => setShowPolicy((s) => !s)} className="mt-2 inline-flex items-center gap-1 text-2xs text-muted hover:text-ink" aria-expanded={showPolicy}>
        <ShieldCheck className="size-3" />
        Why approval is required
      </button>
      {showPolicy && (
        <ul className="mt-1.5 space-y-1 rounded-md bg-raised p-2 text-2xs">
          {approval.policyDecision.checks.map((c) => (
            <li key={c.rule} className="flex gap-2">
              <span className={cn("w-3 shrink-0 font-semibold", c.passed ? "text-positive" : c.hard ? "text-negative" : "text-warning")}>{c.passed ? "✓" : "!"}</span>
              <span className="text-muted">
                <span className="text-ink">{c.rule}:</span> {c.detail}
              </span>
            </li>
          ))}
        </ul>
      )}
      {!showPolicy && failedChecks[0] && <p className="sr-only">{failedChecks[0].detail}</p>}

      {rejecting && (
        <label className="mt-3 block">
          <span className="text-2xs text-muted">Tell the agent why (optional, saved to memory)</span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="mt-1 w-full resize-none rounded-md border border-line-strong bg-surface px-2 py-1.5 text-sm outline-none focus:border-agent"
            placeholder="e.g. Wait until EXP-005 finishes"
          />
        </label>
      )}

      {result && !result.ok && (
        <p role="alert" className="mt-2 text-xs text-negative">
          {result.text}
        </p>
      )}

      <div className="mt-3 flex items-center gap-2">
        {rejecting ? (
          <>
            <Button size="sm" variant="danger" pending={pending} onClick={() => decide("rejected")}>
              Reject
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setRejecting(false)} disabled={pending}>
              Cancel
            </Button>
          </>
        ) : (
          <>
            <Button size="sm" variant="primary" pending={pending} onClick={() => decide("approved")}>
              Approve
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setRejecting(true)} disabled={pending}>
              Reject
            </Button>
          </>
        )}
      </div>
    </article>
  );
}
