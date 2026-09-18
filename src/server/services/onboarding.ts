import "server-only";
import { and, desc, eq, ne } from "drizzle-orm";
import type { WorkspaceContext } from "@/server/context";
import { db } from "@/server/db/client";
import * as t from "@/server/db/schema";
import { DomainError } from "@/server/domain/errors";
import { BUDGET_BANDS, getGoalTemplate, goalTitle } from "@/server/domain/strategy/goals";
import type { Locale } from "@/i18n/config";
import { getIntegration } from "@/server/integrations/catalog";
import { normalizeProductUrl } from "@/server/intelligence/url-safety";
import type { AnalysisRunResult } from "@/server/intelligence/analyze";
import { newId } from "@/lib/ids";
import { recordAudit } from "./audit";
import { defaultPolicy } from "./policy-store";
import { getPrimaryProduct } from "./workspace";

export type OnboardingStep = "analyze" | "confirm" | "goal" | "connect" | "strategy" | "done";

function slugify(s: string): string {
  return s.toLowerCase().replace(/^www\./, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 32) || "product";
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = base;
  for (let i = 0; i < 20; i++) {
    const exists = await db.query.workspaces.findFirst({ where: eq(t.workspaces.slug, slug) });
    if (!exists) return slug;
    slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
  }
  throw new DomainError("conflict", "Couldn't create a workspace name. Try again.");
}

export async function ensureLocalUser(existingUserId: string | null): Promise<string> {
  if (existingUserId) return existingUserId;
  const id = newId("usr");
  await db.insert(t.users).values({ id, email: `founder+${id.slice(-8)}@local.kaya`, name: "Founder" });
  return id;
}

export type AnalysisInput = { kind: "url"; url: string } | { kind: "manual"; name: string; description: string; url?: string };

/** Creates Organization → Workspace → Product and a product-analysis run. The caller schedules the run. */
export async function createProductForAnalysis(userId: string, input: AnalysisInput) {
  let url = "";
  let domain: string;
  let name: string;
  if (input.kind === "url") {
    const parsed = normalizeProductUrl(input.url);
    url = parsed.toString();
    domain = parsed.hostname.replace(/^www\./, "");
    name = domain.split(".")[0].replace(/^./, (c) => c.toUpperCase());
  } else {
    if (input.name.trim().length < 2) throw new DomainError("validation", "Add your product's name.");
    if (input.description.trim().split(/\s+/).length < 8) throw new DomainError("validation", "Describe what the product does in at least a sentence or two.");
    if (input.url?.trim()) {
      const parsed = normalizeProductUrl(input.url);
      url = parsed.toString();
      domain = parsed.hostname.replace(/^www\./, "");
    } else {
      domain = slugify(input.name);
    }
    name = input.name.trim().slice(0, 60);
  }

  const slug = await uniqueSlug(slugify(domain.split(".")[0]));
  const orgId = newId("org");
  const workspaceId = newId("ws");
  const productId = newId("prd");
  const runId = newId("run");

  const result: AnalysisRunResult = {
    host: domain,
    stage: "reading",
    pagesRead: 0,
    pagesFound: 0,
    ...(input.kind === "manual" ? { manual: { name, description: input.description.trim().slice(0, 4000) } } : {}),
  };

  await db.transaction(async (tx) => {
    await tx.insert(t.organizations).values({ id: orgId, name, slug: `${slug}-${orgId.slice(-6)}` });
    await tx.insert(t.members).values({ id: newId("mem"), organizationId: orgId, userId, role: "owner" });
    await tx.insert(t.workspaces).values({ id: workspaceId, organizationId: orgId, name, slug, autonomyMode: "copilot" });
    await tx.insert(t.products).values({ id: productId, workspaceId, name, url, domain, status: "analyzing", onboardingStep: "analyze" });
    await tx.insert(t.agentRuns).values({
      id: runId,
      workspaceId,
      productId,
      kind: "product_analysis",
      goal: `Understand ${domain}`,
      status: "queued",
      planner: "deterministic",
      createdBy: userId,
      result: result as unknown as Record<string, unknown>,
    });
    await recordAudit(tx, { workspaceId, actorType: "user", actorId: userId, action: "workspace.created", targetType: "workspace", targetId: workspaceId, payload: { domain, input: input.kind } });
  });

  return { slug, workspaceId, productId, runId };
}

