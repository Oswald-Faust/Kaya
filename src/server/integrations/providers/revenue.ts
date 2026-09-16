import Stripe from "stripe";
import { daysAgoIso, formatMoneyMap, ProviderError, request, sumByCurrency, toMonthly } from "./http";
import type { Credentials, LiveProvider, ProviderCallContext } from "./types";

/* ───────────────────────────── Stripe ───────────────────────────── */

function stripeClient(creds: Credentials) {
  if (!creds.apiKey) throw new ProviderError("Stripe", 401, "Stripe: missing API key.", true);
  return new Stripe(creds.apiKey, { maxNetworkRetries: 1, timeout: 20_000, appInfo: { name: "Kaya" } });
}

async function stripeCall<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof Stripe.errors.StripeError) {
      const auth = error.type === "StripeAuthenticationError" || error.type === "StripePermissionError";
      throw new ProviderError("Stripe", error.statusCode ?? 0, `Stripe: ${error.message}`, auth, error.code);
    }
    throw error;
  }
}

export const stripeProvider: LiveProvider = {
  provider: "stripe",
  auth: {
    type: "api_key",
    fields: [{ name: "apiKey", label: "Restricted API key", placeholder: "rk_live_…", secret: true }],
    instructions: [
      "In Stripe, open Developers → API keys → Create restricted key.",
      "Give it Read access to Customers, Subscriptions, Invoices, Charges, Prices and Products. Leave everything else at None.",
      "Paste the key here. Kaya only reads: it can't charge, refund or change anything.",
    ],
    docsUrl: "https://dashboard.stripe.com/apikeys/create",
  },
  liveCapabilities: ["READ_REVENUE", "READ_SUBSCRIPTIONS"],

  async verify(creds) {
    const key = creds.apiKey?.trim() ?? "";
    if (key.startsWith("pk_")) throw new ProviderError("Stripe", 400, "That's a publishable key. Paste a restricted (rk_) or secret (sk_) key.", true);
    if (!/^(rk|sk)_(live|test)_/.test(key)) throw new ProviderError("Stripe", 400, "Stripe keys start with rk_live_, rk_test_, sk_live_ or sk_test_.", true);
    const stripe = stripeClient(creds);
    await stripeCall(() => stripe.subscriptions.list({ limit: 1, status: "all" }));
    const mode = key.includes("_test_") ? "test mode" : "live";
    let label = `Stripe (${mode})`;
    let id = `stripe_${key.slice(-6)}`;
    try {
      const account = await stripe.accounts.retrieveCurrent();
      label = `${account.settings?.dashboard?.display_name || account.business_profile?.name || account.email || account.id} (${mode})`;
      id = account.id;
    } catch {
      // Restricted keys often can't read the account object; the key itself is still verified above.
    }
    return { accountId: id, accountLabel: label };
  },

  async sync(ctx) {
    const stripe = stripeClient(ctx.credentials);
    const mrr: { currency: string; amount: number }[] = [];
    let active = 0;
    let trialing = 0;
    let pastDue = 0;
    await stripeCall(async () => {
      for await (const sub of stripe.subscriptions.list({ status: "all", limit: 100, expand: ["data.items.data.price"] })) {
        if (sub.status === "trialing") trialing++;
        if (sub.status === "past_due") pastDue++;
        if (sub.status !== "active" && sub.status !== "past_due") continue;
        active++;
        for (const item of sub.items.data) {
          const price = item.price;
          if (!price.recurring || price.unit_amount == null) continue;
          mrr.push({ currency: price.currency, amount: toMonthly((price.unit_amount * (item.quantity ?? 1)) / 100, price.recurring.interval, price.recurring.interval_count) });
        }
        if (active + trialing + pastDue >= 2000) break;
      }
    });
    const since = Math.floor(Date.now() / 1000) - 30 * 86_400;
    const revenue: { currency: string; amount: number }[] = [];
    let payments = 0;
    await stripeCall(async () => {
      for await (const charge of stripe.charges.list({ created: { gte: since }, limit: 100 })) {
        if (charge.status !== "succeeded" || !charge.paid) continue;
        payments++;
        revenue.push({ currency: charge.currency, amount: (charge.amount - charge.amount_refunded) / 100 });
        if (payments >= 5000) break;
      }
    });
    const mrrByCurrency = sumByCurrency(mrr);
    const revenue30d = sumByCurrency(revenue);
    return {
      summary: `MRR ${formatMoneyMap(mrrByCurrency)} · ${active} active, ${trialing} trialing · ${formatMoneyMap(revenue30d)} collected in 30 days`,
      data: { mrr: mrrByCurrency, activeSubscriptions: active, trialingSubscriptions: trialing, pastDueSubscriptions: pastDue, revenue30d, payments30d: payments },
    };
  },

  async read(_capability, _input, ctx) {
    return (await stripeProvider.sync(ctx)).data;
  },
};

