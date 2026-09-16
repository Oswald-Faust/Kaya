import "server-only";
import { and, count, eq } from "drizzle-orm";
import { z } from "zod";
import type { WorkspaceContext } from "@/server/context";
import { db } from "@/server/db/client";
import * as t from "@/server/db/schema";
import { DomainError } from "@/server/domain/errors";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { recordAudit } from "./audit";

/** Workspace and personal settings a signed-in user edits for themselves. */

const WorkspaceName = z.string().trim().min(1, "Give the workspace a name.").max(60, "Keep the name under 60 characters.");
const PersonName = z.string().trim().min(1, "Add your name.").max(80, "Keep your name under 80 characters.");
const NewPassword = z.string().min(8, "Use at least 8 characters for your new password.").max(200, "That password is too long.");

function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) throw new DomainError("validation", result.error.issues[0]?.message ?? "Check the form and try again.");
  return result.data;
}

export async function renameWorkspace(ctx: WorkspaceContext, value: unknown): Promise<void> {
  if (ctx.isDemo) throw new DomainError("forbidden", "The demo workspace can't be renamed.");
  if (ctx.role !== "owner" && ctx.role !== "admin") throw new DomainError("forbidden", "Only owners and admins can rename the workspace.");
  const name = parse(WorkspaceName, value);
  if (name === ctx.workspaceName) return;
  await db.transaction(async (tx) => {
    await tx.update(t.workspaces).set({ name }).where(eq(t.workspaces.id, ctx.workspaceId));
    await recordAudit(tx, { workspaceId: ctx.workspaceId, actorType: "user", actorId: ctx.userId, action: "workspace.renamed", targetType: "workspace", targetId: ctx.workspaceId, payload: { from: ctx.workspaceName, to: name } });
  });
}

/** Owner only, confirmed by typing the workspace name. A live subscription must be canceled first. */
export async function deleteOwnWorkspace(ctx: WorkspaceContext, confirmation: unknown): Promise<void> {
  if (ctx.isDemo) throw new DomainError("forbidden", "The demo workspace can't be deleted.");
  if (ctx.role !== "owner") throw new DomainError("forbidden", "Only an owner can delete the workspace.");
  if (typeof confirmation !== "string" || confirmation.trim() !== ctx.workspaceName) throw new DomainError("validation", "Type the workspace name exactly to confirm.");
  const org = await db.query.organizations.findFirst({ where: eq(t.organizations.id, ctx.organizationId) });
  if (org?.stripeSubscriptionId && ["trialing", "active", "past_due"].includes(org.planStatus)) {
    throw new DomainError("conflict", "Cancel the subscription in billing before deleting this workspace.");
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
  if (!user || user.isGuest) throw new DomainError("forbidden", "Sign in to change your password.");
  if (user.passwordHash) {
    const ok = typeof input.current === "string" && (await verifyPassword(input.current, user.passwordHash));
    if (!ok) throw new DomainError("validation", "Your current password is incorrect.");
  }
  const next = parse(NewPassword, input.next);
  await db.update(t.users).set({ passwordHash: await hashPassword(next) }).where(eq(t.users.id, userId));
}

export async function hasPassword(userId: string): Promise<boolean> {
  const user = await db.query.users.findFirst({ where: eq(t.users.id, userId), columns: { passwordHash: true } });
  return Boolean(user?.passwordHash);
}
