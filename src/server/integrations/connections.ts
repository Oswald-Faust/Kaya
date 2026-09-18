import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import type { WorkspaceContext } from "@/server/context";
import { db } from "@/server/db/client";
import * as t from "@/server/db/schema";
import { DomainError } from "@/server/domain/errors";
import { env } from "@/server/env";
import { recordAudit } from "@/server/services/audit";
import { recordSyncMetrics } from "@/server/services/live-metrics";
import { newId } from "@/lib/ids";
import { getIntegration } from "./catalog";
import { signToken, verifyToken } from "./crypto";
import { getLiveProvider } from "./providers";
import { ProviderError } from "./providers/http";
import type { ConnectionIdentity, Credentials, LiveProvider, ProviderCallContext } from "./providers/types";
import { destroyCredentials, readCredentials, storeCredentials, vaultKey } from "./vault";

/**
 * Live connections: verify credentials against the vendor, store them encrypted,
 * keep OAuth tokens fresh, sync real data and disconnect cleanly. Every change
 * is recorded in the workspace audit log.
 */

export const OAUTH_STATE_COOKIE = "kaya_oauth_state";
const STATE_TTL_MS = 10 * 60 * 1000;

type IntegrationRow = typeof t.integrations.$inferSelect;

function assertManager(ctx: WorkspaceContext) {
  if (ctx.role !== "owner" && ctx.role !== "admin") throw new DomainError("forbidden", "Only owners and admins can manage integrations.");
  if (ctx.isDemo) throw new DomainError("validation", "The demo workspace only uses demo connections.");
}

function requireProvider(provider: string): LiveProvider {
  const live = getLiveProvider(provider);
  if (!live) throw new DomainError("validation", "This integration has no live connection yet.");
  return live;
}

