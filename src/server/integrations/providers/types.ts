import type { Capability } from "../catalog";

/** Decrypted secret material for one connection. Never sent to the client or logged. */
export interface Credentials {
  apiKey?: string;
  accessToken?: string;
  refreshToken?: string;
  /** Epoch milliseconds. */
  expiresAt?: number;
  scope?: string;
  /** Non-secret connection parameters entered with the key (PostHog host, Plausible site…). */
  params?: Record<string, string>;
}

export interface ExternalAccount {
  id: string;
  label: string;
  detail?: string;
}

export interface ConnectionIdentity {
  /** The account the connection acts on by default. */
  accountId: string;
  accountLabel: string;
  /** Other accounts the founder can switch to (properties, ad accounts, sites…). */
  accounts?: ExternalAccount[];
  scopes?: string[];
}

export interface ProviderCallContext {
  credentials: Credentials;
  accountId: string | null;
}

export interface SyncResult {
  summary: string;
  data: Record<string, unknown>;
}

export interface ApiKeyField {
  name: string;
  label: string;
  placeholder?: string;
  secret?: boolean;
  optional?: boolean;
  /** Fixed choices render as a select. */
  options?: { value: string; label: string }[];
}

export interface ApiKeyAuth {
  type: "api_key";
  fields: ApiKeyField[];
  /** Short, concrete steps shown under the form. */
  instructions: string[];
  docsUrl: string;
}

export interface OAuthAuth {
  type: "oauth";
  /** Env vars that must be set for this provider's OAuth app. Empty = ready. */
  missingConfig(): string[];
  scopes: string[];
  pkce?: boolean;
  authorizeUrl(input: { redirectUri: string; state: string; codeChallenge?: string }): string;
  exchangeCode(input: { code: string; redirectUri: string; codeVerifier?: string }): Promise<Credentials>;
  /** Returns fresh credentials, or null when the provider can't refresh (reconnect needed). */
  refresh?(credentials: Credentials): Promise<Credentials | null>;
  revoke?(credentials: Credentials): Promise<void>;
  setupUrl: string;
}

export interface LiveProvider {
  provider: string;
  auth: ApiKeyAuth | OAuthAuth;
  /** Proves the credentials work with a real API call and identifies the account. */
  verify(credentials: Credentials): Promise<ConnectionIdentity>;
  /** Pulls a real snapshot for the selected account (last 30 days). */
  sync(ctx: ProviderCallContext): Promise<SyncResult>;
  /** Capabilities this live adapter actually implements (a subset of the catalog). */
  liveCapabilities: Capability[];
  read?(capability: Capability, input: Record<string, unknown>, ctx: ProviderCallContext): Promise<Record<string, unknown>>;
  execute?(capability: Capability, input: Record<string, unknown>, ctx: ProviderCallContext & { idempotencyKey: string }): Promise<{ externalId?: string; data: Record<string, unknown> }>;
}
