"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowRight, Check, Eye, PenLine } from "lucide-react";
import { finishConnectAction, integrationAction } from "@/app/(onboarding)/start/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { DOMAIN_LABEL, INTEGRATIONS, type IntegrationDefinition, type IntegrationDomain } from "@/server/integrations/catalog";

const DOMAIN_ORDER: IntegrationDomain[] = ["revenue", "analytics", "search", "ads", "email", "social", "crm", "product", "creators"];

const RISK_LABEL: Record<IntegrationDefinition["risk"], string> = {
  read_only: "Read-only",
  publish: "Can publish after approval",
  spend: "Can spend within your budget",
  sensitive: "Sensitive data",
};

type Recommendation = { label: string; tone: "agent" | "neutral" | "outline" };

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

export function ConnectBoard({ slug, monthlyBudget, connected, canManage }: { slug: string; monthlyBudget: number; connected: { provider: string; mode: string }[]; canManage: boolean }) {
  const [showLater, setShowLater] = useState(false);
  const connectedSet = new Map(connected.map((c) => [c.provider, c.mode]));

  return (
    <div className="mt-6 space-y-7">
      {DOMAIN_ORDER.map((domain) => {
        const items = INTEGRATIONS.filter((i) => i.domain === domain && (showLater || i.priority !== "P2" || connectedSet.has(i.provider)));
        if (items.length === 0) return null;
        return (
          <section key={domain} aria-labelledby={`domain-${domain}`}>
            <h2 id={`domain-${domain}`} className="mb-2 text-sm font-semibold text-ink">
              {DOMAIN_LABEL[domain]}
            </h2>
            <div className="grid gap-2.5 md:grid-cols-2">
              {items.map((def) => (
                <IntegrationCard key={def.provider} slug={slug} def={def} mode={connectedSet.get(def.provider) ?? null} recommendation={recommendationFor(def, monthlyBudget)} canManage={canManage} />
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
          <p className="text-sm text-muted">{connected.length ? `${connected.length} connected. You can add more anytime.` : "You can skip this and connect later from Integrations."}</p>
          <button type="submit" className="inline-flex h-9 items-center gap-2 rounded-md bg-ink px-4 text-sm font-medium text-white hover:bg-ink-hover">
            {connected.length ? "Build my strategy" : "Skip and build my strategy"} <ArrowRight className="size-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

export function IntegrationCard({
  slug,
  def,
  mode,
  recommendation,
  canManage,
  action = integrationAction,
}: {
  slug: string;
  def: IntegrationDefinition;
  mode: string | null;
  recommendation: Recommendation;
  canManage: boolean;
  action?: typeof integrationAction;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const isConnected = mode !== null;

  const toggle = (connect: boolean) =>
    start(async () => {
      const r = await action(slug, def.provider, connect);
      if (r.ok) {
        setOpen(false);
        setError(null);
        router.refresh();
      } else setError(r.error);
    });

  return (
    <article className={cn("rounded-lg border bg-surface", open ? "border-line-strong" : "border-line")}>
      <div className="flex items-start gap-3 p-3.5">
        <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-md border border-line bg-raised text-xs font-semibold text-ink">
          {def.name.slice(0, 2)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-medium text-ink">{def.name}</h3>
            {isConnected ? (
              <Badge tone="positive">
                <Check className="size-3" /> Connected{mode === "demo" ? " · demo" : ""}
              </Badge>
            ) : (
              <Badge tone={recommendation.tone}>{recommendation.label}</Badge>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted">{def.unlocks}</p>
        </div>
        {canManage &&
          (isConnected ? (
            <Button size="sm" variant="ghost" pending={pending} onClick={() => toggle(false)}>
              Disconnect
            </Button>
          ) : (
            <Button size="sm" variant="secondary" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
              Connect
            </Button>
          ))}
      </div>
      {open && !isConnected && (
        <div className="border-t border-line bg-raised px-3.5 py-3">
          <p className="text-2xs font-medium text-subtle">Kaya will be able to</p>
          <ul className="mt-1.5 space-y-1">
            {def.permissions.map((p) => (
              <li key={p.label} className="flex items-start gap-2 text-sm text-ink">
                {p.access === "read" ? <Eye className="mt-0.5 size-3.5 shrink-0 text-muted" /> : <PenLine className="mt-0.5 size-3.5 shrink-0 text-warning" />}
                <span>
                  <span className={cn("mr-1.5 text-2xs font-medium", p.access === "read" ? "text-muted" : "text-warning")}>{p.access === "read" ? "Read" : "Write"}</span>
                  {p.label}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-2xs text-muted">
            {RISK_LABEL[def.risk]}. Every write goes through your autonomy mode and budget limits, and is recorded in the audit log. Disconnect anytime.
          </p>
          <div className="mt-3 rounded-md border border-dashed border-line-strong bg-surface px-2.5 py-2 text-xs text-muted">
            Live {def.authType === "oauth" ? "OAuth" : "API key"} connection isn&apos;t configured in this build. Demo mode walks through the same flow without touching a real account, and everything it produces is labelled as demo.
          </div>
          {error && <p className="mt-2 text-xs text-negative">{error}</p>}
          <div className="mt-3 flex gap-2">
            <Button size="sm" variant="primary" pending={pending} onClick={() => toggle(true)}>
              Connect in demo mode
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </article>
  );
}
