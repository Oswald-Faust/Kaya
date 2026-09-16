"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { listWorkspacesForUser, requireWorkspace } from "@/server/context";
import { db } from "@/server/db/client";
import { budgetPolicies, workspaces } from "@/server/db/schema";
import { recordAudit } from "@/server/services/audit";
import { isDomainError } from "@/server/domain/errors";
import { checkRateLimit } from "@/server/services/account";
import { getGovernance } from "@/server/services/policy-store";
import { changePassword, deleteOwnWorkspace, renameWorkspace, updateProfileName } from "@/server/services/settings";
import { changeMemberRole, inviteMember, removeMember, resendInvitation, revokeInvitation } from "@/server/services/team";

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

// ───────────────────────── Workspace, team and account ─────────────────────────

export type SettingsResult = { ok: true; message?: string } | { ok: false; error: string };

function failed(error: unknown): SettingsResult {
  if (isDomainError(error)) return { ok: false, error: error.message };
  console.error(JSON.stringify({ level: "error", msg: "settings_action_failed", error: String(error) }));
  return { ok: false, error: "Something went wrong. Nothing was changed." };
}

export async function renameWorkspaceAction(slug: string, name: string): Promise<SettingsResult> {
  try {
    const ctx = await requireWorkspace(slug);
    await renameWorkspace(ctx, name);
    revalidatePath(`/w/${slug}`, "layout");
    return { ok: true, message: "Workspace name saved." };
  } catch (error) {
    return failed(error);
  }
}

export async function deleteWorkspaceAction(slug: string, confirmation: string): Promise<SettingsResult> {
  let destination = "/start";
  try {
    const ctx = await requireWorkspace(slug);
    await deleteOwnWorkspace(ctx, confirmation);
    const remaining = (await listWorkspacesForUser(ctx.userId)).find((w) => w.slug !== slug);
    if (remaining) destination = `/w/${remaining.slug}`;
  } catch (error) {
    return failed(error);
  }
  redirect(destination);
}

export type InviteActionResult = { ok: true; email: string; inviteUrl: string; emailed: boolean } | { ok: false; error: string };

export async function inviteMemberAction(slug: string, email: string, role: string): Promise<InviteActionResult> {
  try {
    const ctx = await requireWorkspace(slug);
    const result = await inviteMember(ctx, { email, role });
    revalidatePath(`/w/${slug}/settings/team`);
    return { ok: true, ...result };
  } catch (error) {
    const r = failed(error);
    return r.ok ? { ok: false, error: "Something went wrong." } : r;
  }
}

export async function resendInvitationAction(slug: string, invitationId: string): Promise<InviteActionResult> {
  try {
    const ctx = await requireWorkspace(slug);
    const result = await resendInvitation(ctx, invitationId);
    revalidatePath(`/w/${slug}/settings/team`);
    return { ok: true, ...result };
  } catch (error) {
    const r = failed(error);
    return r.ok ? { ok: false, error: "Something went wrong." } : r;
  }
}

export async function revokeInvitationAction(slug: string, invitationId: string): Promise<SettingsResult> {
  try {
    const ctx = await requireWorkspace(slug);
    await revokeInvitation(ctx, invitationId);
    revalidatePath(`/w/${slug}/settings/team`);
    return { ok: true, message: "Invitation revoked. Its seat is free again." };
  } catch (error) {
    return failed(error);
  }
}

const RoleSchema = z.enum(["owner", "admin", "member", "viewer"]);

export async function changeRoleAction(slug: string, memberId: string, role: string): Promise<SettingsResult> {
  try {
    const parsed = RoleSchema.safeParse(role);
    if (!parsed.success) return { ok: false, error: "Unknown role." };
    const ctx = await requireWorkspace(slug);
    await changeMemberRole(ctx, memberId, parsed.data);
    revalidatePath(`/w/${slug}`, "layout");
    return { ok: true, message: "Role updated." };
  } catch (error) {
    return failed(error);
  }
}

export async function removeMemberAction(slug: string, memberId: string): Promise<SettingsResult> {
  let left = false;
  try {
    const ctx = await requireWorkspace(slug);
    left = (await removeMember(ctx, memberId)).left;
    if (!left) {
      revalidatePath(`/w/${slug}/settings/team`);
      return { ok: true, message: "Removed from the workspace." };
    }
  } catch (error) {
    return failed(error);
  }
  redirect("/start");
}

export async function updateProfileAction(slug: string, name: string): Promise<SettingsResult> {
  try {
    const ctx = await requireWorkspace(slug);
    await updateProfileName(ctx.userId, name);
    revalidatePath(`/w/${slug}`, "layout");
    return { ok: true, message: "Profile saved." };
  } catch (error) {
    return failed(error);
  }
}

export async function changePasswordAction(slug: string, current: string, next: string): Promise<SettingsResult> {
  try {
    const ctx = await requireWorkspace(slug);
    checkRateLimit(`password:${ctx.userId}`, 8);
    await changePassword(ctx.userId, { current, next });
    return { ok: true, message: "Password updated." };
  } catch (error) {
    return failed(error);
  }
}
