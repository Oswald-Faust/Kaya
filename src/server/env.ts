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
});

const parsed = EnvSchema.safeParse({
  ...process.env,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || undefined,
  APP_URL: process.env.APP_URL || undefined,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || undefined,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || undefined,
  ALLOW_DEMO_LOGIN: process.env.ALLOW_DEMO_LOGIN || undefined,
});

if (!parsed.success) {
  throw new Error(`Invalid environment configuration: ${z.prettifyError(parsed.error)}`);
}

export const env = parsed.data;

export const llmAvailable = Boolean(env.ANTHROPIC_API_KEY);
export const googleAuthEnabled = Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
