import type { Metadata } from "next";
import { getI18n } from "@/i18n/server";
import { redirect } from "next/navigation";
import { ConnectBoard } from "@/components/onboarding/connect-board";
import { OnboardingSteps } from "@/components/onboarding/steps";
import { requireOnboardingAccount } from "@/server/context";
import { connectionViews, connectSpecs } from "@/server/integrations/view";
import { getActiveGoal, getPrimaryProduct } from "@/server/services/workspace";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.onboarding.connect.metaTitle };
}

export default async function ConnectPage({ params }: PageProps<"/start/[workspace]/connect">) {
  const { workspace } = await params;
  const ctx = await requireOnboardingAccount(workspace, "connect");
  const product = await getPrimaryProduct(ctx.workspaceId);
  if (!product) redirect("/start");
  const [goal, connections] = await Promise.all([getActiveGoal(ctx.workspaceId, product.id), connectionViews(ctx.workspaceId)]);
  if (!goal) redirect(`/start/${ctx.workspaceSlug}/goal`);
  const { t } = await getI18n();
  const c = t.onboarding.connect;

  return (
    <main className="mx-auto max-w-[980px] px-5 pb-28">
      <OnboardingSteps slug={ctx.workspaceSlug} current="connect" reached={product.onboardingStep} />
      <div className="mt-8">
        <p className="text-xs text-muted">{c.eyebrow}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{c.title}</h1>
        <p className="mt-1.5 max-w-2xl text-base text-muted">
          {c.lead}
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
