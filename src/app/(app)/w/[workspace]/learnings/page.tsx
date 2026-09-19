import type { Metadata } from "next";
import { getI18n } from "@/i18n/server";
import { fmt } from "@/i18n/format";
import { translateDomainText } from "@/i18n/domain-text";
import Link from "next/link";
import { Badge, ChannelBadge, ConfidenceBadge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { EmptyState } from "@/components/ui/states";
import { experimentKey, formatDate } from "@/lib/format";
import { requireWorkspace } from "@/server/context";
import { rankQueue } from "@/server/services/experiments";
import { listLearnings } from "@/server/services/learnings";
import { getPrimaryProduct } from "@/server/services/workspace";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.app.learnings.metaTitle };
}

const GROUPS = [
  { kind: "winner", tone: "positive" as const, label: "winner" as const },
  { kind: "loser", tone: "negative" as const, label: "loser" as const },
  { kind: "insight", tone: "neutral" as const, label: "learning" as const },
];

export default async function LearningsPage({ params }: PageProps<"/w/[workspace]/learnings">) {
  const { workspace } = await params;
  const ctx = await requireWorkspace(workspace);
  const product = await getPrimaryProduct(ctx.workspaceId);
  const base = `/w/${ctx.workspaceSlug}`;
  const { t, locale } = await getI18n();
  const lt = t.app.learnings;
  if (!product) return <EmptyState title={t.app.common.noProduct} className="mx-auto max-w-3xl" />;

  const [learnings, ranked] = await Promise.all([listLearnings(ctx.workspaceId, product.id), rankQueue(ctx.workspaceId, product.id)]);

  // How each learning is currently steering recommendations.
  const influence = new Map<string, { suppressed: string[]; boosted: string[] }>();
  for (const r of ranked) {
    const label = `${experimentKey(r.experiment.number)} ${r.experiment.name}`;
    if (r.suppressedBy) {
      const entry = influence.get(r.suppressedBy.id) ?? { suppressed: [], boosted: [] };
      entry.suppressed.push(label);
      influence.set(r.suppressedBy.id, entry);
    }
    for (const b of r.boostedBy) {
      const entry = influence.get(b.id) ?? { suppressed: [], boosted: [] };
      entry.boosted.push(label);
      influence.set(b.id, entry);
    }
  }

  return (
    <div className="mx-auto max-w-[1100px] space-y-6 px-3 py-5 sm:px-5 lg:py-6">
      <PageHeader
        tour="learn-header"
        title={lt.title}
        description={fmt(lt.description, { name: product.name })}
      />

      {learnings.length === 0 ? (
        <Panel>
          <EmptyState title={lt.emptyTitle} description={lt.emptyHint} />
        </Panel>
      ) : (
        GROUPS.map((group) => {
          const items = learnings.filter((l) => l.kind === group.kind);
          if (items.length === 0) return null;
          return (
            <section key={group.kind} data-tour="learn-group" aria-labelledby={`group-${group.kind}`}>
              <h2 id={`group-${group.kind}`} className="mb-2 text-sm font-semibold text-ink">
                {lt.groups[group.kind]} <span className="font-normal text-subtle tabular">{items.length}</span>
              </h2>
              <ul className="space-y-2.5">
                {items.map((l) => {
                  const inf = influence.get(l.id);
                  return (
                    <li key={l.id}>
                      <Panel as="article" className="p-4">
                        <div className="flex flex-wrap items-center gap-2 text-2xs text-muted">
                          <Badge tone={group.tone}>{t.app.common[group.label]}</Badge>
                          {l.channel && <ChannelBadge channel={l.channel} />}
                          <Badge tone="outline">{fmt(t.app.common.impactLabel, { impact: lt.impact[l.impact] ?? l.impact })}</Badge>
                          <ConfidenceBadge value={l.confidence} />
                          <span className="ml-auto">{formatDate(l.createdAt, { month: "short", day: "numeric", year: "numeric" }, locale)}</span>
                        </div>
                        <p className="mt-2 text-base font-medium text-ink">{l.statement}</p>
                        {l.metricLabel && <p className="mt-1 text-sm text-muted">{translateDomainText(l.metricLabel, locale)}</p>}
                        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-2.5 text-xs">
                          <span className="text-muted">
                            {lt.evidence}{" "}
                            {l.evidence.length ? (
                              l.evidence.map((e) => (
                                <Link key={e.id} href={`${base}/experiments/${e.number}`} className="text-ink underline decoration-line-strong underline-offset-2 hover:decoration-ink">
                                  {experimentKey(e.number)} {e.name}
                                </Link>
                              ))
                            ) : (
                              <span className="text-ink">{lt.metricsOnly}</span>
                            )}
                          </span>
                          {inf?.suppressed.length ? <span className="text-negative">{fmt(lt.stops, { list: inf.suppressed.join(", ") })}</span> : null}
                          {inf?.boosted.length ? <span className="text-positive">{fmt(lt.raises, { list: inf.boosted.join(", ") })}</span> : null}
                        </div>
                      </Panel>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })
      )}
    </div>
  );
}
