"use server";

import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { currentUser } from "@/server/context";
import { db } from "@/server/db/client";
import { users } from "@/server/db/schema";
import { isLocale, LOCALE_COOKIE } from "@/i18n/config";

/** Saves the language on the account (when signed in) and in a cookie for this browser. */
export async function setLocaleAction(locale: string): Promise<{ ok: boolean }> {
  if (!isLocale(locale)) return { ok: false };
  (await cookies()).set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax", httpOnly: false });
  const user = await currentUser();
  if (user && !user.isGuest) await db.update(users).set({ locale }).where(eq(users.id, user.userId));
  revalidatePath("/", "layout");
  return { ok: true };
}
