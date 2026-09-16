import { basicAuth, ProviderError, request } from "./http";
import type { LiveProvider } from "./types";

type SendInput = { from?: string; fromName?: string; to: string | string[]; subject: string; html: string; text?: string; replyTo?: string };

function parseSend(input: Record<string, unknown>, provider: string): SendInput {
  const to = input.to;
  if ((typeof to !== "string" && !Array.isArray(to)) || typeof input.subject !== "string" || typeof input.html !== "string") {
    throw new ProviderError(provider, 400, `${provider}: an email needs to, subject and html.`, false);
  }
  return input as unknown as SendInput;
}

/* ───────────────────────────── Resend ───────────────────────────── */

const RESEND = "https://api.resend.com";

export const resendProvider: LiveProvider = {
  provider: "resend",
  auth: {
    type: "api_key",
    fields: [
      { name: "apiKey", label: "API key", placeholder: "re_…", secret: true },
      { name: "from", label: "Send from", placeholder: "Founder <hello@yourdomain.com>" },
    ],
    instructions: ["In Resend, open API Keys → Create API key with Full access (Kaya reads delivery stats and domains).", "The sender address must use a domain verified in Resend."],
    docsUrl: "https://resend.com/api-keys",
  },
  liveCapabilities: ["READ_EMAIL_METRICS", "SEND_EMAIL"],

  async verify(creds) {
    if (!creds.apiKey?.startsWith("re_")) throw new ProviderError("Resend", 400, "Resend API keys start with re_.", true);
    const from = creds.params?.from?.trim();
    if (!from || !/@/.test(from)) throw new ProviderError("Resend", 400, "Enter the address Kaya should send from.", true);
    let domains: { name: string; status: string }[];
    try {
      domains = (await request<{ data: { name: string; status: string }[] }>("Resend", `${RESEND}/domains`, { headers: { Authorization: `Bearer ${creds.apiKey}` } })).data;
    } catch (error) {
      if (error instanceof ProviderError && error.code === "restricted_api_key") {
        throw new ProviderError("Resend", 403, "This key can only send. Create a Full access key so Kaya can check your domain and read delivery stats.", true);
      }
      throw error;
    }
    const domain = from.split("@")[1]?.replace(/>$/, "").toLowerCase();
    const match = domains.find((d) => d.name.toLowerCase() === domain);
    if (!match) throw new ProviderError("Resend", 400, `${domain} isn't a domain in this Resend account. Add and verify it first.`, false);
    if (match.status !== "verified") throw new ProviderError("Resend", 400, `${domain} is ${match.status} in Resend. Finish DNS verification first.`, false);
    return { accountId: match.name, accountLabel: from, accounts: domains.map((d) => ({ id: d.name, label: d.name, detail: d.status })) };
  },

  async sync(ctx) {
    const headers = { Authorization: `Bearer ${ctx.credentials.apiKey ?? ""}` };
    const [domains, emails] = await Promise.all([
      request<{ data: { name: string; status: string }[] }>("Resend", `${RESEND}/domains`, { headers }),
      request<{ data: { last_event: string; created_at: string }[] }>("Resend", `${RESEND}/emails`, { headers, query: { limit: 100 } }).catch(() => ({ data: [] })),
    ]);
    const events: Record<string, number> = {};
    for (const e of emails.data) events[e.last_event] = (events[e.last_event] ?? 0) + 1;
    return {
      summary: `${domains.data.filter((d) => d.status === "verified").length} verified domain(s) · last ${emails.data.length} emails: ${Object.entries(events).map(([k, v]) => `${v} ${k}`).join(", ") || "none yet"}`,
      data: { domains: domains.data, recentEmails: emails.data.length, lastEvents: events },
    };
  },

  async read(_c, _i, ctx) {
    return (await resendProvider.sync(ctx)).data;
  },

  async execute(capability, input, ctx) {
    if (capability !== "SEND_EMAIL") throw new ProviderError("Resend", 400, `Resend can't ${capability}.`, false);
    const email = parseSend(input, "Resend");
    const res = await request<{ id: string }>("Resend", `${RESEND}/emails`, {
      headers: { Authorization: `Bearer ${ctx.credentials.apiKey ?? ""}`, "Idempotency-Key": ctx.idempotencyKey.slice(0, 256) },
      body: { from: email.from ?? ctx.credentials.params?.from, to: email.to, subject: email.subject, html: email.html, text: email.text, reply_to: email.replyTo },
    });
    return { externalId: res.id, data: { id: res.id } };
  },
};

