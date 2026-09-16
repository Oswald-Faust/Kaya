import "server-only";
import { and, eq, notInArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/server/db/client";
import * as t from "@/server/db/schema";
import { DomainError } from "@/server/domain/errors";
import { dummyHash, hashPassword, verifyPassword } from "@/server/auth/password";
import type { GoogleProfile } from "@/server/auth/google";
import { newId } from "@/lib/ids";

const Email = z.string().trim().toLowerCase().email("Enter a valid email address.").max(254);
const Password = z.string().min(8, "Use at least 8 characters for your password.").max(200, "That password is too long.");
const Name = z.string().trim().min(1, "Add your name.").max(80);

function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) throw new DomainError("validation", result.error.issues[0]?.message ?? "Check the form and try again.");
  return result.data;
}

/** In-memory attempt limiter (per instance). Good enough to slow down credential stuffing on a single node. */
const attempts = new Map<string, { count: number; resetAt: number }>();
export function checkRateLimit(key: string, max = 10, windowMs = 15 * 60_000): void {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  entry.count += 1;
  if (entry.count > max) throw new DomainError("validation", "Too many attempts. Wait a few minutes and try again.");
}

export async function createGuestUser(): Promise<string> {
  const id = newId("usr");
  await db.insert(t.users).values({ id, email: `guest+${id.slice(-12)}@guest.kaya.invalid`, name: "Founder", isGuest: true });
  return id;
}

/** Creates an account, or upgrades the current guest in place so their analysis and workspace stay theirs. */
export async function signUpWithPassword(input: { name: unknown; email: unknown; password: unknown }, guestId: string | null): Promise<string> {
  const name = parse(Name, input.name);
  const email = parse(Email, input.email);
  const password = parse(Password, input.password);

  const existing = await db.query.users.findFirst({ where: eq(t.users.email, email) });
  if (existing && !existing.isGuest) throw new DomainError("conflict", "An account with this email already exists. Log in instead.");

  const passwordHash = await hashPassword(password);
  if (guestId) {
    const guest = await db.query.users.findFirst({ where: eq(t.users.id, guestId) });
    if (guest?.isGuest) {
      await db.update(t.users).set({ name, email, passwordHash, isGuest: false }).where(eq(t.users.id, guestId));
      return guestId;
    }
  }
  const id = newId("usr");
  await db.insert(t.users).values({ id, name, email, passwordHash });
  return id;
}

export async function logInWithPassword(input: { email: unknown; password: unknown }): Promise<string> {
  const email = parse(Email, input.email);
  const password = z.string().min(1).max(200).safeParse(input.password);
  const user = await db.query.users.findFirst({ where: eq(t.users.email, email) });
  const ok = password.success && (await verifyPassword(password.data, user?.passwordHash ?? (await dummyHash())));
  if (!user || user.isGuest || !user.passwordHash || !ok) throw new DomainError("validation", "Email or password is incorrect.");
  if (user.suspendedAt) throw new DomainError("forbidden", "This account is suspended. Contact support@kaya.app.");
  return user.id;
}

/** Hands a guest's workspaces to the account that just logged in. The guest row is left without memberships. */
export async function adoptGuest(guestId: string, userId: string): Promise<void> {
  if (guestId === userId) return;
  await db.transaction(async (tx) => {
    const guest = await tx.query.users.findFirst({ where: eq(t.users.id, guestId) });
    if (!guest?.isGuest) return;
    const already = (await tx.select({ org: t.members.organizationId }).from(t.members).where(eq(t.members.userId, userId))).map((r) => r.org);
    await tx
      .update(t.members)
      .set({ userId })
      .where(already.length ? and(eq(t.members.userId, guestId), notInArray(t.members.organizationId, already)) : eq(t.members.userId, guestId));
    await tx.delete(t.sessions).where(eq(t.sessions.userId, guestId));
  });
}

export async function upsertGoogleUser(profile: GoogleProfile, guestId: string | null): Promise<{ userId: string; adoptedGuest: boolean }> {
  const email = profile.email.toLowerCase();
  const bySub = await db.query.users.findFirst({ where: eq(t.users.googleSub, profile.sub) });
  if (bySub) return { userId: bySub.id, adoptedGuest: false };

  const byEmail = await db.query.users.findFirst({ where: eq(t.users.email, email) });
  if (byEmail && !byEmail.isGuest) {
    await db.update(t.users).set({ googleSub: profile.sub, avatarUrl: profile.picture ?? byEmail.avatarUrl }).where(eq(t.users.id, byEmail.id));
    return { userId: byEmail.id, adoptedGuest: false };
  }

  if (guestId) {
    const guest = await db.query.users.findFirst({ where: eq(t.users.id, guestId) });
    if (guest?.isGuest) {
      await db
        .update(t.users)
        .set({ email, name: profile.name ?? email.split("@")[0], googleSub: profile.sub, avatarUrl: profile.picture ?? null, isGuest: false })
        .where(eq(t.users.id, guestId));
      return { userId: guestId, adoptedGuest: true };
    }
  }

  const id = newId("usr");
  await db.insert(t.users).values({ id, email, name: profile.name ?? email.split("@")[0], googleSub: profile.sub, avatarUrl: profile.picture ?? null });
  return { userId: id, adoptedGuest: false };
}

export async function isPlatformAdmin(userId: string): Promise<boolean> {
  const row = await db.query.users.findFirst({ where: eq(t.users.id, userId), columns: { isPlatformAdmin: true } });
  return Boolean(row?.isPlatformAdmin);
}
