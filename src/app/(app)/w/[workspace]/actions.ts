"use server";

import { measurementContext, verifyLaunchProof } from "@/server/services/measurement";
import { advanceExperiment } from "@/server/services/experiment-stage";

import { and, eq, isNull, sql } from "drizzle-orm";
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
import { translateServerText } from "@/i18n/server-text";
import { isPageTourKey } from "@/lib/page-tours";
import { decideApproval } from "@/server/services/approvals";
import { evaluateAndComplete, getExperimentById, simulateToCompletion } from "@/server/services/experiments";
import {
  archiveKaiConversation,
  askKai,
  deleteKaiConversation,
  editAndRegenerateKaiMessage,
  getKaiConversation,
  listKaiConversations,
  renameKaiConversation,
  unarchiveKaiConversation,
  updateKaiConversationModel,
} from "@/server/services/kai";
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

export async function sendKaiMessageAction(
  slug: string,
  message: string,
  conversationId?: string,
  model?: string
): Promise<({ ok: true } & Awaited<ReturnType<typeof askKai>>) | { ok: false; error: string }> {
  const text = message.trim();
  if (text.length < 2 || text.length > 4000) return { ok: false as const, error: "2–4000 characters" };
  try {
    const ctx = await scoped(slug);
    const { locale } = await getI18n();
    const result = await askKai({
      workspaceId: ctx.workspaceId,
      productId: ctx.productId,
      userId: ctx.userId,
      message: text,
      locale,
      conversationId,
      model,
    });
    revalidatePath(`/w/${slug}/kai`);
    return { ok: true as const, ...result };
  } catch (error) {
    const failure = await fail(error);
    return { ok: false, error: "error" in failure ? failure.error : "Message unavailable" };
  }
}

export async function loadKaiConversationAction(slug: string, conversationId: string) {
  const ctx = await requireWorkspace(slug);
  return getKaiConversation(ctx.workspaceId, ctx.userId, conversationId);
}

export async function searchKaiConversationsAction(
  slug: string,
  search: string,
  offset = 0,
  status: "active" | "archived" | "all" = "active"
) {
  const ctx = await requireWorkspace(slug);
  return listKaiConversations(ctx.workspaceId, ctx.userId, search.slice(0, 200), Math.max(0, Math.floor(offset) || 0), status);
}

export async function deleteKaiConversationAction(
  slug: string,
  conversationId: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const ctx = await requireWorkspace(slug);
    await deleteKaiConversation(ctx.workspaceId, ctx.userId, conversationId);
    revalidatePath(`/w/${slug}/kai`);
    return { ok: true };
  } catch (error) {
    const failure = await fail(error);
    return { ok: false, error: "error" in failure ? failure.error : "Failed to delete conversation" };
  }
}

export async function archiveKaiConversationAction(
  slug: string,
  conversationId: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const ctx = await requireWorkspace(slug);
    await archiveKaiConversation(ctx.workspaceId, ctx.userId, conversationId);
    revalidatePath(`/w/${slug}/kai`);
    return { ok: true };
  } catch (error) {
    const failure = await fail(error);
    return { ok: false, error: "error" in failure ? failure.error : "Failed to archive conversation" };
  }
}

export async function unarchiveKaiConversationAction(
  slug: string,
  conversationId: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const ctx = await requireWorkspace(slug);
    await unarchiveKaiConversation(ctx.workspaceId, ctx.userId, conversationId);
    revalidatePath(`/w/${slug}/kai`);
    return { ok: true };
  } catch (error) {
    const failure = await fail(error);
    return { ok: false, error: "error" in failure ? failure.error : "Failed to restore conversation" };
  }
}