/* ───────────────────────────── Brevo ───────────────────────────── */

const BREVO = "https://api.brevo.com/v3";

export const brevoProvider: LiveProvider = {
  provider: "brevo",
  auth: {
    type: "api_key",
    fields: [
      { name: "apiKey", label: "API key", placeholder: "xkeysib-…", secret: true },
      { name: "from", label: "Send from", placeholder: "hello@yourdomain.com" },
    ],
    instructions: ["In Brevo, open SMTP & API → API keys → Generate a new API key.", "The sender must be a verified sender or domain in Brevo."],
    docsUrl: "https://app.brevo.com/settings/keys/api",
  },
  liveCapabilities: ["READ_EMAIL_METRICS", "SEND_EMAIL"],

  async verify(creds) {
    if (!creds.apiKey?.startsWith("xkeysib-")) throw new ProviderError("Brevo", 400, "Brevo API keys start with xkeysib-. SMTP keys (xsmtpsib-) can't be used.", true);
    const account = await request<{ email: string; companyName?: string; plan?: { type: string }[] }>("Brevo", `${BREVO}/account`, { headers: { "api-key": creds.apiKey } });
    const senders = await request<{ senders: { email: string; active: boolean }[] }>("Brevo", `${BREVO}/senders`, { headers: { "api-key": creds.apiKey } });
    const from = creds.params?.from?.trim().toLowerCase();
    if (from && !senders.senders.some((s) => s.email.toLowerCase() === from && s.active)) {
      throw new ProviderError("Brevo", 400, `${from} isn't an active sender in Brevo. Add it under Senders, Domains & Dedicated IPs.`, false);
    }
    return { accountId: account.email, accountLabel: `${account.companyName || account.email}${account.plan?.[0] ? ` · ${account.plan[0].type} plan` : ""}` };
  },

  async sync(ctx) {
    const headers = { "api-key": ctx.credentials.apiKey ?? "" };
    const [report, campaigns] = await Promise.all([
      request<{ requests: number; delivered: number; uniqueOpens: number; uniqueClicks: number; hardBounces: number; unsubscribed: number }>("Brevo", `${BREVO}/smtp/statistics/aggregatedReport`, { headers, query: { days: 30 } }),
      request<{ campaigns?: { id: number; name: string; sentDate?: string }[]; count?: number }>("Brevo", `${BREVO}/emailCampaigns`, { headers, query: { limit: 10, sort: "desc", status: "sent" } }),
    ]);
    const openRate = report.delivered ? Math.round((report.uniqueOpens / report.delivered) * 1000) / 10 : 0;
    return {
      summary: `${report.delivered.toLocaleString("en-US")} transactional emails delivered in 30 days · ${openRate}% unique opens · ${campaigns.count ?? 0} sent campaigns`,
      data: { transactional30d: report, openRate, recentCampaigns: campaigns.campaigns ?? [] },
    };
  },

  async read(_c, _i, ctx) {
    return (await brevoProvider.sync(ctx)).data;
  },

  async execute(capability, input, ctx) {
    if (capability !== "SEND_EMAIL") throw new ProviderError("Brevo", 400, `Brevo can't ${capability}.`, false);
    const email = parseSend(input, "Brevo");
    const res = await request<{ messageId: string }>("Brevo", `${BREVO}/smtp/email`, {
      headers: { "api-key": ctx.credentials.apiKey ?? "" },
      body: {
        sender: { email: email.from ?? ctx.credentials.params?.from, name: email.fromName },
        to: (Array.isArray(email.to) ? email.to : [email.to]).map((address) => ({ email: address })),
        subject: email.subject,
        htmlContent: email.html,
        textContent: email.text,
        headers: { idempotencyKey: ctx.idempotencyKey.slice(0, 200) },
      },
    });
    return { externalId: res.messageId, data: { messageId: res.messageId } };
  },
};

