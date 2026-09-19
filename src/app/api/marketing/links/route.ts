import { NextResponse } from "next/server";
import { getMarketingLinks } from "@/server/marketing";
import { currentUser } from "@/server/context";

export const dynamic = "force-dynamic";

export async function GET() {
  const [links, user] = await Promise.all([
    getMarketingLinks(),
    currentUser().catch(() => null),
  ]);

  const authenticated = Boolean(user && !user.isGuest);

  return NextResponse.json(
    {
      authenticated,
      appHref: authenticated ? links.appHref : null,
      demoHref: links.demoHref,
      demoSlug: links.demoSlug,
      subscription: authenticated ? links.subscription : null,
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    },
  );
}
