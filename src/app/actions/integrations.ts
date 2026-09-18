"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fmt } from "@/i18n/format";
import { localizeError } from "@/i18n/errors";
import { getI18n } from "@/i18n/server";
import { translateServerText } from "@/i18n/server-text";
import { requireWorkspace } from "@/server/context";
import { isDomainError } from "@/server/domain/errors";
import { connectWithApiKey, disconnectIntegration, selectAccount, syncIntegration } from "@/server/integrations/connections";
import { setDemoIntegration } from "@/server/services/onboarding";

export type IntegrationResult = { ok: true; message?: string } | { ok: false; error: string };

const Provider = z.string().regex(/^[a-z_]{2,40}$/);

type I18n = Awaited<ReturnType<typeof getI18n>>;

async function run(slug: string, fn: (ctx: Awaited<ReturnType<typeof requireWorkspace>>, i18n: I18n) => Promise<string | void>): Promise<IntegrationResult> {
  const i18n = await getI18n();
  try {
    const ctx = await requireWorkspace(slug);
    const message = await fn(ctx, i18n);
    revalidatePath(`/w/${slug}/integrations`);
    revalidatePath(`/start/${slug}/connect`);
    return { ok: true, message: message ? translateServerText(message, i18n.locale) : undefined };
  } catch (error) {
    if (isDomainError(error)) return { ok: false, error: localizeError(error, i18n.locale) ?? error.message };
    console.error(JSON.stringify({ level: "error", msg: "integration_action_failed", error: String(error) }));
    return { ok: false, error: i18n.t.errors.generic };
  }
}

export async function connectApiKeyAction(slug: string, provider: string, fields: Record<string, string>) {
  return run(slug, async (ctx, { t }) => {
    const values = z.record(z.string().max(60), z.string().max(4000)).parse(fields);
    const identity = await connectWithApiKey(ctx, Provider.parse(provider), values);
    return fmt(t.integrations.connectedTo, { account: identity.accountLabel });
  });
}

export async function disconnectAction(slug: string, provider: string) {
  return run(slug, async (ctx, { t }) => {
    if (ctx.isDemo) await setDemoIntegration(ctx, Provider.parse(provider), false);
    else await disconnectIntegration(ctx, Provider.parse(provider));
    return t.integrations.disconnected;
  });
}

export async function syncAction(slug: string, provider: string) {
  return run(slug, async (ctx) => (await syncIntegration(ctx, Provider.parse(provider))).summary);
}

export async function selectAccountAction(slug: string, provider: string, accountId: string) {
  return run(slug, async (ctx, { t }) => {
    await selectAccount(ctx, Provider.parse(provider), z.string().min(1).max(200).parse(accountId));
    return t.integrations.accountSwitched;
  });
}

export async function connectDemoAction(slug: string, provider: string) {
  return run(slug, async (ctx, { t }) => {
    if (!ctx.isDemo) throw new Error(t.integrations.demoOnly);
    await setDemoIntegration(ctx, Provider.parse(provider), true);
  });
}
