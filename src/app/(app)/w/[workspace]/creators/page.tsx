import { and, desc, eq } from "drizzle-orm";
import { ModulePreview } from "@/components/product/module-preview";
import { requireWorkspace } from "@/server/context";
import { db } from "@/server/db/client";
import { experiments } from "@/server/db/schema";

export const metadata = { title: "Creators" };

export default async function CreatorsPage({ params }: PageProps<"/w/[workspace]/creators">) {
  const { workspace } = await params;
  const ctx = await requireWorkspace(workspace);
  const rows = await db
    .select()
    .from(experiments)
    .where(and(eq(experiments.workspaceId, ctx.workspaceId), eq(experiments.channel, "youtube_creators")))
    .orderBy(desc(experiments.number));

  return (
    <ModulePreview
      slug={ctx.workspaceSlug}
      title="Creators"
      description="Discovery → outreach → deal → code or link → revenue."
      status="P1 · Stage 5. Creator tests run as experiments with coupon tracking; discovery and outreach are not built yet."
      capabilities={["Creator discovery ranked by audience fit, not follower count", "Outreach drafts, always approved by a human (R4)", "Deal, code and link tracking", "Revenue attributed per creator"]}
      dependsOn={["Creator and affiliate tracking adapter", "Stripe coupons for attribution"]}
      experiments={rows}
    />
  );
}
