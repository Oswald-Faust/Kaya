import { env } from "@/server/env";
import { dayString, ProviderError, request } from "./http";
import type { Credentials, LiveProvider, OAuthAuth, ProviderCallContext } from "./types";

/* Google OAuth shared by GA4, Search Console and Google Ads. */

const googleClient = () => ({
  id: env.GOOGLE_INTEGRATIONS_CLIENT_ID ?? env.GOOGLE_CLIENT_ID,
  secret: env.GOOGLE_INTEGRATIONS_CLIENT_SECRET ?? env.GOOGLE_CLIENT_SECRET,
});

type TokenResponse = { access_token: string; refresh_token?: string; expires_in: number; scope?: string };

const toCredentials = (t: TokenResponse, previous?: Credentials): Credentials => ({
  accessToken: t.access_token,
  refreshToken: t.refresh_token ?? previous?.refreshToken,
  expiresAt: Date.now() + (t.expires_in - 60) * 1000,
  scope: t.scope ?? previous?.scope,
});

function googleAuth(scopes: string[], extraMissing: () => string[] = () => []): OAuthAuth {
  return {
    type: "oauth",
    scopes,
    setupUrl: "https://console.cloud.google.com/apis/credentials",
    missingConfig: () => [...(googleClient().id ? [] : ["GOOGLE_CLIENT_ID"]), ...(googleClient().secret ? [] : ["GOOGLE_CLIENT_SECRET"]), ...extraMissing()],
    authorizeUrl({ redirectUri, state }) {
      const u = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      u.search = new URLSearchParams({
        client_id: googleClient().id ?? "",
        redirect_uri: redirectUri,
        response_type: "code",
        scope: ["openid", "email", ...scopes].join(" "),
        access_type: "offline",
        prompt: "consent",
        include_granted_scopes: "true",
        state,
      }).toString();
      return u.toString();
    },
    async exchangeCode({ code, redirectUri }) {
      const t = await request<TokenResponse>("Google", "https://oauth2.googleapis.com/token", {
        body: new URLSearchParams({ code, client_id: googleClient().id ?? "", client_secret: googleClient().secret ?? "", redirect_uri: redirectUri, grant_type: "authorization_code" }),
      });
      const granted = (t.scope ?? "").split(" ");
      const missing = scopes.filter((s) => !granted.includes(s));
      if (missing.length) throw new ProviderError("Google", 403, "Google didn't grant the requested access. Reconnect and keep every box checked.", true);
      return toCredentials(t);
    },
    async refresh(creds) {
      if (!creds.refreshToken) return null;
      const t = await request<TokenResponse>("Google", "https://oauth2.googleapis.com/token", {
        body: new URLSearchParams({ refresh_token: creds.refreshToken, client_id: googleClient().id ?? "", client_secret: googleClient().secret ?? "", grant_type: "refresh_token" }),
      });
      return toCredentials(t, creds);
    },
    async revoke(creds) {
      const token = creds.refreshToken ?? creds.accessToken;
      if (token) await request("Google", "https://oauth2.googleapis.com/revoke", { body: new URLSearchParams({ token }) }).catch(() => undefined);
    },
  };
}

const bearer = (creds: Credentials) => ({ Authorization: `Bearer ${creds.accessToken ?? ""}` });

async function googleEmail(creds: Credentials): Promise<string | null> {
  try {
    return (await request<{ email?: string }>("Google", "https://openidconnect.googleapis.com/v1/userinfo", { headers: bearer(creds) })).email ?? null;
  } catch {
    return null;
  }
}

/* ─────────────────────────── Google Analytics 4 ─────────────────────────── */

type RunReport = { rows?: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }[]; totals?: { metricValues: { value: string }[] }[] };

async function ga4Report(ctx: ProviderCallContext, body: Record<string, unknown>) {
  if (!ctx.accountId) throw new ProviderError("Google Analytics", 400, "Pick a GA4 property first.", false);
  return request<RunReport>("Google Analytics", `https://analyticsdata.googleapis.com/v1beta/${ctx.accountId}:runReport`, { headers: bearer(ctx.credentials), body });
}

