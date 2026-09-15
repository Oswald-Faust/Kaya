import "server-only";
import { z } from "zod";

const EnvSchema = z.object({
  DATABASE_URL: z.string().url().default("postgres://localhost:5432/marketing_os"),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  CRAWL_MAX_PAGES: z.coerce.number().int().min(1).max(25).default(8),
  CRAWL_TIMEOUT_MS: z.coerce.number().int().min(1000).max(30000).default(8000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

const parsed = EnvSchema.safeParse({
  ...process.env,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || undefined,
});

if (!parsed.success) {
  throw new Error(`Invalid environment configuration: ${z.prettifyError(parsed.error)}`);
}

export const env = parsed.data;

export const llmAvailable = Boolean(env.ANTHROPIC_API_KEY);
