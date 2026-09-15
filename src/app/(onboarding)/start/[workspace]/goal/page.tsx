import { redirect } from "next/navigation";
import { GoalForm } from "@/components/onboarding/goal-form";
import { OnboardingSteps } from "@/components/onboarding/steps";
import { requireWorkspace } from "@/server/context";
import { getActiveGoal, getPrimaryProduct } from "@/server/services/workspace";

export const metadata = { title: "Set your growth goal" };

export default async function GoalPage({ params }: PageProps<"/start/[workspace]/goal">) {
  const { workspace } = await params;
  const ctx = await requireWorkspace(workspace);
  const product = await getPrimaryProduct(ctx.workspaceId);
  if (!product) redirect("/start");
  const goal = await getActiveGoal(ctx.workspaceId, product.id);

  return (
    <main className="mx-auto max-w-[820px] px-5 pb-24">
      <OnboardingSteps slug={ctx.workspaceSlug} current="goal" reached={product.onboardingStep} />
      <div className="mt-8">
        <p className="text-xs text-muted">Goal and budget</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">What does growth mean for {product.name} right now?</h1>
        <p className="mt-1.5 max-w-2xl text-base text-muted">Pick one outcome. The strategy, channel choices and experiments are all built against it, and the budget becomes a hard limit the agent can&apos;t exceed.</p>
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
