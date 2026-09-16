import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/server/db/client";
import { sessions, users } from "@/server/db/schema";
import { env } from "@/server/env";
import { newId } from "@/lib/ids";
import type { UserContext } from "./types";

export const SESSION_COOKIE = "kaya_session";
export const IMPERSONATOR_COOKIE = "kaya_impersonator";
const TTL_MS = 30 * 24 * 60 * 60 * 1000;

const hashToken = (token: string) => createHash("sha256").update(token).digest("base64url");

/** Creates a session row and sets the cookie. Only callable from server actions and route handlers. */
export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + TTL_MS);
  await db.insert(sessions).values({ id: newId("ses"), userId, tokenHash: hashToken(token), expiresAt });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function getSessionUser(): Promise<UserContext | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const [row] = await db
    .select({ id: users.id, name: users.name, email: users.email, isGuest: users.isGuest })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.tokenHash, hashToken(token)), gt(sessions.expiresAt, new Date()), isNull(users.suspendedAt)))
    .limit(1);
  return row ? { userId: row.id, name: row.name, email: row.email, isGuest: row.isGuest } : null;
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await db.delete(sessions).where(eq(sessions.tokenHash, hashToken(token)));
  store.delete(SESSION_COOKIE);
}

/** New token on every privilege change (guest → account, login) to prevent session fixation. */
export async function rotateSession(userId: string): Promise<void> {
  await destroySession();
  await createSession(userId);
}

export interface ImpersonatorState {
  isImpersonating: boolean;
  adminUserId: string;
  adminEmail?: string;
  targetUserId: string;
  targetUser?: {
    id: string;
    name: string;
    email: string;
  };
}

/**
 * Starts an impersonation session: saves the admin's session token into an impersonation cookie,
 * then generates a session for targetUserId.
 */
export async function startImpersonation(adminUserId: string, targetUserId: string): Promise<void> {
  const store = await cookies();
  const adminToken = store.get(SESSION_COOKIE)?.value;
  if (!adminToken) throw new Error("No active admin session found.");

  const payload = JSON.stringify({ adminToken, adminUserId, targetUserId });
  store.set(IMPERSONATOR_COOKIE, Buffer.from(payload).toString("base64url"), {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: "/",
  });

  // Create a new session for the target user
  await createSession(targetUserId);
}

/**
 * Returns the current impersonator state if active.
 */
export async function getImpersonatorState(): Promise<ImpersonatorState | null> {
  const store = await cookies();
  const raw = store.get(IMPERSONATOR_COOKIE)?.value;
  if (!raw) return null;

  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf-8")) as {
      adminToken: string;
      adminUserId: string;
      targetUserId: string;
    };

    if (!parsed.adminToken || !parsed.targetUserId) return null;

    // Verify admin token still corresponds to an active platform admin
    const [adminRow] = await db
      .select({ id: users.id, email: users.email, isPlatformAdmin: users.isPlatformAdmin })
      .from(sessions)
      .innerJoin(users, eq(users.id, sessions.userId))
      .where(and(eq(sessions.tokenHash, hashToken(parsed.adminToken)), gt(sessions.expiresAt, new Date()), eq(users.isPlatformAdmin, true)))
      .limit(1);

    if (!adminRow) return null;

    const target = await db.query.users.findFirst({
      where: eq(users.id, parsed.targetUserId),
      columns: { id: true, name: true, email: true },
    });

    return {
      isImpersonating: true,
      adminUserId: adminRow.id,
      adminEmail: adminRow.email,
      targetUserId: parsed.targetUserId,
      targetUser: target ?? undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Stops impersonation: destroys the temporary session, restores the admin session, and removes the cookie.
 */
export async function stopImpersonation(): Promise<string> {
  const store = await cookies();
  const raw = store.get(IMPERSONATOR_COOKIE)?.value;
  if (!raw) throw new Error("No active impersonation session.");

  let targetUserId = "";
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf-8")) as {
      adminToken: string;
      adminUserId: string;
      targetUserId: string;
    };
    targetUserId = parsed.targetUserId;

    // Destroy target user session
    const currentToken = store.get(SESSION_COOKIE)?.value;
    if (currentToken) {
      await db.delete(sessions).where(eq(sessions.tokenHash, hashToken(currentToken)));
    }

    // Restore admin session
    store.set(SESSION_COOKIE, parsed.adminToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: env.NODE_ENV === "production",
      path: "/",
      expires: new Date(Date.now() + TTL_MS),
    });
  } finally {
    store.delete(IMPERSONATOR_COOKIE);
  }

  return targetUserId;
}

