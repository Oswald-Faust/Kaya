import "server-only";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { replyFromMemory } from "./kai-engine";
import { db } from "@/server/db/client";
import {
  brandProfiles,
  businessFacts,
  competitors,
  experiments,
  goals,
  icps,
  kaiConversations,
  kaiMessages,
  learnings,
  personas,
  products,
  strategies,
  strategyVersions,
  type KaiSource,
} from "@/server/db/schema";

import { DEFAULT_LOCALE, type Locale } from "@/i18n/config";
import { newId } from "@/lib/ids";

export interface WorkspaceMemory {
  product: {
    name: string;
    url: string | null;
    domain: string;
    oneLiner: string | null;
    category: string | null;
  } | null;
  brand: {
    voiceSummary: string;
    traits: string[];
    wordsToUse: string[];
    wordsToAvoid: string[];
  } | null;
  facts: Array<{
    id: string;
    key: string;
    category: string;
    statement: string;
    kind: string;
    status: string;
    confidence: number;
    evidence: string | null;
  }>;
  icps: Array<{
    id: string;
    name: string;
    description: string;
    pains: string[];
    triggers: string[];
    objections: string[];
    whereTheyAre: string[];
    priority: number;
  }>;
  personas: Array<{
    id: string;
    name: string;
    role: string;
    jobs: string[];
  }>;
  competitors: Array<{
    id: string;
    name: string;
    url: string | null;
    kind: string;
    positioning: string | null;
    pricingSummary: string | null;
    wedge: string | null;
    confidence: number;
  }>;
  learnings: Array<{
    id: string;
    kind: string;
    statement: string;
    confidence: number;
    impact: string;
    metricLabel: string | null;
  }>;
  strategy: {
    version: number;
    summary: string;
    pillars: string[];
    targetCustomer?: string;
  } | null;
  goal: {
    title: string;
    targetValue: number | null;
    baselineValue: number | null;
    unit: string;
  } | null;
  experiments: Array<{
    id: string;
    number: number;
    name: string;
    status: string;
    channel: string;
    hypothesis: string;
  }>;
}

