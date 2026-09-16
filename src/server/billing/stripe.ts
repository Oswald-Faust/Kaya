import "server-only";
import Stripe from "stripe";
import { env } from "@/server/env";
import { DomainError } from "@/server/domain/errors";

let client: Stripe | null = null;

export function stripe(): Stripe {
  if (!env.STRIPE_SECRET_KEY) throw new DomainError("upstream", "Payments are not configured yet.");
  client ??= new Stripe(env.STRIPE_SECRET_KEY, { appInfo: { name: "Kaya" }, maxNetworkRetries: 2 });
  return client;
}
