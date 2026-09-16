import Link from "next/link";
import { and, count, eq, inArray } from "drizzle-orm";
import { ArrowUpRight, Check, CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { Meter, SettingsHeader, SettingsRow, SettingsSection } from "@/components/settings/primitives";
import { PLANS, priceFor } from "@/components/pricing/plans";
import { requireWorkspace } from "@/server/context";
import { db } from "@/server/db/client";
import { experiments, organizations, products, workspaces } from "@/server/db/schema";
import { canManageTeam } from "@/server/domain/team/seats";
import { getTeam } from "@/server/services/team";
import { formatDate, formatUsd } from "@/lib/format";

export const metadata = { title: "Plan & billing" };

const STATUS: Record<string, { label: string; tone: "positive" | "warning" | "negative" | "neutral" | "agent" }> = {
  active: { label: "Active", tone: "positive" },
  trialing: { label: "Trial", tone: "agent" },
  past_due: { label: "Payment failed", tone: "negative" },
  canceled: { label: "Canceled", tone: "neutral" },
  expired: { label: "Trial ended", tone: "warning" },
  none: { label: "No plan", tone: "neutral" },
};

export default async function BillingSettingsPage({ params }: PageProps<"/w/[workspace]/settings/billing">) {
  const { workspace } = await params;
  const ctx = await requireWorkspace(workspace);
  const orgWorkspaces = db.select({ id: workspaces.id }).from(workspaces).where(eq(workspaces.organizationId, ctx.organizationId));
  const [{ plan, seats }, org, [{ productCount }], [{ running }]] = await Promise.all([
    getTeam(ctx),
    db.query.organizations.findFirst({ where: eq(organizations.id, ctx.organizationId) }),
    db.select({ productCount: count() }).from(products).where(inArray(products.workspaceId, orgWorkspaces)),
    db.select({ running: count() }).from(experiments).where(and(eq(experiments.workspaceId, ctx.workspaceId), eq(experiments.status, "running"))),
  ]);

  const def = PLANS.find((p) => p.id === plan.plan);
  const tier = def?.tiers?.find((x) => x.actions === org?.planActions) ?? def?.tiers?.[0];
  const annual = org?.planInterval === "year";
  const status = STATUS[plan.status] ?? STATUS.none;
  const manager = canManageTeam(ctx.role) && !ctx.isDemo;

  const usage = [
    { label: "Seats", value: seats.used, max: seats.limit, href: `/w/${ctx.workspaceSlug}/settings/team` },
    { label: "Products", value: productCount, max: def?.maxProducts ?? null },
    { label: "Experiments running", value: running, max: def?.maxExperiments ?? null },
  ];

  const manageButton = plan.billingManaged ? (
    <form action="/api/billing/portal" method="post">
      <input type="hidden" name="workspace" value={ctx.workspaceSlug} />
      <button type="submit" className={buttonClass("secondary", "md")}>
        <CreditCard className="size-3.5" />
        Manage billing
      </button>
    </form>
  ) : (
    <Link href={`/start/${ctx.workspaceSlug}/plan`} className={buttonClass("primary", "md")}>
      {plan.plan === "free" || plan.plan === "none" ? "Upgrade plan" : "Change plan"}
      <ArrowUpRight className="size-3.5" />
    </Link>
  );

  return (
    <>
      <SettingsHeader title="Plan & billing" description="Your subscription and what it includes." />

      <SettingsSection>
        <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="flex items-center gap-2">
              <span className="text-xl font-semibold tracking-tight text-ink">{def?.name ?? "No plan yet"}</span>
              <Badge tone={status.tone}>{status.label}</Badge>
            </p>
            <p className="mt-1 text-sm text-muted">
              {tier && tier.monthly > 0 ? (
                <>
                  <span className="text-ink tabular">{formatUsd(priceFor(tier, annual))}</span>/month{annual ? ", billed yearly" : ""} · {tier.actions.toLocaleString("en-US")} agent actions
                </>
              ) : (
                (def?.tagline ?? "Choose a plan to unlock your strategy and the agent.")
              )}
            </p>
            {plan.status === "trialing" && plan.trialEndsAt && (
              <p className="mt-2 text-xs text-muted">
                Trial ends {formatDate(plan.trialEndsAt, { month: "long", day: "numeric" })} · {plan.trialDaysLeft} day{plan.trialDaysLeft === 1 ? "" : "s"} left
              </p>
            )}
            {plan.status === "past_due" && <p className="mt-2 text-xs text-negative">Your last payment failed. Update your card to keep access.</p>}
          </div>
          {manager ? manageButton : <p className="text-xs text-muted">Only owners and admins manage billing.</p>}
        </div>
      </SettingsSection>

      <SettingsSection title="Usage">
        {usage.map((u) => (
          <SettingsRow
            key={u.label}
            label={
              u.href ? (
                <Link href={u.href} className="hover:underline">
                  {u.label}
                </Link>
              ) : (
                u.label
              )
            }
            stack
          >
            <div className="flex items-center gap-3">
              <Meter value={u.value} max={u.max} className="flex-1" />
              <span className="w-24 shrink-0 text-right text-xs text-muted tabular">
                {u.value} / {u.max === null ? "∞" : u.max}
              </span>
            </div>
          </SettingsRow>
        ))}
      </SettingsSection>

      {def && (
        <SettingsSection title={`${def.name} includes`}>
          <ul className="grid gap-x-6 gap-y-2 px-4 py-4 sm:grid-cols-2">
            {def.features.map((f) => (
              <li key={f} className="flex gap-2 text-sm text-ink">
                <Check className="mt-0.5 size-3.5 shrink-0 text-positive" />
                {f}
              </li>
            ))}
          </ul>
        </SettingsSection>
      )}
    </>
  );
}
