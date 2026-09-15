import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { budgetPolicies, workspaces } from "@/server/db/schema";
import type { BudgetPolicy } from "@/server/domain/governance/policy";
import type { AutonomyMode } from "@/server/domain/types";

export function defaultPolicy(monthlyBudget: number): BudgetPolicy {
  return {
    monthlyBudget,
    maxDailySpend: Math.max(0, Math.round(monthlyBudget / 20)),
    maxExperimentBudget: Math.round(monthlyBudget * 0.4),
    maxAutoIncreasePct: 0.2,
    autoPauseLosers: true,
    autoLaunchCampaigns: false,
    allowedChannels: [],
    neverWithoutApproval: ["CHANGE_PRICING", "CONTACT_CREATOR", "PUBLISH_COMMUNITY_POST"],
  };
}

export async function getGovernance(workspaceId: string): Promise<{ mode: AutonomyMode; policy: BudgetPolicy }> {
  const [ws, row] = await Promise.all([
    db.query.workspaces.findFirst({ where: eq(workspaces.id, workspaceId) }),
    db.query.budgetPolicies.findFirst({ where: eq(budgetPolicies.workspaceId, workspaceId) }),
  ]);
  const policy: BudgetPolicy = row
    ? {
        monthlyBudget: row.monthlyBudget,
        maxDailySpend: row.maxDailySpend,
        maxExperimentBudget: row.maxExperimentBudget,
        maxAutoIncreasePct: row.maxAutoIncreasePct,
        autoPauseLosers: row.autoPauseLosers,
        autoLaunchCampaigns: row.autoLaunchCampaigns,
        allowedChannels: row.allowedChannels,
        neverWithoutApproval: row.neverWithoutApproval,
      }
    : defaultPolicy(0);
  return { mode: ws?.autonomyMode ?? "suggest", policy };
}
