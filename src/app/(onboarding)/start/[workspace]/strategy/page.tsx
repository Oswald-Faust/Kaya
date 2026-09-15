import { and, count, eq } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";
import { StrategyBuilder } from "@/components/onboarding/strategy-builder";
import { OnboardingSteps } from "@/components/onboarding/steps";
import { StrategySections } from "@/components/product/strategy-sections";
import { StrategyTeaser } from "@/components/product/strategy-teaser";
import { requireOnboardingAccount } from "@/server/context";
import { db } from "@/server/db/client";
import { businessFacts, integrations } from "@/server/db/schema";
import { getRun } from "@/server/services/agent-runs";
import { getPlanState } from "@/server/services/billing";
import { latestRun } from "@/server/services/onboarding";
import { getCurrentStrategy } from "@/server/services/strategy";
import { getActiveGoal, getPrimaryProduct } from "@/server/services/workspace";
import { formatUsd } from "@/lib/format";

export const metadata = { title: "Your first strategy" };

export default async function StrategyOnboardingPage({ params }: PageProps<"/start/[workspace]/strategy">) {
  const { workspace } = await params;
  const ctx = await requireOnboardingAccount(workspace, "strategy");
  const product = await getPrimaryProduct(ctx.workspaceId);
  if (!product) redirect("/start");
  const goal = await getActiveGoal(ctx.workspaceId, product.id);
  if (!goal) redirect(`/start/${ctx.workspaceSlug}/goal`);

  const [strategy, run, [facts], [connected], plan] = await Promise.all([
    getCurrentStrategy(ctx.workspaceId, product.id),
    latestRun(ctx.workspaceId, "strategy"),
    db.select({ n: count() }).from(businessFacts).where(and(eq(businessFacts.productId, product.id), eq(businessFacts.status, "confirmed"))),
    db.select({ n: count() }).from(integrations).where(and(eq(integrations.workspaceId, ctx.workspaceId), eq(integrations.status, "connected"))),
    getPlanState(ctx.organizationId),
  ]);
  const inFlight = run && (run.status === "queued" || run.status === "running");
  const runDetail = inFlight ? await getRun(ctx.workspaceId, run.id) : null;
  const fullAccess = ctx.isDemo || plan.fullAccess;
  const next = fullAccess ? `/w/${ctx.workspaceSlug}` : `/start/${ctx.workspaceSlug}/plan`;

  return (
    <main className="mx-auto max-w-[1180px] px-5 pb-28">
      <OnboardingSteps slug={ctx.workspaceSlug} current="strategy" reached={product.onboardingStep} />

      {strategy && !inFlight ? (
        <>
          <div className="mt-10 flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-3xl">
              <p className="inline-flex items-center gap-2 rounded-full bg-lime-soft px-3 py-1.5 text-sm text-lime-deep">
                <Sparkles className="size-3.5" />
                Strategy v{strategy.current.version} · {facts?.n ? `built from ${facts.n} confirmed fact${facts.n === 1 ? "" : "s"}` : "built from unreviewed analysis"}
              </p>
              <h1 className="mt-4 text-[clamp(32px,3.6vw,48px)] leading-[1.05] font-medium tracking-[-0.04em]">{strategy.current.summary}</h1>
              {!facts?.n && (
                <p className="mt-3 text-sm text-muted">
                  You skipped review, so audiences and features are treated as hypotheses.{" "}
                  <Link href={`/start/${ctx.workspaceSlug}/confirm`} className="underline underline-offset-2 hover:text-ink">
                    Confirm facts
                  </Link>{" "}
                  and rebuild to sharpen it.
                </p>
              )}
            </div>
            <Link href={next} className="inline-flex h-12 items-center gap-2 rounded-xl bg-ink px-5 text-[15px] font-medium text-white hover:bg-ink-hover">
              {fullAccess ? "Open Command Center" : "Unlock full strategy"} <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="mt-8">
            {fullAccess ? (
              <StrategySections slug={ctx.workspaceSlug} animate content={strategy.current.content} channels={strategy.channels} experiments={strategy.experiments} />
            ) : (
              <StrategyTeaser content={strategy.current.content} channels={strategy.channels} experiments={strategy.experiments} unlockHref={next} />
            )}
          </div>
        </>
      ) : (
        <StrategyBuilder
          slug={ctx.workspaceSlug}
          productName={ctx.workspaceName}
          runId={inFlight ? run.id : null}
          initialSteps={(runDetail?.steps ?? []).map((s) => ({ id: s.id, seq: s.seq, kind: s.kind, title: s.title, detail: s.detail, status: s.status }))}
          lastError={run?.status === "failed" ? run.error : null}
          inputs={{
            goal: goal.title,
            budget: goal.monthlyBudget > 0 ? `${formatUsd(goal.monthlyBudget)}/month` : "Organic only",
            facts: String(facts?.n ?? 0),
            data: connected?.n ? `${connected.n} integration${connected.n === 1 ? "" : "s"}` : "None yet",
          }}
        />
      )}
    </main>
  );
}