export async function appOrigin(): Promise<string> {
  if (env.APP_URL) return env.APP_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export const oauthRedirectUri = (origin: string) => `${origin}/api/integrations/callback`;

function toDomainError(error: unknown): never {
  if (error instanceof ProviderError) throw new DomainError(error.authFailure ? "validation" : "upstream", error.message);
  throw error;
}

async function saveConnection(ctx: { workspaceId: string; userId: string }, live: LiveProvider, creds: Credentials, identity: ConnectionIdentity) {
  const def = getIntegration(live.provider)!;
  const existing = await db.query.integrations.findFirst({ where: and(eq(t.integrations.workspaceId, ctx.workspaceId), eq(t.integrations.provider, live.provider)) });
  const credentialRefId = await storeCredentials(ctx.workspaceId, live.provider, live.auth.type, creds, existing?.mode === "live" ? existing.credentialRefId : null);

  const values = {
    status: "connected" as const,
    mode: "live" as const,
    grantedCapabilities: live.liveCapabilities.filter((c) => (def.reads as string[]).includes(c) || (def.writes as string[]).includes(c)),
    health: "ok",
    syncError: null,
    credentialRefId,
    connectedAt: new Date(),
    accountId: identity.accountId,
    accountLabel: identity.accountLabel,
    metadata: { accounts: identity.accounts, scopes: creds.scope?.split(/[ ,]+/).filter(Boolean), connectedBy: ctx.userId },
  };
  const [row] = await db
    .insert(t.integrations)
    .values({ id: newId("int"), workspaceId: ctx.workspaceId, provider: live.provider, ...values })
    .onConflictDoUpdate({ target: [t.integrations.workspaceId, t.integrations.provider], set: values })
    .returning();

  await recordAudit(db, {
    workspaceId: ctx.workspaceId,
    actorType: "user",
    actorId: ctx.userId,
    action: "integration.connected",
    targetType: "integration",
    targetId: live.provider,
    payload: { mode: "live", account: identity.accountLabel, capabilities: values.grantedCapabilities },
  });
  return row;
}

/* ───────────── API keys ───────────── */

export async function connectWithApiKey(ctx: WorkspaceContext, provider: string, input: Record<string, string>) {
  assertManager(ctx);
  const live = requireProvider(provider);
  if (live.auth.type !== "api_key") throw new DomainError("validation", "This integration connects with OAuth.");

  const creds: Credentials = { params: {} };
  for (const field of live.auth.fields) {
    const value = (input[field.name] ?? "").trim();
    if (!value && !field.optional && !field.options) throw new DomainError("validation", `${field.label} is required.`);
    if (value.length > 4000) throw new DomainError("validation", `${field.label} is too long.`);
    if (field.name === "apiKey") creds.apiKey = value;
    else if (value) creds.params![field.name] = value;
    else if (field.options) creds.params![field.name] = field.options[0].value;
  }

  let identity: ConnectionIdentity;
  try {
    identity = await live.verify(creds);
  } catch (error) {
    toDomainError(error);
  }
  const row = await saveConnection(ctx, live, creds, identity);
  await syncConnection(row).catch(() => undefined);
  return identity;
}

/* ───────────── OAuth ───────────── */

interface OAuthState {
  provider: string;
  workspaceId: string;
  userId: string;
  nonce: string;
  verifier?: string;
  returnTo: string;
  exp: number;
}

export async function beginOAuth(ctx: WorkspaceContext, provider: string, returnTo: string): Promise<{ url: string; cookie: string }> {
  assertManager(ctx);
  const live = requireProvider(provider);
  if (live.auth.type !== "oauth") throw new DomainError("validation", "This integration connects with an API key.");
  const missing = live.auth.missingConfig();
  if (missing.length) throw new DomainError("upstream", `${getIntegration(provider)?.name} isn't set up on this server yet (missing ${missing.join(", ")}).`);

  const nonce = randomBytes(24).toString("base64url");
  const verifier = live.auth.pkce ? randomBytes(48).toString("base64url") : undefined;
  const state: OAuthState = { provider, workspaceId: ctx.workspaceId, userId: ctx.userId, nonce, verifier, returnTo, exp: Date.now() + STATE_TTL_MS };
  const origin = await appOrigin();
  const url = live.auth.authorizeUrl({
    redirectUri: oauthRedirectUri(origin),
    state: nonce,
    codeChallenge: verifier ? createHash("sha256").update(verifier).digest("base64url") : undefined,
  });
  return { url, cookie: signToken(state as unknown as Record<string, unknown>, vaultKey()) };
}

/** Where to send the founder back to, even when the connection failed. */
export function peekReturnTo(cookie: string | undefined): string | null {
  if (!cookie || !vaultEnabledSafe()) return null;
  const state = verifyToken<OAuthState>(cookie, vaultKey());
  return state && state.exp > Date.now() ? state.returnTo : null;
}

const vaultEnabledSafe = () => Boolean(env.INTEGRATIONS_ENCRYPTION_KEY);

/** Validates the callback against the signed state cookie, exchanges the code, verifies and stores the connection. */
export async function completeOAuth(input: { code: string; state: string; cookie: string | undefined; currentUserId: string | null }): Promise<{ returnTo: string; provider: string }> {
  const state = input.cookie ? verifyToken<OAuthState>(input.cookie, vaultKey()) : null;
  if (!state || state.exp < Date.now() || state.nonce !== input.state) throw new DomainError("validation", "This connection link expired. Start again from Integrations.");
  if (!input.currentUserId || input.currentUserId !== state.userId) throw new DomainError("forbidden", "Sign in with the account that started this connection.");

  const workspace = await db.query.workspaces.findFirst({ where: eq(t.workspaces.id, state.workspaceId) });
  const member = workspace && (await db.query.members.findFirst({ where: and(eq(t.members.organizationId, workspace.organizationId), eq(t.members.userId, state.userId)) }));
  if (!workspace || !member || (member.role !== "owner" && member.role !== "admin")) throw new DomainError("forbidden", "You no longer manage this workspace.");

  const live = requireProvider(state.provider);
  if (live.auth.type !== "oauth") throw new DomainError("validation", "Unexpected OAuth callback.");
  const origin = await appOrigin();

  try {
    const creds = await live.auth.exchangeCode({ code: input.code, redirectUri: oauthRedirectUri(origin), codeVerifier: state.verifier });
    const identity = await live.verify(creds);
    const row = await saveConnection({ workspaceId: workspace.id, userId: state.userId }, live, creds, identity);
    await syncConnection(row).catch(() => undefined);
  } catch (error) {
    toDomainError(error);
  }
  return { returnTo: state.returnTo, provider: state.provider };
}

/* ───────────── Using a connection ───────────── */

/** Decrypts credentials, refreshing OAuth tokens that expire within two minutes. */
export async function callContext(row: IntegrationRow): Promise<ProviderCallContext> {
  if (row.mode !== "live" || !row.credentialRefId) throw new DomainError("validation", "This integration isn't connected live.");
  const live = requireProvider(row.provider);
  let creds = await readCredentials(row.workspaceId, row.credentialRefId);

  if (live.auth.type === "oauth" && creds.expiresAt && creds.expiresAt < Date.now() + 120_000) {
    const refreshed = live.auth.refresh ? await live.auth.refresh(creds).catch((e) => (e instanceof ProviderError && e.authFailure ? null : Promise.reject(e))) : null;
    if (!refreshed) {
      await markFailing(row, `${getIntegration(row.provider)?.name} access expired. Reconnect to continue.`);
      throw new DomainError("validation", `${getIntegration(row.provider)?.name} access expired. Reconnect it in Integrations.`);
    }
    creds = refreshed;
    await storeCredentials(row.workspaceId, row.provider, "oauth", creds, row.credentialRefId);
  }
  return { credentials: creds, accountId: row.accountId };
}

async function markFailing(row: IntegrationRow, message: string) {
  await db.update(t.integrations).set({ status: "error", health: "failing", syncError: message }).where(eq(t.integrations.id, row.id));
}

/** Runs a vendor call for a connection, recording auth failures on the integration so the UI asks to reconnect. */
export async function withConnection<T>(row: IntegrationRow, fn: (live: LiveProvider, ctx: ProviderCallContext) => Promise<T>): Promise<T> {
  const live = requireProvider(row.provider);
  const ctx = await callContext(row);
  try {
    return await fn(live, ctx);
  } catch (error) {
    if (error instanceof ProviderError) {
      if (error.authFailure) await markFailing(row, error.message);
      else await db.update(t.integrations).set({ health: "degraded", syncError: error.message }).where(eq(t.integrations.id, row.id));
      throw new DomainError(error.authFailure ? "validation" : "upstream", error.message);
    }
    throw error;
  }
}

export async function syncConnection(row: IntegrationRow) {
  const result = await withConnection(row, (live, ctx) => live.sync(ctx));
  const now = new Date();
  await db
    .update(t.integrations)
    .set({ status: "connected", health: "ok", syncError: null, lastSyncedAt: now, metadata: { ...row.metadata, lastSync: { at: now.toISOString(), summary: result.summary, data: result.data } } })
    .where(eq(t.integrations.id, row.id));
  // What was synced becomes business metrics, so the Command Center reflects it.
  await recordSyncMetrics(row.workspaceId, row.provider, result.data, now).catch((error) =>
    console.error(JSON.stringify({ level: "warn", msg: "sync_metrics_failed", provider: row.provider, error: String(error) })),
  );
  return result;
}

async function liveRow(ctx: WorkspaceContext, provider: string) {
  const row = await db.query.integrations.findFirst({ where: and(eq(t.integrations.workspaceId, ctx.workspaceId), eq(t.integrations.provider, provider)) });
  if (!row || row.mode !== "live" || !row.credentialRefId) throw new DomainError("not_found", "This integration isn't connected.");
  return row;
}

export async function syncIntegration(ctx: WorkspaceContext, provider: string) {
  const row = await liveRow(ctx, provider);
  const result = await syncConnection(row);
  await recordAudit(db, { workspaceId: ctx.workspaceId, actorType: "user", actorId: ctx.userId, action: "integration.synced", targetType: "integration", targetId: provider, payload: { summary: result.summary } });
  return result;
}

export async function selectAccount(ctx: WorkspaceContext, provider: string, accountId: string) {
  assertManager(ctx);
  const row = await liveRow(ctx, provider);
  const account = row.metadata.accounts?.find((a) => a.id === accountId);
  if (!account) throw new DomainError("validation", "That account isn't available on this connection.");
  const [updated] = await db
    .update(t.integrations)
    .set({ accountId: account.id, accountLabel: account.detail ? `${account.label} · ${account.detail}` : account.label, metadata: { ...row.metadata, lastSync: undefined } })
    .where(eq(t.integrations.id, row.id))
    .returning();
  await recordAudit(db, { workspaceId: ctx.workspaceId, actorType: "user", actorId: ctx.userId, action: "integration.account_selected", targetType: "integration", targetId: provider, payload: { account: account.label } });
  await syncConnection(updated).catch(() => undefined);
}

export async function disconnectIntegration(ctx: WorkspaceContext, provider: string) {
  assertManager(ctx);
  const row = await db.query.integrations.findFirst({ where: and(eq(t.integrations.workspaceId, ctx.workspaceId), eq(t.integrations.provider, provider)) });
  if (!row) return;
  if (row.mode === "live" && row.credentialRefId) {
    const live = getLiveProvider(provider);
    if (live?.auth.type === "oauth" && live.auth.revoke) {
      const creds = await readCredentials(row.workspaceId, row.credentialRefId).catch(() => null);
      if (creds) await live.auth.revoke(creds).catch(() => undefined);
    }
    await destroyCredentials(ctx.workspaceId, row.credentialRefId);
  }
  await db
    .update(t.integrations)
    .set({ status: "disconnected", grantedCapabilities: [], health: "unknown", connectedAt: null, credentialRefId: null, accountId: null, accountLabel: null, syncError: null, metadata: {} })
    .where(eq(t.integrations.id, row.id));
  await recordAudit(db, { workspaceId: ctx.workspaceId, actorType: "user", actorId: ctx.userId, action: "integration.disconnected", targetType: "integration", targetId: provider, payload: { mode: row.mode } });
}
