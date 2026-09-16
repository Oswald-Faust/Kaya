import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/server/billing/stripe";
import { env } from "@/server/env";
import { syncSubscription } from "@/server/services/billing";

const SUBSCRIPTION_EVENTS = new Set([
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "customer.subscription.paused",
  "customer.subscription.resumed",
  "customer.subscription.trial_will_end",
]);

/** Stripe webhook. Every event re-reads the subscription, so retries and reordering are safe. */
export async function POST(request: NextRequest) {
  if (!env.STRIPE_WEBHOOK_SECRET) return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(await request.text(), signature, env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let subscriptionId: string | null = null;
  if (SUBSCRIPTION_EVENTS.has(event.type)) {
    subscriptionId = (event.data.object as Stripe.Subscription).id;
  } else if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    subscriptionId = typeof session.subscription === "string" ? session.subscription : (session.subscription?.id ?? null);
  } else if (event.type === "invoice.paid" || event.type === "invoice.payment_failed") {
    const invoice = event.data.object as Stripe.Invoice;
    const sub = invoice.parent?.subscription_details?.subscription;
    subscriptionId = typeof sub === "string" ? sub : (sub?.id ?? null);
  }

  if (subscriptionId) {
    try {
      await syncSubscription(subscriptionId);
    } catch (error) {
      console.error(JSON.stringify({ level: "error", msg: "stripe_webhook_sync_failed", type: event.type, eventId: event.id, error: String(error) }));
      // A 500 makes Stripe retry with backoff.
      return NextResponse.json({ error: "Sync failed" }, { status: 500 });
    }
  }
  return NextResponse.json({ received: true });
}
