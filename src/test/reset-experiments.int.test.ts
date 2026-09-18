import { and, eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import { db } from "@/server/db/client";
import * as t from "@/server/db/schema";
import type { WorkspaceContext } from "@/server/context";
import { newId } from "@/lib/ids";
import { resetExperiments } from "@/server/services/reset-experiments";
import { startExperimentRun } from "@/server/agent/runtime";
import { decideApproval } from "@/server/services/approvals";

let ctx: WorkspaceContext;
let productId: string;
let firstId: string;
let secondId: string;
let laterId: string;
let runId: string;
let approvalId: string;
let assetId: string;
let learningId: string;
let campaignId: string;
let untouchedId: string;

beforeAll(async () => {
  const template = await db.query.experiments.findFirst();
  const versionTemplate = await db.query.strategyVersions.findFirst();
  if (!template || !versionTemplate) throw new Error("Missing seeded fixtures");
  untouchedId = template.id;
  const workspaceId = newId("ws"), orgId = newId("org"), userId = newId("usr");
  productId = newId("prd");
  await db.insert(t.users).values({ id: userId, name: "Reset owner", email: `${userId}@reset.test` });
  await db.insert(t.organizations).values({ id: orgId, name: "Reset", slug: orgId });
  await db.insert(t.workspaces).values({ id: workspaceId, organizationId: orgId, name: "Reset", slug: workspaceId });
  await db.insert(t.members).values({ id: newId("mem"), organizationId: orgId, userId, role: "owner" });
  await db.insert(t.products).values({ id: productId, workspaceId, name: "Reset", url: "https://reset.test", domain: "reset.test", status: "active", onboardingStep: "done" });
  const strategyId = newId("str"), v1 = newId("sv"), v2 = newId("sv");
  await db.insert(t.strategies).values({ id: strategyId, workspaceId, productId, currentVersion: 2 });
  await db.insert(t.strategyVersions).values([1, 2].map((version) => ({ ...versionTemplate, id: version === 1 ? v1 : v2, workspaceId, strategyId, version })));
  firstId = newId("exp"); secondId = newId("exp"); laterId = newId("exp");
  await db.insert(t.experiments).values([firstId, secondId, laterId].map((id, i) => ({
    ...template, id, workspaceId, productId, strategyVersionId: i < 2 ? v1 : v2, icpId: null,
    number: i + 1, name: `Reset experiment ${i + 1}`, type: "community", channel: "hacker_news",
    status: i === 0 ? "completed" as const : "awaiting_approval" as const,
    spend: 12, outcome: i === 0 ? "loser" as const : null, resultSummary: "Old result", startedAt: new Date(),
  })));
  runId = newId("run"); assetId = newId("asset"); approvalId = newId("apr"); learningId = newId("lrn"); campaignId = newId("cmp");
  await db.insert(t.agentRuns).values({ id: runId, workspaceId, productId, kind: "goal", goal: "Run experiment", planner: "deterministic", status: "awaiting_approval", createdBy: userId });
  const callId = newId("tc");
  await db.insert(t.toolCalls).values({ id: callId, workspaceId, runId, tool: "content.draft_asset", capability: "DRAFT_CONTENT", risk: "R1", input: { experimentId: secondId }, output: { assetId }, status: "awaiting_approval", idempotencyKey: `content.draft_asset:${secondId}` });
  await db.insert(t.approvals).values({ id: approvalId, workspaceId, runId, toolCallId: callId, experimentId: secondId, title: "Publish", reason: "Test", risk: "R2", tool: "pages.publish", toolInput: {}, policyDecision: { outcome: "require_approval", reasons: [], checks: [], evaluatedAt: new Date().toISOString() } });
  await db.insert(t.creativeAssets).values({ id: assetId, workspaceId, experimentId: firstId, kind: "social_post", channel: "hacker_news", title: "Old draft", body: "Old draft body" });
  await db.insert(t.learnings).values({ id: learningId, workspaceId, productId, statement: "Old result", kind: "loser", confidence: 0.9, impact: "high", evidenceExperimentIds: [firstId], similarityKey: template.similarityKey });
  await db.insert(t.campaigns).values({ id: campaignId, workspaceId, experimentId: firstId, name: "Live campaign", channel: "google_search", externalId: "external-test", status: "paused" });
  ctx = { userId, name: "Owner", email: `${userId}@reset.test`, isGuest: false, organizationId: orgId, workspaceId, workspaceSlug: workspaceId, workspaceName: "Reset", workspaceIconUrl: null, role: "owner", autonomyMode: "copilot", isDemo: false };
});

const experiments = () => db.select().from(t.experiments).where(eq(t.experiments.workspaceId, ctx.workspaceId));

describe("returning to the initial experiments", () => {
  it("enforces permissions, confirmation and product ownership without changing data", async () => {
    for (const role of ["viewer", "member"] as const) await expect(resetExperiments({ ...ctx, role }, productId, "Reset")).rejects.toThrow();
    await expect(resetExperiments(ctx, productId, "wrong")).rejects.toThrow();
    await expect(resetExperiments(ctx, "other-product", "Reset")).rejects.toThrow();
    expect(await experiments()).toHaveLength(3);
  });

  it("refuses an executing task or active live campaign atomically", async () => {
    await db.update(t.agentRuns).set({ status: "running" }).where(eq(t.agentRuns.id, runId));
    await expect(resetExperiments(ctx, productId, "Reset")).rejects.toThrow(/still executing/);
    await db.update(t.agentRuns).set({ status: "awaiting_approval" }).where(eq(t.agentRuns.id, runId));
    await db.update(t.campaigns).set({ status: "active" }).where(eq(t.campaigns.id, campaignId));
    await expect(resetExperiments(ctx, productId, "Reset")).rejects.toThrow(/Pause/);
    expect(await experiments()).toHaveLength(3);
    expect((await db.query.approvals.findFirst({ where: eq(t.approvals.id, approvalId) }))?.status).toBe("pending");
    await db.update(t.campaigns).set({ status: "paused" }).where(eq(t.campaigns.id, campaignId));
  });

  it("restores only the initial list and preserves historical content and other workspaces", async () => {
    const untouched = await db.query.experiments.findFirst({ where: eq(t.experiments.id, untouchedId) });
    expect(await resetExperiments(ctx, productId, "Reset")).toEqual({ count: 2 });
    const rows = await experiments();
    expect(rows.filter((e) => e.status === "archived")).toHaveLength(3);
    const proposed = rows.filter((e) => e.status === "proposed");
    expect(proposed).toHaveLength(2);
    for (const e of proposed) {
      expect(e).toMatchObject({ spend: 0, outcome: null, resultSummary: null, startedAt: null, endedAt: null, confidence: null });
      expect([firstId, secondId, laterId]).not.toContain(e.id);
    }
    expect((await db.query.approvals.findFirst({ where: eq(t.approvals.id, approvalId) }))?.status).toBe("expired");
    expect((await db.query.agentRuns.findFirst({ where: eq(t.agentRuns.id, runId) }))?.status).toBe("cancelled");
    expect((await db.query.learnings.findFirst({ where: eq(t.learnings.id, learningId) }))?.status).toBe("expired");
    expect((await db.query.creativeAssets.findFirst({ where: eq(t.creativeAssets.id, assetId) }))?.body).toBe("Old draft body");
    expect(await db.query.experiments.findFirst({ where: eq(t.experiments.id, untouchedId) })).toEqual(untouched);
    expect((await db.query.products.findFirst({ where: eq(t.products.id, productId) }))?.onboardingStep).toBe("done");
    expect(await db.query.strategies.findFirst({ where: eq(t.strategies.productId, productId) })).toBeTruthy();
  });

  it("rejects stale launches and approvals, then creates a fresh draft when relaunched", async () => {
    await expect(startExperimentRun({ workspaceId: ctx.workspaceId, productId, userId: ctx.userId, isDemo: false, experimentId: firstId })).rejects.toThrow(/archived/);
    await expect(decideApproval({ ...ctx, productId }, approvalId, "approved")).rejects.toThrow();
    const restored = (await experiments()).find((e) => e.status === "proposed")!;
    const newRun = await startExperimentRun({ workspaceId: ctx.workspaceId, productId, userId: ctx.userId, isDemo: false, experimentId: restored.id });
    expect((await db.query.agentRuns.findFirst({ where: eq(t.agentRuns.id, newRun) }))?.status).toBe("completed");
    const draft = await db.query.creativeAssets.findFirst({ where: eq(t.creativeAssets.experimentId, restored.id) });
    expect(draft).toBeTruthy();
    expect(draft!.id).not.toBe(assetId);
  });

  it("can reset again without growing the initial queue", async () => {
    expect(await resetExperiments(ctx, productId, "Reset")).toEqual({ count: 2 });
    expect((await experiments()).filter((e) => e.status === "proposed")).toHaveLength(2);
    expect(await db.select().from(t.auditLogs).where(and(eq(t.auditLogs.workspaceId, ctx.workspaceId), eq(t.auditLogs.action, "experiments.reset")))).toHaveLength(2);
  });
});
