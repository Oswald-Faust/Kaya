import { eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { createSession } from "@/server/auth/session";
import { currentUser } from "@/server/context";
import { db } from "@/server/db/client";
import { members, workspaces } from "@/server/db/schema";
import { env } from "@/server/env";
import { createGuestUser } from "@/server/services/account";
import { newId } from "@/lib/ids";

/**
 * Opens the demo workspace. Visitors join its organization as read-only viewers
 * (a guest session is created if needed), so they can explore but never act.
 */
export async function GET(request: NextRequest) {
  const to = request.nextUrl.searchParams.get("to") ?? "";
  // A path inside the workspace, optionally with a query (Kai links carry `?q=`).
  const cut = to.indexOf("?");
  const pathname = cut === -1 ? to : to.slice(0, cut);
  const query = cut === -1 ? "" : to.slice(cut + 1);
  const safePath = /^\/[a-z0-9/_-]*$/i.test(pathname) && !pathname.startsWith("//") ? pathname : "";
  const search = safePath && query ? `?${new URLSearchParams(query).toString()}` : "";
  const path = `${safePath}${search}`;
  if (env.ALLOW_DEMO_LOGIN === "false") return NextResponse.redirect(new URL("/signup", request.url));

  try {
    const demo = await db.query.workspaces.findFirst({ where: eq(workspaces.isDemo, true) });
    if (!demo) return NextResponse.redirect(new URL("/signup", request.url));

    let user = await currentUser();
    if (!user) {
      const guestId = await createGuestUser();
      await createSession(guestId);
      user = { userId: guestId, name: "Founder", email: "", isGuest: true };
    }
    await db.insert(members).values({ id: newId("mem"), organizationId: demo.organizationId, userId: user.userId, role: "viewer" }).onConflictDoNothing();
    return NextResponse.redirect(new URL(`/w/${demo.slug}${path}`, request.url));
  } catch (error) {
    // No database (e.g. a marketing-only deployment): send visitors to sign up instead of an error page.
    console.error(JSON.stringify({ level: "warn", msg: "demo_unavailable", error: String(error) }));
    return NextResponse.redirect(new URL("/signup", request.url));
  }
}