/* ─────────────────────────── Rewardful (creators) ─────────────────────────── */

const REWARDFUL = "https://api.getrewardful.com/v1";

type RewardfulAffiliate = { id: string; first_name: string; last_name: string; email: string; visitors: number; leads: number; conversions: number; state: string };

export const rewardfulProvider: LiveProvider = {
  provider: "creator_tracking",
  auth: {
    type: "api_key",
    fields: [{ name: "apiKey", label: "Rewardful API secret", placeholder: "Your API secret", secret: true }],
    instructions: [
      "Kaya tracks creators and affiliates through Rewardful, which attributes Stripe revenue to links and coupon codes.",
      "In Rewardful, open Company settings → API → copy the API secret.",
    ],
    docsUrl: "https://developers.rewardful.com/rest-api-reference/authentication",
  },
  liveCapabilities: ["TRACK_CREATOR_DEALS"],

  async verify(creds) {
    const res = await request<{ data: { id: string; name: string; commission_percent?: number }[] }>("Rewardful", `${REWARDFUL}/campaigns`, { headers: { Authorization: basicAuth(creds.apiKey ?? "", "") } });
    if (!res.data.length) throw new ProviderError("Rewardful", 404, "This Rewardful account has no campaign yet. Create one first.", false);
    const accounts = res.data.map((c) => ({ id: c.id, label: c.name, detail: c.commission_percent != null ? `${c.commission_percent}% commission` : undefined }));
    return { accountId: accounts[0].id, accountLabel: `Rewardful · ${accounts[0].label}`, accounts };
  },

  async sync(ctx) {
    const res = await request<{ data: RewardfulAffiliate[]; pagination?: { total_count: number } }>("Rewardful", `${REWARDFUL}/affiliates`, {
      headers: { Authorization: basicAuth(ctx.credentials.apiKey ?? "", "") },
      query: { campaign_id: ctx.accountId ?? undefined, limit: 100 },
    });
    const conversions = res.data.reduce((s, a) => s + a.conversions, 0);
    const top = [...res.data].sort((a, b) => b.conversions - a.conversions).slice(0, 5);
    return {
      summary: `${res.pagination?.total_count ?? res.data.length} affiliates · ${res.data.reduce((s, a) => s + a.visitors, 0)} visitors · ${conversions} conversions`,
      data: { affiliates: res.pagination?.total_count ?? res.data.length, conversions, top: top.map((a) => ({ name: `${a.first_name} ${a.last_name}`.trim(), email: a.email, visitors: a.visitors, leads: a.leads, conversions: a.conversions })) },
    };
  },

  async execute(capability, input, ctx) {
    if (capability !== "TRACK_CREATOR_DEALS") throw new ProviderError("Rewardful", 400, `Rewardful can't ${capability}.`, false);
    if (typeof input.email !== "string") throw new ProviderError("Rewardful", 400, "Rewardful: the creator's email is required.", false);
    const res = await request<{ id: string; links?: { url: string; token: string }[] }>("Rewardful", `${REWARDFUL}/affiliates`, {
      headers: { Authorization: basicAuth(ctx.credentials.apiKey ?? "", "") },
      body: { first_name: String(input.firstName ?? ""), last_name: String(input.lastName ?? ""), email: input.email, campaign_id: String(input.campaignId ?? ctx.accountId ?? "") },
    });
    return { externalId: res.id, data: { affiliateId: res.id, links: res.links ?? [] } };
  },
};
