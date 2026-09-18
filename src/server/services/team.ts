import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, asc, desc, eq, gt, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import type { WorkspaceContext } from "@/server/context";
import { db } from "@/server/db/client";
import * as t from "@/server/db/schema";
import { localizedError } from "@/i18n/errors";
import type { Locale } from "@/i18n/config";
import { dictionaries } from "@/i18n/dictionaries";
import { fmt } from "@/i18n/format";
import {
  canAssignRole,
  canManageMember,
  canManageTeam,
  INVITABLE_ROLES,
  INVITATION_TTL_DAYS,
  normalizeEmail,
  seatUsage,
  type InvitableRole,
  type MemberRole,
} from "@/server/domain/team/seats";
import { escapeHtml, sendEmail } from "@/server/email/send";
import { newId } from "@/lib/ids";
import { appOrigin, getPlanState } from "./billing";
import { recordAudit } from "./audit";

/**
 * Workspace team: members, invitations and seats. Everything is scoped to the
 * caller's organization; seat checks run inside a transaction that locks the
 * organization row, so two invites can't both take the last seat.
 */

const hashToken = (token: string) => createHash("sha256").update(token).digest("base64url");
const expiry = () => new Date(Date.now() + INVITATION_TTL_DAYS * 86_400_000);

const pendingInvite = (organizationId: string) =>
  and(eq(t.invitations.organizationId, organizationId), isNull(t.invitations.acceptedAt), isNull(t.invitations.revokedAt), gt(t.invitations.expiresAt, new Date()));

function assertManager(ctx: WorkspaceContext) {
  if (ctx.isDemo) throw localizedError("forbidden", "demoTeam");
  if (!canManageTeam(ctx.role)) throw localizedError("forbidden", "manageTeamRole");
}

export async function getTeam(ctx: WorkspaceContext) {
  const [members, invites, plan] = await Promise.all([
    db
      .select({ id: t.members.id, userId: t.users.id, name: t.users.name, email: t.users.email, avatarUrl: t.users.avatarUrl, role: t.members.role, joinedAt: t.members.createdAt })
      .from(t.members)
      .innerJoin(t.users, eq(t.users.id, t.members.userId))
      .where(and(eq(t.members.organizationId, ctx.organizationId), eq(t.users.isGuest, false)))
      .orderBy(asc(t.members.createdAt)),
    db
      .select({ id: t.invitations.id, email: t.invitations.email, role: t.invitations.role, sentAt: t.invitations.createdAt, expiresAt: t.invitations.expiresAt, invitedBy: t.users.name })
      .from(t.invitations)
      .leftJoin(t.users, eq(t.users.id, t.invitations.invitedBy))
      .where(pendingInvite(ctx.organizationId))
      .orderBy(desc(t.invitations.createdAt)),
    getPlanState(ctx.organizationId),
  ]);
  return { members, invites, plan, seats: seatUsage(plan.plan, members.length, invites.length) };
}

const InviteSchema = z.object({
  email: z.string().trim().email("Enter a valid email address.").max(254),
  role: z.enum(INVITABLE_ROLES as [InvitableRole, ...InvitableRole[]]),
});

export interface InviteResult {
  email: string;
  inviteUrl: string;
  emailed: boolean;
}

async function lockOrganization(tx: Parameters<Parameters<typeof db.transaction>[0]>[0], organizationId: string) {
  await tx.execute(sql`select id from organizations where id = ${organizationId} for update`);
}

export async function inviteMember(ctx: WorkspaceContext, input: { email: unknown; role: unknown }, locale: Locale = "en"): Promise<InviteResult> {
  assertManager(ctx);
  const parsed = InviteSchema.safeParse(input);
  if (!parsed.success) throw localizedError("validation", parsed.error.issues[0]?.path[0] === "email" ? "invalidEmail" : "invalidInvite");
  const email = normalizeEmail(parsed.data.email);
  const role = parsed.data.role;
  if (!canAssignRole(ctx.role, role)) throw localizedError("forbidden", "ownerInvitesAdmins");

  const token = randomBytes(24).toString("base64url");
  await db.transaction(async (tx) => {
    await lockOrganization(tx, ctx.organizationId);
    const [existingMember] = await tx
      .select({ id: t.members.id })
      .from(t.members)
      .innerJoin(t.users, eq(t.users.id, t.members.userId))
      .where(and(eq(t.members.organizationId, ctx.organizationId), eq(t.users.email, email)))
      .limit(1);
    if (existingMember) throw localizedError("conflict", "alreadyMember", { email });
    const [existingInvite] = await tx
      .select({ id: t.invitations.id })
      .from(t.invitations)
      .where(and(pendingInvite(ctx.organizationId), eq(t.invitations.email, email)))
      .limit(1);
    if (existingInvite) throw localizedError("conflict", "alreadyInvited", { email });

    const plan = await getPlanState(ctx.organizationId);
    const [{ members }] = await tx
      .select({ members: sql<number>`count(*)`.mapWith(Number) })
      .from(t.members)
      .innerJoin(t.users, eq(t.users.id, t.members.userId))
      .where(and(eq(t.members.organizationId, ctx.organizationId), eq(t.users.isGuest, false)));
    const [{ invites }] = await tx.select({ invites: sql<number>`count(*)`.mapWith(Number) }).from(t.invitations).where(pendingInvite(ctx.organizationId));
    const seats = seatUsage(plan.plan, members, invites);
    if (seats.full) {
      throw localizedError("policy_blocked", "seatsFull", { count: seats.limit ?? 0 });
    }

    const id = newId("inv");
    await tx.insert(t.invitations).values({ id, organizationId: ctx.organizationId, workspaceId: ctx.workspaceId, email, role, tokenHash: hashToken(token), invitedBy: ctx.userId, expiresAt: expiry() });
    await recordAudit(tx, { workspaceId: ctx.workspaceId, actorType: "user", actorId: ctx.userId, action: "team.invited", targetType: "invitation", targetId: id, payload: { email, role } });
  });

  return deliver(ctx, email, role, token, locale);
}

