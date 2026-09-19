"use client";

import { useState, useTransition } from "react";
import { Check, Copy, ShieldCheck, UserRound } from "lucide-react";
import { decideApprovalAction } from "@/app/(app)/w/[workspace]/actions";
import { Button } from "@/components/ui/button";
import { RiskBadge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import type { PolicyDecision, RiskClass } from "@/server/domain/types";
import { useI18n } from "@/i18n/client";
import { translatePolicyText } from "@/i18n/domain-text";
import { translateRunText } from "@/i18n/run-text";

export interface ApprovalCardData {
  id: string;
  /** Tool the approval executes; founder hand-offs get a post-URL field. */
  tool?: string;
  title: string;
  change: string | null;
  reason: string;
  risk: RiskClass;
  experimentKey: string | null;
  policyDecision: PolicyDecision;
  createdAt: string;
}

export function ApprovalCard({ slug, approval, compact }: { slug: string; approval: ApprovalCardData; compact?: boolean }) {
  const { t, locale } = useI18n();
  const ap = t.app.approval;
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");
  const [showPolicy, setShowPolicy] = useState(false);
  const [postUrl, setPostUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const handOff = approval.tool === "experiments.founder_launch";
  // Hand-off reasons are "1. step 2. step … Tracked link: https://…".
  const linkMatch = handOff ? approval.reason.match(/https?:\/\/\S+$/) : null;
  const trackedLink = linkMatch?.[0] ?? null;
  const stepsText = trackedLink ? approval.reason.slice(0, approval.reason.lastIndexOf(trackedLink)).replace(/[^.]*:\s*$/, "").trim() : approval.reason;
  const handOffSteps = handOff ? stepsText.split(/\s*(?=\d+\.\s)/).map((x) => x.replace(/^\d+\.\s*/, "").trim()).filter(Boolean) : [];

  const decide = (decision: "approved" | "rejected") =>
    start(async () => {
      const r = await decideApprovalAction({ slug, approvalId: approval.id, decision, note: (decision === "approved" && handOff ? postUrl.trim() : note) || undefined });
      setResult(r.ok ? { ok: true, text: r.message ?? ap.done } : { ok: false, text: r.error });
    });

  if (result?.ok) {
    return (
      <div role="status" className="rounded-md border border-line bg-raised px-3 py-2.5 text-sm text-muted">
        <span className="font-medium text-ink">{translateRunText(approval.title, locale)}</span> · {result.text}
      </div>
    );
  }

  const failedChecks = approval.policyDecision.checks.filter((c) => !c.passed);

  return (
    <article className={cn("rounded-md border border-line bg-surface", compact ? "p-3" : "p-4")}>
      <div className="flex items-center gap-2 text-2xs text-muted">
        {handOff ? (
          <span className="inline-flex items-center gap-1 font-medium text-warning">
            <UserRound className="size-3" /> {ap.founderTask}
          </span>
        ) : (
          <span className="font-medium text-agent">{ap.agentWants}</span>
        )}
        <RiskBadge risk={approval.risk} />
        {approval.experimentKey && <span className="tabular">{approval.experimentKey}</span>}
      </div>
      <h3 className="mt-1.5 text-sm font-semibold text-ink">{translateRunText(approval.title, locale)}</h3>
      {approval.change && <p className="mt-0.5 text-sm font-medium text-ink tabular">{translateRunText(approval.change, locale)}</p>}
      {handOff ? (
        <div className="mt-2 space-y-2.5">
          <ol className="space-y-1.5">
            {handOffSteps.map((step, i) => (
              <li key={i} className="flex gap-2 text-sm text-ink">
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-sunken text-2xs font-medium text-muted">{i + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          {trackedLink && (
            <div className="flex items-center gap-2 rounded-md border border-line bg-raised px-2.5 py-1.5">
              <span className="shrink-0 text-2xs text-muted">{ap.trackedLink}</span>
              <code className="min-w-0 flex-1 truncate text-xs text-ink">{trackedLink}</code>
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard.writeText(trackedLink);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
                className="inline-flex shrink-0 items-center gap-1 text-2xs font-medium text-agent hover:underline"
              >
                {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
                {copied ? ap.copied : ap.copy}
              </button>
            </div>
          )}
          {!rejecting && (
            <label className="block">
              <span className="text-2xs text-muted">{ap.postUrlLabel}</span>
              <input
                type="url"
                value={postUrl}
                onChange={(e) => setPostUrl(e.target.value)}
                placeholder={ap.postUrlPlaceholder}
                className="mt-1 h-9 w-full rounded-md border border-line-strong bg-surface px-2.5 text-sm outline-none focus:border-agent"
              />
            </label>
          )}
        </div>
      ) : (
        <p className="mt-1.5 text-sm text-muted">{approval.reason}</p>
      )}

      <button type="button" onClick={() => setShowPolicy((s) => !s)} className="mt-2 inline-flex items-center gap-1 text-2xs text-muted hover:text-ink" aria-expanded={showPolicy}>
        <ShieldCheck className="size-3" />
        {ap.why}
      </button>
      {showPolicy && (
        <ul className="mt-1.5 space-y-1 rounded-md bg-raised p-2 text-2xs">
          {approval.policyDecision.checks.map((c) => (
            <li key={c.rule} className="flex gap-2">
              <span className={cn("w-3 shrink-0 font-semibold", c.passed ? "text-positive" : c.hard ? "text-negative" : "text-warning")}>{c.passed ? "✓" : "!"}</span>
              <span className="text-muted">
                <span className="text-ink">{translatePolicyText(c.rule, locale)}:</span> {translatePolicyText(c.detail, locale)}
              </span>
            </li>
          ))}
        </ul>
      )}
      {!showPolicy && failedChecks[0] && <p className="sr-only">{translatePolicyText(failedChecks[0].detail, locale)}</p>}

      {rejecting && (
        <label className="mt-3 block">
          <span className="text-2xs text-muted">{ap.rejectWhy}</span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="mt-1 w-full resize-none rounded-md border border-line-strong bg-surface px-2 py-1.5 text-sm outline-none focus:border-agent"
            placeholder={ap.rejectPlaceholder}
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
              {ap.reject}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setRejecting(false)} disabled={pending}>
              {ap.cancel}
            </Button>
          </>
        ) : (
          <>
            <Button size="sm" variant="primary" pending={pending} onClick={() => decide("approved")}>
              {handOff ? ap.postedApprove : ap.approve}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setRejecting(true)} disabled={pending}>
              {ap.reject}
            </Button>
          </>
        )}
      </div>
    </article>
  );
}
