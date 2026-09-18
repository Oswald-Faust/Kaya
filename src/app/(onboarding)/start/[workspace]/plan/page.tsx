import type { Metadata } from "next";
import { getI18n } from "@/i18n/server";
import { fmt } from "@/i18n/format";
import { redirect } from "next/navigation";
import { CalendarDays, Check, Coins, FlaskConical, Radar, ShieldCheck } from "lucide-react";
import { OnboardingSteps } from "@/components/onboarding/steps";
import { PlanPicker } from "@/components/onboarding/plan-picker";
import { requireOnboardingAccount } from "@/server/context";
import { recommendTrialPlan } from "@/server/domain/billing/plan-state";
import { getPlanState } from "@/server/services/billing";
import { billingEnabled } from "@/server/env";
import { getCurrentStrategy } from "@/server/services/strategy";
import { getActiveGoal, getPrimaryProduct } from "@/server/services/workspace";
import { formatUsd } from "@/lib/format";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.onboarding.plan.metaTitle };
}

export default async function PlanPage({ params, searchParams }: PageProps<"/start/[workspace]/plan">) {
  const [{ workspace }, sp] = await Promise.all([params, searchParams]);
  const ctx = await requireOnboardingAccount(workspace, "plan");
  if (ctx.isDemo) redirect(`/w/${ctx.workspaceSlug}`);
  const product = await getPrimaryProduct(ctx.workspaceId);
  if (!product) redirect("/start");
  const [strategy, goal, plan] = await Promise.all([getCurrentStrategy(ctx.workspaceId, product.id), getActiveGoal(ctx.workspaceId, product.id), getPlanState(ctx.organizationId)]);
  if (!strategy) redirect(`/start/${ctx.workspaceSlug}/strategy`);
  if (plan.billingManaged) redirect(`/w/${ctx.workspaceSlug}`);

  const { t, locale } = await getI18n();
  const pl = t.onboarding.plan;
  const focus = strategy.channels.filter((c) => c.verdict !== "avoid").length;
  const budget = goal?.monthlyBudget ?? 0;
  const recommended = recommendTrialPlan({ monthlyBudget: budget, experiments: strategy.experiments.length });
  const ended = plan.status === "canceled" ? "subscription" : sp.expired === "1" || plan.status === "expired" ? "trial" : null;
  const trialUsed = plan.status === "expired" || plan.status === "canceled" || (plan.status === "active" && plan.plan !== "free");
  const notice = sp.canceled === "1" ? pl.canceledNotice : sp.error === "checkout" ? pl.checkoutError : null;
  const terms = !billingEnabled ? pl.termsNoBilling : trialUsed ? pl.termsUsed : pl.termsTrial;

  const unlocks = [
    { icon: Radar, text: fmt(pl.unlockChannels, { total: strategy.channels.length, focus }) },
    { icon: Coins, text: budget > 0 ? fmt(pl.unlockBudget, { budget: formatUsd(budget, {}, locale) }) : pl.unlockOrganic },
    { icon: FlaskConical, text: fmt(pl.unlockExperiments, { count: strategy.experiments.length }) },
    { icon: CalendarDays, text: pl.unlockPlan },
    { icon: ShieldCheck, text: pl.unlockCopilot },
  ];

  return (
    <main className="mx-auto max-w-[1180px] px-5 pb-28">
      <OnboardingSteps slug={ctx.workspaceSlug} current="plan" reached={product.onboardingStep} />

      <div className="mt-10 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <section className="flex flex-col justify-between rounded-[32px] bg-ink p-8 text-white sm:p-10">
          <div>
            <p className="font-mono text-[11px] tracking-[0.12em] text-lime uppercase">{ended === "subscription" ? pl.endedSubscription : ended ? pl.endedTrial : pl.ready}</p>
            <h1 className="mt-4 text-[clamp(32px,3.4vw,46px)] leading-[1.04] font-medium tracking-[-0.04em]">
              {fmt(ended ? pl.keepGrowing : pl.unlockTitle, { name: ctx.workspaceName })}
            </h1>
            <ul className="mt-8 space-y-3.5">
              {unlocks.map((u) => (
                <li key={u.text} className="flex items-start gap-3 text-[15px] text-white/85">
                  <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-white/10">
                    <u.icon className="size-3.5 text-lime" />
                  </span>
                  <span className="pt-1">{u.text}</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-10 flex items-start gap-2 text-sm text-white/60">
            <Check className="mt-0.5 size-4 shrink-0 text-lime" />
            {terms}
          </p>
        </section>

        <div className="space-y-4">
          {notice && (
            <p role="status" className="rounded-2xl border border-line bg-surface px-5 py-4 text-[15px] text-muted">
              {notice}
            </p>
          )}
          <PlanPicker slug={ctx.workspaceSlug} recommended={recommended} trialUsed={trialUsed} currentPlan={plan.plan} cardRequired={billingEnabled} />
        </div>
      </div>
    </main>
  );
}