export async function restartAnalysis(ctx: WorkspaceContext): Promise<string> {
  const product = await requireProduct(ctx);
  const previous = await latestRun(ctx.workspaceId, "product_analysis");
  const runId = newId("run");
  await db.insert(t.agentRuns).values({
    id: runId,
    workspaceId: ctx.workspaceId,
    productId: product.id,
    kind: "product_analysis",
    goal: `Understand ${product.domain}`,
    status: "queued",
    planner: "deterministic",
    createdBy: ctx.userId,
    result: { host: product.domain, stage: "reading", pagesRead: 0, pagesFound: 0, manual: (previous?.result as AnalysisRunResult | null)?.manual },
  });
  await db.update(t.products).set({ status: "analyzing", onboardingStep: "analyze", updatedAt: new Date() }).where(eq(t.products.id, product.id));
  return runId;
}

export async function latestRun(workspaceId: string, kind: string) {
  return db.query.agentRuns.findFirst({
    where: and(eq(t.agentRuns.workspaceId, workspaceId), eq(t.agentRuns.kind, kind)),
    orderBy: desc(t.agentRuns.createdAt),
  });
}

async function requireProduct(ctx: WorkspaceContext) {
  const product = await getPrimaryProduct(ctx.workspaceId);
  if (!product) throw new DomainError("not_found", "This workspace has no product.");
  return product;
}

function assertWriter(ctx: WorkspaceContext) {
  if (ctx.role === "viewer") throw new DomainError("forbidden", "Viewers can't change business memory.");
}

/* ───────────────────────── Business memory review ───────────────────────── */

export async function confirmFacts(ctx: WorkspaceContext, factIds: string[]) {
  assertWriter(ctx);
  for (const id of factIds) {
    const [row] = await db
      .update(t.businessFacts)
      .set({ status: "confirmed", userConfirmed: true, lastVerifiedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(t.businessFacts.id, id), eq(t.businessFacts.workspaceId, ctx.workspaceId), ne(t.businessFacts.status, "superseded")))
      .returning({ id: t.businessFacts.id, key: t.businessFacts.key });
    if (row) await recordAudit(db, { workspaceId: ctx.workspaceId, actorType: "user", actorId: ctx.userId, action: "memory.confirmed", targetType: "business_fact", targetId: row.id, payload: { key: row.key } });
  }
}

/** A correction never edits the agent's fact in place: it supersedes it, keeping provenance. */
export async function correctFact(ctx: WorkspaceContext, factId: string, statement: string) {
  assertWriter(ctx);
  const text = statement.trim();
  if (text.length < 2) throw new DomainError("validation", "The correction is empty.");
  const original = await db.query.businessFacts.findFirst({ where: and(eq(t.businessFacts.id, factId), eq(t.businessFacts.workspaceId, ctx.workspaceId)) });
  if (!original) throw new DomainError("not_found", "Fact not found.");
  const id = newId("fact");
  await db.transaction(async (tx) => {
    await tx.update(t.businessFacts).set({ status: "superseded", updatedAt: new Date() }).where(eq(t.businessFacts.id, original.id));
    await tx.insert(t.businessFacts).values({
      id,
      workspaceId: ctx.workspaceId,
      productId: original.productId,
      key: original.key,
      category: original.category,
      statement: text.slice(0, 600),
      kind: "user_correction",
      status: "confirmed",
      confidence: 1,
      sourceLabel: "Founder correction",
      evidence: `Agent proposed: “${original.statement}”`,
      agentGenerated: false,
      userConfirmed: true,
      supersedesId: original.id,
      lastVerifiedAt: new Date(),
    });
    await recordAudit(tx, { workspaceId: ctx.workspaceId, actorType: "user", actorId: ctx.userId, action: "memory.corrected", targetType: "business_fact", targetId: id, payload: { supersedes: original.id, key: original.key } });
  });
  return id;
}