export async function resendInvitation(ctx: WorkspaceContext, invitationId: string, locale: Locale = "en"): Promise<InviteResult> {
  assertManager(ctx);
  const invite = await db.query.invitations.findFirst({ where: and(eq(t.invitations.id, invitationId), pendingInvite(ctx.organizationId)) });
  if (!invite) throw localizedError("not_found", "invitationNotPending");
  if (!canAssignRole(ctx.role, invite.role)) throw localizedError("forbidden", "ownerManagesAdminInvites");
  // A fresh token invalidates the previous link.
  const token = randomBytes(24).toString("base64url");
  await db.update(t.invitations).set({ tokenHash: hashToken(token), expiresAt: expiry() }).where(eq(t.invitations.id, invite.id));
  return deliver(ctx, invite.email, invite.role as InvitableRole, token, locale);
}

export async function revokeInvitation(ctx: WorkspaceContext, invitationId: string): Promise<void> {
  assertManager(ctx);
  const invite = await db.query.invitations.findFirst({ where: and(eq(t.invitations.id, invitationId), pendingInvite(ctx.organizationId)) });
  if (!invite) throw localizedError("not_found", "invitationNotPending");
  if (!canAssignRole(ctx.role, invite.role)) throw localizedError("forbidden", "ownerManagesAdminInvites");
  await db.transaction(async (tx) => {
    await tx.update(t.invitations).set({ revokedAt: new Date() }).where(eq(t.invitations.id, invite.id));
    await recordAudit(tx, { workspaceId: ctx.workspaceId, actorType: "user", actorId: ctx.userId, action: "team.invitation_revoked", targetType: "invitation", targetId: invite.id, payload: { email: invite.email } });
  });
}

async function deliver(ctx: WorkspaceContext, email: string, role: InvitableRole, token: string, locale: Locale): Promise<InviteResult> {
  const inviteUrl = `${await appOrigin()}/invite/${token}`;
  const t = dictionaries[locale].settings;
  const roleLabel = t.roles[role].label;
  const vars = { inviter: ctx.name, workspace: ctx.workspaceName, role: roleLabel };
  const html = { inviter: escapeHtml(ctx.name), workspace: `<strong>${escapeHtml(ctx.workspaceName)}</strong>`, role: escapeHtml(roleLabel) };
  const expires = fmt(t.email.inviteExpires, { days: INVITATION_TTL_DAYS });
  const emailed = await sendEmail({
    to: email,
    subject: fmt(t.email.inviteSubject, vars),
    text: `${fmt(t.email.inviteBody, vars)}\n\n${t.email.inviteCta}: ${inviteUrl}\n\n${expires}`,
    html: `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#0b0b0b"><p style="font-size:15px">${fmt(t.email.inviteBody, html)}</p><p><a href="${inviteUrl}" style="display:inline-block;background:#0b0b0b;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;font-size:14px">${escapeHtml(t.email.inviteCta)}</a></p><p style="font-size:12px;color:#8c887f">${escapeHtml(expires)}</p></div>`,
  });
  return { email, inviteUrl, emailed };
}

async function loadMember(ctx: WorkspaceContext, memberId: string) {
  const member = await db.query.members.findFirst({ where: and(eq(t.members.id, memberId), eq(t.members.organizationId, ctx.organizationId)) });
  if (!member) throw localizedError("not_found", "memberGone");
  return member;
}

async function ownerCount(organizationId: string): Promise<number> {
  const [{ owners }] = await db
    .select({ owners: sql<number>`count(*)`.mapWith(Number) })
    .from(t.members)
    .where(and(eq(t.members.organizationId, organizationId), eq(t.members.role, "owner")));
  return owners;
}

