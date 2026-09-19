"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowUpRight, BarChart3, CheckCircle2, Globe, AlertTriangle, ExternalLink, X } from "lucide-react";
import { validatePublishedUrlAction } from "@/app/(app)/w/[workspace]/actions";
import { IntegrationCard } from "@/components/integrations/integration-card";
import { recommendationFor } from "@/components/onboarding/connect-board";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n/format";
import { cn } from "@/lib/cn";
import { INTEGRATIONS } from "@/server/integrations/catalog";
import type { ConnectionView, ConnectSpec } from "@/server/integrations/view";

const ANALYTICS_DEFS = INTEGRATIONS.filter((i) => i.domain === "analytics");

export interface PublishedUrlCardProps {
  slug: string;
  experimentId: string;
  experimentStatus: string;
  initialUrl: string | null;
  hasAnalytics: boolean;
  connectedProviders: string[];
  canManage?: boolean;
  isDemo?: boolean;
  connections?: ConnectionView[];
  specs?: Record<string, ConnectSpec>;
  returnTo?: string;
  /** From the measurement plan: label and example for the proof URL (page, HN item, post…). */
  proofLabel?: string;
  proofExample?: string;
  evaluation?: string;
  signalDays?: number;
  trackedLink?: string | null;
}

export function PublishedUrlCard({
  slug,
  experimentId,
  experimentStatus,
  initialUrl,
  hasAnalytics,
  connectedProviders,
  canManage = true,
  isDemo = false,
  connections = [],
  specs = {},
  returnTo,
  proofLabel,
  proofExample,
  evaluation,
  signalDays,
  trackedLink,
}: PublishedUrlCardProps) {
  const { locale, t } = useI18n();
  const d = t.app.deployment;
  const [url, setUrl] = useState(initialUrl ?? "");
  const [isEditing, setIsEditing] = useState(!initialUrl);
  const [validatedUrl, setValidatedUrl] = useState<string | null>(initialUrl);
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);

  useEffect(() => {
    if (!showAnalyticsModal) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowAnalyticsModal(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [showAnalyticsModal]);

  const byProvider = new Map(connections.map((c) => [c.provider, c]));

  const canLaunch = experimentStatus === "proposed" || experimentStatus === "awaiting_approval";

  const handleValidate = (launch: boolean) => {
    if (!url.trim()) {
      setFeedback({ ok: false, message: d.invalidUrl });
      return;
    }

    setFeedback(null);
    startTransition(async () => {
      const res = await validatePublishedUrlAction(slug, experimentId, url.trim(), launch);
      if (res.ok) {
        setValidatedUrl(res.url ?? url.trim());
        setIsEditing(false);
        setFeedback({ ok: true, message: res.message ?? d.urlSuccess });
      } else {
        setFeedback({ ok: false, message: res.error });
      }
    });
  };

  return (
    <>
      <Panel className="overflow-hidden">
        <PanelHeader
          title={
            <span className="flex items-center gap-2">
              <Globe className="size-4 text-subtle" />
              <span>{d.title}</span>
            </span>
          }
          description={d.hint}
        />

        <div className="space-y-4 border-t border-line p-4 text-sm">
          {evaluation && (
            <div className="space-y-1 rounded-md bg-raised p-3 text-xs">
              <p className="font-medium text-ink">{d.howMeasured}</p>
              <p className="leading-relaxed text-muted">{evaluation}</p>
              {signalDays ? <p className="text-subtle">{fmt(d.signalAfter, { days: signalDays })}</p> : null}
            </div>
          )}
          {trackedLink && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-ink">{d.trackedLinkLabel}</p>
              <code className="block rounded-md border border-line bg-surface px-2.5 py-1.5 text-2xs break-all text-ink select-all">{trackedLink}</code>
            </div>
          )}
          {/* Analytics Gate / Notice */}
          {!hasAnalytics ? (
            <div className="flex items-start gap-2.5 rounded-md border border-warning/30 bg-warning-soft p-3 text-xs text-warning">
              <AlertTriangle className="size-4 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-ink">{d.noAnalyticsTitle}</p>
                <p className="leading-relaxed text-muted">
                  {d.noAnalyticsBody}
                </p>
                <button
                  type="button"
                  onClick={() => setShowAnalyticsModal(true)}
                  className="inline-flex items-center gap-1 font-medium text-agent underline hover:text-agent-hover cursor-pointer"
                >
                  {d.connectAnalytics} <ArrowUpRight className="size-3" />
                </button>
              </div>
            </div>
          ) : (
          <div className="flex items-center gap-2 text-2xs text-positive">
            <CheckCircle2 className="size-3.5" />
            <span>{fmt(d.analyticsActive, { providers: connectedProviders.join(", ") || (locale === "fr" ? "connecté" : "connected") })}</span>
          </div>
        )}

        {/* URL Status & Form */}
        {validatedUrl && !isEditing ? (
          <div className="space-y-3 rounded-md bg-raised p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-2xs font-medium text-muted">{d.verifiedUrl}</p>
                <a
                  href={validatedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-0.5 inline-flex items-center gap-1.5 font-mono text-xs font-medium text-ink hover:text-agent hover:underline break-all"
                >
                  <span>{validatedUrl}</span>
                  <ExternalLink className="size-3 shrink-0 text-subtle" />
                </a>
              </div>
              <Badge tone="positive">200 OK</Badge>
            </div>

            <div className="flex items-center gap-2 pt-1 border-t border-line/60">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(true);
                  setFeedback(null);
                }}
                className="text-xs text-muted hover:text-ink transition-colors"
              >
                {d.editUrl}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label htmlFor="published-url-input" className="block text-xs font-medium text-ink">
                {proofLabel ?? d.urlLabel}
              </label>
              <p className="mt-0.5 text-2xs text-muted">
                {d.urlHint}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <input
                id="published-url-input"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={proofExample || "https://example.com/pricing-comparison"}
                className="w-full rounded-md border border-line-strong bg-surface px-3 py-1.5 font-mono text-xs text-ink outline-none transition-colors placeholder:text-subtle focus:border-agent"
                disabled={pending}
              />

              <div className="flex flex-wrap items-center gap-2 pt-1">
                {canLaunch ? (
                  <Button
                    size="sm"
                    variant="primary"
                    pending={pending}
                    onClick={() => handleValidate(true)}
                  >
                    {d.validateAndLaunch}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="secondary"
                    pending={pending}
                    onClick={() => handleValidate(false)}
                  >
                    {d.verifyAndSave}
                  </Button>
                )}

                {validatedUrl && (
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={pending}
                    onClick={() => {
                      setUrl(validatedUrl);
                      setIsEditing(false);
                      setFeedback(null);
                    }}
                  >
                    {d.cancel}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Feedback Message */}
        {feedback && (
          <div
            className={cn(
              "rounded-md p-2.5 text-xs",
              feedback.ok
                ? "bg-positive-soft text-positive border border-positive/20"
                : "bg-negative-soft text-negative border border-negative/20"
            )}
          >
            {feedback.message}
          </div>
        )}
      </div>
    </Panel>

    {showAnalyticsModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-ink/40 backdrop-blur-xs transition-opacity"
          onClick={() => setShowAnalyticsModal(false)}
        />

        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="connect-analytics-modal-title"
          className="relative z-10 w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-line bg-surface shadow-pop animate-rise"
        >
          {/* Modal Header */}
          <div className="flex items-start justify-between gap-4 border-b border-line p-5">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-agent/10 text-agent">
                <BarChart3 className="size-5" />
              </div>
              <div>
                <h2 id="connect-analytics-modal-title" className="text-base font-semibold text-ink">
                  {d.connectAnalyticsModalTitle}
                </h2>
                <p className="text-xs text-muted mt-0.5">
                  {d.connectAnalyticsModalDesc}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowAnalyticsModal(false)}
              className="grid size-8 place-items-center rounded-lg text-muted hover:bg-sunken hover:text-ink cursor-pointer"
              aria-label={d.close}
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-5 overflow-y-auto space-y-3 flex-1">
            {ANALYTICS_DEFS.map((def) => (
              <IntegrationCard
                key={def.provider}
                slug={slug}
                def={def}
                spec={specs[def.provider] ?? { type: "none" }}
                connection={byProvider.get(def.provider) ?? null}
                recommendation={recommendationFor(def, 0, t.onboarding.connect.recommendations)}
                canManage={canManage}
                isDemo={isDemo}
                returnTo={returnTo ?? `/w/${slug}/integrations`}
              />
            ))}
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-3.5 bg-raised/50 rounded-b-2xl">
            <Link
              href={`/w/${slug}/integrations`}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-ink"
            >
              <span>{d.viewAllIntegrations}</span>
              <ArrowUpRight className="size-3.5" />
            </Link>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowAnalyticsModal(false)}
            >
              {d.close}
            </Button>
          </div>
        </div>
      </div>
    )}
  </>
  );
}

