import { ProviderError, request } from "./http";
import type { Credentials, LiveProvider } from "./types";

/* ───────────────────────────── PostHog ───────────────────────────── */

const posthogHost = (creds: Credentials) => (creds.params?.host || "https://us.posthog.com").replace(/\/$/, "");
const phHeaders = (creds: Credentials) => ({ Authorization: `Bearer ${creds.apiKey ?? ""}` });

async function hogql(creds: Credentials, projectId: string, query: string) {
  const res = await request<{ results: unknown[][]; columns: string[] }>("PostHog", `${posthogHost(creds)}/api/projects/${encodeURIComponent(projectId)}/query/`, {
    headers: phHeaders(creds),
    body: { query: { kind: "HogQLQuery", query } },
    timeoutMs: 45_000,
  });
  return res.results;
}

export const posthogProvider: LiveProvider = {
  provider: "posthog",
  auth: {
    type: "api_key",
    fields: [
      { name: "apiKey", label: "Personal API key", placeholder: "phx_…", secret: true },
      {
        name: "host",
        label: "Region",
        options: [
          { value: "https://us.posthog.com", label: "US Cloud (us.posthog.com)" },
          { value: "https://eu.posthog.com", label: "EU Cloud (eu.posthog.com)" },
        ],
      },
    ],
    instructions: [
      "In PostHog, open Settings → Personal API keys → Create personal API key.",
      "Give it read access to Project and Query (scopes project:read and query:read).",
      "Pick the region your PostHog project runs in.",
    ],
    docsUrl: "https://posthog.com/docs/api#private-endpoint-authentication",
  },
  liveCapabilities: ["READ_ANALYTICS", "READ_PRODUCT_EVENTS"],

  async verify(creds) {
    if (!creds.apiKey?.startsWith("phx_")) throw new ProviderError("PostHog", 400, "Personal API keys start with phx_. Project keys (phc_) can't read data.", true);
    const projects = await request<{ results: { id: number; name: string; organization?: string }[] }>("PostHog", `${posthogHost(creds)}/api/projects/`, { headers: phHeaders(creds) });
    if (!projects.results.length) throw new ProviderError("PostHog", 404, "This key can't see any PostHog project.", false);
    const accounts = projects.results.map((p) => ({ id: String(p.id), label: p.name }));
    return { accountId: accounts[0].id, accountLabel: accounts[0].label, accounts };
  },

  async sync(ctx) {
    const projectId = ctx.accountId ?? "";
    const [[totals], topEvents] = await Promise.all([
      hogql(ctx.credentials, projectId, "SELECT count() AS events, count(DISTINCT person_id) AS people FROM events WHERE timestamp > now() - INTERVAL 30 DAY"),
      hogql(ctx.credentials, projectId, "SELECT event, count() AS c FROM events WHERE timestamp > now() - INTERVAL 30 DAY GROUP BY event ORDER BY c DESC LIMIT 12"),
    ]);
    const [events, people] = (totals ?? [0, 0]) as number[];
    return {
      summary: `${Number(people).toLocaleString("en-US")} people and ${Number(events).toLocaleString("en-US")} events in 30 days`,
      data: { people30d: people, events30d: events, topEvents: topEvents.map(([event, count]) => ({ event, count })) },
    };
  },

  async read(capability, input, ctx) {
    if (capability === "READ_PRODUCT_EVENTS" && typeof input.event === "string") {
      const rows = await hogql(ctx.credentials, ctx.accountId ?? "", `SELECT toDate(timestamp) AS day, count() FROM events WHERE event = '${input.event.replace(/'/g, "''")}' AND timestamp > now() - INTERVAL 30 DAY GROUP BY day ORDER BY day`);
      return { event: input.event, daily: rows.map(([day, count]) => ({ day, count })) };
    }
    return (await posthogProvider.sync(ctx)).data;
  },
};

/* ───────────────────────────── Plausible ───────────────────────────── */

const plausibleHost = (creds: Credentials) => (creds.params?.host || "https://plausible.io").replace(/\/$/, "");

async function plausibleQuery(creds: Credentials, body: Record<string, unknown>) {
  return request<{ results: { metrics: number[]; dimensions: string[] }[] }>("Plausible", `${plausibleHost(creds)}/api/v2/query`, {
    headers: { Authorization: `Bearer ${creds.apiKey ?? ""}` },
    body: { site_id: creds.params?.siteId, ...body },
  });
}

export const plausibleProvider: LiveProvider = {
  provider: "plausible",
  auth: {
    type: "api_key",
    fields: [
      { name: "apiKey", label: "Stats API key", placeholder: "Your Plausible API key", secret: true },
      { name: "siteId", label: "Site domain", placeholder: "example.com" },
      { name: "host", label: "Self-hosted URL", placeholder: "https://plausible.io", optional: true },
    ],
    instructions: ["In Plausible, open Account settings → API keys → New API key (Stats API).", "Enter the site domain exactly as it appears in your Plausible dashboard."],
    docsUrl: "https://plausible.io/docs/stats-api",
  },
  liveCapabilities: ["READ_ANALYTICS"],

  async verify(creds) {
    const site = creds.params?.siteId?.trim();
    if (!site) throw new ProviderError("Plausible", 400, "Enter the site domain.", true);
    await plausibleQuery(creds, { metrics: ["visitors"], date_range: "7d" });
    return { accountId: site, accountLabel: site };
  },

  async sync(ctx) {
    const [agg, sources] = await Promise.all([
      plausibleQuery(ctx.credentials, { metrics: ["visitors", "visits", "pageviews", "bounce_rate", "visit_duration"], date_range: "30d" }),
      plausibleQuery(ctx.credentials, { metrics: ["visitors"], date_range: "30d", dimensions: ["visit:source"], pagination: { limit: 10 } }),
    ]);
    const [visitors, visits, pageviews, bounceRate, visitDuration] = agg.results[0]?.metrics ?? [0, 0, 0, 0, 0];
    return {
      summary: `${visitors.toLocaleString("en-US")} visitors · ${bounceRate}% bounce · top source ${sources.results[0]?.dimensions[0] ?? "—"}`,
      data: { visitors30d: visitors, visits30d: visits, pageviews30d: pageviews, bounceRate, visitDurationSeconds: visitDuration, topSources: sources.results.map((r) => ({ source: r.dimensions[0], visitors: r.metrics[0] })) },
    };
  },

  async read(_c, _i, ctx) {
    return (await plausibleProvider.sync(ctx)).data;
  },
};
