import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ActivityTimeline } from "@/components/product/agent-timeline";
import { ApprovalCard } from "@/components/product/approval-card";
import { Badge, RiskBadge } from "@/components/ui/badge";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Notice } from "@/components/ui/states";
import { requireWorkspace } from "@/server/context";
import { getRun } from "@/server/services/agent-runs";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Agent run" };

const STATUS: Record<string, { label: string; tone: "neutral" | "agent" | "positive" | "negative" | "warning" }> = {
  queued: { label: "Queued", tone: "neutral" },
  planning: { label: "Planning", tone: "agent" },
  running: { label: "Running", tone: "agent" },
  awaiting_approval: { label: "Awaiting approval", tone: "warning" },
  completed: { label: "Completed", tone: "positive" },
  failed: { label: "Failed", tone: "negative" },
  cancelled: { label: "Cancelled", tone: "neutral" },
};

export default async function RunPage({ params }: PageProps<"/w/[workspace]/agent/[runId]">) {
  const { workspace, runId } = await params;
  const ctx = await requireWorkspace(workspace);
  const detail = await getRun(ctx.workspaceId, runId);
  if (!detail) notFound();
  const { run, steps, messages, toolCalls, approvals } = detail;
  const base = `/w/${ctx.workspaceSlug}`;
  const status = STATUS[run.status];
  const pending = approvals.filter((a) => a.status === "pending");
  const decided = approvals.filter((a) => a.status !== "pending");
  const external = toolCalls.filter((c) => c.status === "succeeded" && (c.risk === "R2" || c.risk === "R3" || c.risk === "R4"));

  return (
    <div className="mx-auto max-w-[1200px] space-y-5 px-3 py-5 sm:px-5 lg:py-6">
      <div>
        <Link href={`${base}/agent`} className="inline-flex items-center gap-1 text-xs text-muted hover:text-ink">
          <ArrowLeft className="size-3" /> Agent
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <h1 className="max-w-3xl text-2xl font-semibold tracking-tight">{run.goal}</h1>
          <Badge tone={status.tone}>{status.label}</Badge>
        </div>
        <p className="mt-1 text-xs text-muted">
          Started {run.startedAt ? formatDate(run.startedAt, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"} ·{" "}
          {run.planner === "llm" ? `LLM planner (${run.model})` : "Deterministic planner"}
          {run.promptVersion ? ` · ${run.promptVersion}` : ""} · {toolCalls.length} tool calls
        </p>
      </div>

      {run.status === "failed" && run.error && <Notice tone="error" title="The run stopped">{run.error}</Notice>}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-5">
          {messages.length > 0 && (
            <Panel>
              <PanelHeader title="Conversation" />
              <ul className="space-y-3 border-t border-line px-4 py-4">
                {messages.map((m) => (
                  <li key={m.id} className={m.role === "user" ? "flex justify-end" : ""}>
                    {m.role === "user" ? (
                      <p className="max-w-[80%] rounded-lg bg-sunken px-3 py-2 text-sm text-ink">{m.content}</p>
                    ) : (
                      <div className="border-l-2 border-agent pl-3">
                        <p className="text-2xs font-medium text-agent">Agent</p>
                        <p className="mt-0.5 max-w-2xl text-sm leading-6 text-ink">{m.content}</p>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          {run.plan && (
            <Panel>
              <PanelHeader title="Plan" description={run.plan.objective} />
              <ol className="divide-y divide-line border-t border-line">
                {run.plan.steps.map((s, i) => (
                  <li key={s.id} className="grid grid-cols-[20px_minmax(0,1fr)_auto] gap-3 px-4 py-2.5">
                    <span className="text-xs text-subtle tabular">{i + 1}</span>
                    <div className="min-w-0">
                      <p className="text-sm text-ink">{s.title}</p>
                      <p className="text-2xs text-muted">
                        {s.why}
                        {s.tool && (
                          <>
                            {" · "}
                            <code>{s.tool}</code>
                          </>
                        )}
                      </p>
                    </div>
                    <RiskBadge risk={s.risk} />
                  </li>
                ))}
              </ol>
              {run.plan.assumptions.length > 0 && (
                <div className="border-t border-line px-4 py-2.5 text-2xs text-muted">
                  Assumptions: {run.plan.assumptions.join(" ")}
                </div>
              )}
            </Panel>
          )}

          <Panel>
            <PanelHeader title="Execution timeline" description="What the agent actually did, in order. Expand a tool call for inputs, outputs and idempotency." />
            <div className="border-t border-line px-4 py-4">
              <ActivityTimeline
                steps={steps}
                toolCalls={toolCalls.map((c) => ({
                  id: c.id,
                  stepId: c.stepId,
                  tool: c.tool,
                  capability: c.capability,
                  risk: c.risk,
                  status: c.status,
                  input: c.input,
                  output: c.output,
                  error: c.error,
                  adapter: c.adapter,
                  isDemo: c.isDemo,
                  dryRun: c.dryRun,
                  durationMs: c.durationMs,
                  idempotencyKey: c.idempotencyKey,
                }))}
              />
            </div>
          </Panel>
        </div>

        <aside className="space-y-5">
          {pending.length > 0 && (
            <div className="space-y-2.5">
              <h2 className="px-1 text-sm font-semibold">Waiting for your decision</h2>
              {pending.map((a) => (
                <ApprovalCard
                  key={a.id}
                  slug={ctx.workspaceSlug}
                  approval={{ id: a.id, title: a.title, change: a.change, reason: a.reason, risk: a.risk, experimentKey: null, policyDecision: a.policyDecision, createdAt: a.createdAt.toISOString() }}
                />
              ))}
            </div>
          )}

          <Panel>
            <PanelHeader title="Outcome" />
            <div className="space-y-2 border-t border-line px-4 py-3 text-sm">
              {external.length === 0 && decided.length === 0 && pending.length === 0 && (
                <p className="text-muted">This run only read data and made recommendations; nothing outside Kaya changed.</p>
              )}
              {external.map((c) => (
                <p key={c.id} className="text-ink">
                  Executed <code className="text-xs">{c.tool}</code>
                  {c.isDemo ? <span className="text-muted"> on a demo connection</span> : null}.
                </p>
              ))}
              {decided.map((a) => (
                <p key={a.id} className="text-muted">
                  <span className="text-ink">{a.title}</span> — {a.status}
                  {a.decisionNote ? `: “${a.decisionNote}”` : ""}
                </p>
              ))}
              {pending.length > 0 && <p className="text-muted">Nothing risky runs until you decide.</p>}
            </div>
          </Panel>
        </aside>
      </div>
    </div>
  );
}