/* ───────────────────────────── Paddle ───────────────────────────── */

const paddleBase = (key: string) => (key.includes("_sdbx_") ? "https://sandbox-api.paddle.com" : "https://api.paddle.com");

type PaddleList<T> = { data: T[]; meta?: { pagination?: { next?: string; has_more?: boolean } } };

async function paddleAll<T>(creds: Credentials, path: string, query: Record<string, string>, max = 1000): Promise<T[]> {
  const key = creds.apiKey ?? "";
  const out: T[] = [];
  let url: string | undefined = `${paddleBase(key)}${path}?${new URLSearchParams(query)}`;
  while (url && out.length < max) {
    const page: PaddleList<T> = await request<PaddleList<T>>("Paddle", url, { headers: { Authorization: `Bearer ${key}` } });
    out.push(...page.data);
    url = page.meta?.pagination?.has_more ? page.meta.pagination.next : undefined;
  }
  return out;
}

type PaddleSubscription = { status: string; currency_code: string; items: { quantity: number; price: { unit_price: { amount: string }; billing_cycle: { interval: string; frequency: number } | null } }[] };
type PaddleTransaction = { currency_code: string; details: { totals: { grand_total: string } } };

export const paddleProvider: LiveProvider = {
  provider: "paddle",
  auth: {
    type: "api_key",
    fields: [{ name: "apiKey", label: "API key", placeholder: "pdl_live_apikey_…", secret: true }],
    instructions: [
      "In Paddle, open Developer tools → Authentication → New API key.",
      "Grant Read permissions for Subscriptions, Transactions, Prices and Products.",
      "Sandbox keys (pdl_sdbx_) connect to your sandbox account.",
    ],
    docsUrl: "https://developer.paddle.com/api-reference/about/authentication",
  },
  liveCapabilities: ["READ_REVENUE", "READ_SUBSCRIPTIONS"],

  async verify(creds) {
    const key = creds.apiKey?.trim() ?? "";
    if (!key.startsWith("pdl_")) throw new ProviderError("Paddle", 400, "Paddle Billing API keys start with pdl_live_apikey_ or pdl_sdbx_apikey_.", true);
    await request("Paddle", `${paddleBase(key)}/subscriptions`, { headers: { Authorization: `Bearer ${key}` }, query: { per_page: 1 } });
    const sandbox = key.includes("_sdbx_");
    return { accountId: `paddle_${sandbox ? "sandbox" : "live"}_${key.slice(-6)}`, accountLabel: `Paddle (${sandbox ? "sandbox" : "live"})` };
  },

  async sync(ctx) {
    const subs = await paddleAll<PaddleSubscription>(ctx.credentials, "/subscriptions", { status: "active,past_due,trialing", per_page: "200" });
    const mrr: { currency: string; amount: number }[] = [];
    let active = 0;
    let trialing = 0;
    for (const s of subs) {
      if (s.status === "trialing") {
        trialing++;
        continue;
      }
      active++;
      for (const item of s.items) {
        if (!item.price.billing_cycle) continue;
        mrr.push({ currency: s.currency_code, amount: toMonthly((Number(item.price.unit_price.amount) * item.quantity) / 100, item.price.billing_cycle.interval, item.price.billing_cycle.frequency) });
      }
    }
    const txs = await paddleAll<PaddleTransaction>(ctx.credentials, "/transactions", { status: "completed", "created_at[GTE]": daysAgoIso(30), per_page: "200" }, 5000);
    const revenue30d = sumByCurrency(txs.map((t) => ({ currency: t.currency_code, amount: Number(t.details.totals.grand_total) / 100 })));
    const mrrByCurrency = sumByCurrency(mrr);
    return {
      summary: `MRR ${formatMoneyMap(mrrByCurrency)} · ${active} active, ${trialing} trialing · ${formatMoneyMap(revenue30d)} in 30 days`,
      data: { mrr: mrrByCurrency, activeSubscriptions: active, trialingSubscriptions: trialing, revenue30d, transactions30d: txs.length },
    };
  },

  async read(_c, _i, ctx) {
    return (await paddleProvider.sync(ctx)).data;
  },
};

