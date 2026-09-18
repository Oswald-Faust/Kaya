import { and, desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { getI18n } from "@/i18n/server";
import { ModulePreview } from "@/components/product/module-preview";
import { requireWorkspace } from "@/server/context";
import { db } from "@/server/db/client";
import { experiments } from "@/server/db/schema";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.app.module.seo.metaTitle };
}

export default async function SeoPage({ params }: PageProps<"/w/[workspace]/seo">) {
  const { workspace } = await params;
  const ctx = await requireWorkspace(workspace);
  const rows = await db
    .select()
    .from(experiments)
    .where(and(eq(experiments.workspaceId, ctx.workspaceId), eq(experiments.channel, "seo_content")))
    .orderBy(desc(experiments.number));

  const m = (await getI18n()).t.app.module.seo;

  return (
    <ModulePreview
      slug={ctx.workspaceSlug}
      title={m.title}
      description={m.description}
      status={m.status}
      capabilities={m.capabilities}
      dependsOn={m.dependsOn}
      experiments={rows}
    />
  );
}