export const googleAnalyticsProvider: LiveProvider = {
  provider: "google_analytics",
  auth: googleAuth(["https://www.googleapis.com/auth/analytics.readonly"]),
  liveCapabilities: ["READ_ANALYTICS"],

  async verify(creds) {
    const res = await request<{ accountSummaries?: { displayName: string; propertySummaries?: { property: string; displayName: string }[] }[] }>("Google Analytics", "https://analyticsadmin.googleapis.com/v1beta/accountSummaries", {
      headers: bearer(creds),
      query: { pageSize: 200 },
    });
    const accounts = (res.accountSummaries ?? []).flatMap((a) => (a.propertySummaries ?? []).map((p) => ({ id: p.property, label: p.displayName, detail: a.displayName })));
    if (!accounts.length) throw new ProviderError("Google Analytics", 404, "This Google account can't access any GA4 property.", false);
    const email = await googleEmail(creds);
    return { accountId: accounts[0].id, accountLabel: `${accounts[0].label}${email ? ` · ${email}` : ""}`, accounts };
  },

  async sync(ctx) {
    const range = [{ startDate: "30daysAgo", endDate: "today" }];
    const [byChannel, byDay] = await Promise.all([
      ga4Report(ctx, { dateRanges: range, dimensions: [{ name: "sessionDefaultChannelGroup" }], metrics: [{ name: "sessions" }, { name: "totalUsers" }, { name: "keyEvents" }], metricAggregations: ["TOTAL"], orderBys: [{ metric: { metricName: "sessions" }, desc: true }], limit: 12 }),
      ga4Report(ctx, { dateRanges: range, dimensions: [{ name: "date" }], metrics: [{ name: "sessions" }, { name: "keyEvents" }], orderBys: [{ dimension: { dimensionName: "date" } }] }),
    ]);
    const totals = byChannel.totals?.[0]?.metricValues.map((m) => Number(m.value)) ?? [0, 0, 0];
    const channels = (byChannel.rows ?? []).map((r) => ({ channel: r.dimensionValues[0].value, sessions: Number(r.metricValues[0].value), users: Number(r.metricValues[1].value), keyEvents: Number(r.metricValues[2].value) }));
    return {
      summary: `${totals[0].toLocaleString("en-US")} sessions · ${totals[1].toLocaleString("en-US")} users · ${totals[2].toLocaleString("en-US")} key events in 30 days`,
      data: { sessions30d: totals[0], users30d: totals[1], keyEvents30d: totals[2], channels, daily: (byDay.rows ?? []).map((r) => ({ date: r.dimensionValues[0].value, sessions: Number(r.metricValues[0].value), keyEvents: Number(r.metricValues[1].value) })) },
    };
  },

  async read(_c, _i, ctx) {
    return (await googleAnalyticsProvider.sync(ctx)).data;
  },
};

/* ─────────────────────────── Search Console ─────────────────────────── */

type SearchRows = { rows?: { keys: string[]; clicks: number; impressions: number; ctr: number; position: number }[] };

