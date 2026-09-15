import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { Badge, ChannelBadge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { EmptyState } from "@/components/ui/states";
import { experimentKey, formatDate } from "@/lib/format";
import { requireWorkspace } from "@/server/context";
import { db } from "@/server/db/client";
import { creativeAssets, experiments } from "@/server/db/schema";

export const metadata = { title: "Content" };

export default async function ContentPage({ params }: PageProps<"/w/[workspace]/content">) {
  const { workspace } = await params;
  const ctx = await requireWorkspace(workspace);
  const rows = await db
    .select({ asset: creativeAssets, number: experiments.number, experimentName: experiments.name })
    .from(creativeAssets)
    .leftJoin(experiments, eq(experiments.id, creativeAssets.experimentId))
    .where(eq(creativeAssets.workspaceId, ctx.workspaceId))
    .orderBy(desc(creativeAssets.createdAt));
  const base = `/w/${ctx.workspaceSlug}`;

  return (
    <div className="mx-auto max-w-[1100px] space-y-5 px-3 py-5 sm:px-5 lg:py-6">
      <PageHeader title="Content" description="Every asset is produced for an experiment: ad copy, landing pages, lifecycle emails. Drafts never publish without the approval your autonomy mode requires." />
      <Panel className="overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState title="No content yet" description="Assets appear here when the agent drafts them for an experiment." />
        ) : (
          <ul className="divide-y divide-line">
            {rows.map(({ asset: a, number, experimentName }) => (
              <li key={a.id} className="px-4 py-3">
                <details>
                  <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-1 [&::-webkit-details-marker]:hidden">
                    <span className="text-sm font-medium text-ink">{a.title}</span>
                    <Badge tone={a.status === "published" ? "positive" : a.status === "approved" ? "agent" : "outline"}>{a.status}</Badge>
                    <span className="text-2xs text-muted">{a.kind.replace(/_/g, " ")}</span>
                    <ChannelBadge channel={a.channel} className="text-2xs" />
                    {number && (
                      <Link href={`${base}/experiments/${number}`} className="text-2xs text-muted hover:text-ink">
                        {experimentKey(number)} {experimentName}
                      </Link>
                    )}
                    <span className="ml-auto text-2xs text-subtle">{formatDate(a.createdAt, { month: "short", day: "numeric" })}</span>
                  </summary>
                  <pre className="mt-2 max-h-80 overflow-auto rounded-md bg-raised p-3 font-sans text-sm whitespace-pre-wrap text-ink">{a.body}</pre>
                </details>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
