import { sql } from "drizzle-orm";
import { CheckCircle2, CircleDashed, XCircle } from "lucide-react";
import { AdminPage, Card, CardHeader, Dl } from "@/components/admin/ui";
import { requireAdmin } from "@/server/admin/guard";
import { db } from "@/server/db/client";
import { billingEnabled, env, googleAuthEnabled, llmAvailable } from "@/server/env";
import { LIVE_PROVIDERS } from "@/server/integrations/providers";
import { getIntegration } from "@/server/integrations/catalog";

export const metadata = { title: "System" };

type Check = { name: string; state: "ok" | "off" | "error"; detail: string };

async function checkDatabase(): Promise<{ dbCheck: Check; tables: { name: string; rows: number }[] }> {
  const started = performance.now();
  try {
    const [{ version }] = await db.execute<{ version: string }>(sql`select version()`);
    const dbCheck: Check = { name: "Database", state: "ok", detail: `${String(version).split(" on ")[0]} · ${Math.round(performance.now() - started)} ms` };
    const result = await db.execute<{ name: string; rows: string }>(
      sql`select relname as name, n_live_tup::text as rows from pg_stat_user_tables where relname in ('users','sessions','organizations','workspaces','products','agent_runs','experiments','business_facts','audit_logs') order by n_live_tup desc`,
    );
    return { dbCheck, tables: result.map((r) => ({ name: r.name, rows: Number(r.rows) })) };
  } catch (error) {
    return { dbCheck: { name: "Database", state: "error", detail: String(error).slice(0, 120) }, tables: [] };
  }
}

export default async function AdminSystemPage() {
  await requireAdmin();

  const { dbCheck, tables } = await checkDatabase();

  const checks: Check[] = [
    dbCheck,
    { name: "Claude (Anthropic)", state: llmAvailable ? "ok" : "off", detail: llmAvailable ? "Product analysis and pricing research use Claude Opus 5" : "ANTHROPIC_API_KEY not set; analysis is site-text only" },
    { name: "Stripe", state: billingEnabled ? "ok" : "off", detail: billingEnabled ? (env.STRIPE_SECRET_KEY!.startsWith("sk_live_") ? "Live mode" : "Test mode · no real charges") : "STRIPE_SECRET_KEY not set; trials start without a card" },
    { name: "Stripe webhook", state: env.STRIPE_WEBHOOK_SECRET ? "ok" : "off", detail: env.STRIPE_WEBHOOK_SECRET ? "Signing secret configured" : "No signing secret; plans sync on checkout return only" },
    { name: "Integrations vault", state: env.INTEGRATIONS_ENCRYPTION_KEY ? "ok" : "error", detail: env.INTEGRATIONS_ENCRYPTION_KEY ? "API keys and OAuth tokens are encrypted with AES-256-GCM" : "INTEGRATIONS_ENCRYPTION_KEY missing; live connections are disabled" },
    ...Object.values(LIVE_PROVIDERS)
      .filter((p) => p.auth.type === "oauth")
      .map((p): Check => {
        const missing = p.auth.type === "oauth" ? p.auth.missingConfig() : [];
        return { name: `${getIntegration(p.provider)?.name} OAuth app`, state: missing.length ? "off" : "ok", detail: missing.length ? `Missing ${missing.join(", ")} · see docs/integrations-setup.md` : "Configured; founders can connect" };
      }),
    { name: "Google sign-in", state: googleAuthEnabled ? "ok" : "off", detail: googleAuthEnabled ? "OAuth client configured" : "GOOGLE_CLIENT_ID / SECRET not set; button hidden" },
    { name: "Public URL", state: env.APP_URL ? "ok" : "off", detail: env.APP_URL ?? "APP_URL not set; request origin is used" },
    { name: "Demo access", state: env.ALLOW_DEMO_LOGIN === "true" ? "ok" : "off", detail: env.ALLOW_DEMO_LOGIN === "true" ? "/demo opens the demo workspace read-only" : "Disabled" },
  ];

  return (
    <AdminPage title="System" description="Integrations and infrastructure health. Secrets are never displayed.">
      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader title="Services" />
          <ul className="divide-y divide-line">
            {checks.map((c) => (
              <li key={c.name} className="flex items-start gap-3 px-5 py-3.5">
                {c.state === "ok" ? <CheckCircle2 className="mt-0.5 size-4 text-positive" /> : c.state === "error" ? <XCircle className="mt-0.5 size-4 text-negative" /> : <CircleDashed className="mt-0.5 size-4 text-subtle" />}
                <div>
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-muted">{c.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
        <div className="space-y-4">
          <Card>
            <CardHeader title="Table sizes" description="Estimated live rows" />
            <Dl items={tables.map((t) => [t.name, t.rows.toLocaleString("en-US")])} />
          </Card>
          <Card>
            <Dl
              items={[
                ["Environment", env.NODE_ENV],
                ["Region", process.env.VERCEL_REGION ?? "local"],
                ["Deployment", process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local"],
                ["Crawl limit", `${env.CRAWL_MAX_PAGES} pages · ${env.CRAWL_TIMEOUT_MS / 1000}s`],
              ]}
            />
          </Card>
        </div>
      </div>
    </AdminPage>
  );
}
