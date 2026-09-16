import { createHmac } from "node:crypto";
import { env } from "@/server/env";
import { basicAuth, ProviderError, request } from "./http";
import type { Credentials, LiveProvider } from "./types";

/* ───────────────────────────── Meta Ads ───────────────────────────── */

const graph = () => `https://graph.facebook.com/${env.META_GRAPH_VERSION}`;
const META_SCOPES = ["ads_read", "ads_management", "business_management"];

/** appsecret_proof binds every call to Kaya's app, so a leaked token alone is useless elsewhere. */
const metaQuery = (creds: Credentials, extra: Record<string, string | number | undefined> = {}) => ({
  access_token: creds.accessToken,
  appsecret_proof: createHmac("sha256", env.META_APP_SECRET ?? "").update(creds.accessToken ?? "").digest("hex"),
  ...extra,
});

type MetaToken = { access_token: string; expires_in?: number };

async function longLived(token: string): Promise<Credentials> {
  const t = await request<MetaToken>("Meta", `${graph()}/oauth/access_token`, {
    query: { grant_type: "fb_exchange_token", client_id: env.META_APP_ID, client_secret: env.META_APP_SECRET, fb_exchange_token: token },
  });
  return { accessToken: t.access_token, expiresAt: Date.now() + (t.expires_in ?? 60 * 86_400) * 1000 };
}

export const metaAdsProvider: LiveProvider = {
  provider: "meta_ads",
  auth: {
    type: "oauth",
    scopes: META_SCOPES,
    setupUrl: "https://developers.facebook.com/apps",
    missingConfig: () => [...(env.META_APP_ID ? [] : ["META_APP_ID"]), ...(env.META_APP_SECRET ? [] : ["META_APP_SECRET"])],
    authorizeUrl({ redirectUri, state }) {
      const u = new URL(`https://www.facebook.com/${env.META_GRAPH_VERSION}/dialog/oauth`);
      u.search = new URLSearchParams({ client_id: env.META_APP_ID ?? "", redirect_uri: redirectUri, state, scope: META_SCOPES.join(","), response_type: "code" }).toString();
      return u.toString();
    },
    async exchangeCode({ code, redirectUri }) {
      const short = await request<MetaToken>("Meta", `${graph()}/oauth/access_token`, { query: { client_id: env.META_APP_ID, client_secret: env.META_APP_SECRET, redirect_uri: redirectUri, code } });
      return longLived(short.access_token);
    },
    // Meta has no refresh token; a still-valid long-lived token can be exchanged for a new 60-day one.
    async refresh(creds) {
      if (!creds.accessToken || (creds.expiresAt && creds.expiresAt < Date.now())) return null;
      return longLived(creds.accessToken);
    },
    async revoke(creds) {
      await request("Meta", `${graph()}/me/permissions`, { method: "DELETE", query: metaQuery(creds) }).catch(() => undefined);
    },
  },
  liveCapabilities: ["READ_AD_INSIGHTS", "PAUSE_CAMPAIGN", "UPDATE_AD_BUDGET"],

  async verify(creds) {
    const me = await request<{ id: string; name: string }>("Meta", `${graph()}/me`, { query: metaQuery(creds, { fields: "id,name" }) });
    const res = await request<{ data: { id: string; name: string; currency: string; account_status: number }[] }>("Meta", `${graph()}/me/adaccounts`, { query: metaQuery(creds, { fields: "id,name,currency,account_status", limit: 100 }) });
    if (!res.data.length) throw new ProviderError("Meta", 404, "This Facebook account can't access any ad account.", false);
    const accounts = res.data.map((a) => ({ id: a.id, label: a.name, detail: `${a.currency}${a.account_status === 1 ? "" : " · not active"}` }));
    const first = res.data.find((a) => a.account_status === 1) ?? res.data[0];
    return { accountId: first.id, accountLabel: `${first.name} · ${me.name}`, accounts };
  },

  async sync(ctx) {
    if (!ctx.accountId) throw new ProviderError("Meta", 400, "Pick an ad account first.", false);
    const [campaigns, insights] = await Promise.all([
      request<{ data: { id: string; name: string; status: string; objective: string; daily_budget?: string }[] }>("Meta", `${graph()}/${ctx.accountId}/campaigns`, {
        query: metaQuery(ctx.credentials, { fields: "id,name,status,objective,daily_budget", limit: 100 }),
      }),
      request<{ data: { campaign_id: string; spend: string; impressions: string; clicks: string; actions?: { action_type: string; value: string }[] }[] }>("Meta", `${graph()}/${ctx.accountId}/insights`, {
        query: metaQuery(ctx.credentials, { level: "campaign", date_preset: "last_30d", fields: "campaign_id,spend,impressions,clicks,actions", limit: 200 }),
      }),
    ]);
    const byId = new Map(insights.data.map((i) => [i.campaign_id, i]));
    const rows = campaigns.data.map((c) => {
      const i = byId.get(c.id);
      const conversions = (i?.actions ?? []).filter((a) => /purchase|lead|complete_registration|subscribe/.test(a.action_type)).reduce((s, a) => s + Number(a.value), 0);
      return { externalId: c.id, name: c.name, status: c.status, objective: c.objective, dailyBudget: c.daily_budget ? Number(c.daily_budget) / 100 : null, spend: Number(i?.spend ?? 0), impressions: Number(i?.impressions ?? 0), clicks: Number(i?.clicks ?? 0), conversions };
    });
    const spend = rows.reduce((s, r) => s + r.spend, 0);
    return {
      summary: `${rows.filter((r) => r.status === "ACTIVE").length} active campaigns · ${Math.round(spend).toLocaleString("en-US")} spent · ${rows.reduce((s, r) => s + r.conversions, 0)} conversions in 30 days`,
      data: { campaigns: rows, spend30d: Math.round(spend * 100) / 100 },
    };
  },

  async read(_c, _i, ctx) {
    return (await metaAdsProvider.sync(ctx)).data;
  },

  async execute(capability, input, ctx) {
    const id = String(input.externalId ?? "");
    if (!id) throw new ProviderError("Meta", 400, "This campaign isn't linked to Meta yet.", false);
    if (capability === "PAUSE_CAMPAIGN") {
      await request("Meta", `${graph()}/${id}`, { query: metaQuery(ctx.credentials), body: new URLSearchParams({ status: "PAUSED" }) });
      return { externalId: id, data: { status: "PAUSED" } };
    }
    if (capability === "UPDATE_AD_BUDGET") {
      // Meta budgets are in the account currency's minor unit.
      await request("Meta", `${graph()}/${id}`, { query: metaQuery(ctx.credentials), body: new URLSearchParams({ daily_budget: String(Math.round(Number(input.dailyBudget) * 100)) }) });
      return { externalId: id, data: { dailyBudget: Number(input.dailyBudget) } };
    }
    throw new ProviderError("Meta", 400, "Creating campaigns from Kaya isn't available for Meta yet. Create it in Ads Manager; Kaya imports and manages it.", false);
  },
};