export const searchConsoleProvider: LiveProvider = {
  provider: "search_console",
  auth: googleAuth(["https://www.googleapis.com/auth/webmasters.readonly"]),
  liveCapabilities: ["READ_SEARCH_QUERIES"],

  async verify(creds) {
    const res = await request<{ siteEntry?: { siteUrl: string; permissionLevel: string }[] }>("Search Console", "https://www.googleapis.com/webmasters/v3/sites", { headers: bearer(creds) });
    const accounts = (res.siteEntry ?? []).filter((s) => s.permissionLevel !== "siteUnverifiedUser").map((s) => ({ id: s.siteUrl, label: s.siteUrl.replace(/^sc-domain:/, ""), detail: s.permissionLevel }));
    if (!accounts.length) throw new ProviderError("Search Console", 404, "This Google account has no verified Search Console property.", false);
    const email = await googleEmail(creds);
    return { accountId: accounts[0].id, accountLabel: `${accounts[0].label}${email ? ` · ${email}` : ""}`, accounts };
  },

  async sync(ctx) {
    if (!ctx.accountId) throw new ProviderError("Search Console", 400, "Pick a property first.", false);
    const url = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(ctx.accountId)}/searchAnalytics/query`;
    // Search Console data lags ~2 days.
    const window = { startDate: dayString(30), endDate: dayString(2) };
    const [queries, totals] = await Promise.all([
      request<SearchRows>("Search Console", url, { headers: bearer(ctx.credentials), body: { ...window, dimensions: ["query"], rowLimit: 250 } }),
      request<SearchRows>("Search Console", url, { headers: bearer(ctx.credentials), body: { ...window } }),
    ]);
    const rows = (queries.rows ?? []).map((r) => ({ query: r.keys[0], clicks: r.clicks, impressions: r.impressions, ctr: Math.round(r.ctr * 1000) / 10, position: Math.round(r.position * 10) / 10 }));
    // "Almost ranking": page two with real demand, the best candidates for a dedicated page.
    const opportunities = rows.filter((r) => r.position > 8 && r.position <= 20 && r.impressions >= 20).sort((a, b) => b.impressions - a.impressions).slice(0, 15);
    const t = totals.rows?.[0];
    return {
      summary: `${(t?.clicks ?? 0).toLocaleString("en-US")} clicks · ${(t?.impressions ?? 0).toLocaleString("en-US")} impressions · ${opportunities.length} queries ranking 9–20`,
      data: { clicks30d: t?.clicks ?? 0, impressions30d: t?.impressions ?? 0, averagePosition: t ? Math.round(t.position * 10) / 10 : null, topQueries: rows.slice(0, 25), opportunities },
    };
  },

  async read(_c, _i, ctx) {
    return (await searchConsoleProvider.sync(ctx)).data;
  },
};

/* ─────────────────────────── Google Ads ─────────────────────────── */

const adsBase = () => `https://googleads.googleapis.com/${env.GOOGLE_ADS_API_VERSION}`;
const adsHeaders = (creds: Credentials, loginCustomerId?: string) => ({
  ...bearer(creds),
  "developer-token": env.GOOGLE_ADS_DEVELOPER_TOKEN ?? "",
  ...(loginCustomerId ? { "login-customer-id": loginCustomerId } : {}),
});

type AdsSearch<T> = { results?: T[] };

async function adsSearch<T>(creds: Credentials, customerId: string, query: string) {
  const res = await request<AdsSearch<T>[]>("Google Ads", `${adsBase()}/customers/${customerId}/googleAds:searchStream`, { headers: adsHeaders(creds), body: { query } });
  return res.flatMap((chunk) => chunk.results ?? []);
}

type CampaignRow = { campaign: { id: string; name: string; status: string; campaignBudget: string; advertisingChannelType: string }; metrics: { clicks?: string; impressions?: string; costMicros?: string; conversions?: number }; campaignBudget?: { amountMicros?: string } };

export const googleAdsProvider: LiveProvider = {
  provider: "google_ads",
  auth: googleAuth(["https://www.googleapis.com/auth/adwords"], () => (env.GOOGLE_ADS_DEVELOPER_TOKEN ? [] : ["GOOGLE_ADS_DEVELOPER_TOKEN"])),
  liveCapabilities: ["READ_AD_INSIGHTS", "PAUSE_CAMPAIGN", "UPDATE_AD_BUDGET"],

  async verify(creds) {
    const res = await request<{ resourceNames?: string[] }>("Google Ads", `${adsBase()}/customers:listAccessibleCustomers`, { headers: adsHeaders(creds) });
    const ids = (res.resourceNames ?? []).map((r) => r.split("/")[1]).slice(0, 20);
    if (!ids.length) throw new ProviderError("Google Ads", 404, "This Google account has no Google Ads account.", false);
    const accounts = await Promise.all(
      ids.map(async (id) => {
        try {
          const [row] = await adsSearch<{ customer: { descriptiveName?: string; currencyCode: string; manager: boolean } }>(creds, id, "SELECT customer.descriptive_name, customer.currency_code, customer.manager FROM customer LIMIT 1");
          return { id, label: row?.customer.descriptiveName || `Account ${id}`, detail: `${row?.customer.currencyCode ?? ""}${row?.customer.manager ? " · manager" : ""}`, manager: row?.customer.manager ?? false };
        } catch {
          return { id, label: `Account ${id}`, detail: "limited access", manager: false };
        }
      }),
    );
    const usable = accounts.filter((a) => !a.manager);
    const first = usable[0] ?? accounts[0];
    return { accountId: first.id, accountLabel: `${first.label} (${first.id.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3")})`, accounts: accounts.map((a) => ({ id: a.id, label: a.label, detail: a.detail })) };
  },

  async sync(ctx) {
    if (!ctx.accountId) throw new ProviderError("Google Ads", 400, "Pick an ad account first.", false);
    const rows = await adsSearch<CampaignRow>(
      ctx.credentials,
      ctx.accountId,
      "SELECT campaign.id, campaign.name, campaign.status, campaign.advertising_channel_type, campaign_budget.amount_micros, metrics.clicks, metrics.impressions, metrics.cost_micros, metrics.conversions FROM campaign WHERE segments.date DURING LAST_30_DAYS AND campaign.status != 'REMOVED'",
    );
    const campaigns = rows.map((r) => ({
      externalId: r.campaign.id,
      name: r.campaign.name,
      status: r.campaign.status,
      type: r.campaign.advertisingChannelType,
      dailyBudget: Number(r.campaignBudget?.amountMicros ?? 0) / 1e6,
      clicks: Number(r.metrics.clicks ?? 0),
      impressions: Number(r.metrics.impressions ?? 0),
      spend: Math.round(Number(r.metrics.costMicros ?? 0) / 1e4) / 100,
      conversions: r.metrics.conversions ?? 0,
    }));
    const spend = campaigns.reduce((s, c) => s + c.spend, 0);
    return {
      summary: `${campaigns.filter((c) => c.status === "ENABLED").length} active campaigns · ${Math.round(spend).toLocaleString("en-US")} spent · ${Math.round(campaigns.reduce((s, c) => s + c.conversions, 0))} conversions in 30 days`,
      data: { campaigns, spend30d: Math.round(spend * 100) / 100 },
    };
  },

  async read(_c, _i, ctx) {
    return (await googleAdsProvider.sync(ctx)).data;
  },

  async execute(capability, input, ctx) {
    const customerId = ctx.accountId ?? "";
    const campaignId = String(input.externalId ?? "");
    if (!campaignId) throw new ProviderError("Google Ads", 400, "This campaign isn't linked to Google Ads yet.", false);
    if (capability === "PAUSE_CAMPAIGN") {
      await request("Google Ads", `${adsBase()}/customers/${customerId}/campaigns:mutate`, {
        headers: adsHeaders(ctx.credentials),
        body: { operations: [{ update: { resourceName: `customers/${customerId}/campaigns/${campaignId}`, status: "PAUSED" }, updateMask: "status" }] },
      });
      return { externalId: campaignId, data: { status: "PAUSED" } };
    }
    if (capability === "UPDATE_AD_BUDGET") {
      const [row] = await adsSearch<CampaignRow>(ctx.credentials, customerId, `SELECT campaign.campaign_budget FROM campaign WHERE campaign.id = ${Number(campaignId)}`);
      if (!row) throw new ProviderError("Google Ads", 404, "Campaign not found in Google Ads.", false);
      const amountMicros = Math.round(Number(input.dailyBudget) * 1e6);
      await request("Google Ads", `${adsBase()}/customers/${customerId}/campaignBudgets:mutate`, {
        headers: adsHeaders(ctx.credentials),
        body: { operations: [{ update: { resourceName: row.campaign.campaignBudget, amountMicros: String(amountMicros) }, updateMask: "amount_micros" }] },
      });
      return { externalId: campaignId, data: { dailyBudget: Number(input.dailyBudget) } };
    }
    throw new ProviderError("Google Ads", 400, "Creating campaigns from Kaya isn't available for Google Ads yet. Create it in Google Ads; Kaya imports and manages it.", false);
  },
};
