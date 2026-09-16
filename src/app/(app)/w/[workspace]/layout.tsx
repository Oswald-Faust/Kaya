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
import { experiments } from "@/server/db/schema";
import { getShellData } from "@/server/services/workspace";
import { getPlanState } from "@/server/services/billing";
import { experimentKey, formatUsd } from "@/lib/format";

const AUTONOMY_LABEL = { observe: "Observe", suggest: "Suggest", copilot: "Copilot", autopilot: "Autopilot" } as const;

export default async function WorkspaceLayout({ children, params }: LayoutProps<"/w/[workspace]">) {
  const { workspace } = await params;
  const ctx = await requireWorkspace(workspace);
  if (ctx.isGuest && !ctx.isDemo) redirect(`/signup?next=${encodeURIComponent(`/w/${workspace}`)}`);
  const plan = ctx.isDemo ? null : await getPlanState(ctx.organizationId);
  if (plan?.needsChoice) redirect(`/start/${ctx.workspaceSlug}/plan${plan.status === "expired" || plan.status === "canceled" ? "?expired=1" : ""}`);
  const [shell, workspaces, exps] = await Promise.all([
    getShellData(ctx),
    listWorkspacesForUser(ctx.userId),
    db.select({ number: experiments.number, name: experiments.name }).from(experiments).where(eq(experiments.workspaceId, ctx.workspaceId)).orderBy(desc(experiments.number)),
  ]);

  const goal = shell.goal;
  const topBar = (
    <div className="flex min-w-0 flex-1 items-center gap-4">
      {goal && (
        <div className="hidden w-56 shrink-0 md:block" title={`${Math.round(goal.progress * 100)}% of the way; ${Math.round(goal.expectedProgress * 100)}% expected by now`}>
          <div className="flex items-baseline justify-between gap-2 text-2xs">
            <span className="truncate font-medium text-ink">{goal.title}</span>
            <span className={goal.onTrack ? "text-positive" : "text-warning"}>{goal.onTrack ? "On track" : "Behind"}</span>
          </div>
          <ProgressBar value={goal.progress} expected={goal.expectedProgress} className="mt-1.5" />
          <div className="mt-1 text-2xs text-muted tabular">
            {goal.unit === "usd" ? formatUsd(goal.current) : goal.current} of {goal.unit === "usd" ? formatUsd(goal.target) : goal.target}
          </div>
        </div>
      )}
      <div className="hidden min-w-0 flex-1 xl:block">
        <GrowthLoop slug={ctx.workspaceSlug} data={shell} />
      </div>
      <div className="ml-auto flex shrink-0 items-center gap-2">
        {ctx.isDemo && <Badge tone="outline" className="hidden border-dashed sm:inline-flex">Demo data</Badge>}
        {plan && plan.status === "trialing" && !plan.billingManaged && (
          <Link href={`/start/${ctx.workspaceSlug}/plan`} className="hidden h-7 items-center gap-1.5 rounded-md bg-sun-soft px-2 text-xs font-medium text-sun-deep sm:inline-flex">
            {plan.plan === "growth" ? "Growth" : "Launch"} trial · {plan.trialDaysLeft} day{plan.trialDaysLeft === 1 ? "" : "s"} left
          </Link>
        )}
        {plan?.billingManaged && (
          <form action="/api/billing/portal" method="post">
            <input type="hidden" name="workspace" value={ctx.workspaceSlug} />
            {plan.status === "past_due" ? (
              <button type="submit" className="inline-flex h-7 items-center gap-1.5 rounded-md bg-negative-soft px-2 text-xs font-medium text-negative">
                <CreditCard className="size-3.5" />
                Payment failed · Update card
              </button>
            ) : (
              <button type="submit" title="Manage billing" className="inline-flex h-7 items-center gap-1.5 rounded-md border border-line bg-surface px-2 text-xs font-medium text-ink hover:border-line-strong">
                <CreditCard className="size-3.5" />
                {plan.status === "trialing" ? (
                  <span>
                    {plan.plan === "growth" ? "Growth" : "Launch"} trial · {plan.trialDaysLeft}d left
                  </span>
                ) : (
                  <span className="hidden sm:inline">Billing</span>
                )}
              </button>
            )}
          </form>
        )}
        {plan && plan.plan === "free" && (
          <Link href={`/start/${ctx.workspaceSlug}/plan`} className="hidden h-7 items-center rounded-md bg-lime px-2 text-xs font-medium text-ink sm:inline-flex">
            Free plan · Unlock strategy
          </Link>
        )}
        <span className="inline-flex h-7 items-center gap-1.5 rounded-md border border-line bg-surface px-2 text-xs text-ink" title="Autonomy mode">
          <span className="size-1.5 rounded-full bg-agent" aria-hidden />
          {AUTONOMY_LABEL[ctx.autonomyMode]}
        </span>
        <form action="/logout" method="post">
          <button type="submit" title={`Log out ${ctx.email}`} className="grid size-7 place-items-center rounded-md border border-line bg-surface text-muted hover:text-ink">
            <LogOut className="size-3.5" />
            <span className="sr-only">Log out</span>
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <AppShell
      slug={ctx.workspaceSlug}
      switcher={<WorkspaceSwitcher current={{ slug: ctx.workspaceSlug, name: ctx.workspaceName, isDemo: ctx.isDemo }} workspaces={workspaces} />}
      topBar={topBar}
      pendingApprovals={shell.counts.pendingApprovals}
      running={shell.counts.running}
      experiments={exps.map((e) => ({ key: experimentKey(e.number), number: e.number, name: e.name }))}
    >
      {children}
    </AppShell>
  );
}
