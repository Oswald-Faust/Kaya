import type { Metadata } from "next";
import { and, asc, desc, eq } from "drizzle-orm";
import { getI18n } from "@/i18n/server";
import { fmt } from "@/i18n/format";
import { Badge, ConfidenceBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { EmptyState, Notice } from "@/components/ui/states";
import { formatDate } from "@/lib/format";
import { requireWorkspace } from "@/server/context";
import { db } from "@/server/db/client";
import * as t from "@/server/db/schema";
import { getPrimaryProduct } from "@/server/services/workspace";

export async function generateMetadata(): Promise<Metadata> {
  const { t: dict } = await getI18n();
  return { title: dict.app.memory.metaTitle };
}

const KIND_TONE: Record<string, "positive" | "neutral" | "warning" | "agent" | "outline"> = {
  verified: "positive",
  inferred: "neutral",
  hypothesis: "warning",
  user_correction: "agent",
  learning: "positive",
};

export default async function MemoryPage({ params }: PageProps<"/w/[workspace]/memory">) {
  const { workspace } = await params;
  const ctx = await requireWorkspace(workspace);
  const product = await getPrimaryProduct(ctx.workspaceId);
  const { t: dict, locale } = await getI18n();
  const mt = dict.app.memory;
  const status = (v: string) => dict.app.statusValues[v] ?? v;
  if (!product) return <EmptyState title={dict.app.common.noProduct} className="mx-auto max-w-3xl" />;

  const [facts, icps, personas, competitors, brand] = await Promise.all([
    db.select().from(t.businessFacts).where(and(eq(t.businessFacts.workspaceId, ctx.workspaceId), eq(t.businessFacts.productId, product.id))).orderBy(asc(t.businessFacts.category), desc(t.businessFacts.updatedAt)),
    db.select().from(t.icps).where(and(eq(t.icps.workspaceId, ctx.workspaceId), eq(t.icps.productId, product.id))).orderBy(asc(t.icps.priority)),
    db.select().from(t.personas).where(eq(t.personas.workspaceId, ctx.workspaceId)),
    db.select().from(t.competitors).where(and(eq(t.competitors.workspaceId, ctx.workspaceId), eq(t.competitors.productId, product.id))).orderBy(desc(t.competitors.confidence)),
    db.query.brandProfiles.findFirst({ where: eq(t.brandProfiles.productId, product.id) }),
  ]);

  const confirmed = facts.filter((f) => f.status === "confirmed");
  const proposed = facts.filter((f) => f.status === "proposed");
  const superseded = facts.filter((f) => f.status === "superseded");
  const byId = new Map(facts.map((f) => [f.id, f]));

  return (
    <div className="mx-auto max-w-[1200px] space-y-5 px-3 py-5 sm:px-5 lg:py-6">
      <PageHeader
        tour="mem-header"
        title={mt.title}
        description={mt.description}
        meta={
          <span className="text-xs text-muted tabular">
            {fmt(mt.stats, { confirmed: confirmed.length, proposed: proposed.length, superseded: superseded.length })}
          </span>
        }
      />

      {proposed.length > 0 && (
        <Notice tone="agent" title={fmt(mt.waiting, { count: proposed.length })} action={<ButtonLink href={`/start/${ctx.workspaceSlug}/confirm`} size="sm" variant="secondary">{mt.review}</ButtonLink>}>
          {mt.waitingHint}
        </Notice>
      )}

      <Panel tour="mem-facts" className="overflow-hidden">
        <PanelHeader title={mt.facts} />
        <div className="overflow-x-auto border-t border-line">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-2xs text-subtle">
                <th className="px-4 py-2 font-medium">{mt.fact}</th>
                <th className="px-3 py-2 font-medium">{mt.type}</th>
                <th className="px-3 py-2 font-medium">{mt.source}</th>
                <th className="px-3 py-2 font-medium">{dict.app.common.confidence}</th>
                <th className="px-3 py-2 font-medium">{dict.app.common.status}</th>
                <th className="px-4 py-2 font-medium">{mt.lastVerified}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {[...confirmed, ...proposed].map((f) => {
                const replaced = f.supersedesId ? byId.get(f.supersedesId) : null;
                return (
                  <tr key={f.id} className="align-top">
                    <td className="px-4 py-2.5">
                      <p className="text-ink">{f.statement}</p>
                      <p className="mt-0.5 text-2xs text-subtle">
                        {f.category} · <code>{f.key}</code>
                      </p>
                      {f.evidence && <p className="mt-0.5 text-2xs text-muted">{fmt(mt.evidence, { text: f.evidence })}</p>}
                      {replaced && <p className="mt-0.5 text-2xs text-muted line-through">{fmt(mt.agentProposed, { text: replaced.statement })}</p>}
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge tone={KIND_TONE[f.kind] ?? "neutral"}>{mt.kinds[f.kind] ?? f.kind}</Badge>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-muted">{f.sourceLabel}</td>
                    <td className="px-3 py-2.5">{f.kind === "user_correction" ? <span className="text-2xs text-muted">—</span> : <ConfidenceBadge value={f.confidence} />}</td>
                    <td className="px-3 py-2.5">
                      {f.status === "confirmed" ? <Badge tone="positive">{f.userConfirmed ? mt.confirmed : mt.confirmedByData}</Badge> : <Badge tone="outline">{mt.needsReview}</Badge>}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted">{f.lastVerifiedAt ? formatDate(f.lastVerifiedAt, { month: "short", day: "numeric" }, locale) : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel tour="mem-icps">
          <PanelHeader title={mt.icps} count={icps.length} />
          <ul className="divide-y divide-line border-t border-line">
            {icps.map((i) => {
              const persona = personas.find((p) => p.icpId === i.id);
              return (
                <li key={i.id} className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-subtle tabular">P{i.priority}</span>
                    <span className="text-sm font-medium text-ink">{i.name}</span>
                    <Badge tone={i.status === "confirmed" ? "positive" : i.status === "rejected" ? "negative" : "outline"}>{status(i.status)}</Badge>
                    <span className="ml-auto">
                      <ConfidenceBadge value={i.confidence} />
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted">{i.description}</p>
                  {i.pains.length > 0 && (
                    <dl className="mt-2 grid gap-2 text-2xs sm:grid-cols-3">
                      <List k={mt.pains} items={i.pains} />
                      <List k={mt.triggers} items={i.triggers} />
                      <List k={mt.objections} items={i.objections} />
                    </dl>
                  )}
                  {persona && (
                    <p className="mt-2 text-2xs text-muted">
                      {mt.persona} <span className="text-ink">{persona.name}</span>, {persona.role}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </Panel>

        <div className="space-y-5">
          <Panel tour="mem-competitors">
            <PanelHeader title={mt.competitors} count={competitors.length} />
            <ul className="divide-y divide-line border-t border-line">
              {competitors.map((c) => (
                <li key={c.id} className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-ink">{c.name}</span>
                    <Badge tone="outline">{status(c.kind)}</Badge>
                    {c.status !== "confirmed" && <Badge tone={c.status === "rejected" ? "negative" : "outline"}>{status(c.status)}</Badge>}
                  </div>
                  {c.positioning && <p className="text-xs text-muted">{c.positioning}</p>}
                  {c.wedge && <p className="text-xs text-ink">{fmt(mt.wedge, { text: c.wedge })}</p>}
                </li>
              ))}
            </ul>
          </Panel>
          {brand && (
            <Panel className="p-4">
              <p className="text-sm font-semibold text-ink">{mt.brandVoice}</p>
              <p className="mt-1 text-sm text-muted">{brand.voiceSummary}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {brand.traits.map((tr) => (
                  <Badge key={tr}>{tr}</Badge>
                ))}
              </div>
              {(brand.wordsToUse.length > 0 || brand.wordsToAvoid.length > 0) && (
                <dl className="mt-3 grid gap-2 text-2xs sm:grid-cols-2">
                  <List k={mt.say} items={brand.wordsToUse} />
                  <List k={mt.avoid} items={brand.wordsToAvoid} />
                </dl>
              )}
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}

function List({ k, items }: { k: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <dt className="font-medium text-muted">{k}</dt>
      <dd>
        <ul className="mt-0.5 space-y-0.5 text-ink">
          {items.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      </dd>
    </div>
  );
}
