import type { Metadata } from "next";
import { SettingsHeader } from "@/components/settings/primitives";
import { requireWorkspace } from "@/server/context";
import { getGovernance } from "@/server/services/policy-store";
import { getI18n } from "@/i18n/server";
import { GovernanceForm } from "../governance-form";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.settings.agent.title };
}

export default async function AgentSettingsPage({ params }: PageProps<"/w/[workspace]/settings/agent">) {
  const { workspace } = await params;
  const ctx = await requireWorkspace(workspace);
  const [{ mode, policy }, { t }] = await Promise.all([getGovernance(ctx.workspaceId), getI18n()]);
  const a = t.settings.agent;
  const canManage = !ctx.isDemo && (ctx.role === "owner" || ctx.role === "admin");

  return (
    <>
      <SettingsHeader title={a.title} description={a.description} />
      {!canManage && <p className="mb-4 rounded-md bg-sunken px-3 py-2 text-xs text-muted">{a.readOnly}</p>}
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
            {a.alwaysHuman}{" "}
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
