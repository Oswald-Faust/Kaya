import { redirect } from "next/navigation";
import { ConnectBoard } from "@/components/onboarding/connect-board";
import { OnboardingSteps } from "@/components/onboarding/steps";
import { requireOnboardingAccount } from "@/server/context";
import { connectionViews, connectSpecs } from "@/server/integrations/view";
import { getActiveGoal, getPrimaryProduct } from "@/server/services/workspace";

export const metadata = { title: "Connect your data" };

export default async function ConnectPage({ params }: PageProps<"/start/[workspace]/connect">) {
  const { workspace } = await params;
  const ctx = await requireOnboardingAccount(workspace, "connect");
  const product = await getPrimaryProduct(ctx.workspaceId);
  if (!product) redirect("/start");
  const [goal, connections] = await Promise.all([getActiveGoal(ctx.workspaceId, product.id), connectionViews(ctx.workspaceId)]);
  if (!goal) redirect(`/start/${ctx.workspaceSlug}/goal`);

  return (
    <main className="mx-auto max-w-[980px] px-5 pb-28">
      <OnboardingSteps slug={ctx.workspaceSlug} current="connect" reached={product.onboardingStep} />
      <div className="mt-8">
        <p className="text-xs text-muted">Data and channels</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Connect what makes the agent smarter</h1>
        <p className="mt-1.5 max-w-2xl text-base text-muted">
          Nothing here is required to get a strategy. Revenue and analytics turn recommendations into measured results; ad and email accounts let the agent execute what you approve.
        </p>
      </div>
      <ConnectBoard
        slug={ctx.workspaceSlug}
        monthlyBudget={goal.monthlyBudget}
        canManage={ctx.role === "owner" || ctx.role === "admin"}
        isDemo={ctx.isDemo}
        connections={connections}
        specs={connectSpecs()}
      />
    </main>
  );
}
