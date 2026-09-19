import type { Metadata } from "next";
import { getI18n } from "@/i18n/server";
import { KaiChat, type MessageItem } from "@/components/kai/kai-chat";
import { requireWorkspace } from "@/server/context";
import { getKaiConversation, listKaiConversations, retrieveWorkspaceMemory } from "@/server/services/kai";
import { getPrimaryProduct } from "@/server/services/workspace";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.app.kai.metaTitle };
}

export default async function KaiPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspace: string }>;
  searchParams: Promise<{ q?: string; conversation?: string }>;
}) {
  const { workspace } = await params;
  const { q, conversation: selected } = await searchParams;
  const ctx = await requireWorkspace(workspace);
  const product = await getPrimaryProduct(ctx.workspaceId);

  const [{ conversation, messages }, history] = await Promise.all([
    selected === "new" || q ? Promise.resolve({ conversation: null, messages: [] }) : getKaiConversation(ctx.workspaceId, ctx.userId, typeof selected === "string" ? selected : undefined),
    listKaiConversations(ctx.workspaceId, ctx.userId),
  ]);
  // What Kai can read, shown before the first question so its answers feel grounded.
  const memory = product ? await retrieveWorkspaceMemory(ctx.workspaceId, product.id).catch(() => null) : null;
  const memoryStats = memory
    ? { facts: memory.facts.length, customers: memory.icps.length, competitors: memory.competitors.length, learnings: memory.learnings.length, experiments: memory.experiments.length }
    : null;

  const initialMessages: MessageItem[] = messages.map((m) => ({
    id: m.id,
    role: m.role,
    content: m.content,
    sources: m.sources ?? [],
    suggestedAction: m.suggestedAction ?? null,
    createdAt: m.createdAt,
  }));

  return (
    <div className="mx-auto max-w-[1600px] px-2 py-3 sm:px-4">
      <KaiChat
        slug={ctx.workspaceSlug}
        key={ctx.workspaceId}
        initialMessages={initialMessages}
        initialConversationId={conversation?.id}
        initialTitle={conversation?.title}
        initialModel={conversation?.model ?? "kai"}
        initialStatus={conversation?.status ?? "active"}
        initialConversations={history.items}
        initialHasMore={history.hasMore}
        productName={product?.name ?? ctx.workspaceName}
        firstName={ctx.isGuest ? "" : (ctx.name.split(" ")[0] ?? "")}
        memoryStats={memoryStats}
        initialQuery={typeof q === "string" ? q : ""}
      />
    </div>
  );
}