/* ───────────────────────────── X ───────────────────────────── */

const X_API = "https://api.x.com/2";
const X_SCOPES = ["tweet.read", "tweet.write", "users.read", "offline.access"];
type XToken = { access_token: string; refresh_token?: string; expires_in: number; scope: string };
const xCreds = (t: XToken, prev?: Credentials): Credentials => ({ accessToken: t.access_token, refreshToken: t.refresh_token ?? prev?.refreshToken, expiresAt: Date.now() + (t.expires_in - 60) * 1000, scope: t.scope });
const xClientAuth = () => ({ Authorization: basicAuth(env.X_CLIENT_ID ?? "", env.X_CLIENT_SECRET ?? "") });

export const xProvider: LiveProvider = {
  provider: "x",
  auth: {
    type: "oauth",
    scopes: X_SCOPES,
    pkce: true,
    setupUrl: "https://developer.x.com/en/portal/dashboard",
    missingConfig: () => [...(env.X_CLIENT_ID ? [] : ["X_CLIENT_ID"]), ...(env.X_CLIENT_SECRET ? [] : ["X_CLIENT_SECRET"])],
    authorizeUrl({ redirectUri, state, codeChallenge }) {
      const u = new URL("https://x.com/i/oauth2/authorize");
      u.search = new URLSearchParams({ response_type: "code", client_id: env.X_CLIENT_ID ?? "", redirect_uri: redirectUri, scope: X_SCOPES.join(" "), state, code_challenge: codeChallenge ?? "", code_challenge_method: "S256" }).toString();
      return u.toString();
    },
    async exchangeCode({ code, redirectUri, codeVerifier }) {
      const t = await request<XToken>("X", `${X_API}/oauth2/token`, { headers: xClientAuth(), body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: redirectUri, code_verifier: codeVerifier ?? "", client_id: env.X_CLIENT_ID ?? "" }) });
      return xCreds(t);
    },
    async refresh(creds) {
      if (!creds.refreshToken) return null;
      const t = await request<XToken>("X", `${X_API}/oauth2/token`, { headers: xClientAuth(), body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: creds.refreshToken, client_id: env.X_CLIENT_ID ?? "" }) });
      return xCreds(t, creds);
    },
    async revoke(creds) {
      if (creds.accessToken) await request("X", `${X_API}/oauth2/revoke`, { headers: xClientAuth(), body: new URLSearchParams({ token: creds.accessToken, token_type_hint: "access_token" }) }).catch(() => undefined);
    },
  },
  liveCapabilities: ["READ_SOCIAL_ANALYTICS", "PUBLISH_SOCIAL_POST"],

  async verify(creds) {
    const me = await request<{ data: { id: string; username: string; name: string } }>("X", `${X_API}/users/me`, { headers: { Authorization: `Bearer ${creds.accessToken}` } });
    return { accountId: me.data.id, accountLabel: `@${me.data.username}` };
  },

  async sync(ctx) {
    const headers = { Authorization: `Bearer ${ctx.credentials.accessToken}` };
    const [me, posts] = await Promise.all([
      request<{ data: { public_metrics: { followers_count: number; tweet_count: number } } }>("X", `${X_API}/users/me`, { headers, query: { "user.fields": "public_metrics" } }),
      request<{ data?: { id: string; text: string; created_at: string; public_metrics: { like_count: number; retweet_count: number; reply_count: number; impression_count?: number } }[] }>("X", `${X_API}/users/${ctx.accountId}/tweets`, {
        headers,
        query: { max_results: 20, exclude: "retweets,replies", "tweet.fields": "created_at,public_metrics" },
      }),
    ]);
    const recent = (posts.data ?? []).map((p) => ({ id: p.id, text: p.text.slice(0, 140), createdAt: p.created_at, ...p.public_metrics }));
    const best = [...recent].sort((a, b) => b.like_count + b.retweet_count * 2 - (a.like_count + a.retweet_count * 2))[0];
    return {
      summary: `${me.data.public_metrics.followers_count.toLocaleString("en-US")} followers · ${recent.length} recent posts${best ? ` · best: ${best.like_count} likes` : ""}`,
      data: { followers: me.data.public_metrics.followers_count, recentPosts: recent },
    };
  },

  async read(_c, _i, ctx) {
    return (await xProvider.sync(ctx)).data;
  },

  async execute(capability, input, ctx) {
    if (capability !== "PUBLISH_SOCIAL_POST") throw new ProviderError("X", 400, `X can't ${capability}.`, false);
    const text = String(input.text ?? "").trim();
    if (!text) throw new ProviderError("X", 400, "X: the post is empty.", false);
    const res = await request<{ data: { id: string } }>("X", `${X_API}/tweets`, { headers: { Authorization: `Bearer ${ctx.credentials.accessToken}` }, body: { text } });
    return { externalId: res.data.id, data: { id: res.data.id, url: `https://x.com/i/web/status/${res.data.id}` } };
  },
};

