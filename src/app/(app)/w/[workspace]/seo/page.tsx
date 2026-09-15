import { and, desc, eq } from "drizzle-orm";
import { ModulePreview } from "@/components/product/module-preview";
import { requireWorkspace } from "@/server/context";
import { db } from "@/server/db/client";
import { experiments } from "@/server/db/schema";

export const metadata = { title: "SEO" };

export default async function SeoPage({ params }: PageProps<"/w/[workspace]/seo">) {
  const { workspace } = await params;
  const ctx = await requireWorkspace(workspace);
  const rows = await db
    .select()
    .from(experiments)
    .where(and(eq(experiments.workspaceId, ctx.workspaceId), eq(experiments.channel, "seo_content")))
    .orderBy(desc(experiments.number));

  return (
    <ModulePreview
      slug={ctx.workspaceSlug}
      title="SEO"
      description="Queries → opportunities → pages → positions → conversions."
      status="P1 · comparison and use-case pages run as experiments; the opportunity engine is next."
      capabilities={["Search Console query ingestion", "Keyword gap and clustering against competitors", "Comparison, alternative and integration page briefs", "Positions and conversions per page"]}
      dependsOn={["Google Search Console (read-only)", "Hosted pages or CMS publishing adapter"]}
      experiments={rows}
    />
  );
}