export async function retrieveWorkspaceMemory(workspaceId: string, productId: string): Promise<WorkspaceMemory> {
  const [
    prod,
    brand,
    factsList,
    icpsList,
    personasList,
    competitorsList,
    learningsList,
    activeGoal,
    strat,
    experimentsList,
  ] = await Promise.all([
    db.query.products.findFirst({ where: and(eq(products.id, productId), eq(products.workspaceId, workspaceId)) }),
    db.query.brandProfiles.findFirst({ where: and(eq(brandProfiles.productId, productId), eq(brandProfiles.workspaceId, workspaceId)) }),
    db
      .select({
        id: businessFacts.id,
        key: businessFacts.key,
        category: businessFacts.category,
        statement: businessFacts.statement,
        kind: businessFacts.kind,
        status: businessFacts.status,
        confidence: businessFacts.confidence,
        evidence: businessFacts.evidence,
      })
      .from(businessFacts)
      .where(and(eq(businessFacts.workspaceId, workspaceId), eq(businessFacts.productId, productId), inArray(businessFacts.status, ["confirmed", "proposed"])))
      .orderBy(desc(businessFacts.confidence)),
    db
      .select({
        id: icps.id,
        name: icps.name,
        description: icps.description,
        pains: icps.pains,
        triggers: icps.triggers,
        objections: icps.objections,
        whereTheyAre: icps.whereTheyAre,
        priority: icps.priority,
      })
      .from(icps)
      .where(and(eq(icps.workspaceId, workspaceId), eq(icps.productId, productId)))
      .orderBy(asc(icps.priority)),
    db
      .select({
        id: personas.id,
        name: personas.name,
        role: personas.role,
        jobs: personas.jobs,
      })
      .from(personas)
      .where(eq(personas.workspaceId, workspaceId)),
    db
      .select({
        id: competitors.id,
        name: competitors.name,
        url: competitors.url,
        kind: competitors.kind,
        positioning: competitors.positioning,
        pricingSummary: competitors.pricingSummary,
        wedge: competitors.wedge,
        confidence: competitors.confidence,
      })
      .from(competitors)
      .where(and(eq(competitors.workspaceId, workspaceId), eq(competitors.productId, productId)))
      .orderBy(desc(competitors.confidence)),
    db
      .select({
        id: learnings.id,
        kind: learnings.kind,
        statement: learnings.statement,
        confidence: learnings.confidence,
        impact: learnings.impact,
        metricLabel: learnings.metricLabel,
      })
      .from(learnings)
      .where(eq(learnings.workspaceId, workspaceId))
      .orderBy(desc(learnings.createdAt)),
    db.query.goals.findFirst({
      where: and(eq(goals.workspaceId, workspaceId), eq(goals.productId, productId), eq(goals.status, "active")),
    }),
    db.query.strategies.findFirst({
      where: and(eq(strategies.workspaceId, workspaceId), eq(strategies.productId, productId)),
    }),
    db
      .select({
        id: experiments.id,
        number: experiments.number,
        name: experiments.name,
        status: experiments.status,
        channel: experiments.channel,
        hypothesis: experiments.hypothesis,
      })
      .from(experiments)
      .where(eq(experiments.workspaceId, workspaceId))
      .orderBy(desc(experiments.number))
      .limit(10),
  ]);

  let activeStrategy: { version: number; summary: string; pillars: string[]; targetCustomer?: string } | null = null;
  if (strat) {
    const versionRow = await db.query.strategyVersions.findFirst({
      where: and(eq(strategyVersions.strategyId, strat.id), eq(strategyVersions.version, strat.currentVersion)),
    });
    if (versionRow) {
      activeStrategy = {
        version: versionRow.version,
        summary: versionRow.summary,
        pillars: versionRow.content?.messagingPillars?.map((p) => p.pillar) ?? [],
        targetCustomer: versionRow.content?.positioning?.forWho,
      };
    }
  }

  return {
    product: prod ? { name: prod.name, url: prod.url, domain: prod.domain, oneLiner: prod.oneLiner, category: prod.category } : null,
    brand: brand
      ? {
          voiceSummary: brand.voiceSummary,
          traits: brand.traits ?? [],
          wordsToUse: brand.wordsToUse ?? [],
          wordsToAvoid: brand.wordsToAvoid ?? [],
        }
      : null,
    facts: factsList,
    icps: icpsList,
    personas: personasList,
    competitors: competitorsList,
    learnings: learningsList,
    strategy: activeStrategy,
    goal: activeGoal
      ? {
          title: activeGoal.title,
          targetValue: activeGoal.targetValue,
          baselineValue: activeGoal.baselineValue,
          unit: activeGoal.unit,
        }
      : null,
    experiments: experimentsList,
  };
}

