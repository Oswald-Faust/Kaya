import type { Metadata } from "next";
import { getI18n } from "@/i18n/server";
import { fmt, plural } from "@/i18n/format";
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
import { localizedGoalTitle } from "@/server/domain/strategy/goals";
import { getRun } from "@/server/services/agent-runs";
import { getPlanState } from "@/server/services/billing";
import { latestRun } from "@/server/services/onboarding";
import { getCurrentStrategy } from "@/server/services/strategy";
import { getActiveGoal, getPrimaryProduct } from "@/server/services/workspace";
import { formatUsd } from "@/lib/format";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.onboarding.strategy.metaTitle };
}

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
  const { t, locale } = await getI18n();
  const so = t.onboarding.strategy;

  return (
    <main className="mx-auto max-w-[1180px] px-5 pb-28">
      <OnboardingSteps slug={ctx.workspaceSlug} current="strategy" reached={product.onboardingStep} />

      {strategy && !inFlight ? (
        <>
          <div className="mt-10 flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-3xl">
              <p className="inline-flex items-center gap-2 rounded-full bg-lime-soft px-3 py-1.5 text-sm text-lime-deep">
                <Sparkles className="size-3.5" />
                {fmt(so.badge, { version: strategy.current.version, source: facts?.n ? plural(locale, facts.n, so.builtFrom) : so.unreviewed })}
              </p>
              <h1 className="mt-4 text-[clamp(32px,3.6vw,48px)] leading-[1.05] font-medium tracking-[-0.04em]">{strategy.current.summary}</h1>
              {!facts?.n && (
                <p className="mt-3 text-sm text-muted">
                  {so.skippedBefore}{" "}
                  <Link href={`/start/${ctx.workspaceSlug}/confirm`} className="underline underline-offset-2 hover:text-ink">
                    {so.confirmFacts}
                  </Link>{" "}
                  {so.skippedAfter}
                </p>
              )}
            </div>
            <Link href={next} className="inline-flex h-12 items-center gap-2 rounded-xl bg-ink px-5 text-[15px] font-medium text-white hover:bg-ink-hover">
              {fullAccess ? so.openCommand : so.unlock} <ArrowRight className="size-4" />
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
            goal: localizedGoalTitle(goal, locale),
            budget: goal.monthlyBudget > 0 ? fmt(so.perMonth, { amount: formatUsd(goal.monthlyBudget, {}, locale) }) : so.organicOnly,
            facts: String(facts?.n ?? 0),
            data: connected?.n ? plural(locale, connected.n, so.integrations) : so.noneYet,
          }}
        />
      )}
    </main>
  );
}
