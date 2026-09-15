import "server-only";
import { z } from "zod";
import { env } from "@/server/env";

/** Google OAuth 2.0 authorization-code flow (OpenID Connect userinfo). Enabled when GOOGLE_CLIENT_ID/SECRET are set. */

export const OAUTH_COOKIE = "kaya_oauth";

export function googleRedirectUri(requestUrl: string): string {
  const base = env.APP_URL ?? new URL(requestUrl).origin;
  return `${base.replace(/\/$/, "")}/api/auth/google/callback`;
}

export function googleAuthUrl(state: string, redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID ?? "",
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

const Token = z.object({ access_token: z.string() });
const Profile = z.object({
  sub: z.string(),
  email: z.string().email(),
  email_verified: z.boolean(),
  name: z.string().optional(),
  picture: z.string().url().optional(),
});
export type GoogleProfile = z.infer<typeof Profile>;

export async function exchangeGoogleCode(code: string, redirectUri: string): Promise<GoogleProfile> {
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID ?? "",
      client_secret: env.GOOGLE_CLIENT_SECRET ?? "",
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!tokenRes.ok) throw new Error(`google_token_${tokenRes.status}`);
  const { access_token } = Token.parse(await tokenRes.json());
  const profileRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { authorization: `Bearer ${access_token}` },
    signal: AbortSignal.timeout(10_000),
  });
  if (!profileRes.ok) throw new Error(`google_userinfo_${profileRes.status}`);
  const profile = Profile.parse(await profileRes.json());
  if (!profile.email_verified) throw new Error("google_email_unverified");
  return profile;
}