/* ─────────────────────────── Lemon Squeezy ─────────────────────────── */

const lsHeaders = (creds: Credentials) => ({ Authorization: `Bearer ${creds.apiKey ?? ""}`, Accept: "application/vnd.api+json" });

type LsStore = { id: string; attributes: { name: string; domain: string; currency: string; total_revenue: number; thirty_day_revenue: number; thirty_day_sales: number; total_sales: number } };

export const lemonSqueezyProvider: LiveProvider = {
  provider: "lemon_squeezy",
  auth: {
    type: "api_key",
    fields: [{ name: "apiKey", label: "API key", placeholder: "eyJ0eXAiOiJKV1QiLCJhbGciOi…", secret: true }],
    instructions: ["In Lemon Squeezy, open Settings → API → New API key.", "Paste it here. Kaya reads stores, orders and subscriptions."],
    docsUrl: "https://app.lemonsqueezy.com/settings/api",
  },
  liveCapabilities: ["READ_REVENUE", "READ_SUBSCRIPTIONS"],

  async verify(creds) {
    const me = await request<{ data: { attributes: { name: string; email: string } } }>("Lemon Squeezy", "https://api.lemonsqueezy.com/v1/users/me", { headers: lsHeaders(creds) });
    const stores = await request<{ data: LsStore[] }>("Lemon Squeezy", "https://api.lemonsqueezy.com/v1/stores", { headers: lsHeaders(creds) });
    if (!stores.data.length) throw new ProviderError("Lemon Squeezy", 404, "This Lemon Squeezy account has no store yet.", false);
    const accounts = stores.data.map((s) => ({ id: s.id, label: s.attributes.name, detail: s.attributes.domain }));
    return { accountId: accounts[0].id, accountLabel: `${accounts[0].label} · ${me.data.attributes.email}`, accounts };
  },

  async sync(ctx: ProviderCallContext) {
    const stores = await request<{ data: LsStore[] }>("Lemon Squeezy", "https://api.lemonsqueezy.com/v1/stores", { headers: lsHeaders(ctx.credentials) });
    const store = stores.data.find((s) => s.id === ctx.accountId) ?? stores.data[0];
    if (!store) throw new ProviderError("Lemon Squeezy", 404, "Store not found.", false);
    const subs = await request<{ meta: { page: { total: number } } }>("Lemon Squeezy", "https://api.lemonsqueezy.com/v1/subscriptions", {
      headers: lsHeaders(ctx.credentials),
      query: { "filter[store_id]": store.id, "filter[status]": "active", "page[size]": 1 },
    });
    const currency = store.attributes.currency;
    const revenue30d = { [currency]: store.attributes.thirty_day_revenue / 100 };
    return {
      summary: `${store.attributes.name}: ${formatMoneyMap(revenue30d)} and ${store.attributes.thirty_day_sales} sales in 30 days · ${subs.meta.page.total} active subscriptions`,
      data: { store: store.attributes.name, revenue30d, sales30d: store.attributes.thirty_day_sales, totalRevenue: { [currency]: store.attributes.total_revenue / 100 }, activeSubscriptions: subs.meta.page.total },
    };
  },

  async read(_c, _i, ctx) {
    return (await lemonSqueezyProvider.sync(ctx)).data;
  },
};
