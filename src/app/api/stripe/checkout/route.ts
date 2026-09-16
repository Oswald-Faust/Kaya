import { NextResponse, type NextRequest } from "next/server";
import { unstable_rethrow } from "next/navigation";
import Stripe from "stripe";
import { requireWorkspace } from "@/server/context";
import { stripe } from "@/server/billing/stripe";
import { completeCheckout } from "@/server/services/billing";

/** Stripe Checkout success URL: activates the plan, then opens the workspace. */
export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id") ?? "";
  if (!/^cs_(test|live)_[A-Za-z0-9]+$/.test(sessionId)) return NextResponse.redirect(new URL("/start", request.url));

  let slug: string | undefined;
  try {
    const session = await stripe().checkout.sessions.retrieve(sessionId);
    slug = session.metadata?.workspaceSlug;
    if (!slug) return NextResponse.redirect(new URL("/start", request.url));
    const ctx = await requireWorkspace(slug);
    const done = await completeCheckout(ctx, sessionId);
    return NextResponse.redirect(new URL(done ? `/w/${slug}?welcome=1` : `/start/${slug}/plan?canceled=1`, request.url), 303);
  } catch (error) {
    unstable_rethrow(error);
    const detail = error instanceof Stripe.errors.StripeError ? error.message : String(error);
    console.error(JSON.stringify({ level: "error", msg: "stripe_checkout_return_failed", sessionId, error: detail }));
    return NextResponse.redirect(new URL(slug ? `/start/${slug}/plan?error=checkout` : "/start", request.url), 303);
  }
}
