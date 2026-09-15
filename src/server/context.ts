import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/server/db/client";
import { members, users, workspaces } from "@/server/db/schema";
import type { AutonomyMode } from "@/server/domain/types";

/**
 * Tenant boundary. Every service receives a WorkspaceContext obtained here and
 * scopes every query by `ctx.workspaceId`; nothing downstream trusts a
 * workspace id coming from the client.
 *
 * Authentication is intentionally minimal in this build (see docs/decision-log.md):
 * the session cookie selects a local user, falling back to the first owner.
 * Swapping in a real identity provider only changes `currentUser()`.
 */

export interface UserContext {
  userId: string;
  name: string;
  email: string;
}

export interface WorkspaceContext extends UserContext {
  organizationId: string;
  workspaceId: string;
  workspaceSlug: string;
  workspaceName: string;
  role: "owner" | "admin" | "member" | "viewer";
  autonomyMode: AutonomyMode;
  isDemo: boolean;
}

export const SESSION_COOKIE = "mos_user";

export const currentUser = cache(async (): Promise<UserContext | null> => {
  const store = await cookies();
  const fromCookie = store.get(SESSION_COOKIE)?.value;
  const row = fromCookie
    ? await db.query.users.findFirst({ where: eq(users.id, fromCookie) })
    : await db.query.users.findFirst({ orderBy: asc(users.createdAt) });
  return row ? { userId: row.id, name: row.name, email: row.email } : null;
});

export const listWorkspacesForUser = cache(async (userId: string) => {
  return db
    .select({
      id: workspaces.id,
      slug: workspaces.slug,
      name: workspaces.name,
      organizationId: workspaces.organizationId,
      isDemo: workspaces.isDemo,
      createdAt: workspaces.createdAt,
    })
    .from(workspaces)
    .innerJoin(members, eq(members.organizationId, workspaces.organizationId))
    .where(eq(members.userId, userId))
    .orderBy(asc(workspaces.createdAt));
});

/** Resolves and authorizes a workspace by slug for the current user. */
export const requireWorkspace = cache(async (slug: string): Promise<WorkspaceContext> => {
  const user = await currentUser();
  if (!user) redirect("/start");
  const [row] = await db
    .select({ workspace: workspaces, role: members.role })
    .from(workspaces)
    .innerJoin(members, and(eq(members.organizationId, workspaces.organizationId), eq(members.userId, user.userId)))
    .where(eq(workspaces.slug, slug))
    .limit(1);
  if (!row) notFound();
  return {
    ...user,
    organizationId: row.workspace.organizationId,
    workspaceId: row.workspace.id,
    workspaceSlug: row.workspace.slug,
    workspaceName: row.workspace.name,
    role: row.role,
    autonomyMode: row.workspace.autonomyMode,
    isDemo: row.workspace.isDemo,
  };
});

export function canWrite(ctx: WorkspaceContext): boolean {
  return ctx.role !== "viewer";
}
