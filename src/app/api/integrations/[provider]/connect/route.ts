import { NextResponse, type NextRequest } from "next/server";
import { unstable_rethrow } from "next/navigation";
import { requireWorkspace } from "@/server/context";
import { isDomainError } from "@/server/domain/errors";
import { beginOAuth, OAUTH_STATE_COOKIE } from "@/server/integrations/connections";

const safeReturnTo = (value: string | null, slug: string) => (value && /^\/(w|start)\/[a-z0-9-]+(\/[a-z0-9/_-]*)?$/i.test(value) ? value : `/w/${slug}/integrations`);

/** Starts an OAuth connection: signs the state into a short-lived cookie and redirects to the provider. */
export async function GET(request: NextRequest, { params }: RouteContext<"/api/integrations/[provider]/connect">) {
  const { provider } = await params;
  const slug = request.nextUrl.searchParams.get("workspace") ?? "";
  if (!/^[a-z0-9-]{1,64}$/.test(slug)) return NextResponse.redirect(new URL("/", request.url));
  const returnTo = safeReturnTo(request.nextUrl.searchParams.get("returnTo"), slug);

  try {
    const ctx = await requireWorkspace(slug);
    const { url, cookie } = await beginOAuth(ctx, provider, returnTo);
    const res = NextResponse.redirect(url);
    res.cookies.set(OAUTH_STATE_COOKIE, cookie, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/api/integrations", maxAge: 600 });
    return res;
  } catch (error) {
    unstable_rethrow(error);
    const message = isDomainError(error) ? error.message : "Couldn't start the connection.";
    if (!isDomainError(error)) console.error(JSON.stringify({ level: "error", msg: "oauth_begin_failed", provider, error: String(error) }));
    const back = new URL(returnTo, request.url);
    back.searchParams.set("integration_error", message);
    back.searchParams.set("provider", provider);
    return NextResponse.redirect(back);
  }
}
