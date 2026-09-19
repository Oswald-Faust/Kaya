import type { Metadata } from "next";
import Link from "next/link";
import { and, count, eq, inArray, sum } from "drizzle-orm";
import { ArrowUpRight, Check, CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { Meter, SettingsHeader, SettingsRow, SettingsSection } from "@/components/settings/primitives";
import { PLANS, priceFor } from "@/components/pricing/plans";
import { requireWorkspace } from "@/server/context";
import { db } from "@/server/db/client";
import { campaigns, experiments, organizations, products, toolCalls, workspaces } from "@/server/db/schema";
import { canManageTeam } from "@/server/domain/team/seats";
import { getTeam } from "@/server/services/team";
import { formatDate, formatNumber, formatUsd } from "@/lib/format";
import { getI18n } from "@/i18n/server";
import { fmt, plural } from "@/i18n/format";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.settings.billing.title };
}

const TONE = { active: "positive", trialing: "agent", past_due: "negative", canceled: "neutral", expired: "warning", none: "neutral" } as const;

export default async function BillingSettingsPage({ params }: PageProps<"/w/[workspace]/settings/billing">) {
  const { workspace } = await params;
  const ctx = await requireWorkspace(workspace);
  const orgWorkspaces = db.select({ id: workspaces.id }).from(workspaces).where(eq(workspaces.organizationId, ctx.organizationId));
  const [
    { plan, seats },
    org,
    [{ productCount }],
    [{ running }],
    [{ actionCount }],
    [{ expSpend }],
    [{ campSpend }],
    { t, locale },
  ] = await Promise.all([
    getTeam(ctx),
    db.query.organizations.findFirst({ where: eq(organizations.id, ctx.organizationId) }),
    db.select({ productCount: count() }).from(products).where(inArray(products.workspaceId, orgWorkspaces)),
    db.select({ running: count() }).from(experiments).where(and(eq(experiments.workspaceId, ctx.workspaceId), eq(experiments.status, "running"))),
    db.select({ actionCount: count() }).from(toolCalls).where(and(inArray(toolCalls.workspaceId, orgWorkspaces), eq(toolCalls.status, "succeeded"))),
    db.select({ expSpend: sum(experiments.spend) }).from(experiments).where(inArray(experiments.workspaceId, orgWorkspaces)),
    db.select({ campSpend: sum(campaigns.spend) }).from(campaigns).where(inArray(campaigns.workspaceId, orgWorkspaces)),
    getI18n(),
  ]);
  const b = t.settings.billing;
  const def = PLANS.find((p) => p.id === plan.plan);
  const localizedPlan = def ? t.pricing.plans[def.id] : null;
  const tier = def?.tiers?.find((x) => x.actions === org?.planActions) ?? def?.tiers?.[0];
  const annual = org?.planInterval === "year";
  const manager = canManageTeam(ctx.role) && !ctx.isDemo;

  const totalSpend = Math.max(Number(expSpend ?? 0), Number(campSpend ?? 0));
  const actionsQuota = org?.planActions ?? tier?.actions ?? def?.tiers?.[0]?.actions ?? null;
  const spendLimit = def?.spendCap ?? null;

  const usage = [
    {
      label: b.seats,
      value: seats.used,
      max: seats.limit,
      display: `${seats.used} / ${seats.limit === null ? "∞" : seats.limit}`,
      href: `/w/${ctx.workspaceSlug}/settings/team`,
    },
    {
      label: b.products,
      value: productCount,
      max: def?.maxProducts ?? null,
      display: `${productCount} / ${def?.maxProducts ?? "∞"}`,
    },
    {
      label: b.running,
      value: running,
      max: def?.maxExperiments ?? null,
      display: `${running} / ${def?.maxExperiments ?? "∞"}`,
      href: `/w/${ctx.workspaceSlug}/experiments`,
    },
    {
      label: b.agentActions,
      value: actionCount,
      max: actionsQuota,
      display: `${formatNumber(actionCount, locale)} / ${actionsQuota === null ? "∞" : formatNumber(actionsQuota, locale)}`,
      href: `/w/${ctx.workspaceSlug}/agent`,
    },
    {
      label: b.agentSpend,
      value: totalSpend,
      max: spendLimit,
      display: `${formatUsd(totalSpend, { cents: false }, locale)} / ${spendLimit === null ? "∞" : formatUsd(spendLimit, { cents: false }, locale)}`,
      href: `/w/${ctx.workspaceSlug}/analytics`,
    },
  ];

  const manageButton = plan.billingManaged ? (
    <form action="/api/billing/portal" method="post">
      <input type="hidden" name="workspace" value={ctx.workspaceSlug} />
      <button type="submit" className={buttonClass("secondary", "md")}>
        <CreditCard className="size-3.5" />
        {b.manage}
      </button>
    </form>
  ) : (
    <Link href={`/start/${ctx.workspaceSlug}/plan`} className={buttonClass("primary", "md")}>
      {plan.plan === "free" || plan.plan === "none" ? b.upgrade : b.change}
      <ArrowUpRight className="size-3.5" />
    </Link>
  );

  return (
    <>
      <SettingsHeader title={b.title} description={b.description} />

      <SettingsSection>
        <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="flex items-center gap-2">
              <span className="text-xl font-semibold tracking-tight text-ink">{def?.name ?? b.noPlanYet}</span>
              <Badge tone={TONE[plan.status]}>{b.status[plan.status]}</Badge>
            </p>
            <p className="mt-1 text-sm text-muted">
              {tier && tier.monthly > 0 ? (
                <>
                  <span className="text-ink tabular">{formatUsd(priceFor(tier, annual), {}, locale)}</span>
                  {b.perMonth}
                  {annual ? b.billedYearly : ""} · {fmt(b.actions, { count: formatNumber(tier.actions, locale) })}
                </>
              ) : (
                (localizedPlan?.tagline ?? b.choosePlan)
              )}
            </p>
            {plan.status === "trialing" && plan.trialEndsAt && (
              <p className="mt-2 text-xs text-muted">
                {fmt(b.trialEnds, { date: formatDate(plan.trialEndsAt, { month: "long", day: "numeric" }, locale), days: plural(locale, plan.trialDaysLeft ?? 0, t.shell.topbar.daysLeft) })}
              </p>
            )}
            {plan.status === "past_due" && <p className="mt-2 text-xs text-negative">{b.pastDue}</p>}
          </div>
          {manager ? manageButton : <p className="text-xs text-muted">{b.managersOnly}</p>}
        </div>
      </SettingsSection>

      <SettingsSection title={b.usage}>
        {usage.map((u) => (
          <SettingsRow
            key={String(u.label)}
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
              <span className="w-32 shrink-0 text-right text-xs text-muted tabular">
                {u.display}
              </span>
            </div>
          </SettingsRow>
        ))}
      </SettingsSection>

      {def && localizedPlan && (
        <SettingsSection title={fmt(b.includes, { plan: def.name })}>
          <ul className="grid gap-x-6 gap-y-2 px-4 py-4 sm:grid-cols-2">
            {localizedPlan.features.map((f) => (
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