export async function updateKaiConversationModelAction(
  slug: string,
  conversationId: string,
  model: string
): Promise<{ ok: boolean }> {
  try {
    const ctx = await requireWorkspace(slug);
    await updateKaiConversationModel(ctx.workspaceId, ctx.userId, conversationId, model);
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export async function renameKaiConversationAction(
  slug: string,
  conversationId: string,
  title: string
): Promise<{ ok: boolean; title?: string; error?: string }> {
  try {
    const ctx = await requireWorkspace(slug);
    const res = await renameKaiConversation(ctx.workspaceId, ctx.userId, conversationId, title);
    revalidatePath(`/w/${slug}/kai`);
    return { ok: true, title: res.title };
  } catch (error) {
    const failure = await fail(error);
    return { ok: false, error: "error" in failure ? failure.error : "Failed to rename conversation" };
  }
}

export async function editKaiMessageAction(
  slug: string,
  conversationId: string,
  messageId: string,
  newContent: string,
  model?: string
) {
  try {
    const ctx = await scoped(slug);
    const { locale } = await getI18n();
    const result = await editAndRegenerateKaiMessage({
      workspaceId: ctx.workspaceId,
      productId: ctx.productId,
      userId: ctx.userId,
      conversationId,
      messageId,
      newContent,
      locale,
      model,
    });
    revalidatePath(`/w/${slug}/kai`);
    return { ok: true as const, ...result };
  } catch (error) {
    const failure = await fail(error);
    return { ok: false as const, error: "error" in failure ? failure.error : "Failed to edit message" };
  }
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
    if (mode === "evaluate" && !ctx.isDemo) {
      // An experiment is judged only once it's proven live and something can measure it.
      const exp = await getExperimentById(ctx.workspaceId, experimentId);
      const { readiness } = await measurementContext(ctx.workspaceId, exp);
      if (readiness.missing.length) return { ok: false, error: readiness.missing.map((m) => `${m.label}: ${m.action}`).join(" · ") };
    }
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

/** Records that the user saw a page's first-visit tour, so it opens only once. */
export async function markPageTourSeenAction(page: string): Promise<ActionResult> {
  if (!isPageTourKey(page)) return { ok: false, error: "Unknown page." };
  const user = await currentUser();
  if (!user || user.isGuest) return { ok: true };
  await db
    .update(users)
    .set({ pageToursSeen: sql`(select coalesce(jsonb_agg(distinct v), '[]'::jsonb) from jsonb_array_elements_text(${users.pageToursSeen} || ${JSON.stringify([page])}::jsonb) as v)` })
    .where(eq(users.id, user.userId));
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

export async function validatePublishedUrlAction(
  slug: string,
  experimentId: string,
  url: string,
  launch: boolean = false
): Promise<ActionResult & { url?: string }> {
  try {
    const { locale } = await getI18n();
    const ctx = await scoped(slug);
    const actor = { type: "user" as const, id: ctx.userId };
    // Checks the URL against the experiment's plan (HN item for Show HN, product domain for a page) before pinging it.
    const res = await verifyLaunchProof(ctx.workspaceId, await getExperimentById(ctx.workspaceId, experimentId), url, actor, { launch, locale });
    if (!res.ok) {
      return { ok: false, error: res.error ?? translateServerText("URL validation failed.", locale) };
    }
    revalidatePath(`/w/${slug}`, "layout");
    return {
      ok: true,
      url: res.url,
      message: launch
        ? translateServerText("URL validated (200 OK) and experiment launched successfully!", locale)
        : translateServerText("URL validated successfully (200 OK).", locale),
    };
  } catch (error) {
    return await fail(error);
  }
}


/** Moves the experiment a run worked on to Approval or Running, from the run page. */
export async function advanceExperimentAction(slug: string, input: { runId: string; experimentId: string; target: "approval" | "running"; url?: string }): Promise<ActionResult> {
  try {
    const parsed = z.object({ runId: z.string().min(3), experimentId: z.string().min(3), target: z.enum(["approval", "running"]), url: z.string().max(2000).optional() }).parse(input);
    const ctx = await scoped(slug);
    const { locale } = await getI18n();
    const result = await advanceExperiment(ctx, parsed);
    revalidatePath(`/w/${slug}`, "layout");
    return { ok: true, message: translateServerText(result.message, locale) };
  } catch (error) {
    return await fail(error);
  }
}