export async function rejectFact(ctx: WorkspaceContext, factId: string) {
  assertWriter(ctx);
  await db
    .update(t.businessFacts)
    .set({ status: "rejected", updatedAt: new Date() })
    .where(and(eq(t.businessFacts.id, factId), eq(t.businessFacts.workspaceId, ctx.workspaceId)));
  await recordAudit(db, { workspaceId: ctx.workspaceId, actorType: "user", actorId: ctx.userId, action: "memory.rejected", targetType: "business_fact", targetId: factId });
}

export async function addContext(ctx: WorkspaceContext, text: string) {
  assertWriter(ctx);
  const product = await requireProduct(ctx);
  const statement = text.trim();
  if (statement.length < 4) throw new DomainError("validation", "Add a bit more detail.");
  const id = newId("fact");
  await db.insert(t.businessFacts).values({
    id,
    workspaceId: ctx.workspaceId,
    productId: product.id,
    key: `context.${id.slice(-6)}`,
    category: "context",
    statement: statement.slice(0, 1000),
    kind: "user_correction",
    status: "confirmed",
    confidence: 1,
    sourceLabel: "Founder",
    agentGenerated: false,
    userConfirmed: true,
    lastVerifiedAt: new Date(),
  });
  await recordAudit(db, { workspaceId: ctx.workspaceId, actorType: "user", actorId: ctx.userId, action: "memory.context_added", targetType: "business_fact", targetId: id });
}

export async function reviewIcp(ctx: WorkspaceContext, icpId: string, decision: "confirmed" | "rejected", name?: string) {
  assertWriter(ctx);
  await db
    .update(t.icps)
    .set({ status: decision, ...(name?.trim() ? { name: name.trim().slice(0, 120), confidence: 1 } : {}) })
    .where(and(eq(t.icps.id, icpId), eq(t.icps.workspaceId, ctx.workspaceId)));
  await recordAudit(db, { workspaceId: ctx.workspaceId, actorType: "user", actorId: ctx.userId, action: `icp.${decision}`, targetType: "icp", targetId: icpId, payload: { renamed: Boolean(name) } });
}

export async function reviewCompetitor(ctx: WorkspaceContext, competitorId: string, decision: "confirmed" | "rejected") {
  assertWriter(ctx);
  await db.update(t.competitors).set({ status: decision }).where(and(eq(t.competitors.id, competitorId), eq(t.competitors.workspaceId, ctx.workspaceId)));
  await recordAudit(db, { workspaceId: ctx.workspaceId, actorType: "user", actorId: ctx.userId, action: `competitor.${decision}`, targetType: "competitor", targetId: competitorId });
}

export async function addCompetitor(ctx: WorkspaceContext, name: string) {
  assertWriter(ctx);
  const product = await requireProduct(ctx);
  if (name.trim().length < 2) throw new DomainError("validation", "Add the competitor's name.");
  await db.insert(t.competitors).values({ id: newId("cmp"), workspaceId: ctx.workspaceId, productId: product.id, name: name.trim().slice(0, 80), kind: "direct", positioning: "Added by the founder", confidence: 1, status: "confirmed" });
}

export async function completeReview(ctx: WorkspaceContext) {
  const product = await requireProduct(ctx);
  await db.update(t.products).set({ onboardingStep: "goal", updatedAt: new Date() }).where(eq(t.products.id, product.id));
}

/* ───────────────────────── Goal & budget ───────────────────────── */

export interface GoalInput {
  template: string;
  baseline: number | null;
  target: number | null;
  deadlineDays: number;
  budgetBand: string;
  customBudget: number | null;
  customText: string | null;
}

