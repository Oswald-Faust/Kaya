import type { Metadata } from "next";
import { getI18n } from "@/i18n/server";
import { fmt, plural } from "@/i18n/format";
import { translateRunText } from "@/i18n/run-text";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ActivityTimeline } from "@/components/product/agent-timeline";
import { ApprovalCard } from "@/components/product/approval-card";
import { ExecutionPrompt } from "@/components/product/execution-prompt";
import { Badge, ChannelBadge, RiskBadge } from "@/components/ui/badge";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Notice } from "@/components/ui/states";
import { requireWorkspace } from "@/server/context";
import { getRun } from "@/server/services/agent-runs";
import { buildExecutionPrompt } from "@/server/domain/agent/execution-prompt";
import { formatDate } from "@/lib/format";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.app.run.metaTitle };
}

const TONE: Record<string, "neutral" | "agent" | "positive" | "negative" | "warning"> = {
  queued: "neutral",
  planning: "agent",
  running: "agent",
  awaiting_approval: "warning",
  completed: "positive",
  failed: "negative",
  cancelled: "neutral",
};

export default async function RunPage({ params }: PageProps<"/w/[workspace]/agent/[runId]">) {
  const { workspace, runId } = await params;
  const ctx = await requireWorkspace(workspace);
  const detail = await getRun(ctx.workspaceId, runId);
  if (!detail) notFound();
  const { run, steps, messages, toolCalls, approvals, assets } = detail;
  const base = `/w/${ctx.workspaceSlug}`;
  const { t, locale } = await getI18n();
  const r = t.app.run;
  const pending = approvals.filter((a) => a.status === "pending");
  const decided = approvals.filter((a) => a.status !== "pending");
  const external = toolCalls.filter((c) => c.status === "succeeded" && (c.risk === "R2" || c.risk === "R3" || c.risk === "R4"));

  const hasDrafts = assets.some((asset) => asset.status === "draft");
  const active = ["queued", "planning", "running"].includes(run.status);
  const internalChanges = toolCalls.some((call) => call.status === "succeeded" && !call.dryRun && call.risk === "R1");
  const executionPrompt = buildExecutionPrompt({
    locale,
    goal: run.goal,
    status: run.status,
    plan: run.plan,
    summary: typeof run.result?.summary === "string" ? run.result.summary : null,
    assets: assets.map((asset) => ({ title: asset.title, kind: asset.kind, channel: asset.channel, status: asset.status, body: asset.body })),
    approvals: approvals.map((approval) => ({ title: approval.title, change: approval.change, tool: approval.tool, status: approval.status, input: approval.toolInput })),
  });

  return (
    <div className="mx-auto max-w-[1200px] space-y-5 px-3 py-5 sm:px-5 lg:py-6">
      <div>
        <Link href={`${base}/agent`} className="inline-flex items-center gap-1 text-xs text-muted hover:text-ink">
          <ArrowLeft className="size-3" /> {r.back}
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <h1 className="max-w-3xl text-2xl font-semibold tracking-tight">{run.goal}</h1>
          <Badge tone={TONE[run.status] ?? "neutral"}>{t.app.agent.runStatus[run.status] ?? run.status}</Badge>
        </div>
        <p className="mt-1 text-xs text-muted">
          {fmt(r.startedAt, { date: run.startedAt ? formatDate(run.startedAt, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }, locale) : "—" })} ·{" "}
          {run.planner === "llm" ? fmt(r.llmPlanner, { model: run.model ?? "" }) : r.deterministicPlanner}
          {run.promptVersion ? ` · ${run.promptVersion}` : ""} · {plural(locale, toolCalls.length, r.toolCalls)}
        </p>
      </div>

      {run.status === "failed" && run.error && <Notice tone="error" title={r.stopped}>{run.error}</Notice>}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-5">
          {assets.length > 0 && (
            <Panel>
              <PanelHeader title={r.deliverables} description={r.deliverablesHint} />
              <div className="divide-y divide-line border-t border-line">
                {assets.map((asset) => (
                  <section key={asset.id} className="space-y-4 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="mr-auto text-base font-semibold">{asset.title}</h2>
                      <ChannelBadge channel={asset.channel} />
                      <Badge tone={asset.status === "published" ? "positive" : "warning"}>
                        {t.app.statusValues[asset.status] ?? asset.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted">{asset.status === "draft" ? r.draftNext : r.savedResult}</p>
                    <div className="rounded-md border border-line bg-raised p-4 text-sm leading-7 whitespace-pre-wrap break-words text-ink">{asset.body}</div>
                    <Link href={`${base}/content#asset-${asset.id}`} className="inline-flex text-sm font-medium text-agent hover:underline">
                      {r.openContent} →
                    </Link>
                  </section>
                ))}
              </div>
            </Panel>
          )}

          {messages.length > 0 && (
            <Panel>
              <PanelHeader title={r.conversation} />
              <ul className="space-y-3 border-t border-line px-4 py-4">
                {messages.map((m) => (
                  <li key={m.id} className={m.role === "user" ? "flex justify-end" : ""}>
                    {m.role === "user" ? (
                      <p className="max-w-[80%] rounded-lg bg-sunken px-3 py-2 text-sm text-ink">{m.content}</p>
                    ) : (
                      <div className="border-l-2 border-agent pl-3">
                        <p className="text-2xs font-medium text-agent">{r.agent}</p>
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
              <PanelHeader title={r.plan} description={translateRunText(run.plan.objective, locale)} />
              <ol className="divide-y divide-line border-t border-line">
                {run.plan.steps.map((s, i) => (
                  <li key={s.id} className="grid grid-cols-[20px_minmax(0,1fr)_auto] gap-3 px-4 py-2.5">
                    <span className="text-xs text-subtle tabular">{i + 1}</span>
                    <div className="min-w-0">
                      <p className="text-sm text-ink">{translateRunText(s.title, locale)}</p>
                      <p className="text-2xs text-muted">
                        {translateRunText(s.why, locale)}
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
                  {fmt(r.assumptions, { list: run.plan.assumptions.join(" ") })}
                </div>
              )}
            </Panel>
          )}

          <Panel>
            <PanelHeader title={r.timeline} description={r.timelineHint} />
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
              <h2 className="px-1 text-sm font-semibold">{r.yourDecision}</h2>
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
            <PanelHeader title={r.outcome} />
            <div className="space-y-2 border-t border-line px-4 py-3 text-sm">
              {assets.length > 0 && (
                <>
                  <p className="font-medium text-ink">{hasDrafts ? r.draftReady : r.deliverables}</p>
                  <p className="text-muted">{hasDrafts ? r.draftNext : r.savedResult}</p>
                </>
              )}
              {assets.length === 0 && external.length === 0 && decided.length === 0 && pending.length === 0 && (
                <p className="text-muted">{active ? r.inProgress : run.status === "failed" || run.status === "cancelled" ? r.noResult : internalChanges ? r.internalChanges : r.readOnly}</p>
              )}
              {external.map((c) => (
                <p key={c.id} className="text-ink">
                  {r.executed} <code className="text-xs">{c.tool}</code>
                  {c.isDemo ? <span className="text-muted">{r.onDemo}</span> : null}.
                </p>
              ))}
              {decided.map((a) => (
                <p key={a.id} className="text-muted">
                  <span className="text-ink">{a.title}</span> — {r.decision[a.status] ?? a.status}
                  {a.decisionNote ? `: “${a.decisionNote}”` : ""}
                </p>
              ))}
              {pending.length > 0 && <p className="text-muted">{r.nothingRisky}</p>}
            </div>
          </Panel>
          <ExecutionPrompt
            prompt={executionPrompt}
            title={r.codePromptTitle}
            description={r.codePromptHint}
            copyLabel={r.copyPrompt}
            copiedLabel={r.promptCopied}
            toolsLabel={r.codePromptTools}
          />
        </aside>
      </div>
    </div>
  );
}
