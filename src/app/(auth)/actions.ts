"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { rotateSession } from "@/server/auth/session";
import { currentUser } from "@/server/context";
import { localizeError } from "@/i18n/errors";
import { getI18n } from "@/i18n/server";
import { adoptGuest, checkRateLimit, isPlatformAdmin, logInWithPassword, resolvePostLoginRedirect, signUpWithPassword } from "@/server/services/account";

export type AuthFormState = { error: string | null };

function safeNext(value: FormDataEntryValue | null): string | null {
  const s = typeof value === "string" ? value : "";
  return s.startsWith("/") && !s.startsWith("//") && !s.startsWith("/\\") ? s : null;
}

async function toError(error: unknown): Promise<string> {
  const { locale, t } = await getI18n();
  const message = localizeError(error, locale);
  if (message) return message;
  console.error(JSON.stringify({ level: "error", msg: "auth_action_failed", error: String(error) }));
  return t.common.somethingWentWrong;
}

async function clientKey(prefix: string, email: FormDataEntryValue | null) {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  return `${prefix}:${ip}:${String(email ?? "").toLowerCase()}`;
}

export async function signupAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  let next = safeNext(formData.get("next"));
  try {
    const current = await currentUser();
    if (!current || current.isGuest) {
      checkRateLimit(await clientKey("signup", formData.get("email")), 10);
      const userId = await signUpWithPassword(
        { name: formData.get("name"), email: formData.get("email"), password: formData.get("password") },
        current?.isGuest ? current.userId : null,
      );
      await rotateSession(userId);
      next = await resolvePostLoginRedirect(userId, next);
    } else {
      next = await resolvePostLoginRedirect(current.userId, next);
    }
  } catch (error) {
    return { error: await toError(error) };
  }
  redirect(next);
}

export async function loginAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  let next = safeNext(formData.get("next"));
  try {
    checkRateLimit(await clientKey("login", formData.get("email")), 8);
    const userId = await logInWithPassword({ email: formData.get("email"), password: formData.get("password") });
    const current = await currentUser();
    if (current?.isGuest) await adoptGuest(current.userId, userId);
    await rotateSession(userId);
    next = await resolvePostLoginRedirect(userId, next);
  } catch (error) {
    return { error: await toError(error) };
  }
  redirect(next);
}
