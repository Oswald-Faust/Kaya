import "server-only";
import { and, count, desc, eq, gte, ilike, inArray, isNotNull, ne, or, sql } from "drizzle-orm";
import type { AdminContext } from "@/server/admin/guard";
import { dailyCounts, listPrice, monthlyRevenue } from "@/server/admin/metrics";
import { stripe } from "@/server/billing/stripe";
import { db } from "@/server/db/client";
import * as t from "@/server/db/schema";
import { DomainError } from "@/server/domain/errors";
import { billingEnabled } from "@/server/env";
import { newId } from "@/lib/ids";
import { recordAudit } from "./audit";
import { syncSubscription } from "./billing";

/**
 * Platform administration. Every read spans all tenants, so these functions
 * must only be reached through requireAdmin(). Every write is recorded in the
 * audit log under the "platform" scope with the acting admin.
 */

export const PLATFORM_SCOPE = "platform";
const DAY = 86_400_000;
const likeTerm = (q: string) => `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;

async function adminAudit(admin: AdminContext, action: string, targetType: string, targetId: string, payload: Record<string, unknown> = {}) {
  await recordAudit(db, { workspaceId: PLATFORM_SCOPE, actorType: "user", actorId: admin.userId, action: `admin.${action}`, targetType, targetId, payload: { ...payload, adminEmail: admin.email } });
}

// ───────────────────────── Overview ─────────────────────────

export async function getOverview() {
  const now = new Date();
  const since30 = new Date(now.getTime() - 30 * DAY);
  const since7 = new Date(now.getTime() - 7 * DAY);

  const [orgs, signups30, [{ users: userCount }], [{ guests }], [{ workspaces: workspaceCount }], recentUsers, activity, runs, [{ runs30, failed30 }]] = await Promise.all([
    db
      .select({ id: t.organizations.id, name: t.organizations.name, plan: t.organizations.plan, planStatus: t.organizations.planStatus, planInterval: t.organizations.planInterval, planActions: t.organizations.planActions, trialEndsAt: t.organizations.trialEndsAt, createdAt: t.organizations.createdAt })
      .from(t.organizations),
    db.select({ createdAt: t.users.createdAt }).from(t.users).where(and(eq(t.users.isGuest, false), gte(t.users.createdAt, since30))),
    db.select({ users: count() }).from(t.users).where(eq(t.users.isGuest, false)),
    db.select({ guests: count() }).from(t.users).where(eq(t.users.isGuest, true)),
    db.select({ workspaces: count() }).from(t.workspaces).where(eq(t.workspaces.isDemo, false)),
    db.select({ id: t.users.id, name: t.users.name, email: t.users.email, createdAt: t.users.createdAt }).from(t.users).where(eq(t.users.isGuest, false)).orderBy(desc(t.users.createdAt)).limit(6),
    db.select().from(t.auditLogs).orderBy(desc(t.auditLogs.createdAt)).limit(14),
    db
      .select({ id: t.agentRuns.id, kind: t.agentRuns.kind, status: t.agentRuns.status, planner: t.agentRuns.planner, createdAt: t.agentRuns.createdAt, workspace: t.workspaces.name })
      .from(t.agentRuns)
      .innerJoin(t.workspaces, eq(t.workspaces.id, t.agentRuns.workspaceId))
      .orderBy(desc(t.agentRuns.createdAt))
      .limit(6),
    db
      .select({ runs30: count(), failed30: sql<number>`count(*) filter (where ${t.agentRuns.status} = 'failed')`.mapWith(Number) })
      .from(t.agentRuns)
      .where(gte(t.agentRuns.createdAt, since30)),
  ]);

  const real = orgs.filter((o) => o.plan !== "none" || o.planStatus !== "none");
  const mrr = orgs.reduce((sum, o) => sum + monthlyRevenue(o), 0);
  const trialing = orgs.filter((o) => o.planStatus === "trialing" && (!o.trialEndsAt || o.trialEndsAt > now));
  const byStatus = {
    paying: orgs.filter((o) => (o.planStatus === "active" || o.planStatus === "past_due") && o.plan !== "free").length,
    trialing: trialing.length,
    free: orgs.filter((o) => o.plan === "free").length,
    pastDue: orgs.filter((o) => o.planStatus === "past_due").length,
    canceled: orgs.filter((o) => o.planStatus === "canceled").length,
    noPlan: orgs.filter((o) => o.plan === "none").length,
  };

  return {
    mrr,
    arr: mrr * 12,
    trialPipeline: trialing.reduce((sum, o) => sum + listPrice(o), 0),
    trialsEndingSoon: trialing.filter((o) => o.trialEndsAt && o.trialEndsAt.getTime() - now.getTime() < 3 * DAY).length,
    userCount,
    guests,
    workspaceCount,
    signups7: signups30.filter((u) => u.createdAt >= since7).length,
    signups30: signups30.length,
    signupSeries: dailyCounts(signups30.map((u) => u.createdAt), 30, now),
    byStatus,
    conversion: real.length ? byStatus.paying / real.length : null,
    recentUsers,
    activity,
    runs,
    runs30,
    failed30,
  };
}

// ───────────────────────── Users ─────────────────────────

export type UserFilter = "all" | "admins" | "suspended" | "guests" | "paying";

export async function listUsers(opts: { q?: string; filter?: UserFilter; limit?: number }) {
  const filter = opts.filter ?? "all";
  const conditions = [filter === "guests" ? eq(t.users.isGuest, true) : eq(t.users.isGuest, false)];
  if (opts.q) conditions.push(or(ilike(t.users.email, likeTerm(opts.q)), ilike(t.users.name, likeTerm(opts.q)))!);
  if (filter === "admins") conditions.push(eq(t.users.isPlatformAdmin, true));
  if (filter === "suspended") conditions.push(isNotNull(t.users.suspendedAt));

  // Correlated subqueries use explicit table names: Drizzle drops qualifiers in single-table selects.
  const lastSignIn = sql<Date | null>`(select max(s.created_at) from sessions s where s.user_id = "users"."id")`.mapWith((v) => (v ? new Date(v) : null));
  const orgCount = sql<number>`(select count(*) from members m where m.user_id = "users"."id")`.mapWith(Number);
  const bestPlan = sql<string | null>`(select o.plan || ':' || o.plan_status from members m join organizations o on o.id = m.organization_id where m.user_id = "users"."id" and m.role = 'owner' order by case o.plan_status when 'active' then 0 when 'past_due' then 1 when 'trialing' then 2 else 3 end limit 1)`;

  let rows = await db
    .select({ id: t.users.id, name: t.users.name, email: t.users.email, isPlatformAdmin: t.users.isPlatformAdmin, suspendedAt: t.users.suspendedAt, googleSub: t.users.googleSub, hasPassword: sql<boolean>`${t.users.passwordHash} is not null`, createdAt: t.users.createdAt, lastSignIn, orgCount, bestPlan })
    .from(t.users)
    .where(and(...conditions))
    .orderBy(desc(t.users.createdAt))
    .limit(opts.limit ?? 200);

  if (filter === "paying") rows = rows.filter((r) => r.bestPlan && /^(launch|growth|scale):(active|past_due)$/.test(r.bestPlan));

  const [counts] = await db
    .select({
      all: sql<number>`count(*) filter (where not ${t.users.isGuest})`.mapWith(Number),
      admins: sql<number>`count(*) filter (where ${t.users.isPlatformAdmin})`.mapWith(Number),
      suspended: sql<number>`count(*) filter (where ${t.users.suspendedAt} is not null)`.mapWith(Number),
      guests: sql<number>`count(*) filter (where ${t.users.isGuest})`.mapWith(Number),
    })
    .from(t.users);

  return { rows, counts };
}

export async function getUserDetail(userId: string) {
  const user = await db.query.users.findFirst({ where: eq(t.users.id, userId) });
  if (!user) return null;
  const [memberships, sessions, activity] = await Promise.all([
    db
      .select({ role: t.members.role, joinedAt: t.members.createdAt, org: t.organizations })
      .from(t.members)
      .innerJoin(t.organizations, eq(t.organizations.id, t.members.organizationId))
      .where(eq(t.members.userId, userId))
      .orderBy(desc(t.members.createdAt)),
    db.select({ id: t.sessions.id, createdAt: t.sessions.createdAt, expiresAt: t.sessions.expiresAt }).from(t.sessions).where(eq(t.sessions.userId, userId)).orderBy(desc(t.sessions.createdAt)).limit(10),
    db.select().from(t.auditLogs).where(eq(t.auditLogs.actorId, userId)).orderBy(desc(t.auditLogs.createdAt)).limit(20),
  ]);
  const orgIds = memberships.map((m) => m.org.id);
  const workspaces = orgIds.length ? await db.select().from(t.workspaces).where(inArray(t.workspaces.organizationId, orgIds)) : [];
  const { passwordHash, ...safe } = user;
  return { user: { ...safe, hasPassword: Boolean(passwordHash) }, memberships: memberships.map((m) => ({ ...m, workspaces: workspaces.filter((w) => w.organizationId === m.org.id) })), sessions, activity };
}

export async function setPlatformAdmin(admin: AdminContext, userId: string, value: boolean) {
  if (userId === admin.userId && !value) throw new DomainError("validation", "You can't remove your own admin access.");
  const user = await db.query.users.findFirst({ where: eq(t.users.id, userId) });
  if (!user || user.isGuest) throw new DomainError("not_found", "User not found.");
  await db.update(t.users).set({ isPlatformAdmin: value }).where(eq(t.users.id, userId));
  await adminAudit(admin, value ? "user.admin_granted" : "user.admin_revoked", "user", userId, { email: user.email });
}

export async function setSuspended(admin: AdminContext, userId: string, suspended: boolean) {
  if (userId === admin.userId) throw new DomainError("validation", "You can't suspend your own account.");
  const user = await db.query.users.findFirst({ where: eq(t.users.id, userId) });
  if (!user) throw new DomainError("not_found", "User not found.");
  await db.transaction(async (tx) => {
    await tx.update(t.users).set({ suspendedAt: suspended ? new Date() : null }).where(eq(t.users.id, userId));
    if (suspended) await tx.delete(t.sessions).where(eq(t.sessions.userId, userId));
  });
  await adminAudit(admin, suspended ? "user.suspended" : "user.reactivated", "user", userId, { email: user.email });
}

export async function revokeSessions(admin: AdminContext, userId: string) {
  const removed = await db.delete(t.sessions).where(eq(t.sessions.userId, userId)).returning({ id: t.sessions.id });
  await adminAudit(admin, "user.sessions_revoked", "user", userId, { sessions: removed.length });
  return removed.length;
}

export async function deleteUser(admin: AdminContext, userId: string) {
  if (userId === admin.userId) throw new DomainError("validation", "You can't delete your own account.");
  const user = await db.query.users.findFirst({ where: eq(t.users.id, userId) });
  if (!user) throw new DomainError("not_found", "User not found.");
  await db.delete(t.users).where(eq(t.users.id, userId));
  await adminAudit(admin, "user.deleted", "user", userId, { email: user.email, name: user.name });
}

export async function purgeGuests(admin: AdminContext, olderThanDays: number) {
  const cutoff = new Date(Date.now() - olderThanDays * DAY);
  const removed = await db
    .delete(t.users)
    .where(and(eq(t.users.isGuest, true), sql`${t.users.createdAt} < ${cutoff}`, sql`not exists (select 1 from members m where m.user_id = "users"."id" and m.role = 'owner')`))
    .returning({ id: t.users.id });
  await adminAudit(admin, "users.guests_purged", "user", "*", { removed: removed.length, olderThanDays });
  return removed.length;
}

// ───────────────────────── Workspaces ─────────────────────────

export async function listWorkspaces(opts: { q?: string; plan?: string }) {
  const memberCount = sql<number>`(select count(*) from members m where m.organization_id = "workspaces"."organization_id")`.mapWith(Number);
  const owner = sql<string | null>`(select u.email from members m join users u on u.id = m.user_id where m.organization_id = "workspaces"."organization_id" and m.role = 'owner' order by m.created_at limit 1)`;
  const product = sql<string | null>`(select p.name || '|' || p.domain || '|' || p.onboarding_step || '|' || p.status from products p where p.workspace_id = "workspaces"."id" order by p.created_at limit 1)`;
  const conditions = [];
  if (opts.q) conditions.push(or(ilike(t.workspaces.name, likeTerm(opts.q)), ilike(t.workspaces.slug, likeTerm(opts.q)))!);
  if (opts.plan && opts.plan !== "all") conditions.push(opts.plan === "trialing" || opts.plan === "past_due" || opts.plan === "canceled" ? eq(t.organizations.planStatus, opts.plan) : eq(t.organizations.plan, opts.plan));

  const rows = await db
    .select({ id: t.workspaces.id, name: t.workspaces.name, slug: t.workspaces.slug, isDemo: t.workspaces.isDemo, autonomyMode: t.workspaces.autonomyMode, createdAt: t.workspaces.createdAt, org: { id: t.organizations.id, plan: t.organizations.plan, planStatus: t.organizations.planStatus, planInterval: t.organizations.planInterval, planActions: t.organizations.planActions, trialEndsAt: t.organizations.trialEndsAt }, memberCount, owner, product })
    .from(t.workspaces)
    .innerJoin(t.organizations, eq(t.organizations.id, t.workspaces.organizationId))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(t.workspaces.createdAt))
    .limit(300);

  return rows.map((r) => {
    const [name, domain, step, status] = r.product?.split("|") ?? [];
    return { ...r, product: r.product ? { name, domain, step, status } : null };
  });
}

export async function getWorkspaceDetail(workspaceId: string) {
  const ws = await db.query.workspaces.findFirst({ where: eq(t.workspaces.id, workspaceId) });
  if (!ws) return null;
  const [org, products, members, runs, activity, [{ experiments }], [{ facts }]] = await Promise.all([
    db.query.organizations.findFirst({ where: eq(t.organizations.id, ws.organizationId) }),
    db.select().from(t.products).where(eq(t.products.workspaceId, ws.id)),
    db
      .select({ id: t.members.id, role: t.members.role, userId: t.users.id, name: t.users.name, email: t.users.email, isGuest: t.users.isGuest, joinedAt: t.members.createdAt })
      .from(t.members)
      .innerJoin(t.users, eq(t.users.id, t.members.userId))
      .where(eq(t.members.organizationId, ws.organizationId))
      .orderBy(t.members.createdAt),
    db.select().from(t.agentRuns).where(eq(t.agentRuns.workspaceId, ws.id)).orderBy(desc(t.agentRuns.createdAt)).limit(12),
    db.select().from(t.auditLogs).where(eq(t.auditLogs.workspaceId, ws.id)).orderBy(desc(t.auditLogs.createdAt)).limit(25),
    db.select({ experiments: count() }).from(t.experiments).where(eq(t.experiments.workspaceId, ws.id)),
    db.select({ facts: count() }).from(t.businessFacts).where(eq(t.businessFacts.workspaceId, ws.id)),
  ]);
  return { ws, org: org!, products, members, runs, activity, experiments, facts };
}

export async function joinWorkspace(admin: AdminContext, workspaceId: string): Promise<string> {
  const ws = await db.query.workspaces.findFirst({ where: eq(t.workspaces.id, workspaceId) });
  if (!ws) throw new DomainError("not_found", "Workspace not found.");
  await db.insert(t.members).values({ id: newId("mem"), organizationId: ws.organizationId, userId: admin.userId, role: "admin" }).onConflictDoNothing();
  await adminAudit(admin, "workspace.joined", "workspace", ws.id, { slug: ws.slug });
  return ws.slug;
}

export async function removeMember(admin: AdminContext, memberId: string) {
  const member = await db.query.members.findFirst({ where: eq(t.members.id, memberId) });
  if (!member) throw new DomainError("not_found", "Member not found.");
  await db.delete(t.members).where(eq(t.members.id, memberId));
  await adminAudit(admin, "member.removed", "organization", member.organizationId, { userId: member.userId, role: member.role });
}

export async function setAutonomy(admin: AdminContext, workspaceId: string, mode: "observe" | "suggest" | "copilot" | "autopilot") {
  await db.update(t.workspaces).set({ autonomyMode: mode }).where(eq(t.workspaces.id, workspaceId));
  await adminAudit(admin, "workspace.autonomy_set", "workspace", workspaceId, { mode });
}

export async function deleteWorkspace(admin: AdminContext, workspaceId: string) {
  const ws = await db.query.workspaces.findFirst({ where: eq(t.workspaces.id, workspaceId) });
  if (!ws) throw new DomainError("not_found", "Workspace not found.");
  if (ws.isDemo) throw new DomainError("validation", "The demo workspace can't be deleted here. Reseed it instead.");
  const org = await db.query.organizations.findFirst({ where: eq(t.organizations.id, ws.organizationId) });
  if (org?.stripeSubscriptionId && ["trialing", "active", "past_due"].includes(org.planStatus)) {
    throw new DomainError("conflict", "Cancel this workspace's Stripe subscription before deleting it.");
  }
  await db.transaction(async (tx) => {
    await tx.delete(t.workspaces).where(eq(t.workspaces.id, ws.id));
    const [{ left }] = await tx.select({ left: count() }).from(t.workspaces).where(eq(t.workspaces.organizationId, ws.organizationId));
    if (left === 0) await tx.delete(t.organizations).where(eq(t.organizations.id, ws.organizationId));
  });
  await adminAudit(admin, "workspace.deleted", "workspace", ws.id, { slug: ws.slug, name: ws.name, organizationId: ws.organizationId });
}

// ───────────────────────── Subscriptions ─────────────────────────

export async function listSubscriptions(opts: { status?: string }) {
  const owner = sql<string | null>`(select u.email from members m join users u on u.id = m.user_id where m.organization_id = "organizations"."id" and m.role = 'owner' order by m.created_at limit 1)`;
  const workspace = sql<string | null>`(select w.id || '|' || w.name from workspaces w where w.organization_id = "organizations"."id" order by w.created_at limit 1)`;
  const conditions = [ne(t.organizations.plan, "none")];
  if (opts.status && opts.status !== "all") conditions.push(opts.status === "free" ? eq(t.organizations.plan, "free") : eq(t.organizations.planStatus, opts.status));
  const rows = await db
    .select({ org: t.organizations, owner, workspace })
    .from(t.organizations)
    .where(and(...conditions))
    .orderBy(desc(t.organizations.createdAt))
    .limit(300);
  return rows.map((r) => {
    const [workspaceId, workspaceName] = r.workspace?.split("|") ?? [];
    return { ...r, workspaceId, workspaceName, mrr: monthlyRevenue(r.org), listPrice: listPrice(r.org) };
  });
}

export async function overridePlan(
  admin: AdminContext,
  organizationId: string,
  input: { plan: string; planStatus: string; planInterval: string | null; planActions: number | null; trialEndsAt: Date | null },
) {
  const org = await db.query.organizations.findFirst({ where: eq(t.organizations.id, organizationId) });
  if (!org) throw new DomainError("not_found", "Organization not found.");
  await db.update(t.organizations).set(input).where(eq(t.organizations.id, organizationId));
  await adminAudit(admin, "plan.overridden", "organization", organizationId, {
    from: { plan: org.plan, status: org.planStatus, interval: org.planInterval, actions: org.planActions },
    to: { ...input, trialEndsAt: input.trialEndsAt?.toISOString() ?? null },
    note: org.stripeSubscriptionId ? "Stripe subscription exists; its next sync will overwrite this override." : undefined,
  });
}

export async function extendTrial(admin: AdminContext, organizationId: string, days: number) {
  const org = await db.query.organizations.findFirst({ where: eq(t.organizations.id, organizationId) });
  if (!org) throw new DomainError("not_found", "Organization not found.");
  const base = org.trialEndsAt && org.trialEndsAt > new Date() ? org.trialEndsAt : new Date();
  const trialEndsAt = new Date(base.getTime() + days * DAY);

  if (org.stripeSubscriptionId && billingEnabled && org.planStatus === "trialing") {
    // Stripe owns the trial: move it there so billing and Kaya agree.
    await stripe().subscriptions.update(org.stripeSubscriptionId, { trial_end: Math.floor(trialEndsAt.getTime() / 1000), proration_behavior: "none" });
    await syncSubscription(org.stripeSubscriptionId);
  } else {
    await db
      .update(t.organizations)
      .set({ trialEndsAt, planStatus: "trialing", plan: org.plan === "none" || org.plan === "free" ? "launch" : org.plan, planActions: org.planActions ?? 2000, planInterval: org.planInterval ?? "month" })
      .where(eq(t.organizations.id, organizationId));
  }
  await adminAudit(admin, "plan.trial_extended", "organization", organizationId, { days, trialEndsAt: trialEndsAt.toISOString() });
}

export async function cancelSubscription(admin: AdminContext, organizationId: string, immediately: boolean) {
  const org = await db.query.organizations.findFirst({ where: eq(t.organizations.id, organizationId) });
  if (!org?.stripeSubscriptionId) throw new DomainError("not_found", "This organization has no Stripe subscription.");
  if (immediately) await stripe().subscriptions.cancel(org.stripeSubscriptionId);
  else await stripe().subscriptions.update(org.stripeSubscriptionId, { cancel_at_period_end: true });
  await syncSubscription(org.stripeSubscriptionId);
  await adminAudit(admin, immediately ? "plan.subscription_canceled" : "plan.subscription_cancel_scheduled", "organization", organizationId, { subscriptionId: org.stripeSubscriptionId });
}

export async function resyncSubscription(admin: AdminContext, organizationId: string) {
  const org = await db.query.organizations.findFirst({ where: eq(t.organizations.id, organizationId) });
  if (!org?.stripeSubscriptionId) throw new DomainError("not_found", "This organization has no Stripe subscription.");
  await syncSubscription(org.stripeSubscriptionId);
  await adminAudit(admin, "plan.subscription_resynced", "organization", organizationId, { subscriptionId: org.stripeSubscriptionId });
}

// ───────────────────────── Agent runs & audit ─────────────────────────

export async function listRuns(opts: { status?: string; kind?: string }) {
  const conditions = [];
  if (opts.status && opts.status !== "all") conditions.push(eq(t.agentRuns.status, opts.status as (typeof t.agentRuns.status.enumValues)[number]));
  if (opts.kind && opts.kind !== "all") conditions.push(eq(t.agentRuns.kind, opts.kind));
  return db
    .select({ run: t.agentRuns, workspace: { id: t.workspaces.id, name: t.workspaces.name, slug: t.workspaces.slug }, product: { name: t.products.name, domain: t.products.domain } })
    .from(t.agentRuns)
    .innerJoin(t.workspaces, eq(t.workspaces.id, t.agentRuns.workspaceId))
    .leftJoin(t.products, eq(t.products.id, t.agentRuns.productId))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(t.agentRuns.createdAt))
    .limit(200);
}

export async function listAudit(opts: { q?: string; scope?: "all" | "platform" }) {
  const conditions = [];
  if (opts.scope === "platform") conditions.push(eq(t.auditLogs.workspaceId, PLATFORM_SCOPE));
  if (opts.q) conditions.push(or(ilike(t.auditLogs.action, likeTerm(opts.q)), ilike(t.auditLogs.targetId, likeTerm(opts.q)), ilike(t.auditLogs.actorId, likeTerm(opts.q)))!);
  const rows = await db
    .select()
    .from(t.auditLogs)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(t.auditLogs.createdAt))
    .limit(250);
  const wsIds = [...new Set(rows.map((r) => r.workspaceId).filter((id) => id !== PLATFORM_SCOPE))];
  const names = wsIds.length ? await db.select({ id: t.workspaces.id, name: t.workspaces.name }).from(t.workspaces).where(inArray(t.workspaces.id, wsIds)) : [];
  const actorIds = [...new Set(rows.filter((r) => r.actorType === "user").map((r) => r.actorId))];
  const actors = actorIds.length ? await db.select({ id: t.users.id, email: t.users.email }).from(t.users).where(inArray(t.users.id, actorIds)) : [];
  return rows.map((r) => ({ ...r, workspaceName: r.workspaceId === PLATFORM_SCOPE ? "Platform" : (names.find((n) => n.id === r.workspaceId)?.name ?? "Deleted workspace"), actorEmail: actors.find((a) => a.id === r.actorId)?.email ?? null }));
}
