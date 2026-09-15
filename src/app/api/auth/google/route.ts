import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { googleAuthUrl, googleRedirectUri, OAUTH_COOKIE } from "@/server/auth/google";
import { env, googleAuthEnabled } from "@/server/env";

export async function GET(request: NextRequest) {
  if (!googleAuthEnabled) return NextResponse.redirect(new URL("/login?error=google", request.url));
  const nextParam = request.nextUrl.searchParams.get("next");
  const next = nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : null;
  const state = randomBytes(24).toString("base64url");
  const response = NextResponse.redirect(googleAuthUrl(state, googleRedirectUri(request.url)));
  response.cookies.set(OAUTH_COOKIE, JSON.stringify({ state, next }), {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: "/api/auth/google",
    maxAge: 600,
  });
  return response;
}