export async function saveGoal(ctx: WorkspaceContext, input: GoalInput, locale: Locale = "en") {
  assertWriter(ctx);
  const product = await requireProduct(ctx);
  const template = getGoalTemplate(input.template);
  if (!template) throw new DomainError("validation", "Choose a goal.");
  const band = BUDGET_BANDS.find((b) => b.id === input.budgetBand);
  if (!band) throw new DomainError("validation", "Choose a monthly budget.");
  const monthlyBudget = band.monthly ?? input.customBudget;
  if (monthlyBudget === null || !Number.isFinite(monthlyBudget) || monthlyBudget < 0) throw new DomainError("validation", "Enter a monthly budget (0 for organic only).");
  if (template.id === "custom" && !input.customText?.trim()) throw new DomainError("validation", "Describe your goal.");

  const baseline = template.asksBaseline ? (input.baseline ?? template.baseline) : template.baseline;
  const target = template.asksTarget ? (input.target ?? template.target) : template.target;
  if (template.id === "grow_mrr" && (baseline === null || target === null || target <= baseline)) {
    throw new DomainError("validation", "Enter today's MRR and a higher target.");
  }
  const deadline = new Date(Date.now() + Math.max(14, Math.min(365, input.deadlineDays)) * 86_400_000).toISOString().slice(0, 10);

  await db.transaction(async (tx) => {
    await tx.update(t.goals).set({ status: "replaced" }).where(and(eq(t.goals.productId, product.id), eq(t.goals.status, "active")));
    const id = newId("goal");
    await tx.insert(t.goals).values({
      id,
      workspaceId: ctx.workspaceId,
      productId: product.id,
      template: template.id,
      title: goalTitle(template, baseline, target, input.customText ?? undefined, locale),
      metric: template.metric,
      baselineValue: baseline,
      targetValue: target,
      unit: template.unit,
      deadline,
      monthlyBudget,
      budgetBand: band.id,
    });
    await tx
      .insert(t.budgetPolicies)
      .values({ workspaceId: ctx.workspaceId, ...defaultPolicy(monthlyBudget) })
      .onConflictDoUpdate({ target: t.budgetPolicies.workspaceId, set: { ...defaultPolicy(monthlyBudget), updatedAt: new Date() } });
    await tx.update(t.products).set({ onboardingStep: "connect", updatedAt: new Date() }).where(eq(t.products.id, product.id));
    await recordAudit(tx, { workspaceId: ctx.workspaceId, actorType: "user", actorId: ctx.userId, action: "goal.set", targetType: "goal", targetId: id, payload: { template: template.id, monthlyBudget } });
  });
}

/* ───────────────────────── Integrations ───────────────────────── */

/**
 * Live OAuth requires provider credentials this build doesn't have. Connecting
 * creates an explicit demo connection: same flow and permissions screen, no
 * external account, labelled as demo everywhere.
 */
export async function setDemoIntegration(ctx: WorkspaceContext, provider: string, connect: boolean) {
  if (ctx.role !== "owner" && ctx.role !== "admin") throw new DomainError("forbidden", "Only owners and admins can manage integrations.");
  const def = getIntegration(provider);
  if (!def) throw new DomainError("validation", "Unknown integration.");
  const values = connect
    ? { status: "connected" as const, mode: "demo" as const, grantedCapabilities: [...def.reads, ...def.writes], health: "ok", connectedAt: new Date(), syncError: null }
    : { status: "disconnected" as const, grantedCapabilities: [], health: "unknown", connectedAt: null };
  await db
    .insert(t.integrations)
    .values({ id: newId("int"), workspaceId: ctx.workspaceId, provider, ...values })
    .onConflictDoUpdate({ target: [t.integrations.workspaceId, t.integrations.provider], set: values });
  await recordAudit(db, {
    workspaceId: ctx.workspaceId,
    actorType: "user",
    actorId: ctx.userId,
    action: connect ? "integration.connected" : "integration.disconnected",
    targetType: "integration",
    targetId: provider,
    payload: { mode: "demo", capabilities: connect ? values.grantedCapabilities : [] },
  });
}

export async function completeConnect(ctx: WorkspaceContext) {
  const product = await requireProduct(ctx);
  await db.update(t.products).set({ onboardingStep: "strategy", updatedAt: new Date() }).where(eq(t.products.id, product.id));
}
