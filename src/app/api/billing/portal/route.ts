import { NextResponse, type NextRequest } from "next/server";
import { unstable_rethrow } from "next/navigation";
import { requireWorkspace } from "@/server/context";
import { billingPortalUrl } from "@/server/services/billing";

/** Opens the Stripe billing portal (card, invoices, cancel). Submitted as a POST form. */
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const slug = String(form.get("workspace") ?? "");
  if (!/^[a-z0-9-]{1,64}$/.test(slug)) return NextResponse.redirect(new URL("/", request.url), 303);
  try {
    const ctx = await requireWorkspace(slug);
    return NextResponse.redirect(await billingPortalUrl(ctx), 303);
  } catch (error) {
    unstable_rethrow(error);
    console.error(JSON.stringify({ level: "error", msg: "billing_portal_failed", slug, error: String(error) }));
    return NextResponse.redirect(new URL(`/w/${slug}?billing=unavailable`, request.url), 303);
  }
}
