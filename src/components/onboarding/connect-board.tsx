"use client";

import { Suspense, useState } from "react";
import { ArrowRight } from "lucide-react";
import { finishConnectAction } from "@/app/(onboarding)/start/actions";
import { ConnectNotice } from "@/components/integrations/connect-notice";
import { IntegrationCard, type Recommendation } from "@/components/integrations/integration-card";
import { DOMAIN_LABEL, INTEGRATIONS, type IntegrationDefinition, type IntegrationDomain } from "@/server/integrations/catalog";
import type { ConnectionView, ConnectSpec } from "@/server/integrations/view";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n/format";
import type { Dictionary } from "@/i18n/dictionaries";

const DOMAIN_ORDER: IntegrationDomain[] = ["revenue", "analytics", "search", "ads", "email", "social", "crm", "product", "creators"];

export function recommendationFor(def: IntegrationDefinition, monthlyBudget: number, r: Dictionary["onboarding"]["connect"]["recommendations"]): Recommendation {
  switch (def.provider) {
    case "stripe":
      return { label: r.revenue, tone: "agent" };
    case "google_analytics":
      return { label: r.recommended, tone: "agent" };
    case "posthog":
      return { label: r.activation, tone: "neutral" };
    case "search_console":
      return { label: r.recommended, tone: "neutral" };
    case "google_ads":
      return monthlyBudget >= 300 ? { label: r.search, tone: "agent" } : { label: r.optionalBudget, tone: "outline" };
    case "meta_ads":
      return monthlyBudget >= 500 ? { label: r.optional, tone: "outline" } : { label: r.notNeeded, tone: "outline" };
    case "resend":
    case "brevo":
      return { label: r.lifecycle, tone: "neutral" };
    default:
      return { label: r.optional, tone: "outline" };
  }
}

export function ConnectBoard({
  slug,
  monthlyBudget,
  connections,
  specs,
  canManage,
  isDemo,
}: {
  slug: string;
  monthlyBudget: number;
  connections: ConnectionView[];
  specs: Record<string, ConnectSpec>;
  canManage: boolean;
  isDemo: boolean;
}) {
  const { t } = useI18n();
  const cn_ = t.onboarding.connect;
  const [showLater, setShowLater] = useState(false);
  const byProvider = new Map(connections.map((c) => [c.provider, c]));
  const live = connections.filter((c) => c.status === "connected").length;

  return (
    <div className="mt-6 space-y-8">
      <Suspense>
        <ConnectNotice />
      </Suspense>
      {DOMAIN_ORDER.map((domain) => {
        const items = INTEGRATIONS.filter((i) => i.domain === domain && (showLater || i.priority !== "P2" || byProvider.has(i.provider)));
        if (items.length === 0) return null;
        return (
          <section key={domain} aria-labelledby={`domain-${domain}`}>
            <h2 id={`domain-${domain}`} className="mb-3 text-base font-medium text-ink">
              {t.integrations.domains[domain] ?? DOMAIN_LABEL[domain]}
            </h2>
            <div className="grid items-start gap-3 md:grid-cols-2">
              {items.map((def) => (
                <IntegrationCard
                  key={def.provider}
                  slug={slug}
                  def={def}
                  spec={specs[def.provider] ?? { type: "none" }}
                  connection={byProvider.get(def.provider) ?? null}
                  recommendation={recommendationFor(def, monthlyBudget, cn_.recommendations)}
                  canManage={canManage}
                  isDemo={isDemo}
                  returnTo={`/start/${slug}/connect`}
                />
              ))}
            </div>
          </section>
        );
      })}
      {!showLater && (
        <button type="button" onClick={() => setShowLater(true)} className="text-sm text-muted underline decoration-line-strong underline-offset-4 hover:text-ink">
          {cn_.showLater}
        </button>
      )}

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/95 backdrop-blur-sm">
        <form action={finishConnectAction.bind(null, slug)} className="mx-auto flex max-w-[980px] flex-wrap items-center justify-between gap-3 px-5 py-3">
          <p className="text-sm text-muted">{live ? fmt(cn_.connected, { count: live }) : cn_.skipHint}</p>
          <button type="submit" className="inline-flex h-11 items-center gap-2 rounded-xl bg-ink px-5 text-[15px] font-medium text-white hover:bg-ink-hover">
            {live ? cn_.build : cn_.skipBuild} <ArrowRight className="size-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
