import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/server/db/client";
import { sessions, users } from "@/server/db/schema";
import { env } from "@/server/env";
import { newId } from "@/lib/ids";
import type { UserContext } from "./types";

export const SESSION_COOKIE = "kaya_session";
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
    .where(and(eq(sessions.tokenHash, hashToken(token)), gt(sessions.expiresAt, new Date())))
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
