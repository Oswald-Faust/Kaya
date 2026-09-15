import { and, asc, desc, eq } from "drizzle-orm";
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

export const metadata = { title: "Business memory" };

const KIND: Record<string, { label: string; tone: "positive" | "neutral" | "warning" | "agent" | "outline" }> = {
  verified: { label: "Verified", tone: "positive" },
  inferred: { label: "Inferred", tone: "neutral" },
  hypothesis: { label: "Hypothesis", tone: "warning" },
  user_correction: { label: "From founder", tone: "agent" },
  learning: { label: "Learning", tone: "positive" },
};

export default async function MemoryPage({ params }: PageProps<"/w/[workspace]/memory">) {
  const { workspace } = await params;
  const ctx = await requireWorkspace(workspace);
  const product = await getPrimaryProduct(ctx.workspaceId);
  if (!product) return <EmptyState title="No product yet" className="mx-auto max-w-3xl" />;

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
        title="Business memory"
        description="What the agent knows about the business. Every fact keeps its source, confidence and whether a human confirmed it. Only confirmed facts drive decisions."
        meta={
          <span className="text-xs text-muted tabular">
            {confirmed.length} confirmed · {proposed.length} awaiting review · {superseded.length} corrected
          </span>
        }
      />

      {proposed.length > 0 && (
        <Notice tone="agent" title={`${proposed.length} inferences are waiting for review`} action={<ButtonLink href={`/start/${ctx.workspaceSlug}/confirm`} size="sm" variant="secondary">Review</ButtonLink>}>
          They are excluded from strategy and spend decisions until you confirm them.
        </Notice>
      )}

      <Panel className="overflow-hidden">
        <PanelHeader title="Facts" />
        <div className="overflow-x-auto border-t border-line">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-2xs text-subtle">
                <th className="px-4 py-2 font-medium">Fact</th>
                <th className="px-3 py-2 font-medium">Type</th>
                <th className="px-3 py-2 font-medium">Source</th>
                <th className="px-3 py-2 font-medium">Confidence</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Last verified</th>
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
                      {f.evidence && <p className="mt-0.5 text-2xs text-muted">Evidence: {f.evidence}</p>}
                      {replaced && <p className="mt-0.5 text-2xs text-muted line-through">Agent proposed: {replaced.statement}</p>}
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge tone={KIND[f.kind].tone}>{KIND[f.kind].label}</Badge>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-muted">{f.sourceLabel}</td>
                    <td className="px-3 py-2.5">{f.kind === "user_correction" ? <span className="text-2xs text-muted">—</span> : <ConfidenceBadge value={f.confidence} />}</td>
                    <td className="px-3 py-2.5">
                      {f.status === "confirmed" ? <Badge tone="positive">{f.userConfirmed ? "Confirmed" : "Confirmed by data"}</Badge> : <Badge tone="outline">Needs review</Badge>}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted">{f.lastVerifiedAt ? formatDate(f.lastVerifiedAt, { month: "short", day: "numeric" }) : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel>
          <PanelHeader title="Ideal customer profiles" count={icps.length} />
          <ul className="divide-y divide-line border-t border-line">
            {icps.map((i) => {
              const persona = personas.find((p) => p.icpId === i.id);
              return (
                <li key={i.id} className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-subtle tabular">P{i.priority}</span>
                    <span className="text-sm font-medium text-ink">{i.name}</span>
                    <Badge tone={i.status === "confirmed" ? "positive" : i.status === "rejected" ? "negative" : "outline"}>{i.status}</Badge>
                    <span className="ml-auto">
                      <ConfidenceBadge value={i.confidence} />
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted">{i.description}</p>
                  {i.pains.length > 0 && (
                    <dl className="mt-2 grid gap-2 text-2xs sm:grid-cols-3">
                      <List k="Pains" items={i.pains} />
                      <List k="Triggers" items={i.triggers} />
                      <List k="Objections" items={i.objections} />
                    </dl>
                  )}
                  {persona && (
                    <p className="mt-2 text-2xs text-muted">
                      Persona: <span className="text-ink">{persona.name}</span>, {persona.role}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </Panel>

        <div className="space-y-5">
          <Panel>
            <PanelHeader title="Competitors" count={competitors.length} />
            <ul className="divide-y divide-line border-t border-line">
              {competitors.map((c) => (
                <li key={c.id} className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-ink">{c.name}</span>
                    <Badge tone="outline">{c.kind}</Badge>
                    {c.status !== "confirmed" && <Badge tone={c.status === "rejected" ? "negative" : "outline"}>{c.status}</Badge>}
                  </div>
                  {c.positioning && <p className="text-xs text-muted">{c.positioning}</p>}
                  {c.wedge && <p className="text-xs text-ink">Wedge: {c.wedge}</p>}
                </li>
              ))}
            </ul>
          </Panel>
          {brand && (
            <Panel className="p-4">
              <p className="text-sm font-semibold text-ink">Brand voice</p>
              <p className="mt-1 text-sm text-muted">{brand.voiceSummary}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {brand.traits.map((tr) => (
                  <Badge key={tr}>{tr}</Badge>
                ))}
              </div>
              {(brand.wordsToUse.length > 0 || brand.wordsToAvoid.length > 0) && (
                <dl className="mt-3 grid gap-2 text-2xs sm:grid-cols-2">
                  <List k="Say" items={brand.wordsToUse} />
                  <List k="Avoid" items={brand.wordsToAvoid} />
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
