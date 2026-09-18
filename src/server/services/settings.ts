import "server-only";
import { and, count, eq } from "drizzle-orm";
import { z } from "zod";
import type { WorkspaceContext } from "@/server/context";
import { db } from "@/server/db/client";
import * as t from "@/server/db/schema";
import { localizedError, type ErrorKey } from "@/i18n/errors";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { recordAudit } from "./audit";
import { deleteStoredImage, storeImage } from "./images";

/** Workspace and personal settings a signed-in user edits for themselves. */

const WorkspaceName = z.string().trim().min(1, "workspaceNameRequired").max(60, "workspaceNameLong");
const PersonName = z.string().trim().min(1, "nameRequired").max(80, "nameLong");
const NewPassword = z.string().min(8, "passwordShort").max(200, "passwordLong");

function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) throw localizedError("validation", (result.error.issues[0]?.message ?? "generic") as ErrorKey);
  return result.data;
}

export async function renameWorkspace(ctx: WorkspaceContext, value: unknown): Promise<void> {
  if (ctx.isDemo) throw localizedError("forbidden", "demoRename");
  if (ctx.role !== "owner" && ctx.role !== "admin") throw localizedError("forbidden", "renameRole");
  const name = parse(WorkspaceName, value);
  if (name === ctx.workspaceName) return;
  await db.transaction(async (tx) => {
    await tx.update(t.workspaces).set({ name }).where(eq(t.workspaces.id, ctx.workspaceId));
    await recordAudit(tx, { workspaceId: ctx.workspaceId, actorType: "user", actorId: ctx.userId, action: "workspace.renamed", targetType: "workspace", targetId: ctx.workspaceId, payload: { from: ctx.workspaceName, to: name } });
  });
}

/** Owner only, confirmed by typing the workspace name. A live subscription must be canceled first. */
export async function deleteOwnWorkspace(ctx: WorkspaceContext, confirmation: unknown): Promise<void> {
  if (ctx.isDemo) throw localizedError("forbidden", "demoDelete");
  if (ctx.role !== "owner") throw localizedError("forbidden", "deleteRole");
  if (typeof confirmation !== "string" || confirmation.trim() !== ctx.workspaceName) throw localizedError("validation", "deleteConfirm");
  const org = await db.query.organizations.findFirst({ where: eq(t.organizations.id, ctx.organizationId) });
  if (org?.stripeSubscriptionId && ["trialing", "active", "past_due"].includes(org.planStatus)) {
    throw localizedError("conflict", "cancelSubscriptionFirst");
  }
  await db.transaction(async (tx) => {
    await recordAudit(tx, { workspaceId: ctx.workspaceId, actorType: "user", actorId: ctx.userId, action: "workspace.deleted", targetType: "workspace", targetId: ctx.workspaceId, payload: { name: ctx.workspaceName, slug: ctx.workspaceSlug } });
    await tx.delete(t.workspaces).where(eq(t.workspaces.id, ctx.workspaceId));
    const [{ left }] = await tx.select({ left: count() }).from(t.workspaces).where(eq(t.workspaces.organizationId, ctx.organizationId));
    if (left === 0) await tx.delete(t.organizations).where(eq(t.organizations.id, ctx.organizationId));
  });
}

export async function updateProfileName(userId: string, value: unknown): Promise<void> {
  const name = parse(PersonName, value);
  await db.update(t.users).set({ name }).where(and(eq(t.users.id, userId), eq(t.users.isGuest, false)));
}

/** Google-only accounts set a first password without a current one. */
export async function changePassword(userId: string, input: { current: unknown; next: unknown }): Promise<void> {
  const user = await db.query.users.findFirst({ where: eq(t.users.id, userId) });
  if (!user || user.isGuest) throw localizedError("forbidden", "signInForPassword");
  if (user.passwordHash) {
    const ok = typeof input.current === "string" && (await verifyPassword(input.current, user.passwordHash));
    if (!ok) throw localizedError("validation", "currentPasswordWrong");
  }
  const next = parse(NewPassword, input.next);
  await db.update(t.users).set({ passwordHash: await hashPassword(next) }).where(eq(t.users.id, userId));
}

export async function hasPassword(userId: string): Promise<boolean> {
  const user = await db.query.users.findFirst({ where: eq(t.users.id, userId), columns: { passwordHash: true } });
  return Boolean(user?.passwordHash);
}

export async function setAvatar(userId: string, file: unknown | null): Promise<void> {
  const user = await db.query.users.findFirst({ where: eq(t.users.id, userId), columns: { avatarUrl: true, isGuest: true } });
  if (!user || user.isGuest) throw localizedError("forbidden", "signInForPassword");
  const url = file ? await storeImage(file, userId) : null;
  await db.update(t.users).set({ avatarUrl: url }).where(eq(t.users.id, userId));
  await deleteStoredImage(user.avatarUrl);
}

export async function setWorkspaceIcon(ctx: WorkspaceContext, file: unknown | null): Promise<void> {
  if (ctx.isDemo) throw localizedError("forbidden", "demoIcon");
  if (ctx.role !== "owner" && ctx.role !== "admin") throw localizedError("forbidden", "iconRole");
  const ws = await db.query.workspaces.findFirst({ where: eq(t.workspaces.id, ctx.workspaceId), columns: { iconUrl: true } });
  const url = file ? await storeImage(file, ctx.userId) : null;
  await db.transaction(async (tx) => {
    await tx.update(t.workspaces).set({ iconUrl: url }).where(eq(t.workspaces.id, ctx.workspaceId));
    await recordAudit(tx, { workspaceId: ctx.workspaceId, actorType: "user", actorId: ctx.userId, action: url ? "workspace.icon_updated" : "workspace.icon_removed", targetType: "workspace", targetId: ctx.workspaceId });
  });
  await deleteStoredImage(ws?.iconUrl);
}
