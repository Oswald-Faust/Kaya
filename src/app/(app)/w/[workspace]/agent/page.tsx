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

export const metadata = { title: "Agent" };

const RUN_STATUS: Record<string, { label: string; tone: "neutral" | "agent" | "positive" | "negative" | "warning" }> = {
  queued: { label: "Queued", tone: "neutral" },
  planning: { label: "Planning", tone: "agent" },
  running: { label: "Running", tone: "agent" },
  awaiting_approval: { label: "Awaiting approval", tone: "warning" },
  completed: { label: "Completed", tone: "neutral" },
  failed: { label: "Failed", tone: "negative" },
  cancelled: { label: "Cancelled", tone: "neutral" },
};

const KIND_LABEL: Record<string, string> = {
  goal: "Goal",
  product_analysis: "Product analysis",
  strategy: "Strategy",
  daily_brief: "Daily brief",
};

export default async function AgentPage({ params, searchParams }: PageProps<"/w/[workspace]/agent">) {
  const { workspace } = await params;
  const { ask } = await searchParams;
  const ctx = await requireWorkspace(workspace);
  const [runs, approvals] = await Promise.all([listRuns(ctx.workspaceId), listApprovals(ctx.workspaceId)]);
  const base = `/w/${ctx.workspaceSlug}`;

  return (
    <div className="mx-auto max-w-[1200px] space-y-5 px-3 py-5 sm:px-5 lg:py-6">
      <PageHeader
        title="Agent"
        description="Give the agent a goal. It retrieves context, shows its plan, calls typed tools inside your policy, and asks before anything risky."
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-5">
          <AskAgentForm slug={ctx.workspaceSlug} initial={typeof ask === "string" ? ask : ""} />

          <Panel>
            <PanelHeader title="Runs" count={runs.length} description="Every run keeps its plan, steps, tool calls, approvals and outcome." />
            {runs.length === 0 ? (
              <EmptyState title="No runs yet" description="Start with a concrete goal, like “Get me my first 20 paying users”." />
            ) : (
              <ul className="divide-y divide-line border-t border-line">
                {runs.map((r) => {
                  const s = RUN_STATUS[r.status];
                  return (
                    <li key={r.id}>
                      <Link href={`${base}/agent/${r.id}`} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 hover:bg-raised">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-ink">{r.goal}</p>
                          <p className="mt-0.5 text-2xs text-muted">
                            {KIND_LABEL[r.kind] ?? r.kind} · {r.stepCount} steps · {r.planner === "llm" ? `planned by ${r.model}` : "deterministic planner"}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge tone={s.tone}>{s.label}</Badge>
                          <span className="w-20 text-right text-2xs text-subtle">{relativeTime(r.createdAt)}</span>
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
            Waiting for approval <span className="font-normal text-subtle tabular">{approvals.length}</span>
          </h2>
          {approvals.length === 0 ? (
            <p className="px-1 text-sm text-muted">No actions are waiting.</p>
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
