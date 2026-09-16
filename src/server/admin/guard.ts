import "server-only";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { currentUser } from "@/server/context";
import { db } from "@/server/db/client";
import { users } from "@/server/db/schema";

export interface AdminContext {
  userId: string;
  name: string;
  email: string;
}

/**
 * Gate for /admin. Signed-out visitors go to login; signed-in non-admins get a
 * 404 so the console's existence isn't advertised. Re-checked on every request
 * and inside every admin action, never trusted from the client.
 */
export const requireAdmin = cache(async (): Promise<AdminContext> => {
  const user = await currentUser();
  if (!user || user.isGuest) redirect("/login?next=/admin");
  const row = await db.query.users.findFirst({ where: eq(users.id, user.userId), columns: { isPlatformAdmin: true, suspendedAt: true } });
  if (!row?.isPlatformAdmin || row.suspendedAt) notFound();
  return { userId: user.userId, name: user.name, email: user.email };
});
