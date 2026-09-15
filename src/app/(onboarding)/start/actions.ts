"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { z } from "zod";
import { currentUser, requireWorkspace, SESSION_COOKIE } from "@/server/context";
import { isDomainError } from "@/server/domain/errors";
import { runProductAnalysis } from "@/server/intelligence/analyze";
import {
  addCompetitor,
  addContext,
  completeConnect,
  completeReview,
  confirmFacts,
  correctFact,
  createProductForAnalysis,
  ensureLocalUser,
  rejectFact,
  restartAnalysis,
  reviewCompetitor,
  reviewIcp,
  saveGoal,
  setDemoIntegration,
} from "@/server/services/onboarding";
import { runStrategyGeneration, startStrategyRun } from "@/server/services/strategy";

export type FormState = { error: string | null };
export type MutationResult = { ok: true } | { ok: false; error: string };

function toError(error: unknown): string {
  if (isDomainError(error)) return error.message;
  console.error(JSON.stringify({ level: "error", msg: "onboarding_action_failed", error: String(error) }));
  return "Something went wrong. Please try again.";
}

async function mutate(slug: string, fn: (ctx: Awaited<ReturnType<typeof requireWorkspace>>) => Promise<unknown>): Promise<MutationResult> {
  try {
    const ctx = await requireWorkspace(slug);
    await fn(ctx);
    revalidatePath(`/start/${slug}`, "layout");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: toError(error) };
  }
}

export async function startAnalysisAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const mode = formData.get("mode") === "manual" ? "manual" : "url";
  let slug: string;
  try {
    const existing = await currentUser();
    const userId = await ensureLocalUser(existing?.userId ?? null);
    if (!existing) (await cookies()).set(SESSION_COOKIE, userId, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 });

    const created = await createProductForAnalysis(
      userId,
      mode === "url"
        ? { kind: "url", url: String(formData.get("url") ?? "") }
        : { kind: "manual", name: String(formData.get("name") ?? ""), description: String(formData.get("description") ?? ""), url: String(formData.get("url") ?? "") },
    );
    slug = created.slug;
    after(() => runProductAnalysis(created.workspaceId, created.runId));
  } catch (error) {
    return { error: toError(error) };
  }
  redirect(`/start/${slug}/analyze`);
}

export async function retryAnalysisAction(slug: string): Promise<void> {
  const ctx = await requireWorkspace(slug);
  const runId = await restartAnalysis(ctx);
  after(() => runProductAnalysis(ctx.workspaceId, runId));
  redirect(`/start/${slug}/analyze`);
}

export async function confirmFactsAction(slug: string, factIds: string[]) {
  return mutate(slug, (ctx) => confirmFacts(ctx, z.array(z.string()).max(100).parse(factIds)));
}

export async function correctFactAction(slug: string, factId: string, statement: string) {
  return mutate(slug, (ctx) => correctFact(ctx, factId, statement));
}

export async function rejectFactAction(slug: string, factId: string) {
  return mutate(slug, (ctx) => rejectFact(ctx, factId));
}

export async function addContextAction(slug: string, text: string) {
  return mutate(slug, (ctx) => addContext(ctx, text));
}

export async function reviewIcpAction(slug: string, icpId: string, decision: "confirmed" | "rejected", name?: string) {
  return mutate(slug, (ctx) => reviewIcp(ctx, icpId, z.enum(["confirmed", "rejected"]).parse(decision), name));
}

export async function reviewCompetitorAction(slug: string, competitorId: string, decision: "confirmed" | "rejected") {
  return mutate(slug, (ctx) => reviewCompetitor(ctx, competitorId, z.enum(["confirmed", "rejected"]).parse(decision)));
}

export async function addCompetitorAction(slug: string, name: string) {
  return mutate(slug, (ctx) => addCompetitor(ctx, name));
}

export async function finishReviewAction(slug: string): Promise<void> {
  const ctx = await requireWorkspace(slug);
  await completeReview(ctx);
  redirect(`/start/${slug}/goal`);
}

const GoalForm = z.object({
  template: z.string().min(1),
  baseline: z.string().optional(),
  target: z.string().optional(),
  deadlineDays: z.coerce.number().int().min(14).max(365),
  budgetBand: z.string().min(1),
  customBudget: z.string().optional(),
  customText: z.string().max(200).optional(),
});

const num = (v: string | undefined) => {
  if (v === undefined || v.trim() === "") return null;
  const n = Number(v.replace(/[$,%\s]/g, ""));
  return Number.isFinite(n) ? n : null;
};

export async function saveGoalAction(slug: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = GoalForm.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Choose a goal, a timeframe and a budget." };
  try {
    const ctx = await requireWorkspace(slug);
    const d = parsed.data;
    const pct = d.template === "trial_conversion";
    await saveGoal(ctx, {
      template: d.template,
      baseline: pct && num(d.baseline) !== null ? num(d.baseline)! / 100 : num(d.baseline),
      target: pct && num(d.target) !== null ? num(d.target)! / 100 : num(d.target),
      deadlineDays: d.deadlineDays,
      budgetBand: d.budgetBand,
      customBudget: num(d.customBudget),
      customText: d.customText ?? null,
    });
  } catch (error) {
    return { error: toError(error) };
  }
  redirect(`/start/${slug}/connect`);
}

export async function integrationAction(slug: string, provider: string, connect: boolean) {
  return mutate(slug, (ctx) => setDemoIntegration(ctx, provider, connect));
}

export async function finishConnectAction(slug: string): Promise<void> {
  const ctx = await requireWorkspace(slug);
  await completeConnect(ctx);
  redirect(`/start/${slug}/strategy`);
}

export async function startStrategyAction(slug: string): Promise<{ ok: true; runId: string } | { ok: false; error: string }> {
  try {
    const ctx = await requireWorkspace(slug);
    const runId = await startStrategyRun(ctx);
    after(() => runStrategyGeneration(ctx.workspaceId, runId));
    return { ok: true, runId };
  } catch (error) {
    return { ok: false, error: toError(error) };
  }
}
