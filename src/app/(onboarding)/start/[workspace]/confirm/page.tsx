import { and, asc, desc, eq, inArray, ne } from "drizzle-orm";
import { redirect } from "next/navigation";
import { ReviewBoard } from "@/components/onboarding/review-board";
import { OnboardingSteps } from "@/components/onboarding/steps";
import { requireWorkspace } from "@/server/context";
import { db } from "@/server/db/client";
import * as t from "@/server/db/schema";
import { getPrimaryProduct } from "@/server/services/workspace";

export const metadata = { title: "Confirm what we learned" };

export default async function ConfirmPage({ params }: PageProps<"/start/[workspace]/confirm">) {
  const { workspace } = await params;
  const ctx = await requireWorkspace(workspace);
  const product = await getPrimaryProduct(ctx.workspaceId);
  if (!product) redirect("/start");
  if (product.status === "analyzing") redirect(`/start/${ctx.workspaceSlug}/analyze`);

  const [facts, icps, competitors, snapshot] = await Promise.all([
    db
      .select()
      .from(t.businessFacts)
      .where(and(eq(t.businessFacts.productId, product.id), eq(t.businessFacts.workspaceId, ctx.workspaceId), inArray(t.businessFacts.status, ["proposed", "confirmed"])))
      .orderBy(asc(t.businessFacts.createdAt)),
    db.select().from(t.icps).where(and(eq(t.icps.productId, product.id), eq(t.icps.workspaceId, ctx.workspaceId), ne(t.icps.status, "rejected"))).orderBy(asc(t.icps.priority)),
    db.select().from(t.competitors).where(and(eq(t.competitors.productId, product.id), eq(t.competitors.workspaceId, ctx.workspaceId), ne(t.competitors.status, "rejected"))).orderBy(desc(t.competitors.confidence)),
    db.query.productSnapshots.findFirst({ where: eq(t.productSnapshots.productId, product.id), orderBy: desc(t.productSnapshots.createdAt) }),
  ]);

  return (
    <main className="mx-auto max-w-[920px] px-5 pb-32">
      <OnboardingSteps slug={ctx.workspaceSlug} current="confirm" reached={product.onboardingStep} />
      <div className="mt-8">
        <p className="text-xs text-muted">Business memory</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Here&apos;s what we learned about {product.name}</h1>
        <p className="mt-1.5 max-w-2xl text-base text-muted">
          Confirm what&apos;s right and fix what isn&apos;t. Only confirmed facts drive strategy and spend; everything keeps its source so you can check it later.
        </p>
      </div>
      <ReviewBoard
        slug={ctx.workspaceSlug}
        warnings={snapshot?.extraction?.warnings ?? []}
        facts={facts.map((f) => ({
          id: f.id,
          category: f.category,
          statement: f.statement,
          kind: f.kind,
          status: f.status,
          confidence: f.confidence,
          sourceLabel: f.sourceLabel,
          evidence: f.evidence,
        }))}
        icps={icps.map((i) => ({ id: i.id, name: i.name, description: i.description, confidence: i.confidence, status: i.status, priority: i.priority }))}
        competitors={competitors.map((c) => ({ id: c.id, name: c.name, positioning: c.positioning, confidence: c.confidence, status: c.status }))}
      />
    </main>
  );
}
