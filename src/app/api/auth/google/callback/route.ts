import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { exchangeGoogleCode, googleRedirectUri, OAUTH_COOKIE } from "@/server/auth/google";
import { rotateSession } from "@/server/auth/session";
import { currentUser } from "@/server/context";
import { googleAuthEnabled } from "@/server/env";
import { adoptGuest, resolvePostLoginRedirect, upsertGoogleUser } from "@/server/services/account";

function sameState(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export async function GET(request: NextRequest) {
  const fail = () => NextResponse.redirect(new URL("/login?error=google", request.url));
  if (!googleAuthEnabled) return fail();

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  let saved: { state?: string; next?: string | null } = {};
  try {
    saved = JSON.parse(request.cookies.get(OAUTH_COOKIE)?.value ?? "{}");
  } catch {
    return fail();
  }
  if (!code || !state || !saved.state || !sameState(state, saved.state)) return fail();

  let authedUserId: string | null = null;
  try {
    const profile = await exchangeGoogleCode(code, googleRedirectUri(request.url));
    const current = await currentUser();
    const guestId = current?.isGuest ? current.userId : null;
    const { userId, adoptedGuest } = await upsertGoogleUser(profile, guestId);
    if (guestId && !adoptedGuest) await adoptGuest(guestId, userId);
    await rotateSession(userId);
    authedUserId = userId;
  } catch (error) {
    console.error(JSON.stringify({ level: "error", msg: "google_oauth_failed", error: String(error) }));
    return fail();
  }

  const savedNext = saved.next && saved.next.startsWith("/") && !saved.next.startsWith("//") ? saved.next : null;
  const next = authedUserId ? await resolvePostLoginRedirect(authedUserId, savedNext) : (savedNext ?? "/start");
  const response = NextResponse.redirect(new URL(next, request.url));
  response.cookies.delete({ name: OAUTH_COOKIE, path: "/api/auth/google" });
  return response;
}
