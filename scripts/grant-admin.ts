import "./load-env";
import { eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import * as t from "@/server/db/schema";
import { hashPassword } from "@/server/auth/password";
import { newId } from "@/lib/ids";

/**
 * Grants platform admin access: pnpm admin:grant you@company.com
 * Set ADMIN_PASSWORD to also set (or create the account with) that password.
 * The password is read from the environment so it never lands in shell history files or the repo.
 */
async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("Usage: pnpm admin:grant <email>  (optional ADMIN_PASSWORD env)");
  const password = process.env.ADMIN_PASSWORD;
  if (password !== undefined && password.length < 8) throw new Error("ADMIN_PASSWORD must be at least 8 characters.");

  const existing = await db.query.users.findFirst({ where: eq(t.users.email, email) });
  const passwordHash = password ? await hashPassword(password) : undefined;
  if (existing) {
    await db
      .update(t.users)
      .set({ isPlatformAdmin: true, isGuest: false, suspendedAt: null, ...(passwordHash ? { passwordHash } : {}) })
      .where(eq(t.users.id, existing.id));
    console.log(`${email} is now a platform admin${passwordHash ? " (password updated)" : ""}.`);
  } else {
    if (!passwordHash) throw new Error(`No account for ${email}. Set ADMIN_PASSWORD to create it.`);
    await db.insert(t.users).values({ id: newId("usr"), email, name: email.split("@")[0], passwordHash, isPlatformAdmin: true });
    console.log(`Created ${email} as a platform admin.`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
