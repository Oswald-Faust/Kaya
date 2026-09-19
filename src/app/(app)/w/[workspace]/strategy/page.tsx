import type { Metadata } from "next";
import { getI18n } from "@/i18n/server";
import { fmt } from "@/i18n/format";
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
import { getPlanState } from "@/server/services/billing";
import { StrategyTeaser } from "@/components/product/strategy-teaser";
import { experimentKey, formatDate } from "@/lib/format";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.app.strategy.metaTitle };
}

export default async function StrategyPage({ params }: PageProps<"/w/[workspace]/strategy">) {
  const { workspace } = await params;
  const ctx = await requireWorkspace(workspace);
  const product = await getPrimaryProduct(ctx.workspaceId);
  const strategy = product ? await getCurrentStrategy(ctx.workspaceId, product.id) : null;
  const { t, locale } = await getI18n();
  const st = t.app.strategy;

  if (!product || !strategy) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-12">
        <EmptyState
          title={st.noneTitle}
          description={st.noneHint}
          action={<ButtonLink href={`/start/${ctx.workspaceSlug}/confirm`} variant="primary">{st.continueSetup}</ButtonLink>}
        />
      </div>
    );
  }

  const fullAccess = ctx.isDemo || (await getPlanState(ctx.organizationId)).fullAccess;
  const learnings = await listLearnings(ctx.workspaceId, product.id);
  const learningById = new Map(learnings.map((l) => [l.id, l]));

  return (
    <div className="mx-auto max-w-[1400px] px-3 py-5 sm:px-5 lg:py-6">
      <PageHeader
        tour="strategy-header"
        title={fmt(st.title, { version: strategy.current.version })}
        description={strategy.current.summary}
        meta={
          <>
            <Badge tone="agent">{st.living}</Badge>
            <span className="text-xs text-muted">{fmt(st.updated, { date: formatDate(strategy.current.createdAt, { month: "long", day: "numeric", year: "numeric" }, locale), by: strategy.current.createdBy === "agent" ? st.byAgent : st.byTeam })}</span>
          </>
        }
        actions={<RebuildStrategyButton slug={ctx.workspaceSlug} />}
      />

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div data-tour="strategy-body" className="min-w-0">
        {fullAccess ? (
          <StrategySections slug={ctx.workspaceSlug} content={strategy.current.content} channels={strategy.channels} experiments={strategy.experiments} />
        ) : (
          <StrategyTeaser content={strategy.current.content} channels={strategy.channels} experiments={strategy.experiments} unlockHref={`/start/${ctx.workspaceSlug}/plan`} />
        )}
        </div>

        <aside className="space-y-5 xl:sticky xl:top-20 xl:self-start">
          <Panel tour="strategy-history">
            <PanelHeader title={st.history} description={st.historyHint} />
            <ol className="border-t border-line">
              {strategy.versions.map((v) => (
                <li key={v.id} className="border-b border-line px-4 py-3 last:border-b-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-ink">v{v.version}</span>
                    <span className="text-2xs text-subtle">{formatDate(v.createdAt, { month: "short", day: "numeric" }, locale)}</span>
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
                              {l.evidence[0] ? experimentKey(l.evidence[0].number) : t.app.common.insight}
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
