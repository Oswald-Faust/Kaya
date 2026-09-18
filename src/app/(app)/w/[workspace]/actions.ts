"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { startExperimentRun, startGoalRun } from "@/server/agent/runtime";
import { currentUser, requireWorkspace } from "@/server/context";
import { db } from "@/server/db/client";
import { users } from "@/server/db/schema";
import { localizeError } from "@/i18n/errors";
import { getI18n } from "@/i18n/server";
import { fmt } from "@/i18n/format";
import { translateDomainText } from "@/i18n/domain-text";
import { decideApproval } from "@/server/services/approvals";
import { evaluateAndComplete, simulateToCompletion } from "@/server/services/experiments";
import { resetExperiments } from "@/server/services/reset-experiments";
import { getPrimaryProduct } from "@/server/services/workspace";

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

async function scoped(slug: string) {
  const ctx = await requireWorkspace(slug);
  const product = await getPrimaryProduct(ctx.workspaceId);
  if (!product) throw new Error("This workspace has no product yet.");
  return { ...ctx, productId: product.id };
}

async function fail(error: unknown): Promise<ActionResult> {
  const { locale, t } = await getI18n();
  const message = localizeError(error, locale);
  if (message) return { ok: false, error: message };
  console.error(JSON.stringify({ level: "error", msg: "action_failed", error: String(error) }));
  return { ok: false, error: t.app.approval.actionFailed };
}

const DecisionSchema = z.object({
  slug: z.string().min(1),
  approvalId: z.string().min(1),
  decision: z.enum(["approved", "rejected"]),
  note: z.string().max(500).optional(),
});

export async function decideApprovalAction(input: z.infer<typeof DecisionSchema>): Promise<ActionResult> {
  const parsed = DecisionSchema.safeParse(input);
  const { t } = await getI18n();
  const ap = t.app.approval;
  if (!parsed.success) return { ok: false, error: ap.invalid };
  try {
    const ctx = await scoped(parsed.data.slug);
    const result = await decideApproval(ctx, parsed.data.approvalId, parsed.data.decision, parsed.data.note);
    revalidatePath(`/w/${parsed.data.slug}`, "layout");
    if (result.status === "rejected") return { ok: true, message: ap.rejected };
    if (result.status === "succeeded") return { ok: true, message: ap.executed };
    return { ok: false, error: result.status === "blocked" ? ap.blocked : ap.failed };
  } catch (error) {
    return await fail(error);
  }
}

export async function askAgentAction(slug: string, formData: FormData): Promise<void> {
  const goal = String(formData.get("goal") ?? "").trim();
  if (goal.length < 3) return;
  const ctx = await scoped(slug);
  const { locale } = await getI18n();
  const runId = await startGoalRun({ workspaceId: ctx.workspaceId, productId: ctx.productId, userId: ctx.userId, isDemo: ctx.isDemo, goal: goal.slice(0, 500), locale });
  revalidatePath(`/w/${slug}`, "layout");
  redirect(`/w/${slug}/agent/${runId}`);
}

/** Runs one experiment the founder picked from the Command Center. */
export async function runExperimentAction(slug: string, experimentId: string): Promise<void> {
  const ctx = await scoped(slug);
  const { locale } = await getI18n();
  const runId = await startExperimentRun({ workspaceId: ctx.workspaceId, productId: ctx.productId, userId: ctx.userId, isDemo: ctx.isDemo, experimentId, locale });
  revalidatePath(`/w/${slug}`, "layout");
  redirect(`/w/${slug}/agent/${runId}`);
}

export async function recordExperimentResultAction(slug: string, experimentId: string, mode: "evaluate" | "simulate"): Promise<ActionResult> {
  try {
    const ctx = await scoped(slug);
    const actor = { type: "user" as const, id: ctx.userId };
    const result =
      mode === "simulate"
        ? await simulateToCompletion(ctx.workspaceId, experimentId, actor, ctx.isDemo)
        : await evaluateAndComplete(ctx.workspaceId, experimentId, actor);
    revalidatePath(`/w/${slug}`, "layout");
    const { t, locale } = await getI18n();
    const ap = t.app.approval;
    if (!result.completed) return { ok: true, message: fmt(ap.notEnough, { summary: translateDomainText(result.evaluation.summary, locale) }) };
    const decision = { winner: t.app.common.winner, loser: t.app.common.loser, inconclusive: t.app.common.inconclusive }[result.evaluation.decision as "winner" | "loser" | "inconclusive"] ?? result.evaluation.decision;
    return { ok: true, message: fmt(ap.recorded, { decision }) + (result.learning ? ap.learningSaved : "") };
  } catch (error) {
    return await fail(error);
  }
}

/** Finishing or skipping the product tour both count: it never reopens on its own afterwards. */
export async function completeProductTourAction(): Promise<ActionResult> {
  const user = await currentUser();
  if (!user || user.isGuest) return { ok: false, error: (await getI18n()).t.app.approval.signInTour };
  await db.update(users).set({ tourCompletedAt: new Date() }).where(and(eq(users.id, user.userId), isNull(users.tourCompletedAt)));
  return { ok: true };
}

export async function resetExperimentsAction(slug: string, confirmation: string): Promise<ActionResult> {
  try {
    const ctx = await scoped(slug);
    const result = await resetExperiments(ctx, ctx.productId, confirmation);
    revalidatePath(`/w/${slug}`, "layout");
    const { t } = await getI18n();
    return { ok: true, message: fmt(t.app.experiments.resetSuccess, { count: result.count }) };
  } catch (error) {
    return fail(error);
  }
}
