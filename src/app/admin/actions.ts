"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/server/admin/guard";
import { isDomainError } from "@/server/domain/errors";
import * as admin from "@/server/services/admin";

export type AdminResult = { ok: true; message?: string } | { ok: false; error: string };

async function run(fn: (ctx: Awaited<ReturnType<typeof requireAdmin>>) => Promise<string | void>): Promise<AdminResult> {
  const ctx = await requireAdmin();
  try {
    const message = await fn(ctx);
    revalidatePath("/admin", "layout");
    return { ok: true, message: message ?? undefined };
  } catch (error) {
    if (isDomainError(error)) return { ok: false, error: error.message };
    console.error(JSON.stringify({ level: "error", msg: "admin_action_failed", error: String(error) }));
    return { ok: false, error: error instanceof Error ? error.message : "Something went wrong." };
  }
}

const Id = z.string().min(3).max(64);

export async function setAdminAction(userId: string, value: boolean) {
  return run((ctx) => admin.setPlatformAdmin(ctx, Id.parse(userId), value).then(() => (value ? "Admin access granted." : "Admin access removed.")));
}

export async function setSuspendedAction(userId: string, suspended: boolean) {
  return run((ctx) => admin.setSuspended(ctx, Id.parse(userId), suspended).then(() => (suspended ? "Account suspended and signed out." : "Account reactivated.")));
}

export async function revokeSessionsAction(userId: string) {
  return run(async (ctx) => `${await admin.revokeSessions(ctx, Id.parse(userId))} session(s) revoked.`);
}

export async function deleteUserAction(userId: string) {
  const result = await run((ctx) => admin.deleteUser(ctx, Id.parse(userId)));
  if (result.ok) redirect("/admin/users");
  return result;
}

export async function purgeGuestsAction() {
  return run(async (ctx) => `${await admin.purgeGuests(ctx, 7)} guest account(s) older than 7 days removed.`);
}

export async function joinWorkspaceAction(workspaceId: string) {
  const ctx = await requireAdmin();
  let slug: string;
  try {
    slug = await admin.joinWorkspace(ctx, Id.parse(workspaceId));
  } catch (error) {
    return { ok: false, error: isDomainError(error) ? error.message : "Couldn't open the workspace." } satisfies AdminResult;
  }
  redirect(`/w/${slug}`);
}

export async function removeMemberAction(memberId: string) {
  return run((ctx) => admin.removeMember(ctx, Id.parse(memberId)).then(() => "Member removed."));
}

export async function setAutonomyAction(workspaceId: string, mode: string) {
  return run((ctx) => admin.setAutonomy(ctx, Id.parse(workspaceId), z.enum(["observe", "suggest", "copilot", "autopilot"]).parse(mode)).then(() => `Autonomy set to ${mode}.`));
}

export async function deleteWorkspaceAction(workspaceId: string) {
  const result = await run((ctx) => admin.deleteWorkspace(ctx, Id.parse(workspaceId)));
  if (result.ok) redirect("/admin/workspaces");
  return result;
}

const Override = z.object({
  plan: z.enum(["none", "free", "launch", "growth", "scale"]),
  planStatus: z.enum(["none", "trialing", "active", "past_due", "canceled"]),
  planInterval: z.enum(["month", "year", ""]).transform((v) => v || null),
  planActions: z.coerce.number().int().min(0).max(10_000_000).nullable(),
  trialEndsAt: z.string().transform((v, c) => {
    if (!v) return null;
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) {
      c.addIssue({ code: "custom", message: "Invalid trial end date" });
      return z.NEVER;
    }
    return d;
  }),
});

export async function overridePlanAction(organizationId: string, _prev: AdminResult | null, form: FormData): Promise<AdminResult> {
  return run(async (ctx) => {
    const parsed = Override.safeParse({
      plan: form.get("plan"),
      planStatus: form.get("planStatus"),
      planInterval: form.get("planInterval") ?? "",
      planActions: form.get("planActions") ? form.get("planActions") : null,
      trialEndsAt: form.get("trialEndsAt") ?? "",
    });
    if (!parsed.success) return Promise.reject(new Error(parsed.error.issues[0]?.message ?? "Invalid plan"));
    await admin.overridePlan(ctx, Id.parse(organizationId), parsed.data);
    return "Plan updated.";
  });
}

export async function extendTrialAction(organizationId: string, days: number) {
  return run((ctx) => admin.extendTrial(ctx, Id.parse(organizationId), z.number().int().min(1).max(365).parse(days)).then(() => `Trial extended by ${days} days.`));
}

export async function cancelSubscriptionAction(organizationId: string, immediately: boolean) {
  return run((ctx) => admin.cancelSubscription(ctx, Id.parse(organizationId), immediately).then(() => (immediately ? "Subscription canceled." : "Subscription will cancel at period end.")));
}

export async function resyncSubscriptionAction(organizationId: string) {
  return run((ctx) => admin.resyncSubscription(ctx, Id.parse(organizationId)).then(() => "Synced from Stripe."));
}
