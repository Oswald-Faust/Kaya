/**
 * The product is the loop. This walks the demo workspace through
 * approve → execute → measure → learn → recommend, against a real database,
 * and checks the guarantees governance and memory depend on.
 */
import { and, eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import { invokeTool } from "@/server/agent/executor";
import type { WorkspaceContext } from "@/server/context";
import { db } from "@/server/db/client";
import * as t from "@/server/db/schema";
import { decideApproval, listApprovals } from "@/server/services/approvals";
import { getExperimentDetail, rankQueue, simulateToCompletion } from "@/server/services/experiments";

let ctx: WorkspaceContext & { productId: string };
let campaignId: string;

async function experimentByNumber(n: number) {
  const row = await db.query.experiments.findFirst({ where: and(eq(t.experiments.workspaceId, ctx.workspaceId), eq(t.experiments.number, n)) });
  if (!row) throw new Error(`EXP-${n} missing from seed`);
  return row;
}

beforeAll(async () => {
  const ws = await db.query.workspaces.findFirst({ where: eq(t.workspaces.slug, "tickwarden") });
  const product = await db.query.products.findFirst({ where: eq(t.products.workspaceId, ws!.id) });
  const member = await db.query.members.findFirst({ where: eq(t.members.organizationId, ws!.organizationId) });
  const user = await db.query.users.findFirst({ where: eq(t.users.id, member!.userId) });
  ctx = {
    userId: user!.id,
    name: user!.name,
    email: user!.email,
    organizationId: ws!.organizationId,
    workspaceId: ws!.id,
    workspaceSlug: ws!.slug,
    workspaceName: ws!.name,
    role: "owner",
    autonomyMode: ws!.autonomyMode,
    isDemo: true,
    productId: product!.id,
  };
  const campaign = await db.query.campaigns.findFirst({ where: and(eq(t.campaigns.workspaceId, ws!.id), eq(t.campaigns.name, "Cron monitoring · exact match")) });
  campaignId = campaign!.id;
  // Tool calls always belong to a persisted run.
  await db
    .insert(t.agentRuns)
    .values({ id: "run_integration_test", workspaceId: ws!.id, productId: product!.id, kind: "goal", goal: "Integration test", status: "running", planner: "deterministic", createdBy: user!.id })
    .onConflictDoNothing();
});

const agentCtx = () => ({ workspaceId: ctx.workspaceId, productId: ctx.productId, runId: "run_integration_test", actor: { type: "agent" as const, id: "agent:test" }, isDemo: true, now: new Date() });

describe("governance and execution", () => {
  it("executes an approved budget change exactly as requested, on a demo connection, with an audit trail", async () => {
    const pending = await listApprovals(ctx.workspaceId);
    const budget = pending.find((a) => a.tool === "ads.update_daily_budget");
    expect(budget?.change).toBe("$20/day → $28/day");

    const result = await decideApproval(ctx, budget!.id, "approved");
    expect(result.status).toBe("succeeded");

    const campaign = await db.query.campaigns.findFirst({ where: eq(t.campaigns.id, campaignId) });
    expect(campaign?.dailyBudget).toBe(28);

    const audit = await db.select().from(t.auditLogs).where(and(eq(t.auditLogs.workspaceId, ctx.workspaceId), eq(t.auditLogs.approvalId, budget!.id)));
    const mutation = audit.find((a) => a.isExternalMutation);
    expect(mutation?.payload).toMatchObject({ demo: true, approvedBy: ctx.userId });
  });

  it("refuses to decide the same approval twice", async () => {
    const [decided] = await db.select().from(t.approvals).where(and(eq(t.approvals.workspaceId, ctx.workspaceId), eq(t.approvals.status, "approved")));
    await expect(decideApproval(ctx, decided.id, "approved")).rejects.toThrow(/already decided/);
  });

  it("never repeats a write with the same identity", async () => {
    const again = await invokeTool("ads.update_daily_budget", { campaignId, dailyBudget: 28 }, agentCtx(), { reason: "retry" });
    expect(again).toMatchObject({ status: "succeeded", cached: true });
  });

  it("hard-blocks spend above the daily cap even for an owner-triggered action", async () => {
    const result = await invokeTool("ads.update_daily_budget", { campaignId, dailyBudget: 60 }, agentCtx(), { reason: "try to overspend" });
    expect(result.status).toBe("blocked");
    const campaign = await db.query.campaigns.findFirst({ where: eq(t.campaigns.id, campaignId) });
    expect(campaign?.dailyBudget).toBe(28);
  });

  it("keeps the audit log append-only at the database level", async () => {
    await expect(db.update(t.auditLogs).set({ action: "tampered" }).where(eq(t.auditLogs.workspaceId, ctx.workspaceId))).rejects.toThrow();
    await expect(db.delete(t.auditLogs).where(eq(t.auditLogs.workspaceId, ctx.workspaceId))).rejects.toThrow();
  });

  it("scopes experiment lookups to the workspace", async () => {
    expect(await getExperimentDetail(ctx.workspaceId, 5)).not.toBeNull();
    expect(await getExperimentDetail("ws_someone_else", 5)).toBeNull();
  });
});

describe("measure → learn → recommend", () => {
  it("turns a finished experiment into a learning that changes the next recommendation", async () => {
    const exp6 = await experimentByNumber(6);
    const exp13 = await experimentByNumber(13);

    const before = (await rankQueue(ctx.workspaceId, ctx.productId)).find((r) => r.experiment.id === exp13.id)!;
    expect(before.boostedBy).toHaveLength(0);

    const result = await simulateToCompletion(ctx.workspaceId, exp6.id, { type: "user", id: ctx.userId }, true);
    expect(result.completed).toBe(true);
    expect(result.evaluation.decision).toBe("winner");
    expect(result.learning?.statement).toMatch(/^Confirmed:/);

    const after = (await rankQueue(ctx.workspaceId, ctx.productId)).find((r) => r.experiment.id === exp13.id)!;
    expect(after.boostedBy.map((l) => l.id)).toContain(result.learning!.id);
    expect(after.adjustedConfidence).toBeGreaterThan(before.adjustedConfidence);
    expect(after.score).toBeGreaterThan(before.score);
  });

  it("refuses to fabricate results outside demo workspaces", async () => {
    const exp5 = await experimentByNumber(5);
    await expect(simulateToCompletion(ctx.workspaceId, exp5.id, { type: "user", id: ctx.userId }, false)).rejects.toThrow(/demo/);
  });

  it("suppresses a newly proposed experiment that memory already disproved", async () => {
    const result = await invokeTool(
      "experiments.propose",
      {
        name: "Meta lookalike of trial users",
        hypothesis: "Broad interest targeting on Meta for platform engineers acquires customers below $60 CAC",
        type: "paid_ad",
        channel: "meta_ads",
        audience: "Platform engineers",
        primaryMetric: "cac",
        successThreshold: 60,
        budget: 300,
        impact: 3,
        priorConfidence: 0.4,
        effort: 2,
        informationGain: 3,
        timeToSignalDays: 10,
        durationDays: 21,
        similarityKey: "meta_ads:broad_interest:platform_engineers",
        rationale: "Suggested by a generic playbook for developer tools.",
      },
      agentCtx(),
      { reason: "integration test" },
    );
    expect(result.status).toBe("succeeded");
    if (result.status !== "succeeded") return;
    expect(result.output.status).toBe("suppressed");
    expect(String(result.output.suppressedReason)).toContain("EXP-001");
  });
});
