import { desc, eq } from "drizzle-orm";
import { Badge, RiskBadge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { formatDate } from "@/lib/format";
import { describeRegistry } from "@/server/agent/tools";
import { requireWorkspace } from "@/server/context";
import { db } from "@/server/db/client";
import { auditLogs } from "@/server/db/schema";
import { getGovernance } from "@/server/services/policy-store";
import { GovernanceForm } from "./governance-form";

export const metadata = { title: "Settings" };

export default async function SettingsPage({ params }: PageProps<"/w/[workspace]/settings">) {
  const { workspace } = await params;
  const ctx = await requireWorkspace(workspace);
  const [{ mode, policy }, audit] = await Promise.all([
    getGovernance(ctx.workspaceId),
    db.select().from(auditLogs).where(eq(auditLogs.workspaceId, ctx.workspaceId)).orderBy(desc(auditLogs.createdAt)).limit(40),
  ]);
  const tools = describeRegistry();
  const canManage = ctx.role === "owner" || ctx.role === "admin";

  return (
    <div className="mx-auto max-w-[1200px] space-y-5 px-3 py-5 sm:px-5 lg:py-6">
      <PageHeader title="Settings" description={`${ctx.workspaceName} workspace · you are ${ctx.role}`} />

      <Panel className="p-5">
        <GovernanceForm
          slug={ctx.workspaceSlug}
          disabled={!canManage}
          values={{
            autonomyMode: mode,
            monthlyBudget: policy.monthlyBudget,
            maxDailySpend: policy.maxDailySpend,
            maxExperimentBudget: policy.maxExperimentBudget,
            maxAutoIncreasePct: policy.maxAutoIncreasePct,
            autoPauseLosers: policy.autoPauseLosers,
            autoLaunchCampaigns: policy.autoLaunchCampaigns,
          }}
        />
        {policy.neverWithoutApproval.length > 0 && (
          <p className="mt-4 border-t border-line pt-3 text-xs text-muted">
            Always require a human, in every mode:{" "}
            {policy.neverWithoutApproval.map((c) => (
              <code key={c} className="mr-1.5 rounded-sm bg-sunken px-1 text-[10px]">
                {c}
              </code>
            ))}
          </p>
        )}
      </Panel>

      <Panel className="overflow-hidden">
        <PanelHeader title="Tool registry" description="Every action the agent can take is a typed tool with a capability, risk class, idempotency and dry-run support." count={tools.length} />
        <div className="overflow-x-auto border-t border-line">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-2xs text-subtle">
                <th className="px-4 py-2 font-medium">Tool</th>
                <th className="px-3 py-2 font-medium">Capability</th>
                <th className="px-3 py-2 font-medium">Risk</th>
                <th className="px-3 py-2 font-medium">External</th>
                <th className="px-3 py-2 font-medium">Dry run</th>
                <th className="px-4 py-2 font-medium">Who can trigger</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {tools.map((tool) => (
                <tr key={tool.name} className="align-top">
                  <td className="px-4 py-2.5">
                    <code className="text-xs font-medium text-ink">{tool.name}</code>
                    <p className="mt-0.5 max-w-md text-2xs text-muted">{tool.description}</p>
                  </td>
                  <td className="px-3 py-2.5">
                    <code className="text-[11px] text-muted">{tool.capability}</code>
                  </td>
                  <td className="px-3 py-2.5">
                    <RiskBadge risk={tool.risk} />
                  </td>
                  <td className="px-3 py-2.5 text-xs text-muted">{tool.external ? "Yes, audited" : "No"}</td>
                  <td className="px-3 py-2.5 text-xs text-muted">{tool.supportsDryRun ? "Yes" : "No"}</td>
                  <td className="px-4 py-2.5 text-xs text-muted">{tool.permissions.join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel className="overflow-hidden">
        <PanelHeader title="Audit log" description="Append-only: the database rejects edits and deletes. External mutations are flagged." />
        <div className="overflow-x-auto border-t border-line">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-2xs text-subtle">
                <th className="px-4 py-2 font-medium">When</th>
                <th className="px-3 py-2 font-medium">Actor</th>
                <th className="px-3 py-2 font-medium">Action</th>
                <th className="px-4 py-2 font-medium">Target</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {audit.map((a) => (
                <tr key={a.id}>
                  <td className="px-4 py-2 text-xs text-muted tabular whitespace-nowrap">{formatDate(a.createdAt, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                  <td className="px-3 py-2 text-xs">
                    <Badge tone={a.actorType === "agent" ? "agent" : "neutral"}>{a.actorType}</Badge>
                  </td>
                  <td className="px-3 py-2">
                    <code className="text-xs text-ink">{a.action}</code>
                    {a.isExternalMutation && (
                      <Badge tone="warning" className="ml-2">
                        External{(a.payload as { demo?: boolean }).demo ? " · demo" : ""}
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-2 text-xs text-muted">
                    {a.targetType}
                    {a.targetId ? ` · ${a.targetId.slice(0, 18)}` : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
