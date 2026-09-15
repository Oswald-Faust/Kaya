"use client";

import { IntegrationCard, recommendationFor } from "@/components/onboarding/connect-board";
import { DOMAIN_LABEL, INTEGRATIONS, type IntegrationDomain } from "@/server/integrations/catalog";

const ORDER: IntegrationDomain[] = ["revenue", "analytics", "search", "ads", "email", "social", "crm", "product", "creators"];

export function IntegrationsCatalog({ slug, monthlyBudget, canManage, connected }: { slug: string; monthlyBudget: number; canManage: boolean; connected: { provider: string; mode: string }[] }) {
  const modes = new Map(connected.map((c) => [c.provider, c.mode]));
  return (
    <div className="space-y-6">
      {ORDER.map((domain) => {
        const items = INTEGRATIONS.filter((i) => i.domain === domain);
        return (
          <section key={domain} aria-labelledby={`int-${domain}`}>
            <h2 id={`int-${domain}`} className="mb-2 text-sm font-semibold text-ink">
              {DOMAIN_LABEL[domain]}
            </h2>
            <div className="grid gap-2.5 md:grid-cols-2">
              {items.map((def) => (
                <IntegrationCard key={def.provider} slug={slug} def={def} mode={modes.get(def.provider) ?? null} recommendation={recommendationFor(def, monthlyBudget)} canManage={canManage} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
