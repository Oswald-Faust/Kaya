"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { listWorkspacesForUser, requireWorkspace } from "@/server/context";
import { db } from "@/server/db/client";
import { budgetPolicies, workspaces } from "@/server/db/schema";
import { recordAudit } from "@/server/services/audit";
import { checkRateLimit } from "@/server/services/account";
import { getGovernance } from "@/server/services/policy-store";
import { changePassword, deleteOwnWorkspace, renameWorkspace, setAvatar, setWorkspaceIcon, updateProfileName } from "@/server/services/settings";
import { changeMemberRole, inviteMember, removeMember, resendInvitation, revokeInvitation } from "@/server/services/team";
import { localizeError } from "@/i18n/errors";
import { getI18n } from "@/i18n/server";

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
  const { t } = await getI18n();
  if (ctx.role !== "owner" && ctx.role !== "admin") return { error: t.settings.agent.errorRole, saved: false };

  const parsed = Schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: t.settings.agent.errorValues, saved: false };
  const d = parsed.data;
  if (d.maxDailySpend > d.monthlyBudget) return { error: t.settings.agent.errorDaily, saved: false };
  if (d.maxExperimentBudget > d.monthlyBudget) return { error: t.settings.agent.errorExperiment, saved: false };

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

async function failed(error: unknown): Promise<{ ok: false; error: string }> {
  const { locale, t } = await getI18n();
  const message = localizeError(error, locale);
  if (message) return { ok: false, error: message };
  console.error(JSON.stringify({ level: "error", msg: "settings_action_failed", error: String(error) }));
  return { ok: false, error: t.errors.generic };
}

async function succeeded(pick: (t: Awaited<ReturnType<typeof getI18n>>["t"]) => string): Promise<SettingsResult> {
  const { t } = await getI18n();
  return { ok: true, message: pick(t) };
}

export async function renameWorkspaceAction(slug: string, name: string): Promise<SettingsResult> {
  try {
    const ctx = await requireWorkspace(slug);
    await renameWorkspace(ctx, name);
    revalidatePath(`/w/${slug}`, "layout");
    return succeeded((t) => t.settings.general.nameSaved);
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

export async function uploadWorkspaceIconAction(slug: string, formData: FormData): Promise<SettingsResult> {
  try {
    const ctx = await requireWorkspace(slug);
    await setWorkspaceIcon(ctx, formData.get("image"));
    revalidatePath(`/w/${slug}`, "layout");
    return succeeded((t) => t.settings.image.saved);
  } catch (error) {
    return failed(error);
  }
}

export async function removeWorkspaceIconAction(slug: string): Promise<SettingsResult> {
  try {
    const ctx = await requireWorkspace(slug);
    await setWorkspaceIcon(ctx, null);
    revalidatePath(`/w/${slug}`, "layout");
    return succeeded((t) => t.settings.image.removed);
  } catch (error) {
    return failed(error);
  }
}

export async function uploadAvatarAction(slug: string, formData: FormData): Promise<SettingsResult> {
  try {
    const ctx = await requireWorkspace(slug);
    await setAvatar(ctx.userId, formData.get("image"));
    revalidatePath(`/w/${slug}`, "layout");
    return succeeded((t) => t.settings.image.saved);
  } catch (error) {
    return failed(error);
  }
}

export async function removeAvatarAction(slug: string): Promise<SettingsResult> {
  try {
    const ctx = await requireWorkspace(slug);
    await setAvatar(ctx.userId, null);
    revalidatePath(`/w/${slug}`, "layout");
    return succeeded((t) => t.settings.image.removed);
  } catch (error) {
    return failed(error);
  }
}

export type InviteActionResult = { ok: true; email: string; inviteUrl: string; emailed: boolean } | { ok: false; error: string };

export async function inviteMemberAction(slug: string, email: string, role: string): Promise<InviteActionResult> {
  try {
    const ctx = await requireWorkspace(slug);
    const result = await inviteMember(ctx, { email, role }, (await getI18n()).locale);
    revalidatePath(`/w/${slug}/settings/team`);
    return { ok: true, ...result };
  } catch (error) {
    return failed(error);
  }
}

export async function resendInvitationAction(slug: string, invitationId: string): Promise<InviteActionResult> {
  try {
    const ctx = await requireWorkspace(slug);
    const result = await resendInvitation(ctx, invitationId, (await getI18n()).locale);
    revalidatePath(`/w/${slug}/settings/team`);
    return { ok: true, ...result };
  } catch (error) {
    return failed(error);
  }
}

export async function revokeInvitationAction(slug: string, invitationId: string): Promise<SettingsResult> {
  try {
    const ctx = await requireWorkspace(slug);
    await revokeInvitation(ctx, invitationId);
    revalidatePath(`/w/${slug}/settings/team`);
    return succeeded((t) => t.settings.team.revoked);
  } catch (error) {
    return failed(error);
  }
}

const RoleSchema = z.enum(["owner", "admin", "member", "viewer"]);

export async function changeRoleAction(slug: string, memberId: string, role: string): Promise<SettingsResult> {
  try {
    const parsed = RoleSchema.safeParse(role);
    if (!parsed.success) return { ok: false, error: (await getI18n()).t.settings.team.unknownRole };
    const ctx = await requireWorkspace(slug);
    await changeMemberRole(ctx, memberId, parsed.data);
    revalidatePath(`/w/${slug}`, "layout");
    return succeeded((t) => t.settings.team.roleUpdated);
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
      return succeeded((t) => t.settings.team.removed);
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
    return succeeded((t) => t.settings.profile.saved);
  } catch (error) {
    return failed(error);
  }
}

export async function changePasswordAction(slug: string, current: string, next: string): Promise<SettingsResult> {
  try {
    const ctx = await requireWorkspace(slug);
    checkRateLimit(`password:${ctx.userId}`, 8);
    await changePassword(ctx.userId, { current, next });
    return succeeded((t) => t.settings.profile.passwordUpdated);
  } catch (error) {
    return failed(error);
  }
}
