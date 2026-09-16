"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { startGoalRun } from "@/server/agent/runtime";
import { currentUser, requireWorkspace } from "@/server/context";
import { db } from "@/server/db/client";
import { users } from "@/server/db/schema";
import { isDomainError } from "@/server/domain/errors";
import { decideApproval } from "@/server/services/approvals";
import { evaluateAndComplete, simulateToCompletion } from "@/server/services/experiments";
import { getPrimaryProduct } from "@/server/services/workspace";

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

async function scoped(slug: string) {
  const ctx = await requireWorkspace(slug);
  const product = await getPrimaryProduct(ctx.workspaceId);
  if (!product) throw new Error("This workspace has no product yet.");
  return { ...ctx, productId: product.id };
}

function fail(error: unknown): ActionResult {
  if (isDomainError(error)) return { ok: false, error: error.message };
  console.error(JSON.stringify({ level: "error", msg: "action_failed", error: String(error) }));
  return { ok: false, error: "Something went wrong. The action was not completed." };
}

const DecisionSchema = z.object({
  slug: z.string().min(1),
  approvalId: z.string().min(1),
  decision: z.enum(["approved", "rejected"]),
  note: z.string().max(500).optional(),
});

export async function decideApprovalAction(input: z.infer<typeof DecisionSchema>): Promise<ActionResult> {
  const parsed = DecisionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };
  try {
    const ctx = await scoped(parsed.data.slug);
    const result = await decideApproval(ctx, parsed.data.approvalId, parsed.data.decision, parsed.data.note);
    revalidatePath(`/w/${parsed.data.slug}`, "layout");
    if (result.status === "rejected") return { ok: true, message: "Rejected. The agent will not run this action." };
    if (result.status === "succeeded") return { ok: true, message: "Approved and executed." };
    return { ok: false, error: result.status === "blocked" ? "Approved, but policy blocked execution. See the agent run for details." : "Approved, but execution failed. See the agent run." };
  } catch (error) {
    return fail(error);
  }
}

export async function askAgentAction(slug: string, formData: FormData): Promise<void> {
  const goal = String(formData.get("goal") ?? "").trim();
  if (goal.length < 3) return;
  const ctx = await scoped(slug);
  const runId = await startGoalRun({ workspaceId: ctx.workspaceId, productId: ctx.productId, userId: ctx.userId, isDemo: ctx.isDemo, goal: goal.slice(0, 500) });
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
    if (!result.completed) return { ok: true, message: `Not enough evidence yet: ${result.evaluation.summary}` };
    return { ok: true, message: `Recorded ${result.evaluation.decision}. ${result.learning ? "Learning saved to memory." : ""}` };
  } catch (error) {
    return fail(error);
  }
}

/** Finishing or skipping the product tour both count: it never reopens on its own afterwards. */
export async function completeProductTourAction(): Promise<ActionResult> {
  const user = await currentUser();
  if (!user || user.isGuest) return { ok: false, error: "Sign in to save your progress." };
  await db.update(users).set({ tourCompletedAt: new Date() }).where(and(eq(users.id, user.userId), isNull(users.tourCompletedAt)));
  return { ok: true };
}
