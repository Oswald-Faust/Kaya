import "server-only";
import { eq } from "drizzle-orm";
import type { WorkspaceContext } from "@/server/context";
import { db } from "@/server/db/client";
import * as t from "@/server/db/schema";
import { DomainError } from "@/server/domain/errors";
import { resolvePlanState, trialEnd, type PlanState } from "@/server/domain/billing/plan-state";
import { recordAudit } from "./audit";

/**
 * Plan selection. Trials start without a card; payment collection is not wired yet
 * (Stripe credentials pending), so nothing is ever charged automatically.
 */

export async function getPlanState(organizationId: string): Promise<PlanState> {
  const org = await db.query.organizations.findFirst({ where: eq(t.organizations.id, organizationId) });
  return resolvePlanState(org ?? { plan: "none", planStatus: "none", trialEndsAt: null });
}

function assertCanManage(ctx: WorkspaceContext) {
  if (ctx.isDemo) throw new DomainError("validation", "The demo workspace can't change plans.");
  if (ctx.role !== "owner" && ctx.role !== "admin") throw new DomainError("validation", "Only an owner or admin can choose the plan.");
}

export async function startTrial(ctx: WorkspaceContext, plan: "launch" | "growth", interval: "month" | "year", actions: number): Promise<void> {
  assertCanManage(ctx);
  const current = await getPlanState(ctx.organizationId);
  if (current.status === "expired" || (current.status === "active" && current.plan !== "free") || current.status === "trialing") {
    // One trial per organization; switching plans later goes through billing.
    if (current.status !== "trialing") throw new DomainError("conflict", "Your trial has already been used. Choose a paid plan to continue.");
  }
  const endsAt = current.status === "trialing" && current.trialEndsAt ? current.trialEndsAt : trialEnd();
  await db.transaction(async (tx) => {
    await tx
      .update(t.organizations)
      .set({ plan, planStatus: "trialing", planInterval: interval, planActions: actions, trialEndsAt: endsAt })
      .where(eq(t.organizations.id, ctx.organizationId));
    await tx.update(t.products).set({ onboardingStep: "done", updatedAt: new Date() }).where(eq(t.products.workspaceId, ctx.workspaceId));
    await recordAudit(tx, {
      workspaceId: ctx.workspaceId,
      actorType: "user",
      actorId: ctx.userId,
      action: "plan.trial_started",
      targetType: "organization",
      targetId: ctx.organizationId,
      payload: { plan, interval, actions, trialEndsAt: endsAt.toISOString() },
    });
  });
}

export async function chooseFree(ctx: WorkspaceContext): Promise<void> {
  assertCanManage(ctx);
  await db.transaction(async (tx) => {
    await tx
      .update(t.organizations)
      .set({ plan: "free", planStatus: "active", planInterval: null, planActions: 200 })
      .where(eq(t.organizations.id, ctx.organizationId));
    await tx.update(t.products).set({ onboardingStep: "done", updatedAt: new Date() }).where(eq(t.products.workspaceId, ctx.workspaceId));
    await tx.update(t.workspaces).set({ autonomyMode: "suggest" }).where(eq(t.workspaces.id, ctx.workspaceId));
    await recordAudit(tx, {
      workspaceId: ctx.workspaceId,
      actorType: "user",
      actorId: ctx.userId,
      action: "plan.free_selected",
      targetType: "organization",
      targetId: ctx.organizationId,
      payload: {},
    });
  });
}
