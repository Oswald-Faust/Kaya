import { and, count, eq } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { StrategyBuilder } from "@/components/onboarding/strategy-builder";
import { OnboardingSteps } from "@/components/onboarding/steps";
import { StrategySections } from "@/components/product/strategy-sections";
import { requireWorkspace } from "@/server/context";
import { db } from "@/server/db/client";
import { businessFacts, integrations } from "@/server/db/schema";
import { getRun } from "@/server/services/agent-runs";
import { latestRun } from "@/server/services/onboarding";
import { getCurrentStrategy } from "@/server/services/strategy";
import { getActiveGoal, getPrimaryProduct } from "@/server/services/workspace";
import { formatUsd } from "@/lib/format";

export const metadata = { title: "Your first strategy" };

export default async function StrategyOnboardingPage({ params }: PageProps<"/start/[workspace]/strategy">) {
  const { workspace } = await params;
  const ctx = await requireWorkspace(workspace);
  const product = await getPrimaryProduct(ctx.workspaceId);
  if (!product) redirect("/start");
  const goal = await getActiveGoal(ctx.workspaceId, product.id);
  if (!goal) redirect(`/start/${ctx.workspaceSlug}/goal`);

  const [strategy, run, [facts], [connected]] = await Promise.all([
    getCurrentStrategy(ctx.workspaceId, product.id),
    latestRun(ctx.workspaceId, "strategy"),
    db.select({ n: count() }).from(businessFacts).where(and(eq(businessFacts.productId, product.id), eq(businessFacts.status, "confirmed"))),
    db.select({ n: count() }).from(integrations).where(and(eq(integrations.workspaceId, ctx.workspaceId), eq(integrations.status, "connected"))),
  ]);
  const inFlight = run && (run.status === "queued" || run.status === "running");
  const runDetail = inFlight ? await getRun(ctx.workspaceId, run.id) : null;

  const base = `/w/${ctx.workspaceSlug}`;

  return (
    <main className="mx-auto max-w-[1180px] px-5 pb-28">
      <OnboardingSteps slug={ctx.workspaceSlug} current="strategy" reached={product.onboardingStep} />

      {strategy && !inFlight ? (
        <>
          <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-agent">
                Strategy v{strategy.current.version} ·{" "}
                {facts?.n ? `built from ${facts.n} confirmed fact${facts.n === 1 ? "" : "s"}` : "built from unreviewed analysis"}
              </p>
              {!facts?.n && (
                <p className="mt-1 text-xs text-muted">
                  You skipped review, so audiences and features are treated as hypotheses.{" "}
                  <Link href={`/start/${ctx.workspaceSlug}/confirm`} className="underline underline-offset-2 hover:text-ink">
                    Confirm facts
                  </Link>{" "}
                  and rebuild to sharpen it.
                </p>
              )}
              <h1 className="mt-1 text-2xl font-semibold tracking-tight">{strategy.current.summary}</h1>
            </div>
            <Link href={base} className="inline-flex h-9 items-center gap-2 rounded-md bg-ink px-4 text-sm font-medium text-white hover:bg-ink-hover">
              Open Command Center <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="mt-6">
            <StrategySections
              slug={ctx.workspaceSlug}
              animate
              content={strategy.current.content}
              channels={strategy.channels}
              experiments={strategy.experiments}
            />
          </div>
          <div className="mt-8 flex justify-end">
            <Link href={base} className="inline-flex h-9 items-center gap-2 rounded-md bg-ink px-4 text-sm font-medium text-white hover:bg-ink-hover">
              Open Command Center <ArrowRight className="size-4" />
            </Link>
          </div>
        </>
      ) : (
        <StrategyBuilder
          slug={ctx.workspaceSlug}
          runId={inFlight ? run.id : null}
          initialSteps={(runDetail?.steps ?? []).map((s) => ({ id: s.id, seq: s.seq, kind: s.kind, title: s.title, detail: s.detail, status: s.status }))}
          lastError={run?.status === "failed" ? run.error : null}
          inputs={[
            ["Goal", goal.title],
            ["Budget", goal.monthlyBudget > 0 ? `${formatUsd(goal.monthlyBudget)}/month` : "Organic only"],
            ["Confirmed facts", String(facts?.n ?? 0)],
            ["Connected data", connected?.n ? `${connected.n} integration${connected.n === 1 ? "" : "s"}` : "None yet"],
          ]}
        />
      )}
    </main>
  );
}
