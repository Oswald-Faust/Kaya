"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { rotateSession } from "@/server/auth/session";
import { currentUser } from "@/server/context";
import { isDomainError } from "@/server/domain/errors";
import { adoptGuest, checkRateLimit, logInWithPassword, signUpWithPassword } from "@/server/services/account";

export type AuthFormState = { error: string | null };

function safeNext(value: FormDataEntryValue | null): string | null {
  const s = typeof value === "string" ? value : "";
  return s.startsWith("/") && !s.startsWith("//") && !s.startsWith("/\\") ? s : null;
}

function toError(error: unknown): string {
  if (isDomainError(error)) return error.message;
  console.error(JSON.stringify({ level: "error", msg: "auth_action_failed", error: String(error) }));
  return "Something went wrong. Please try again.";
}

async function clientKey(prefix: string, email: FormDataEntryValue | null) {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  return `${prefix}:${ip}:${String(email ?? "").toLowerCase()}`;
}

export async function signupAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const next = safeNext(formData.get("next")) ?? "/start";
  try {
    const current = await currentUser();
    if (!current || current.isGuest) {
      checkRateLimit(await clientKey("signup", formData.get("email")), 10);
      const userId = await signUpWithPassword(
        { name: formData.get("name"), email: formData.get("email"), password: formData.get("password") },
        current?.isGuest ? current.userId : null,
      );
      await rotateSession(userId);
    }
  } catch (error) {
    return { error: toError(error) };
  }
  redirect(next);
}

export async function loginAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const next = safeNext(formData.get("next")) ?? "/start";
  try {
    checkRateLimit(await clientKey("login", formData.get("email")), 8);
    const userId = await logInWithPassword({ email: formData.get("email"), password: formData.get("password") });
    const current = await currentUser();
    if (current?.isGuest) await adoptGuest(current.userId, userId);
    await rotateSession(userId);
  } catch (error) {
    return { error: toError(error) };
  }
  redirect(next);
}
