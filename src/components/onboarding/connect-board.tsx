"use client";

import { Suspense, useState } from "react";
import { ArrowRight } from "lucide-react";
import { finishConnectAction } from "@/app/(onboarding)/start/actions";
import { ConnectNotice } from "@/components/integrations/connect-notice";
import { IntegrationCard, type Recommendation } from "@/components/integrations/integration-card";
import { DOMAIN_LABEL, INTEGRATIONS, type IntegrationDefinition, type IntegrationDomain } from "@/server/integrations/catalog";
import type { ConnectionView, ConnectSpec } from "@/server/integrations/view";

const DOMAIN_ORDER: IntegrationDomain[] = ["revenue", "analytics", "search", "ads", "email", "social", "crm", "product", "creators"];

export function recommendationFor(def: IntegrationDefinition, monthlyBudget: number): Recommendation {
  switch (def.provider) {
    case "stripe":
      return { label: "Required to measure revenue", tone: "agent" };
    case "google_analytics":
      return { label: "Recommended", tone: "agent" };
    case "posthog":
      return { label: "Recommended for activation", tone: "neutral" };
    case "search_console":
      return { label: "Recommended", tone: "neutral" };
    case "google_ads":
      return monthlyBudget >= 300 ? { label: "Required to launch search tests", tone: "agent" } : { label: "Optional at your budget", tone: "outline" };
    case "meta_ads":
      return monthlyBudget >= 500 ? { label: "Optional", tone: "outline" } : { label: "Not needed at your budget", tone: "outline" };
    case "resend":
    case "brevo":
      return { label: "Required for lifecycle email tests", tone: "neutral" };
    default:
      return { label: "Optional", tone: "outline" };
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
              {DOMAIN_LABEL[domain]}
            </h2>
            <div className="grid items-start gap-3 md:grid-cols-2">
              {items.map((def) => (
                <IntegrationCard
                  key={def.provider}
                  slug={slug}
                  def={def}
                  spec={specs[def.provider] ?? { type: "none" }}
                  connection={byProvider.get(def.provider) ?? null}
                  recommendation={recommendationFor(def, monthlyBudget)}
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
          Show integrations planned for later (LinkedIn Ads, TikTok, CRM, GitHub)
        </button>
      )}

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/95 backdrop-blur-sm">
        <form action={finishConnectAction.bind(null, slug)} className="mx-auto flex max-w-[980px] flex-wrap items-center justify-between gap-3 px-5 py-3">
          <p className="text-sm text-muted">{live ? `${live} connected. You can add more anytime.` : "You can skip this and connect later from Integrations."}</p>
          <button type="submit" className="inline-flex h-11 items-center gap-2 rounded-xl bg-ink px-5 text-[15px] font-medium text-white hover:bg-ink-hover">
            {live ? "Build my strategy" : "Skip and build my strategy"} <ArrowRight className="size-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
