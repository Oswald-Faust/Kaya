import Link from "next/link";
import { RebuildStrategyButton } from "@/components/product/rebuild-strategy-button";
import { StrategySections } from "@/components/product/strategy-sections";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { EmptyState } from "@/components/ui/states";
import { requireWorkspace } from "@/server/context";
import { listLearnings } from "@/server/services/learnings";
import { getCurrentStrategy } from "@/server/services/strategy";
import { getPrimaryProduct } from "@/server/services/workspace";
import { experimentKey, formatDate } from "@/lib/format";

export const metadata = { title: "Strategy" };

export default async function StrategyPage({ params }: PageProps<"/w/[workspace]/strategy">) {
  const { workspace } = await params;
  const ctx = await requireWorkspace(workspace);
  const product = await getPrimaryProduct(ctx.workspaceId);
  const strategy = product ? await getCurrentStrategy(ctx.workspaceId, product.id) : null;

  if (!product || !strategy) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-12">
        <EmptyState
          title="No strategy yet"
          description="Confirm what Kaya learned about your product and set a goal; the strategy is built from both."
          action={<ButtonLink href={`/start/${ctx.workspaceSlug}/confirm`} variant="primary">Continue setup</ButtonLink>}
        />
      </div>
    );
  }

  const learnings = await listLearnings(ctx.workspaceId, product.id);
  const learningById = new Map(learnings.map((l) => [l.id, l]));

  return (
    <div className="mx-auto max-w-[1400px] px-3 py-5 sm:px-5 lg:py-6">
      <PageHeader
        title={`Strategy v${strategy.current.version}`}
        description={strategy.current.summary}
        meta={
          <>
            <Badge tone="agent">Living document</Badge>
            <span className="text-xs text-muted">Updated {formatDate(strategy.current.createdAt, { month: "long", day: "numeric", year: "numeric" })} by the {strategy.current.createdBy === "agent" ? "agent" : "team"}</span>
          </>
        }
        actions={<RebuildStrategyButton slug={ctx.workspaceSlug} />}
      />

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <StrategySections slug={ctx.workspaceSlug} content={strategy.current.content} channels={strategy.channels} experiments={strategy.experiments} />

        <aside className="space-y-5 xl:sticky xl:top-20 xl:self-start">
          <Panel>
            <PanelHeader title="Version history" description="Every revision is tied to the evidence that caused it." />
            <ol className="border-t border-line">
              {strategy.versions.map((v) => (
                <li key={v.id} className="border-b border-line px-4 py-3 last:border-b-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-ink">v{v.version}</span>
                    <span className="text-2xs text-subtle">{formatDate(v.createdAt, { month: "short", day: "numeric" })}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted">{v.revisionReason}</p>
                  {v.evidenceLearningIds.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {v.evidenceLearningIds
                        .map((id) => learningById.get(id))
                        .filter((l): l is NonNullable<typeof l> => Boolean(l))
                        .slice(0, 4)
                        .map((l) => (
                          <li key={l.id} className="text-2xs">
                            <Badge tone={l.kind === "winner" ? "positive" : l.kind === "loser" ? "negative" : "neutral"} className="mr-1.5">
                              {l.evidence[0] ? experimentKey(l.evidence[0].number) : "Insight"}
                            </Badge>
                            {l.evidence[0] ? (
                              <Link href={`/w/${ctx.workspaceSlug}/experiments/${l.evidence[0].number}`} className="text-muted hover:text-ink">
                                {l.statement}
                              </Link>
                            ) : (
                              <span className="text-muted">{l.statement}</span>
                            )}
                          </li>
                        ))}
                    </ul>
                  )}
                </li>
              ))}
            </ol>
          </Panel>
        </aside>
      </div>
    </div>
  );
}
