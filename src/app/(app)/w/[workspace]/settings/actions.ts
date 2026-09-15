"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireWorkspace } from "@/server/context";
import { db } from "@/server/db/client";
import { budgetPolicies, workspaces } from "@/server/db/schema";
import { recordAudit } from "@/server/services/audit";
import { getGovernance } from "@/server/services/policy-store";

export type GovernanceState = { error: string | null; saved: boolean };

const Schema = z.object({
  autonomyMode: z.enum(["observe", "suggest", "copilot", "autopilot"]),
  monthlyBudget: z.coerce.number().min(0).max(1_000_000),
  maxDailySpend: z.coerce.number().min(0).max(100_000),
  maxExperimentBudget: z.coerce.number().min(0).max(1_000_000),
  maxAutoIncreasePct: z.coerce.number().min(0).max(100),
  autoPauseLosers: z.literal("on").optional(),
  autoLaunchCampaigns: z.literal("on").optional(),
});

export async function updateGovernanceAction(slug: string, _prev: GovernanceState, formData: FormData): Promise<GovernanceState> {
  const ctx = await requireWorkspace(slug);
  if (ctx.role !== "owner" && ctx.role !== "admin") return { error: "Only owners and admins can change autonomy and budget limits.", saved: false };

  const parsed = Schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Check the values: budgets must be positive numbers.", saved: false };
  const d = parsed.data;
  if (d.maxDailySpend > d.monthlyBudget) return { error: "The daily cap can't exceed the monthly budget.", saved: false };
  if (d.maxExperimentBudget > d.monthlyBudget) return { error: "The per-experiment cap can't exceed the monthly budget.", saved: false };

  const before = await getGovernance(ctx.workspaceId);
  const policy = {
    monthlyBudget: d.monthlyBudget,
    maxDailySpend: d.maxDailySpend,
    maxExperimentBudget: d.maxExperimentBudget,
    maxAutoIncreasePct: d.maxAutoIncreasePct / 100,
    autoPauseLosers: d.autoPauseLosers === "on",
    autoLaunchCampaigns: d.autoLaunchCampaigns === "on",
  };

  await db.transaction(async (tx) => {
    await tx.update(workspaces).set({ autonomyMode: d.autonomyMode }).where(eq(workspaces.id, ctx.workspaceId));
    await tx
      .insert(budgetPolicies)
      .values({ workspaceId: ctx.workspaceId, ...policy, allowedChannels: before.policy.allowedChannels, neverWithoutApproval: before.policy.neverWithoutApproval })
      .onConflictDoUpdate({ target: budgetPolicies.workspaceId, set: { ...policy, updatedAt: new Date() } });
    await recordAudit(tx, {
      workspaceId: ctx.workspaceId,
      actorType: "user",
      actorId: ctx.userId,
      action: "governance.updated",
      targetType: "workspace",
      targetId: ctx.workspaceId,
      payload: { before: { mode: before.mode, ...before.policy }, after: { mode: d.autonomyMode, ...policy } },
    });
  });

  revalidatePath(`/w/${slug}`, "layout");
  return { error: null, saved: true };
}
