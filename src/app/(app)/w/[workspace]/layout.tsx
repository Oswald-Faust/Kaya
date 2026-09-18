import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CreditCard, LogOut } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { GrowthLoop } from "@/components/shell/growth-loop";
import { WorkspaceSwitcher } from "@/components/shell/workspace-switcher";
import { ProgressBar } from "@/components/ui/goal-progress";
import { Badge } from "@/components/ui/badge";
import { listWorkspacesForUser, requireWorkspace } from "@/server/context";
import { db } from "@/server/db/client";
import { experiments, users } from "@/server/db/schema";
import { getPrimaryProduct, getShellData } from "@/server/services/workspace";
import { rankQueue } from "@/server/services/experiments";
import { getPlanState } from "@/server/services/billing";
import { experimentKey, formatUsd } from "@/lib/format";
import { getI18n } from "@/i18n/server";
import { fmt, plural } from "@/i18n/format";

export default async function WorkspaceLayout({ children, params }: LayoutProps<"/w/[workspace]">) {
  const { workspace } = await params;
  const ctx = await requireWorkspace(workspace);
  const { t, locale } = await getI18n();
  const tb = t.shell.topbar;
  if (ctx.isGuest && !ctx.isDemo) redirect(`/signup?next=${encodeURIComponent(`/w/${workspace}`)}`);
  const plan = ctx.isDemo ? null : await getPlanState(ctx.organizationId);
  if (plan?.needsChoice) redirect(`/start/${ctx.workspaceSlug}/plan${plan.status === "expired" || plan.status === "canceled" ? "?expired=1" : ""}`);
  const [shell, workspaces, exps, account] = await Promise.all([
    getShellData(ctx),
    listWorkspacesForUser(ctx.userId),
    db.select({ number: experiments.number, name: experiments.name }).from(experiments).where(eq(experiments.workspaceId, ctx.workspaceId)).orderBy(desc(experiments.number)),
    db.query.users.findFirst({ where: eq(users.id, ctx.userId), columns: { tourCompletedAt: true } }),
  ]);
  const product = await getPrimaryProduct(ctx.workspaceId);
  // Kai needs to know what it would run first, from any screen.
  const ranked = product ? await rankQueue(ctx.workspaceId, product.id) : [];
  const top = ranked.find((r) => !r.suppressedBy);
  const assistant = {
    topAction: top ? { id: top.experiment.id, name: top.experiment.name } : null,
    pendingApprovals: shell.counts.pendingApprovals,
    firstName: ctx.name.split(" ")[0] ?? "",
  };
  const tour = { autoStart: !ctx.isGuest && !account?.tourCompletedAt, persist: !ctx.isGuest, firstName: ctx.name.split(" ")[0] ?? "" };

  const goal = shell.goal;
  const topBar = (
    <div className="flex min-w-0 flex-1 items-center gap-4">
      {goal && (
        <div className="hidden w-56 shrink-0 md:block" title={fmt(tb.progressTitle, { progress: Math.round(goal.progress * 100), expected: Math.round(goal.expectedProgress * 100) })}>
          <div className="flex items-baseline justify-between gap-2 text-2xs">
            <span className="truncate font-medium text-ink">{goal.displayTitle}</span>
            <span className={goal.onTrack ? "text-positive" : "text-warning"}>{goal.onTrack ? tb.onTrack : tb.behind}</span>
          </div>
          <ProgressBar value={goal.progress} expected={goal.expectedProgress} className="mt-1.5" />
          <div className="mt-1 text-2xs text-muted tabular">
            {fmt(tb.of, { current: goal.unit === "usd" ? formatUsd(goal.current, {}, locale) : goal.current, target: goal.unit === "usd" ? formatUsd(goal.target, {}, locale) : goal.target })}
          </div>
        </div>
      )}
      <div className="hidden min-w-0 flex-1 xl:block">
        <GrowthLoop slug={ctx.workspaceSlug} data={shell} />
      </div>
      <div className="ml-auto flex shrink-0 items-center gap-2">
        {ctx.isDemo && <Badge tone="outline" className="hidden border-dashed sm:inline-flex">{t.common.demoData}</Badge>}
        <span className="inline-flex h-7 items-center gap-1.5 rounded-md border border-line bg-surface px-2 text-xs text-ink" title={tb.autonomyMode}>
          <span className="size-1.5 rounded-full bg-agent" aria-hidden />
          {tb.autonomy[ctx.autonomyMode]}
        </span>
        <form action="/logout" method="post">
          <button type="submit" title={fmt(t.common.logOutUser, { email: ctx.email })} className="grid size-7 place-items-center rounded-md border border-line bg-surface text-muted hover:text-ink">
            <LogOut className="size-3.5" />
            <span className="sr-only">{t.common.logOut}</span>
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <AppShell
      slug={ctx.workspaceSlug}
      switcher={<WorkspaceSwitcher current={{ slug: ctx.workspaceSlug, name: ctx.workspaceName, isDemo: ctx.isDemo, iconUrl: ctx.workspaceIconUrl }} workspaces={workspaces} />}
      topBar={topBar}
      billing={
        plan && plan.status === "trialing" && !plan.billingManaged ? (
          <Link href={`/start/${ctx.workspaceSlug}/plan`} className="flex h-8 w-full items-center gap-1.5 rounded-md bg-sun-soft px-2 text-xs font-medium text-sun-deep hover:bg-sun-soft/80">
            <CreditCard className="size-3.5" />
            {fmt(tb.trial, { plan: plan.plan === "growth" ? "Growth" : "Launch", days: plural(locale, plan.trialDaysLeft ?? 0, tb.daysLeft) })}
          </Link>
        ) : plan?.billingManaged ? (
          <form action="/api/billing/portal" method="post">
            <input type="hidden" name="workspace" value={ctx.workspaceSlug} />
            {plan.status === "past_due" ? (
              <button type="submit" className="flex h-8 w-full items-center gap-1.5 rounded-md bg-negative-soft px-2 text-xs font-medium text-negative">
                <CreditCard className="size-3.5" />
                {tb.paymentFailed}
              </button>
            ) : (
              <button type="submit" title={tb.manageBilling} className="flex h-8 w-full items-center gap-1.5 rounded-md border border-line bg-surface px-2 text-xs font-medium text-ink hover:border-line-strong">
                <CreditCard className="size-3.5" />
                {plan.status === "trialing" ? fmt(tb.trialShort, { plan: plan.plan === "growth" ? "Growth" : "Launch", days: plan.trialDaysLeft ?? 0 }) : tb.billing}
              </button>
            )}
          </form>
        ) : plan?.plan === "free" ? (
          <Link href={`/start/${ctx.workspaceSlug}/plan`} className="flex h-8 w-full items-center gap-1.5 rounded-md bg-lime px-2 text-xs font-medium text-ink hover:bg-lime/80">
            <CreditCard className="size-3.5" />
            {tb.freePlan}
          </Link>
        ) : null
      }
      pendingApprovals={shell.counts.pendingApprovals}
      running={shell.counts.running}
      tour={tour}
      assistant={assistant}
      experiments={exps.map((e) => ({ key: experimentKey(e.number), number: e.number, name: e.name }))}
    >
      {children}
    </AppShell>
  );
}