/* ───────────────────────────── LinkedIn ───────────────────────────── */

const LINKEDIN_SCOPES = ["openid", "profile", "email", "w_member_social"];
type LinkedInToken = { access_token: string; expires_in: number; refresh_token?: string; refresh_token_expires_in?: number; scope?: string };

export const linkedinProvider: LiveProvider = {
  provider: "linkedin_organic",
  auth: {
    type: "oauth",
    scopes: LINKEDIN_SCOPES,
    setupUrl: "https://www.linkedin.com/developers/apps",
    missingConfig: () => [...(env.LINKEDIN_CLIENT_ID ? [] : ["LINKEDIN_CLIENT_ID"]), ...(env.LINKEDIN_CLIENT_SECRET ? [] : ["LINKEDIN_CLIENT_SECRET"])],
    authorizeUrl({ redirectUri, state }) {
      const u = new URL("https://www.linkedin.com/oauth/v2/authorization");
      u.search = new URLSearchParams({ response_type: "code", client_id: env.LINKEDIN_CLIENT_ID ?? "", redirect_uri: redirectUri, state, scope: LINKEDIN_SCOPES.join(" ") }).toString();
      return u.toString();
    },
    async exchangeCode({ code, redirectUri }) {
      const t = await request<LinkedInToken>("LinkedIn", "https://www.linkedin.com/oauth/v2/accessToken", {
        body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: redirectUri, client_id: env.LINKEDIN_CLIENT_ID ?? "", client_secret: env.LINKEDIN_CLIENT_SECRET ?? "" }),
      });
      return { accessToken: t.access_token, refreshToken: t.refresh_token, expiresAt: Date.now() + (t.expires_in - 60) * 1000, scope: t.scope };
    },
    // Refresh tokens are only issued to approved LinkedIn partners; otherwise the founder reconnects every 60 days.
    async refresh(creds) {
      if (!creds.refreshToken) return null;
      const t = await request<LinkedInToken>("LinkedIn", "https://www.linkedin.com/oauth/v2/accessToken", {
        body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: creds.refreshToken, client_id: env.LINKEDIN_CLIENT_ID ?? "", client_secret: env.LINKEDIN_CLIENT_SECRET ?? "" }),
      });
      return { accessToken: t.access_token, refreshToken: t.refresh_token ?? creds.refreshToken, expiresAt: Date.now() + (t.expires_in - 60) * 1000, scope: t.scope ?? creds.scope };
    },
  },
  liveCapabilities: ["PUBLISH_SOCIAL_POST"],

  async verify(creds) {
    const me = await request<{ sub: string; name: string; email?: string }>("LinkedIn", "https://api.linkedin.com/v2/userinfo", { headers: { Authorization: `Bearer ${creds.accessToken}` } });
    return { accountId: me.sub, accountLabel: `${me.name}${me.email ? ` · ${me.email}` : ""}` };
  },

  async sync(ctx) {
    const me = await request<{ sub: string; name: string }>("LinkedIn", "https://api.linkedin.com/v2/userinfo", { headers: { Authorization: `Bearer ${ctx.credentials.accessToken}` } });
    const days = ctx.credentials.expiresAt ? Math.max(0, Math.floor((ctx.credentials.expiresAt - Date.now()) / 86_400_000)) : null;
    return {
      summary: `Publishing as ${me.name}${days !== null ? ` · access valid ${days} more days` : ""}`,
      data: { member: me.name, accessDaysLeft: days, note: "LinkedIn only shares member post analytics with approved partners; Kaya publishes approved posts." },
    };
  },

  async execute(capability, input, ctx) {
    if (capability !== "PUBLISH_SOCIAL_POST") throw new ProviderError("LinkedIn", 400, `LinkedIn can't ${capability}.`, false);
    const text = String(input.text ?? "").trim();
    if (!text) throw new ProviderError("LinkedIn", 400, "LinkedIn: the post is empty.", false);
    const res = await fetch("https://api.linkedin.com/rest/posts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ctx.credentials.accessToken}`,
        "Content-Type": "application/json",
        "LinkedIn-Version": env.LINKEDIN_API_VERSION,
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify({ author: `urn:li:person:${ctx.accountId}`, commentary: text, visibility: "PUBLIC", distribution: { feedDistribution: "MAIN_FEED", targetEntities: [], thirdPartyDistributionChannels: [] }, lifecycleState: "PUBLISHED", isReshareDisabledByAuthor: false }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new ProviderError("LinkedIn", res.status, `LinkedIn: couldn't publish (${res.status}) ${detail.slice(0, 200)}`, res.status === 401 || res.status === 403);
    }
    const urn = res.headers.get("x-restli-id") ?? "";
    return { externalId: urn, data: { urn, url: urn ? `https://www.linkedin.com/feed/update/${urn}/` : null } };
  },
};