export function filterRelevantMemory(memory: WorkspaceMemory, query: string): { contextText: string; sources: KaiSource[] } {
  const q = query.toLowerCase();
  const sources: KaiSource[] = [];

  // Match facts
  const matchedFacts = memory.facts.filter((f) => {
    const text = `${f.key} ${f.category} ${f.statement}`.toLowerCase();
    return q.split(/\s+/).some((word) => word.length > 3 && text.includes(word));
  });
  const selectedFacts = (matchedFacts.length > 0 ? matchedFacts : memory.facts.slice(0, 8)).slice(0, 10);
  selectedFacts.forEach((f) => {
    sources.push({
      type: "fact",
      label: f.key,
      detail: f.statement,
      confidence: f.confidence,
    });
  });

  // Match ICPs
  const matchedIcps = memory.icps.filter((i) => {
    const text = `${i.name} ${i.description} ${i.pains.join(" ")}`.toLowerCase();
    return q.split(/\s+/).some((word) => word.length > 3 && text.includes(word));
  });
  const selectedIcps = matchedIcps.length > 0 ? matchedIcps : memory.icps.slice(0, 2);
  selectedIcps.forEach((i) => {
    sources.push({
      type: "icp",
      label: i.name,
      detail: i.description,
    });
  });

  // Match Competitors
  const matchedCompetitors = memory.competitors.filter((c) => {
    const text = `${c.name} ${c.positioning ?? ""} ${c.wedge ?? ""}`.toLowerCase();
    return q.split(/\s+/).some((word) => word.length > 3 && text.includes(word));
  });
  const selectedCompetitors = matchedCompetitors.length > 0 ? matchedCompetitors : memory.competitors.slice(0, 3);
  selectedCompetitors.forEach((c) => {
    sources.push({
      type: "competitor",
      label: c.name,
      detail: c.positioning ?? c.wedge ?? undefined,
      confidence: c.confidence,
    });
  });

  // Match Learnings
  const matchedLearnings = memory.learnings.filter((l) => {
    const text = `${l.statement} ${l.metricLabel ?? ""}`.toLowerCase();
    return q.split(/\s+/).some((word) => word.length > 3 && text.includes(word));
  });
  const selectedLearnings = matchedLearnings.length > 0 ? matchedLearnings : memory.learnings.slice(0, 4);
  selectedLearnings.forEach((l) => {
    sources.push({
      type: "learning",
      label: `${l.kind.toUpperCase()}: ${l.statement}`,
      detail: l.metricLabel ?? undefined,
      confidence: l.confidence,
    });
  });

  // Context text construction for prompt / synthesizer
  const lines: string[] = [];
  if (memory.product) {
    lines.push(`PRODUCT: ${memory.product.name} (${memory.product.domain})`);
    if (memory.product.oneLiner) lines.push(`One-Liner: ${memory.product.oneLiner}`);
    if (memory.product.category) lines.push(`Category: ${memory.product.category}`);
  }
  if (memory.brand) {
    lines.push(`BRAND VOICE: ${memory.brand.voiceSummary}`);
    if (memory.brand.traits.length > 0) lines.push(`Traits: ${memory.brand.traits.join(", ")}`);
  }
  if (memory.goal) {
    lines.push(`ACTIVE GOAL: ${memory.goal.title} (Target: ${memory.goal.targetValue ?? "N/A"} ${memory.goal.unit})`);
  }
  if (memory.strategy) {
    lines.push(`ACTIVE STRATEGY: v${memory.strategy.version} - ${memory.strategy.summary}`);
    if (memory.strategy.pillars.length > 0) lines.push(`Pillars: ${memory.strategy.pillars.join("; ")}`);
  }
  if (selectedFacts.length > 0) {
    lines.push("BUSINESS FACTS (RAG):");
    selectedFacts.forEach((f) => lines.push(`- [${f.status.toUpperCase()}] ${f.key}: ${f.statement} (confidence: ${f.confidence})`));
  }
  if (selectedIcps.length > 0) {
    lines.push("IDEAL CUSTOMER PROFILES (ICPs):");
    selectedIcps.forEach((i) => {
      lines.push(`- ${i.name}: ${i.description}`);
      if (i.pains.length > 0) lines.push(`  Pains: ${i.pains.join(", ")}`);
      if (i.triggers.length > 0) lines.push(`  Triggers: ${i.triggers.join(", ")}`);
      if (i.objections.length > 0) lines.push(`  Objections: ${i.objections.join(", ")}`);
    });
  }
  if (selectedCompetitors.length > 0) {
    lines.push("COMPETITORS & WEDGES:");
    selectedCompetitors.forEach((c) => {
      lines.push(`- ${c.name} (${c.kind}): ${c.positioning ?? "No positioning summary"} | Wedge: ${c.wedge ?? "N/A"}`);
    });
  }
  if (selectedLearnings.length > 0) {
    lines.push("EXPERIMENT LEARNINGS:");
    selectedLearnings.forEach((l) => {
      lines.push(`- [${l.kind.toUpperCase()}] ${l.statement} (Impact: ${l.impact})`);
    });
  }

  return { contextText: lines.join("\n"), sources };
}

/** Conversations are private to their author and scoped to the authorized workspace. */
export async function listKaiConversations(
  workspaceId: string,
  userId: string,
  search = "",
  offset = 0,
  status: "active" | "archived" | "all" = "active"
) {
  const pattern = `%${search.replace(/[\\%_]/g, "\\$&")}%`;
  const conditions = [
    eq(kaiConversations.workspaceId, workspaceId),
    eq(kaiConversations.userId, userId),
  ];
  if (status !== "all") {
    conditions.push(eq(kaiConversations.status, status));
  }
  if (search) {
    conditions.push(
      sql`(${kaiConversations.title} ilike ${pattern} or exists (select 1 from ${kaiMessages} where ${kaiMessages.conversationId} = ${kaiConversations.id} and ${kaiMessages.content} ilike ${pattern}))`
    );
  }
  const rows = await db
    .select({
      id: kaiConversations.id,
      title: kaiConversations.title,
      status: kaiConversations.status,
      model: kaiConversations.model,
      updatedAt: kaiConversations.updatedAt,
      archivedAt: kaiConversations.archivedAt,
    })
    .from(kaiConversations)
    .where(and(...conditions))
    .orderBy(desc(kaiConversations.updatedAt), desc(kaiConversations.id))
    .limit(41)
    .offset(offset);
  return { items: rows.slice(0, 40), hasMore: rows.length > 40 };
}

