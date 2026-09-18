import type { Metadata } from "next";
import { getI18n } from "@/i18n/server";
import { redirect } from "next/navigation";
import { AnalysisLive } from "@/components/onboarding/analysis-live";
import { OnboardingSteps } from "@/components/onboarding/steps";
import { requireWorkspace } from "@/server/context";
import type { AnalysisRunResult } from "@/server/intelligence/analyze";
import { getRun } from "@/server/services/agent-runs";
import { latestRun } from "@/server/services/onboarding";
import { getPrimaryProduct } from "@/server/services/workspace";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.onboarding.analyze.metaTitle };
}

export default async function AnalyzePage({ params }: PageProps<"/start/[workspace]/analyze">) {
  const { workspace } = await params;
  const ctx = await requireWorkspace(workspace);
  const product = await getPrimaryProduct(ctx.workspaceId);
  if (!product) redirect("/start");
  const run = await latestRun(ctx.workspaceId, "product_analysis");
  if (!run) redirect(`/start/${ctx.workspaceSlug}/confirm`);
  const detail = await getRun(ctx.workspaceId, run.id);

  return (
    <main className="mx-auto max-w-[1180px] px-5 pb-28">
      <OnboardingSteps slug={ctx.workspaceSlug} current="analyze" reached={product.onboardingStep} />
      <AnalysisLive
        slug={ctx.workspaceSlug}
        runId={run.id}
        initial={{
          status: run.status,
          error: run.error,
          result: run.result as AnalysisRunResult | null,
          steps: (detail?.steps ?? []).map((s) => ({ id: s.id, seq: s.seq, kind: s.kind, title: s.title, detail: s.detail, status: s.status })),
        }}
      />
    </main>
  );
}
