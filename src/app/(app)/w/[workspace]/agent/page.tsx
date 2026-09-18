import type { Metadata } from "next";
import { getI18n } from "@/i18n/server";
import { fmt, plural } from "@/i18n/format";
import Link from "next/link";
import { ApprovalCard } from "@/components/product/approval-card";
import { AskAgentForm } from "@/components/product/ask-agent-form";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { EmptyState } from "@/components/ui/states";
import { requireWorkspace } from "@/server/context";
import { listRuns } from "@/server/services/agent-runs";
import { listApprovals } from "@/server/services/approvals";
import { relativeTime } from "@/lib/format";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.app.agent.metaTitle };
}

const RUN_TONE: Record<string, "neutral" | "agent" | "positive" | "negative" | "warning"> = {
  queued: "neutral",
  planning: "agent",
  running: "agent",
  awaiting_approval: "warning",
  completed: "neutral",
  failed: "negative",
  cancelled: "neutral",
};

export default async function AgentPage({ params, searchParams }: PageProps<"/w/[workspace]/agent">) {
  const { workspace } = await params;
  const { ask } = await searchParams;
  const ctx = await requireWorkspace(workspace);
  const [runs, approvals] = await Promise.all([listRuns(ctx.workspaceId), listApprovals(ctx.workspaceId)]);
  const base = `/w/${ctx.workspaceSlug}`;
  const { t, locale } = await getI18n();
  const a = t.app.agent;

  return (
    <div className="mx-auto max-w-[1200px] space-y-5 px-3 py-5 sm:px-5 lg:py-6">
      <PageHeader
        title={a.title}
        description={a.description}
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-5">
          <AskAgentForm slug={ctx.workspaceSlug} initial={typeof ask === "string" ? ask : ""} />

          <Panel>
            <PanelHeader title={a.runs} count={runs.length} description={a.runsHint} />
            {runs.length === 0 ? (
              <EmptyState title={a.noRuns} description={a.noRunsHint} />
            ) : (
              <ul className="divide-y divide-line border-t border-line">
                {runs.map((r) => {
                  const s = RUN_TONE[r.status] ?? "neutral";
                  return (
                    <li key={r.id}>
                      <Link href={`${base}/agent/${r.id}`} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 hover:bg-raised">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-ink">{r.goal}</p>
                          <p className="mt-0.5 text-2xs text-muted">
                            {a.kinds[r.kind] ?? r.kind} · {plural(locale, r.stepCount, a.steps)} · {r.planner === "llm" ? fmt(a.plannedBy, { model: r.model ?? "" }) : a.deterministic}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge tone={s}>{a.runStatus[r.status] ?? r.status}</Badge>
                          <span className="w-20 text-right text-2xs text-subtle">{relativeTime(r.createdAt, new Date(), locale)}</span>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </div>

        <aside className="space-y-3">
          <h2 className="px-1 text-sm font-semibold">
            {a.waiting} <span className="font-normal text-subtle tabular">{approvals.length}</span>
          </h2>
          {approvals.length === 0 ? (
            <p className="px-1 text-sm text-muted">{a.noneWaiting}</p>
          ) : (
            approvals.map((a) => (
              <ApprovalCard
                key={a.id}
                slug={ctx.workspaceSlug}
                compact
                approval={{ id: a.id, title: a.title, change: a.change, reason: a.reason, risk: a.risk, experimentKey: a.experimentKey, policyDecision: a.policyDecision, createdAt: a.createdAt.toISOString() }}
              />
            ))
          )}
        </aside>
      </div>
    </div>
  );
}
