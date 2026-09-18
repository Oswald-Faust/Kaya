import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { getSessionUser } from "@/server/auth/session";
import type { UserContext } from "@/server/auth/types";
import { db } from "@/server/db/client";
import { members, users, workspaces } from "@/server/db/schema";
import type { AutonomyMode } from "@/server/domain/types";
import { env } from "@/server/env";

/**
 * Tenant boundary. Every service receives a WorkspaceContext obtained here and
 * scopes every query by `ctx.workspaceId`; nothing downstream trusts a
 * workspace id coming from the client.
 *
 * Identity comes from a server-side session (src/server/auth/session.ts):
 * email + password, Google OAuth, or a guest session created when an
 * anonymous visitor starts an analysis.
 */

export type { UserContext };

export interface WorkspaceContext extends UserContext {
  organizationId: string;
  workspaceId: string;
  workspaceSlug: string;
  workspaceName: string;
  workspaceIconUrl: string | null;
  role: "owner" | "admin" | "member" | "viewer";
  autonomyMode: AutonomyMode;
  isDemo: boolean;
}

/** Pre-auth local cookie, honored only outside production so earlier local workspaces stay reachable. */
export const LEGACY_SESSION_COOKIE = "mos_user";

export const currentUser = cache(async (): Promise<UserContext | null> => {
  const session = await getSessionUser();
  if (session) return session;
  if (env.NODE_ENV === "production") return null;
  const legacy = (await cookies()).get(LEGACY_SESSION_COOKIE)?.value;
  if (!legacy) return null;
  const row = await db.query.users.findFirst({ where: eq(users.id, legacy) });
  return row ? { userId: row.id, name: row.name, email: row.email, isGuest: row.isGuest, locale: row.locale } : null;
});

export const listWorkspacesForUser = cache(async (userId: string) => {
  return db
    .select({
      id: workspaces.id,
      slug: workspaces.slug,
      name: workspaces.name,
      organizationId: workspaces.organizationId,
      isDemo: workspaces.isDemo,
      iconUrl: workspaces.iconUrl,
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
  if (!user) redirect("/login");
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
    workspaceIconUrl: row.workspace.iconUrl,
    role: row.role,
    autonomyMode: row.workspace.autonomyMode,
    isDemo: row.workspace.isDemo,
  };
});

/**
 * Onboarding steps after the analysis need a real account: guests are sent to
 * sign up and come back to the same step with their workspace.
 */
export async function requireOnboardingAccount(slug: string, step: string): Promise<WorkspaceContext> {
  const ctx = await requireWorkspace(slug);
  if (ctx.isGuest && !ctx.isDemo) {
    const next = encodeURIComponent(`/start/${slug}/${step}`);
    redirect(`/signup?next=${next}&product=${encodeURIComponent(ctx.workspaceName)}`);
  }
  return ctx;
}

export function canWrite(ctx: WorkspaceContext): boolean {
  return ctx.role !== "viewer";
}
