import { SettingsHeader } from "@/components/settings/primitives";
import { requireWorkspace } from "@/server/context";
import { getGovernance } from "@/server/services/policy-store";
import { GovernanceForm } from "../governance-form";

export const metadata = { title: "Agent & guardrails" };

export default async function AgentSettingsPage({ params }: PageProps<"/w/[workspace]/settings/agent">) {
  const { workspace } = await params;
  const ctx = await requireWorkspace(workspace);
  const { mode, policy } = await getGovernance(ctx.workspaceId);
  const canManage = !ctx.isDemo && (ctx.role === "owner" || ctx.role === "admin");

  return (
    <>
      <SettingsHeader title="Agent & guardrails" description="How much the agent does on its own, and the spending limits it can never cross." />
      {!canManage && <p className="mb-4 rounded-md bg-sunken px-3 py-2 text-xs text-muted">Only owners and admins can change these settings.</p>}
      <div className="rounded-lg border border-line bg-surface p-4 sm:p-5">
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
          <p className="mt-5 border-t border-line pt-3 text-xs text-muted">
            Always need a human, in every mode:{" "}
            {policy.neverWithoutApproval.map((c) => (
              <code key={c} className="mr-1.5 rounded-sm bg-sunken px-1 text-[10px]">
                {c}
              </code>
            ))}
          </p>
        )}
      </div>
    </>
  );
}
