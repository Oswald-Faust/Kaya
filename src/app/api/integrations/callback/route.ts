import { NextResponse, type NextRequest } from "next/server";
import { currentUser } from "@/server/context";
import { isDomainError } from "@/server/domain/errors";
import { completeOAuth, OAUTH_STATE_COOKIE, peekReturnTo } from "@/server/integrations/connections";

/** Single OAuth redirect URI for every provider; the signed state says which connection it completes. */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const cookie = request.cookies.get(OAUTH_STATE_COOKIE)?.value;
  let returnTo = peekReturnTo(cookie) ?? "/start";
  let provider = "";

  const finish = (params: Record<string, string>) => {
    const url = new URL(returnTo, request.url);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    const res = NextResponse.redirect(url);
    res.cookies.set(OAUTH_STATE_COOKIE, "", { path: "/api/integrations", maxAge: 0 });
    return res;
  };

  try {
    const user = await currentUser();
    if (sp.get("error")) {
      // The founder declined, or the provider refused. Recover the return path from the state if we can.
      const denied = sp.get("error_description") ?? sp.get("error") ?? "Connection canceled.";
      return finish({ integration_error: denied.slice(0, 200) });
    }
    const result = await completeOAuth({ code: sp.get("code") ?? "", state: sp.get("state") ?? "", cookie, currentUserId: user && !user.isGuest ? user.userId : null });
    returnTo = result.returnTo;
    provider = result.provider;
    return finish({ connected: provider });
  } catch (error) {
    const message = isDomainError(error) ? error.message : "The connection couldn't be completed.";
    if (!isDomainError(error)) console.error(JSON.stringify({ level: "error", msg: "oauth_callback_failed", error: String(error) }));
    return finish({ integration_error: message });
  }
}