export async function getKaiConversation(workspaceId: string, userId: string, conversationId?: string) {
  const conversation = await db.query.kaiConversations.findFirst({
    where: and(
      eq(kaiConversations.workspaceId, workspaceId),
      eq(kaiConversations.userId, userId),
      conversationId ? eq(kaiConversations.id, conversationId) : undefined
    ),
    orderBy: desc(kaiConversations.updatedAt),
  });
  if (!conversation) {
    if (conversationId) throw new Error("Conversation unavailable.");
    return { conversation: null, messages: [] };
  }
  const messages = await db
    .select()
    .from(kaiMessages)
    .where(and(eq(kaiMessages.workspaceId, workspaceId), eq(kaiMessages.conversationId, conversation.id)))
    .orderBy(asc(kaiMessages.createdAt), asc(kaiMessages.id));
  return { conversation, messages };
}

export async function deleteKaiConversation(workspaceId: string, userId: string, conversationId: string) {
  const deleted = await db
    .delete(kaiConversations)
    .where(
      and(
        eq(kaiConversations.id, conversationId),
        eq(kaiConversations.workspaceId, workspaceId),
        eq(kaiConversations.userId, userId)
      )
    )
    .returning({ id: kaiConversations.id });
  if (!deleted.length) {
    throw new Error("Conversation unavailable or already deleted.");
  }
  return { ok: true };
}

export async function archiveKaiConversation(workspaceId: string, userId: string, conversationId: string) {
  const updated = await db
    .update(kaiConversations)
    .set({
      status: "archived",
      archivedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(kaiConversations.id, conversationId),
        eq(kaiConversations.workspaceId, workspaceId),
        eq(kaiConversations.userId, userId)
      )
    )
    .returning({ id: kaiConversations.id });
  if (!updated.length) {
    throw new Error("Conversation unavailable.");
  }
  return { ok: true };
}

export async function unarchiveKaiConversation(workspaceId: string, userId: string, conversationId: string) {
  const updated = await db
    .update(kaiConversations)
    .set({
      status: "active",
      archivedAt: null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(kaiConversations.id, conversationId),
        eq(kaiConversations.workspaceId, workspaceId),
        eq(kaiConversations.userId, userId)
      )
    )
    .returning({ id: kaiConversations.id });
  if (!updated.length) {
    throw new Error("Conversation unavailable.");
  }
  return { ok: true };
}

export async function updateKaiConversationModel(
  workspaceId: string,
  userId: string,
  conversationId: string,
  model: string
) {
  const updated = await db
    .update(kaiConversations)
    .set({ model, updatedAt: new Date() })
    .where(
      and(
        eq(kaiConversations.id, conversationId),
        eq(kaiConversations.workspaceId, workspaceId),
        eq(kaiConversations.userId, userId)
      )
    )
    .returning({ id: kaiConversations.id });
  return { ok: updated.length > 0 };
}

export async function renameKaiConversation(
  workspaceId: string,
  userId: string,
  conversationId: string,
  title: string
) {
  const trimmed = title.trim().slice(0, 120);
  if (!trimmed) throw new Error("Title cannot be empty.");
  const updated = await db
    .update(kaiConversations)
    .set({ title: trimmed, updatedAt: new Date() })
    .where(
      and(
        eq(kaiConversations.id, conversationId),
        eq(kaiConversations.workspaceId, workspaceId),
        eq(kaiConversations.userId, userId)
      )
    )
    .returning({ id: kaiConversations.id, title: kaiConversations.title });
  return { ok: updated.length > 0, title: updated[0]?.title ?? trimmed };
}

