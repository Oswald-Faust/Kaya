"use client";

import { Suspense } from "react";
import { ConnectNotice } from "@/components/integrations/connect-notice";
import { IntegrationCard } from "@/components/integrations/integration-card";
import { recommendationFor } from "@/components/onboarding/connect-board";
import { DOMAIN_LABEL, INTEGRATIONS, type IntegrationDomain } from "@/server/integrations/catalog";
import type { ConnectionView, ConnectSpec } from "@/server/integrations/view";

const ORDER: IntegrationDomain[] = ["revenue", "analytics", "search", "ads", "email", "social", "crm", "product", "creators"];

export function IntegrationsCatalog({
  slug,
  monthlyBudget,
  canManage,
  isDemo,
  connections,
  specs,
}: {
  slug: string;
  monthlyBudget: number;
  canManage: boolean;
  isDemo: boolean;
  connections: ConnectionView[];
  specs: Record<string, ConnectSpec>;
}) {
  const byProvider = new Map(connections.map((c) => [c.provider, c]));
  return (
    <div className="space-y-6">
      <Suspense>
        <ConnectNotice />
      </Suspense>
      {ORDER.map((domain) => {
        const items = INTEGRATIONS.filter((i) => i.domain === domain);
        return (
          <section key={domain} aria-labelledby={`int-${domain}`}>
            <h2 id={`int-${domain}`} className="mb-2 text-sm font-semibold text-ink">
              {DOMAIN_LABEL[domain]}
            </h2>
            <div className="grid items-start gap-2.5 md:grid-cols-2">
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
                  returnTo={`/w/${slug}/integrations`}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
