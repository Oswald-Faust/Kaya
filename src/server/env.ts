import "server-only";
import { z } from "zod";

const EnvSchema = z.object({
  DATABASE_URL: z.string().url().default("postgres://localhost:5432/marketing_os"),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  CRAWL_MAX_PAGES: z.coerce.number().int().min(1).max(25).default(8),
  CRAWL_TIMEOUT_MS: z.coerce.number().int().min(1000).max(30000).default(8000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  /** Public origin used for OAuth redirects, e.g. https://kaya.app. Falls back to the request origin. */
  APP_URL: z.string().url().optional(),
  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
  /** "false" disables /demo, which signs visitors into the demo workspace as read-only viewers. */
  ALLOW_DEMO_LOGIN: z.enum(["true", "false"]).default("true"),
  /** Stripe secret key (sk_test_… or sk_live_…). Without it, trials start without a card. */
  STRIPE_SECRET_KEY: z.string().startsWith("sk_").optional(),
  /** Signing secret of the /api/stripe/webhook endpoint (whsec_…). */
  STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_").optional(),
  /** 32 random bytes, base64. Encrypts integration API keys and OAuth tokens at rest. */
  INTEGRATIONS_ENCRYPTION_KEY: z.string().min(40).optional(),
  /** OAuth apps for integrations. Google reuses the sign-in client unless dedicated values are set. */
  GOOGLE_INTEGRATIONS_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_INTEGRATIONS_CLIENT_SECRET: z.string().min(1).optional(),
  GOOGLE_ADS_DEVELOPER_TOKEN: z.string().min(1).optional(),
  GOOGLE_ADS_API_VERSION: z.string().regex(/^v\d+$/).default("v21"),
  META_APP_ID: z.string().min(1).optional(),
  META_APP_SECRET: z.string().min(1).optional(),
  META_GRAPH_VERSION: z.string().regex(/^v\d+\.\d+$/).default("v23.0"),
  X_CLIENT_ID: z.string().min(1).optional(),
  X_CLIENT_SECRET: z.string().min(1).optional(),
  LINKEDIN_CLIENT_ID: z.string().min(1).optional(),
  LINKEDIN_CLIENT_SECRET: z.string().min(1).optional(),
  LINKEDIN_API_VERSION: z.string().regex(/^\d{6}$/).default("202508"),
  /** Transactional email (team invitations). Without it, invite links are shared by hand. */
  RESEND_API_KEY: z.string().startsWith("re_").optional(),
  EMAIL_FROM: z.string().min(3).default("Kaya <team@kaya.app>"),
});

const parsed = EnvSchema.safeParse({
  ...process.env,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || undefined,
  APP_URL: process.env.APP_URL || undefined,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || undefined,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || undefined,
  ALLOW_DEMO_LOGIN: process.env.ALLOW_DEMO_LOGIN || undefined,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || undefined,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || undefined,
  INTEGRATIONS_ENCRYPTION_KEY: process.env.INTEGRATIONS_ENCRYPTION_KEY || undefined,
  GOOGLE_INTEGRATIONS_CLIENT_ID: process.env.GOOGLE_INTEGRATIONS_CLIENT_ID || undefined,
  GOOGLE_INTEGRATIONS_CLIENT_SECRET: process.env.GOOGLE_INTEGRATIONS_CLIENT_SECRET || undefined,
  GOOGLE_ADS_DEVELOPER_TOKEN: process.env.GOOGLE_ADS_DEVELOPER_TOKEN || undefined,
  GOOGLE_ADS_API_VERSION: process.env.GOOGLE_ADS_API_VERSION || undefined,
  META_APP_ID: process.env.META_APP_ID || undefined,
  META_APP_SECRET: process.env.META_APP_SECRET || undefined,
  META_GRAPH_VERSION: process.env.META_GRAPH_VERSION || undefined,
  X_CLIENT_ID: process.env.X_CLIENT_ID || undefined,
  X_CLIENT_SECRET: process.env.X_CLIENT_SECRET || undefined,
  LINKEDIN_CLIENT_ID: process.env.LINKEDIN_CLIENT_ID || undefined,
  LINKEDIN_CLIENT_SECRET: process.env.LINKEDIN_CLIENT_SECRET || undefined,
  LINKEDIN_API_VERSION: process.env.LINKEDIN_API_VERSION || undefined,
  RESEND_API_KEY: process.env.RESEND_API_KEY || undefined,
  EMAIL_FROM: process.env.EMAIL_FROM || undefined,
});

if (!parsed.success) {
  throw new Error(`Invalid environment configuration: ${z.prettifyError(parsed.error)}`);
}

export const env = parsed.data;

export const llmAvailable = Boolean(env.ANTHROPIC_API_KEY);
export const googleAuthEnabled = Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
export const billingEnabled = Boolean(env.STRIPE_SECRET_KEY);
export const emailEnabled = Boolean(env.RESEND_API_KEY);