export async function askKai({
  workspaceId,
  productId,
  userId,
  message,
  locale = DEFAULT_LOCALE,
  conversationId,
  model = "kai",
}: {
  workspaceId: string;
  productId: string;
  userId: string;
  message: string;
  locale?: Locale;
  conversationId?: string;
  model?: string;
}) {
  if (!message.trim() || message.length > 4000) throw new Error("Invalid message.");
  const current = conversationId ? await getKaiConversation(workspaceId, userId, conversationId) : null;
  const memory = await retrieveWorkspaceMemory(workspaceId, productId);
  const answer = replyFromMemory(memory, message, current?.messages ?? [], locale);
  const id = conversationId ?? newId("kconv");
  const now = new Date();
  const effectiveModel = model || current?.conversation?.model || "kai";
  const userMessage = {
    id: newId("kmsg"),
    workspaceId,
    conversationId: id,
    role: "user",
    content: message,
    sources: [] as KaiSource[],
    suggestedAction: null,
    model: effectiveModel,
    createdAt: now,
  };
  const assistantMessage = {
    id: newId("kmsg"),
    workspaceId,
    conversationId: id,
    role: "assistant",
    content: answer.reply,
    sources: answer.sources,
    suggestedAction: answer.suggestedAction,
    model: effectiveModel,
    createdAt: new Date(now.getTime() + 1),
  };
  await db.transaction(async (tx) => {
    if (!conversationId) {
      await tx.insert(kaiConversations).values({
        id,
        workspaceId,
        userId,
        title: message.slice(0, 80),
        status: "active",
        model: effectiveModel,
      });
    } else {
      await tx
        .update(kaiConversations)
        .set({
          updatedAt: assistantMessage.createdAt,
          model: effectiveModel,
        })
        .where(
          and(
            eq(kaiConversations.id, id),
            eq(kaiConversations.workspaceId, workspaceId),
            eq(kaiConversations.userId, userId)
          )
        );
    }
    await tx.insert(kaiMessages).values([userMessage, assistantMessage]);
  });
  return { ...answer, conversationId: id, model: effectiveModel, messages: [userMessage, assistantMessage] };
}

export async function editAndRegenerateKaiMessage({
  workspaceId,
  productId,
  userId,
  conversationId,
  messageId,
  newContent,
  locale = DEFAULT_LOCALE,
  model = "kai",
}: {
  workspaceId: string;
  productId: string;
  userId: string;
  conversationId: string;
  messageId: string;
  newContent: string;
  locale?: Locale;
  model?: string;
}) {
  const trimmed = newContent.trim();
  if (!trimmed || trimmed.length > 4000) throw new Error("Invalid message.");

  const current = await getKaiConversation(workspaceId, userId, conversationId);
  if (!current || !current.conversation) throw new Error("Conversation not found.");

  const targetMsgIndex = current.messages.findIndex((m) => m.id === messageId);
  if (targetMsgIndex === -1) throw new Error("Message not found.");

  const priorMessages = current.messages.slice(0, targetMsgIndex);
  const msgsToDelete = current.messages.slice(targetMsgIndex + 1).map((m) => m.id);

  const memory = await retrieveWorkspaceMemory(workspaceId, productId);
  const answer = replyFromMemory(memory, trimmed, priorMessages, locale);
  const effectiveModel = model || current.conversation.model || "kai";
  const now = new Date();

  const assistantMessage = {
    id: newId("kmsg"),
    workspaceId,
    conversationId,
    role: "assistant",
    content: answer.reply,
    sources: answer.sources,
    suggestedAction: answer.suggestedAction,
    model: effectiveModel,
    createdAt: new Date(now.getTime() + 1),
  };

  await db.transaction(async (tx) => {
    // 1. Update the user message content
    await tx
      .update(kaiMessages)
      .set({
        content: trimmed,
        model: effectiveModel,
      })
      .where(
        and(
          eq(kaiMessages.id, messageId),
          eq(kaiMessages.conversationId, conversationId),
          eq(kaiMessages.workspaceId, workspaceId)
        )
      );

    // 2. Delete any messages that were after this user message
    if (msgsToDelete.length > 0) {
      await tx.delete(kaiMessages).where(inArray(kaiMessages.id, msgsToDelete));
    }

    // 3. Insert the new assistant reply
    await tx.insert(kaiMessages).values(assistantMessage);

    // 4. Update conversation metadata
    await tx
      .update(kaiConversations)
      .set({
        updatedAt: assistantMessage.createdAt,
        model: effectiveModel,
      })
      .where(
        and(
          eq(kaiConversations.id, conversationId),
          eq(kaiConversations.workspaceId, workspaceId),
          eq(kaiConversations.userId, userId)
        )
      );
  });

  const refreshed = await getKaiConversation(workspaceId, userId, conversationId);
  return {
    ...answer,
    conversationId,
    model: effectiveModel,
    messages: refreshed?.messages ?? [],
  };
}
