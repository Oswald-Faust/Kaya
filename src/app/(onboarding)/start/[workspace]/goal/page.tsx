import type { Metadata } from "next";
import { getI18n } from "@/i18n/server";
import { fmt } from "@/i18n/format";
import { redirect } from "next/navigation";
import { GoalForm } from "@/components/onboarding/goal-form";
import { OnboardingSteps } from "@/components/onboarding/steps";
import { requireOnboardingAccount } from "@/server/context";
import { getActiveGoal, getPrimaryProduct } from "@/server/services/workspace";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.onboarding.goal.metaTitle };
}

export default async function GoalPage({ params }: PageProps<"/start/[workspace]/goal">) {
  const { workspace } = await params;
  const ctx = await requireOnboardingAccount(workspace, "goal");
  const product = await getPrimaryProduct(ctx.workspaceId);
  if (!product) redirect("/start");
  const goal = await getActiveGoal(ctx.workspaceId, product.id);
  const { t } = await getI18n();
  const g = t.onboarding.goal;

  return (
    <main className="mx-auto max-w-[820px] px-5 pb-24">
      <OnboardingSteps slug={ctx.workspaceSlug} current="goal" reached={product.onboardingStep} />
      <div className="mt-8">
        <p className="text-xs text-muted">{g.eyebrow}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{fmt(g.title, { name: product.name })}</h1>
        <p className="mt-1.5 max-w-2xl text-base text-muted">{g.lead}</p>
      </div>
      <GoalForm
        slug={ctx.workspaceSlug}
        today={new Date().toISOString().slice(0, 10)}
        initial={
          goal
            ? {
                template: goal.template,
                baseline: goal.baselineValue,
                target: goal.targetValue,
                budgetBand: goal.budgetBand,
                monthlyBudget: goal.monthlyBudget,
              }
            : null
        }
      />
    </main>
  );
}