export async function changeMemberRole(ctx: WorkspaceContext, memberId: string, role: MemberRole): Promise<void> {
  assertManager(ctx);
  const member = await loadMember(ctx, memberId);
  if (member.role === role) return;
  if (!canManageMember(ctx.role, member.role) || !canAssignRole(ctx.role, role)) throw localizedError("forbidden", "noRolePermission");
  if (member.role === "owner" && (await ownerCount(ctx.organizationId)) <= 1) throw localizedError("conflict", "needOwner");
  await db.transaction(async (tx) => {
    await tx.update(t.members).set({ role }).where(eq(t.members.id, member.id));
    await recordAudit(tx, { workspaceId: ctx.workspaceId, actorType: "user", actorId: ctx.userId, action: "team.role_changed", targetType: "member", targetId: member.id, payload: { from: member.role, to: role, userId: member.userId } });
  });
}

/** Managers remove others; anyone can leave, except the last owner. */
export async function removeMember(ctx: WorkspaceContext, memberId: string): Promise<{ left: boolean }> {
  if (ctx.isDemo) throw localizedError("forbidden", "demoTeam");
  const member = await loadMember(ctx, memberId);
  const self = member.userId === ctx.userId;
  if (!self && !canManageMember(ctx.role, member.role)) throw localizedError("forbidden", "noRemovePermission");
  if (member.role === "owner" && (await ownerCount(ctx.organizationId)) <= 1) throw localizedError("conflict", "lastOwnerLeave");
  await db.transaction(async (tx) => {
    await tx.delete(t.members).where(eq(t.members.id, member.id));
    await recordAudit(tx, { workspaceId: ctx.workspaceId, actorType: "user", actorId: ctx.userId, action: self ? "team.left" : "team.member_removed", targetType: "member", targetId: member.id, payload: { userId: member.userId, role: member.role } });
  });
  return { left: self };
}

export type InvitationLookup =
  | { status: "valid"; id: string; email: string; role: MemberRole; workspaceName: string; workspaceSlug: string; workspaceIconUrl: string | null; inviterName: string | null; memberCount: number }
  | { status: "invalid" | "expired" | "used" };

export async function findInvitation(token: string): Promise<InvitationLookup> {
  if (!token || token.length > 100) return { status: "invalid" };
  const [row] = await db
    .select({ invite: t.invitations, workspaceName: t.workspaces.name, workspaceSlug: t.workspaces.slug, workspaceIconUrl: t.workspaces.iconUrl, inviterName: t.users.name })
    .from(t.invitations)
    .innerJoin(t.workspaces, eq(t.workspaces.id, t.invitations.workspaceId))
    .leftJoin(t.users, eq(t.users.id, t.invitations.invitedBy))
    .where(eq(t.invitations.tokenHash, hashToken(token)))
    .limit(1);
  if (!row || row.invite.revokedAt) return { status: "invalid" };
  if (row.invite.acceptedAt) return { status: "used" };
  if (row.invite.expiresAt.getTime() <= Date.now()) return { status: "expired" };
  const [{ memberCount }] = await db.select({ memberCount: sql<number>`count(*)`.mapWith(Number) }).from(t.members).where(eq(t.members.organizationId, row.invite.organizationId));
  return {
    status: "valid",
    id: row.invite.id,
    email: row.invite.email,
    role: row.invite.role,
    workspaceName: row.workspaceName,
    workspaceSlug: row.workspaceSlug,
    workspaceIconUrl: row.workspaceIconUrl,
    inviterName: row.inviterName,
    memberCount,
  };
}

/** The invitation is bound to its email address: another account can't redeem a forwarded link. */
export async function acceptInvitation(user: { userId: string; email: string }, token: string): Promise<string> {
  const lookup = await findInvitation(token);
  if (lookup.status !== "valid") throw localizedError("not_found", "invitationInvalid");
  if (normalizeEmail(user.email) !== lookup.email) throw localizedError("forbidden", "invitationOtherEmail", { email: lookup.email });

  await db.transaction(async (tx) => {
    const invite = await tx.query.invitations.findFirst({ where: eq(t.invitations.id, lookup.id) });
    if (!invite || invite.acceptedAt || invite.revokedAt) throw localizedError("conflict", "invitationUsed");
    await tx.insert(t.members).values({ id: newId("mem"), organizationId: invite.organizationId, userId: user.userId, role: invite.role }).onConflictDoNothing();
    await tx.update(t.invitations).set({ acceptedAt: new Date() }).where(eq(t.invitations.id, invite.id));
    await recordAudit(tx, { workspaceId: invite.workspaceId, actorType: "user", actorId: user.userId, action: "team.joined", targetType: "invitation", targetId: invite.id, payload: { role: invite.role } });
  });
  return lookup.workspaceSlug;
}
