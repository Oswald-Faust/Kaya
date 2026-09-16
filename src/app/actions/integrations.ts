"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireWorkspace } from "@/server/context";
import { isDomainError } from "@/server/domain/errors";
import { connectWithApiKey, disconnectIntegration, selectAccount, syncIntegration } from "@/server/integrations/connections";
import { setDemoIntegration } from "@/server/services/onboarding";

export type IntegrationResult = { ok: true; message?: string } | { ok: false; error: string };

const Provider = z.string().regex(/^[a-z_]{2,40}$/);

async function run(slug: string, fn: (ctx: Awaited<ReturnType<typeof requireWorkspace>>) => Promise<string | void>): Promise<IntegrationResult> {
  try {
    const ctx = await requireWorkspace(slug);
    const message = await fn(ctx);
    revalidatePath(`/w/${slug}/integrations`);
    revalidatePath(`/start/${slug}/connect`);
    return { ok: true, message: message ?? undefined };
  } catch (error) {
    if (isDomainError(error)) return { ok: false, error: error.message };
    console.error(JSON.stringify({ level: "error", msg: "integration_action_failed", error: String(error) }));
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}

export async function connectApiKeyAction(slug: string, provider: string, fields: Record<string, string>) {
  return run(slug, async (ctx) => {
    const values = z.record(z.string().max(60), z.string().max(4000)).parse(fields);
    const identity = await connectWithApiKey(ctx, Provider.parse(provider), values);
    return `Connected to ${identity.accountLabel}.`;
  });
}

export async function disconnectAction(slug: string, provider: string) {
  return run(slug, async (ctx) => {
    if (ctx.isDemo) await setDemoIntegration(ctx, Provider.parse(provider), false);
    else await disconnectIntegration(ctx, Provider.parse(provider));
    return "Disconnected. Stored credentials were deleted.";
  });
}

export async function syncAction(slug: string, provider: string) {
  return run(slug, async (ctx) => (await syncIntegration(ctx, Provider.parse(provider))).summary);
}

export async function selectAccountAction(slug: string, provider: string, accountId: string) {
  return run(slug, async (ctx) => {
    await selectAccount(ctx, Provider.parse(provider), z.string().min(1).max(200).parse(accountId));
    return "Account switched.";
  });
}

export async function connectDemoAction(slug: string, provider: string) {
  return run(slug, async (ctx) => {
    if (!ctx.isDemo) throw new Error("Demo connections are only available in the demo workspace.");
    await setDemoIntegration(ctx, Provider.parse(provider), true);
  });
}
