"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Archive,
  Copy,
  ArchiveRestore,
  ArrowUp,
  ArrowUpRight,
  BookOpen,
  Bot,
  Check,
  ChevronUp,
  Cpu,
  History,
  MessageSquare,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import {
  archiveKaiConversationAction,
  deleteKaiConversationAction,
  editKaiMessageAction,
  loadKaiConversationAction,
  renameKaiConversationAction,
  searchKaiConversationsAction,
  sendKaiMessageAction,
  unarchiveKaiConversationAction,
  updateKaiConversationModelAction,
} from "@/app/(app)/w/[workspace]/actions";
import { KaiMark } from "@/components/brand/kai-mark";
import { KaiAnswer, KaiSources, STARTER_ICONS, groupConversations } from "@/components/kai/kai-parts";
import { Spinner } from "@/components/ui/button";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/cn";
import type { KaiSource, KaiSuggestedAction } from "@/server/db/schema";

export interface MessageItem {
  id: string;
  role: string;
  content: string;
  sources: KaiSource[];
  suggestedAction: KaiSuggestedAction | null;
  model?: string | null;
  createdAt: Date | string;
}

export interface ConversationItem {
  id: string;
  title: string;
  status?: string;
  model?: string;
  updatedAt: Date | string;
  archivedAt?: Date | string | null;
}

export interface ModelOption {
  id: string;
  name: string;
  badge: string;
  isDefault?: boolean;
}

function getModelOptions(fr: boolean): ModelOption[] {
  return [
    {
      id: "kai",
      name: "Kai",
      badge: fr ? "Défaut · RAG" : "Default · RAG",
      isDefault: true,
    },
    {
      id: "claude-3-5-sonnet",
      name: "Claude 3.5 Sonnet",
      badge: "Anthropic",
    },
    {
      id: "claude-3-7-sonnet",
      name: "Claude 3.7 Sonnet",
      badge: fr ? "Hybride · Anthropic" : "Hybrid · Anthropic",
    },
    {
      id: "gpt-4o",
      name: "GPT-4o",
      badge: "OpenAI",
    },
  ];
}

export function KaiChat({
  slug,
  initialMessages,
  initialConversationId,
  initialTitle = "Kai",
  initialModel = "kai",
  initialStatus = "active",
  initialConversations,
  initialHasMore,
  initialQuery = "",
  productName,
  firstName = "",
  memoryStats = null,
}: {
  slug: string;
  initialMessages: MessageItem[];
  initialConversationId?: string;
  initialTitle?: string;
  initialModel?: string;
  initialStatus?: string;
  initialConversations: ConversationItem[];
  initialHasMore: boolean;
  initialQuery?: string;
  productName: string;
  firstName?: string;
  /** What Kai can read right now, shown before the first question. */
  memoryStats?: { facts: number; customers: number; competitors: number; learnings: number; experiments: number } | null;
}) {
  const { locale, t } = useI18n();
  const fr = locale === "fr";
  const say = (a: string, b: string) => (fr ? a : b);

  const modelOptions = getModelOptions(fr);

  const [messages, setMessages] = useState(initialMessages);
  const [conversationId, setConversationId] = useState(initialConversationId);
  const [title, setTitle] = useState(initialTitle);
  const [selectedModel, setSelectedModel] = useState(initialModel || "kai");
  const [currentStatus, setCurrentStatus] = useState(initialStatus || "active");
  const [activeTab, setActiveTab] = useState<"active" | "archived">("active");

  const [conversations, setConversations] = useState(initialConversations);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [input, setInput] = useState(initialQuery);
  const [error, setError] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);

  // Dropdown states
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const [activeMenuConvId, setActiveMenuConvId] = useState<string | null>(null);
  const [confirmDeleteConv, setConfirmDeleteConv] = useState<ConversationItem | null>(null);

  // Edit states (conversation title & chat messages)
  const [editingConv, setEditingConv] = useState<{ id: string; title: string } | null>(null);
  const [editTitleInput, setEditTitleInput] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingMessageText, setEditingMessageText] = useState("");
  const [editingPending, setEditingPending] = useState(false);

  const [pending, startTransition] = useTransition();
  const [searching, startSearch] = useTransition();
  const [deleting, startDelete] = useTransition();
  const [archiving, startArchive] = useTransition();
  const [renaming, startRename] = useTransition();

  const busy = useRef(false);
  const searchVersion = useRef(0);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const modelMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, pending]);

  // Click outside and escape key listener for dropdowns
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (modelMenuRef.current && !modelMenuRef.current.contains(e.target as Node)) {
        setModelMenuOpen(false);
      }
      if (activeMenuConvId) {
        const target = e.target as HTMLElement;
        if (!target.closest("[data-conv-menu]")) {
          setActiveMenuConvId(null);
        }
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (modelMenuOpen) setModelMenuOpen(false);
        if (activeMenuConvId) setActiveMenuConvId(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeMenuConvId, modelMenuOpen]);

  function rememberSelection(id?: string) {
    const url = new URL(window.location.href);
    url.searchParams.delete("q");
    url.searchParams.set("conversation", id ?? "new");
    window.history.replaceState(null, "", url);
  }

  function newConversation() {
    if (busy.current) return;
    rememberSelection();
    setTitle("Kai");
    setConversationId(undefined);
    setSelectedModel("kai");
    setCurrentStatus("active");
    setMessages([]);
    setInput("");
    setError("");
    setHistoryOpen(false);
    inputRef.current?.focus();
  }

  function openConversation(id: string) {
    if (busy.current) return;
    busy.current = true;
    setError("");
    startTransition(async () => {
      try {
        const result = await loadKaiConversationAction(slug, id);
        rememberSelection(id);
        setTitle(result.conversation?.title ?? "Kai");
        setConversationId(id);
        setSelectedModel(result.conversation?.model ?? "kai");
        setCurrentStatus(result.conversation?.status ?? "active");
        setMessages(result.messages);
        setInput("");
        setHistoryOpen(false);
      } catch {
        setError(say("Impossible d’ouvrir cette conversation. Réessayez.", "Could not open this conversation. Please try again."));
      } finally {
        busy.current = false;
      }
    });
  }

  function findConversations(more = false, targetTab = activeTab) {
    const version = ++searchVersion.current;
    const query = more ? appliedSearch : search.trim();
    startSearch(async () => {
      try {
        const result = await searchKaiConversationsAction(slug, query, more ? conversations.length : 0, targetTab);
        if (version !== searchVersion.current) return;
        setConversations((prev) =>
          more ? [...prev, ...result.items.filter((item) => !prev.some((c) => c.id === item.id))] : result.items
        );
        setHasMore(result.hasMore);
        setAppliedSearch(query);
      } catch {
        setError(say("Recherche indisponible. Réessayez.", "Search unavailable. Please try again."));
      }
    });
  }

  function handleTabChange(tab: "active" | "archived") {
    if (tab === activeTab) return;
    setActiveTab(tab);
    findConversations(false, tab);
  }

  function handleSelectModel(modelId: string) {
    setSelectedModel(modelId);
    setModelMenuOpen(false);
    if (conversationId) {
      void updateKaiConversationModelAction(slug, conversationId, modelId).catch(() => {});
    }
  }

  function handleSaveTitle(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!editingConv || !editTitleInput.trim()) return;
    const newTitle = editTitleInput.trim();
    const targetId = editingConv.id;
    setConversations((prev) =>
      prev.map((c) => (c.id === targetId ? { ...c, title: newTitle } : c))
    );
    if (conversationId === targetId) {
      setTitle(newTitle);
    }
    setEditingConv(null);
    startRename(async () => {
      try {
        await renameKaiConversationAction(slug, targetId, newTitle);
      } catch {
        // ignore background error
      }
    });
  }

  async function handleSaveMessage(messageId: string, newText: string) {
    if (!conversationId || !newText.trim() || editingPending) return;
    setEditingPending(true);
    try {
      const res = await editKaiMessageAction(slug, conversationId, messageId, newText.trim(), selectedModel);
      if (res.ok && res.messages) {
        setMessages(res.messages as MessageItem[]);
        setEditingMessageId(null);
      } else {
        setError(say("Impossible de modifier le message.", "Failed to edit message."));
      }
    } catch {
      setError(say("Impossible de modifier le message.", "Failed to edit message."));
    } finally {
      setEditingPending(false);
    }
  }

  function handleArchive(target: { id: string; title?: string }) {
    setActiveMenuConvId(null);
    startArchive(async () => {
      try {
        const res = await archiveKaiConversationAction(slug, target.id);
        if (!res.ok) throw new Error(res.error);
        if (activeTab === "active") {
          setConversations((prev) => prev.filter((c) => c.id !== target.id));
        }
        if (conversationId === target.id) {
          setCurrentStatus("archived");
        }
      } catch {
        setError(say("Impossible d’archiver la discussion.", "Failed to archive conversation."));
      }
    });
  }

  function handleUnarchive(target: { id: string; title?: string }) {
    setActiveMenuConvId(null);
    startArchive(async () => {
      try {
        const res = await unarchiveKaiConversationAction(slug, target.id);
        if (!res.ok) throw new Error(res.error);
        if (activeTab === "archived") {
          setConversations((prev) => prev.filter((c) => c.id !== target.id));
        }
        if (conversationId === target.id) {
          setCurrentStatus("active");
        }
      } catch {
        setError(say("Impossible de restaurer la discussion.", "Failed to restore conversation."));
      }
    });
  }

  function executeDelete() {
    if (!confirmDeleteConv) return;
    const target = confirmDeleteConv;
    startDelete(async () => {
      try {
        const res = await deleteKaiConversationAction(slug, target.id);
        if (!res.ok) throw new Error(res.error);
        setConversations((prev) => prev.filter((c) => c.id !== target.id));
        setConfirmDeleteConv(null);
        if (conversationId === target.id) {
          newConversation();
        }
      } catch {
        setError(say("Impossible de supprimer la discussion.", "Failed to delete conversation."));
        setConfirmDeleteConv(null);
      }
    });
  }

  function send(text: string) {
    const message = text.trim();
    if (busy.current || message.length < 2 || message.length > 4000) return;
    busy.current = true;
    setError("");
    const optimisticId = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      {
        id: optimisticId,
        role: "user",
        content: message,
        sources: [],
        suggestedAction: null,
        model: selectedModel,
        createdAt: new Date(),
      },
    ]);
    setInput("");
    startTransition(async () => {
      try {
        const result = await sendKaiMessageAction(slug, message, conversationId, selectedModel);
        if (!result.ok || !("messages" in result)) throw new Error("Send failed");
        rememberSelection(result.conversationId);
        if (!conversationId) setTitle(message.slice(0, 80));
        setConversationId(result.conversationId);
        setMessages((prev) => [...prev.filter((m) => m.id !== optimisticId), ...result.messages]);
        searchVersion.current++;
        setSearch("");
        setAppliedSearch("");
        try {
          const history = await searchKaiConversationsAction(slug, "", 0, activeTab);
          setConversations(history.items);
          setHasMore(history.hasMore);
        } catch {
          setError(say("Message enregistré. L’historique n’a pas pu être actualisé.", "Message saved. History could not be refreshed."));
        }
      } catch {
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
        setInput(message);
        setError(
          say(
            "Votre message n’a pas pu être envoyé. Il est conservé ci-dessous pour réessayer.",
            "Your message could not be sent. It is kept below so you can retry."
          )
        );
      } finally {
        busy.current = false;
        inputRef.current?.focus();
      }
    });
  }

  const currentModelObj = modelOptions.find((m) => m.id === selectedModel) ?? modelOptions[0];
  const suggestions: { id: keyof typeof STARTER_ICONS; label: string; prompt: string; tone: string }[] = [
    { id: "customers", label: say("Clients", "Customers"), prompt: say("Qui sont nos clients et quels sont leurs besoins ?", "Who are our customers and what do they need?"), tone: "bg-pink-soft text-pink-deep" },
    { id: "pricing", label: say("Tarifs", "Pricing"), prompt: say("Compare nos tarifs et ceux de nos concurrents", "Compare our pricing with our competitors"), tone: "bg-sun-soft text-sun-deep" },
    { id: "strategy", label: say("Stratégie", "Strategy"), prompt: say("Résume notre stratégie actuelle", "Summarize our current strategy"), tone: "bg-blue-soft text-blue-deep" },
    { id: "learnings", label: say("Expériences", "Experiments"), prompt: say("Qu’avons-nous appris de nos expériences ?", "What have we learned from our experiments?"), tone: "bg-grass-soft text-grass-deep" },
  ];
  const composer = (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        send(input);
      }}
      className="mx-auto w-full max-w-3xl rounded-[22px] border border-line-strong bg-surface p-3 shadow-[0_10px_30px_-14px_rgba(11,11,11,0.22)] transition-shadow focus-within:border-agent/50 focus-within:ring-4 focus-within:ring-agent/10"
    >
      <label htmlFor="kai-message" className="sr-only">
        {t.app.kai.placeholder}
      </label>
      <textarea
        id="kai-message"
        ref={inputRef}
        value={input}
        disabled={pending}
        maxLength={4000}
        rows={2}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            send(input);
          }
        }}
        placeholder={say("Parlons de votre business…", "Let’s talk about your business…")}
        className="block max-h-48 min-h-[52px] w-full resize-none bg-transparent px-1.5 py-1 text-[15px] leading-6 outline-none placeholder:text-subtle disabled:opacity-60"
      />
      <div className="mt-2.5 flex items-center justify-between border-t border-line/60 pt-2">
        <div className="flex items-center gap-2">
          {/* Product Memory Status Tag */}
          <div className="flex items-center gap-1.5 rounded-md bg-raised/70 px-2 py-1 text-[11px] text-muted border border-line/50">
            <BookOpen className="size-3 text-agent" />
            <span className="font-medium">{say("Mémoire produit", "Product memory")}</span>
            <span className="size-1.5 rounded-full bg-positive ml-0.5" />
          </div>

          {/* Bottom Model Selector Pill & Popover */}
          <div className="relative" ref={modelMenuRef}>
            <button
              type="button"
              onClick={() => setModelMenuOpen((prev) => !prev)}
              className={cn(
                "flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-all shadow-2xs",
                modelMenuOpen
                  ? "border-agent bg-agent-soft text-agent ring-1 ring-agent/30"
                  : "border-line bg-surface text-ink hover:border-line-strong hover:bg-raised"
              )}
              aria-haspopup="listbox"
              aria-expanded={modelMenuOpen}
            >
              {selectedModel === "kai" ? (
                <Sparkles className="size-3.5 text-agent" />
              ) : selectedModel.startsWith("claude") ? (
                <Bot className="size-3.5 text-amber-600 dark:text-amber-400" />
              ) : selectedModel.startsWith("gpt") ? (
                <Zap className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Cpu className="size-3.5 text-muted" />
              )}
              <span className="font-semibold">{currentModelObj.name}</span>
              <ChevronUp
                className={cn(
                  "size-3 text-subtle transition-transform duration-200",
                  modelMenuOpen && "rotate-180"
                )}
              />
            </button>

            {/* Popover anchored directly above the prompt bar */}
            {modelMenuOpen && (
              <div
                role="listbox"
                className="absolute bottom-full left-0 z-50 mb-2.5 w-72 sm:w-80 rounded-2xl border border-line-strong bg-surface p-1.5 shadow-xl backdrop-blur-md animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2 duration-150"
              >
                <div className="flex items-center justify-between border-b border-line px-2.5 py-1.5 mb-1">
                  <p className="text-xs font-semibold text-ink">
                    {say("Choisir le modèle d'IA", "Select AI model")}
                  </p>
                  <span className="rounded-full bg-agent-soft px-2 py-0.5 text-[9px] font-semibold text-agent">
                    {currentModelObj.name}
                  </span>
                </div>

                <div className="space-y-0.5">
                  {modelOptions.map((opt) => {
                    const isSelected = selectedModel === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => {
                          handleSelectModel(opt.id);
                          setModelMenuOpen(false);
                        }}
                        className={cn(
                          "group flex w-full items-center justify-between gap-2.5 rounded-xl px-2.5 py-2 text-left transition-all",
                          isSelected
                            ? "bg-raised border border-line/80 shadow-2xs font-medium"
                            : "hover:bg-sunken/80 border border-transparent text-ink"
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={cn(
                              "grid size-6 shrink-0 place-items-center rounded-lg border text-muted transition-colors",
                              isSelected
                                ? "border-agent-line bg-agent-soft text-agent"
                                : "border-line bg-surface-raised group-hover:bg-surface"
                            )}
                          >
                            {opt.id === "kai" ? (
                              <Sparkles className="size-3.5 text-agent" />
                            ) : opt.id.startsWith("claude") ? (
                              <Bot className="size-3.5 text-amber-600 dark:text-amber-400" />
                            ) : opt.id.startsWith("gpt") ? (
                              <Zap className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <Cpu className="size-3.5" />
                            )}
                          </div>
                          <span className="truncate text-xs font-semibold text-ink">{opt.name}</span>
                          <span
                            className={cn(
                              "rounded-full px-1.5 py-0.2 text-[9px] font-medium tracking-wide",
                              opt.id === "kai"
                                ? "bg-agent-soft text-agent border border-agent-line/50 font-semibold"
                                : "bg-surface-raised text-subtle border border-line/60"
                            )}
                          >
                            {opt.badge}
                          </span>
                        </div>
                        {isSelected ? (
                          <div className="grid size-4 shrink-0 place-items-center rounded-full bg-ink text-white">
                            <Check className="size-2.5 stroke-[3]" />
                          </div>
                        ) : (
                          <span className="size-4 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
        <button
          type="submit"
          aria-label={t.app.kai.send}
          disabled={pending || input.trim().length < 2}
          className="grid size-8 place-items-center rounded-lg bg-ink text-white transition-opacity disabled:opacity-30 hover:opacity-90"
        >
          {pending ? <Spinner className="size-4" /> : <ArrowUp className="size-4" />}
        </button>
      </div>
    </form>
  );

  return (
    <div
      className="relative flex h-[calc(100dvh-5.5rem)] min-h-[560px] overflow-hidden rounded-2xl border border-line bg-surface shadow-xs"
      data-tour="kai-header"
    >
      {/* ── Sidebar (History, Archive, Delete) ── */}
      <aside
        aria-label={say("Historique des conversations", "Conversation history")}
        className={cn(
          "absolute inset-y-0 left-0 z-20 flex w-[300px] shrink-0 flex-col border-r border-line bg-canvas lg:static lg:flex",
          historyOpen ? "flex shadow-xl" : "hidden"
        )}
      >
        <div className="p-4">
          <div className="mb-4 flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-semibold">
              <History className="size-4 text-muted" />
              {say("Vos conversations", "Your conversations")}
            </span>
            <button
              type="button"
              className="lg:hidden rounded p-1 text-muted hover:text-ink"
              onClick={() => setHistoryOpen(false)}
              aria-label={say("Fermer l’historique", "Close history")}
            >
              <X className="size-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={newConversation}
            disabled={pending}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-ink px-3 py-2.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            <Plus className="size-4" />
            {say("Nouvelle conversation", "New conversation")}
          </button>

          {/* Active vs Archived Tab Switcher */}
          <div className="mt-3 grid grid-cols-2 gap-1 rounded-lg border border-line bg-surface p-0.5 text-xs">
            <button
              type="button"
              onClick={() => handleTabChange("active")}
              className={cn(
                "rounded-md py-1.5 font-medium transition-colors",
                activeTab === "active"
                  ? "bg-raised text-ink shadow-2xs"
                  : "text-muted hover:text-ink"
              )}
            >
              {say("Actives", "Active")}
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("archived")}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-md py-1.5 font-medium transition-colors",
                activeTab === "archived"
                  ? "bg-raised text-ink shadow-2xs"
                  : "text-muted hover:text-ink"
              )}
            >
              <Archive className="size-3" />
              {say("Archivées", "Archived")}
            </button>
          </div>

          {/* Search Form */}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              findConversations(false, activeTab);
            }}
            className="mt-3 flex items-center gap-2 rounded-lg border border-line bg-surface px-2.5"
          >
            <input
              aria-label={say("Rechercher dans les titres et messages", "Search titles and messages")}
              value={search}
              maxLength={200}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={say("Rechercher…", "Search…")}
              className="min-w-0 flex-1 bg-transparent py-2 text-xs outline-none"
            />
            <button
              type="submit"
              disabled={searching || pending}
              aria-label={say("Rechercher", "Search")}
              className="rounded p-1 text-muted hover:text-ink"
            >
              {searching ? <Spinner className="size-3.5" /> : <Search className="size-3.5" />}
            </button>
          </form>
        </div>

        {/* Conversation list */}
        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
          {(appliedSearch || activeTab === "archived"
            ? [{ label: appliedSearch ? say("Résultats", "Results") : say("Discussions archivées", "Archived discussions"), items: conversations }]
            : groupConversations(conversations, {
                today: say("Aujourd’hui", "Today"),
                yesterday: say("Hier", "Yesterday"),
                week: say("Cette semaine", "This week"),
                older: say("Plus anciennes", "Older"),
              })
          ).map((group) => (
          <div key={group.label} className="mb-3">
          <p className="px-3 pt-1 pb-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-subtle">{group.label}</p>
          {group.items.map((c) => {
            const isSelected = c.id === conversationId;
            const menuOpen = activeMenuConvId === c.id;

            return (
              <div
                key={c.id}
                className={cn(
                  "group relative mb-1 flex items-center rounded-lg transition-colors hover:bg-raised",
                  isSelected && "bg-surface ring-1 ring-line"
                )}
              >
                <button
                  type="button"
                  onClick={() => openConversation(c.id)}
                  disabled={pending}
                  aria-current={isSelected ? "true" : undefined}
                  className="flex min-w-0 flex-1 items-start gap-2.5 p-3 text-left disabled:opacity-50"
                >
                  <MessageSquare className="mt-0.5 size-3.5 shrink-0 text-subtle" />
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 text-xs font-medium leading-5 text-ink">
                      {c.title}
                    </span>
                    <span className="mt-1 flex items-center gap-1.5 text-[10px] text-subtle">
                      <span>
                        {new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" }).format(
                          new Date(c.updatedAt)
                        )}
                      </span>
                      {c.model && c.model !== "kai" && (
                        <span className="rounded bg-surface-raised px-1 py-0.2 text-[9px] font-normal text-muted">
                          {c.model === "claude-3-5-sonnet" ? "Claude 3.5" : c.model === "claude-3-7-sonnet" ? "Claude 3.7" : c.model}
                        </span>
                      )}
                    </span>
                  </span>
                </button>

                {/* Conversation actions dropdown */}
                <div className="relative shrink-0 pr-2" data-conv-menu>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuConvId((prev) => (prev === c.id ? null : c.id));
                    }}
                    aria-label={say("Options de la discussion", "Conversation options")}
                    className={cn(
                      "rounded p-1 text-muted transition-colors hover:bg-sunken hover:text-ink",
                      menuOpen ? "opacity-100 bg-sunken text-ink" : "opacity-0 group-hover:opacity-100"
                    )}
                  >
                    <MoreVertical className="size-3.5" />
                  </button>

                  {menuOpen && (
                    <div className="absolute right-0 top-full z-30 mt-1 w-40 rounded-xl border border-line bg-surface p-1 shadow-lg animate-in fade-in zoom-in-95">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuConvId(null);
                          setEditingConv({ id: c.id, title: c.title });
                          setEditTitleInput(c.title);
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-ink hover:bg-raised transition-colors"
                      >
                        <Pencil className="size-3.5 text-muted" />
                        <span>{say("Renommer", "Rename")}</span>
                      </button>
                      {c.status === "archived" || activeTab === "archived" ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnarchive(c);
                          }}
                          disabled={archiving}
                          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-ink hover:bg-raised transition-colors disabled:opacity-50"
                        >
                          <ArchiveRestore className="size-3.5 text-muted" />
                          <span>{say("Désarchiver", "Unarchive")}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleArchive(c);
                          }}
                          disabled={archiving}
                          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-ink hover:bg-raised transition-colors disabled:opacity-50"
                        >
                          <Archive className="size-3.5 text-muted" />
                          <span>{say("Archiver", "Archive")}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuConvId(null);
                          setConfirmDeleteConv(c);
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                      >
                        <Trash2 className="size-3.5" />
                        <span>{say("Supprimer", "Delete")}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          </div>
          ))}

          {!conversations.length && (
            <p className="p-3 text-xs leading-5 text-muted">
              {appliedSearch
                ? say("Aucun résultat. Essayez un autre mot.", "No results. Try another word.")
                : activeTab === "archived"
                ? say("Aucune conversation archivée pour le moment.", "No archived conversations yet.")
                : say("Vos discussions apparaîtront ici, pour reprendre chaque idée.", "Your conversations will appear here, ready to pick up where you left off.")}
            </p>
          )}

          {hasMore && (
            <button
              type="button"
              onClick={() => findConversations(true, activeTab)}
              disabled={searching || pending}
              className="w-full p-3 text-xs text-muted underline hover:text-ink"
            >
              {say("Voir les conversations précédentes", "Load earlier conversations")}
            </button>
          )}
        </div>

        <Link
          href={`/w/${slug}/memory`}
          className="m-3 flex items-center gap-2 rounded-lg border border-line bg-surface p-3 text-xs text-muted hover:text-ink transition-colors"
        >
          <BookOpen className="size-4" />
          {say("Explorer la mémoire produit", "Explore product memory")}
          <ArrowUpRight className="ml-auto size-3.5" />
        </Link>
      </aside>

      {historyOpen && (
        <button
          type="button"
          aria-label={say("Fermer l’historique", "Close history")}
          onClick={() => setHistoryOpen(false)}
          className="absolute inset-0 z-10 bg-ink/20 lg:hidden"
        />
      )}

      {/* ── Main Chat Section ── */}
      <section className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setHistoryOpen(true)}
              aria-label={say("Ouvrir l’historique", "Open history")}
              aria-expanded={historyOpen}
              className="rounded p-1 text-muted hover:text-ink lg:hidden"
            >
              <History className="size-5" />
            </button>
            <KaiMark className="size-8 shrink-0" thinking={pending} />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="truncate text-sm font-semibold">{title}</h2>
                {conversationId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingConv({ id: conversationId, title });
                      setEditTitleInput(title);
                    }}
                    className="rounded p-0.5 text-subtle hover:text-ink hover:bg-raised transition-colors"
                    title={say("Renommer la conversation", "Rename conversation")}
                  >
                    <Pencil className="size-3" />
                  </button>
                )}
              </div>
              <p className="mt-0.5 truncate text-xs text-muted">
                {productName} <span className="px-1 text-subtle">/</span> {say("Votre espace de réflexion", "Your space to think")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Memory Connected Indicator */}
            <span className="hidden items-center gap-1.5 whitespace-nowrap rounded-full border border-line px-2.5 py-1 text-[10px] text-muted sm:flex">
              <span className="size-1.5 rounded-full bg-positive" />
              {say("Mémoire connectée", "Memory connected")}
            </span>
          </div>
        </header>

        {/* Archived Conversation Banner */}
        {currentStatus === "archived" && (
          <div className="flex items-center justify-between gap-3 border-b border-line bg-amber-50/70 px-4 py-2 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
            <span className="flex items-center gap-1.5 font-medium">
              <Archive className="size-3.5" />
              {say("Cette discussion est archivée.", "This discussion is archived.")}
            </span>
            <button
              type="button"
              disabled={archiving}
              onClick={() => conversationId && handleUnarchive({ id: conversationId, title })}
              className="font-medium underline hover:no-underline"
            >
              {say("Désarchiver la discussion", "Unarchive discussion")}
            </button>
          </div>
        )}

        {/* Messages stream */}
        <div
          ref={listRef}
          role="log"
          aria-label={say("Messages", "Messages")}
          aria-live="polite"
          aria-busy={pending}
          className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8"
        >
          {!messages.length ? (
            <div className="mx-auto flex min-h-full max-w-3xl flex-col justify-center py-4">
              <div className="flex flex-col items-center text-center">
                <div className="relative">
                  <span aria-hidden className="absolute inset-0 -m-3 rounded-[24px] bg-agent/15 blur-xl" />
                  <KaiMark className="relative size-14" />
                </div>
                <h3 className="mt-6 text-[clamp(26px,3vw,36px)] leading-tight font-semibold tracking-[-0.03em] text-ink">
                  {firstName ? say(`Bonjour ${firstName},`, `Hi ${firstName},`) : say("Bonjour,", "Hi,")}
                  <br />
                  <span className="text-muted">{say(`que voulez-vous savoir sur ${productName} ?`, `what do you want to know about ${productName}?`)}</span>
                </h3>
                {memoryStats && (
                  <p className="mt-4 flex flex-wrap items-center justify-center gap-1.5 text-xs text-muted">
                    <span className="mr-0.5">{say("Kai connaît", "Kai knows")}</span>
                    {[
                      [memoryStats.facts, say("faits", "facts")],
                      [memoryStats.customers, say("profils clients", "customer profiles")],
                      [memoryStats.competitors, say("concurrents", "competitors")],
                      [memoryStats.learnings, say("apprentissages", "learnings")],
                      [memoryStats.experiments, say("expériences", "experiments")],
                    ]
                      .filter(([n]) => Number(n) > 0)
                      .map(([n, label]) => (
                        <span key={String(label)} className="rounded-full border border-line bg-surface px-2 py-0.5">
                          <span className="font-medium text-ink tabular-nums">{n}</span> {label}
                        </span>
                      ))}
                  </p>
                )}
              </div>

              <div className="mt-8">{composer}</div>

              <div className="mx-auto mt-6 grid w-full max-w-3xl gap-2 sm:grid-cols-2">
                {suggestions.map((s) => {
                  const Icon = STARTER_ICONS[s.id];
                  return (
                    <button
                      key={s.id}
                      type="button"
                      disabled={pending}
                      onClick={() => send(s.prompt)}
                      className="group flex items-center gap-3 rounded-2xl border border-line bg-surface px-3.5 py-3 text-left transition-all hover:-translate-y-0.5 hover:border-agent/40 hover:shadow-sm disabled:opacity-50"
                    >
                      <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl", s.tone)}>
                        <Icon className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[11px] text-subtle">{s.label}</span>
                        <span className="block text-sm leading-5 font-medium text-ink">{s.prompt}</span>
                      </span>
                      <ArrowUpRight className="size-4 shrink-0 text-subtle transition-colors group-hover:text-agent" />
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-8">
              {messages.map((m) => {
                const isEditingThis = editingMessageId === m.id;
                return (
                  <article
                    key={m.id}
                    className={cn("group flex gap-3", m.role === "user" && "justify-end")}
                  >
                    {m.role !== "user" && (
                      <KaiMark className="mt-0.5 size-7 shrink-0" />
                    )}
                    <div className={cn("min-w-0 max-w-full", m.role === "user" && "max-w-[85%]")}>
                      <div className="mb-1.5 flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5">
                          <p className="text-[10px] font-medium text-subtle">
                            {m.role === "user" ? say("Vous", "You") : "Kai"}
                          </p>
                          {m.role !== "user" && m.model && m.model !== "kai" && (
                            <span className="rounded bg-surface-raised px-1 py-0.2 text-[9px] text-muted">
                              {m.model}
                            </span>
                          )}
                        </div>
                        {m.role === "user" && !isEditingThis && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingMessageId(m.id);
                              setEditingMessageText(m.content);
                            }}
                            className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-subtle opacity-0 transition-opacity hover:bg-raised hover:text-ink group-hover:opacity-100"
                            title={say("Modifier ce message", "Edit this message")}
                          >
                            <Pencil className="size-2.5" />
                            <span>{say("Modifier", "Edit")}</span>
                          </button>
                        )}
                      </div>

                      {isEditingThis ? (
                        <div className="rounded-2xl rounded-tr-sm border border-agent/50 bg-surface p-3 shadow-xs">
                          <textarea
                            value={editingMessageText}
                            disabled={editingPending}
                            rows={3}
                            onChange={(e) => setEditingMessageText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSaveMessage(m.id, editingMessageText);
                              } else if (e.key === "Escape") {
                                setEditingMessageId(null);
                              }
                            }}
                            className="block w-full resize-none bg-transparent text-sm leading-6 outline-none text-ink placeholder:text-subtle disabled:opacity-60"
                            autoFocus
                          />
                          <div className="mt-2.5 flex items-center justify-end gap-2 border-t border-line/60 pt-2">
                            <button
                              type="button"
                              disabled={editingPending}
                              onClick={() => setEditingMessageId(null)}
                              className="rounded-lg border border-line px-2.5 py-1 text-xs font-medium text-muted transition-colors hover:bg-raised hover:text-ink"
                            >
                              {say("Annuler", "Cancel")}
                            </button>
                            <button
                              type="button"
                              disabled={editingPending || !editingMessageText.trim()}
                              onClick={() => handleSaveMessage(m.id, editingMessageText)}
                              className="flex items-center gap-1.5 rounded-lg bg-ink px-2.5 py-1 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                            >
                              {editingPending ? <Spinner className="size-3" /> : <Check className="size-3" />}
                              <span>{say("Enregistrer et relancer", "Save & submit")}</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        m.role === "user" ? (
                          <div className="whitespace-pre-wrap break-words rounded-2xl rounded-tr-md bg-sunken px-4 py-2.5 text-[15px] leading-7 text-ink">{m.content}</div>
                        ) : (
                          <div className="break-words">
                            <KaiAnswer content={m.content} unverifiedLabel={say("À vérifier", "Unverified")} />
                            <div className="mt-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                              <button
                                type="button"
                                onClick={() => void navigator.clipboard?.writeText(m.content)}
                                className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] text-subtle hover:bg-raised hover:text-ink"
                              >
                                <Copy className="size-3" />
                                {say("Copier", "Copy")}
                              </button>
                            </div>
                          </div>
                        )
                      )}

                      {!!m.sources.length && (
                        <KaiSources
                          sources={m.sources}
                          labels={{
                            title: say(`${m.sources.length} sources de votre mémoire`, `${m.sources.length} sources from your memory`),
                            showAll: say("Voir toutes les sources", "Show all sources"),
                            showLess: say("Voir moins", "Show less"),
                            types: fr
                              ? { fact: "Fait", icp: "Client", persona: "Persona", competitor: "Concurrent", learning: "Apprentissage", strategy: "Stratégie", metric: "Objectif", brand: "Marque" }
                              : { fact: "Fact", icp: "Customer", persona: "Persona", competitor: "Competitor", learning: "Learning", strategy: "Strategy", metric: "Goal", brand: "Brand" },
                          }}
                        />
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {pending && (
            <p role="status" className="mx-auto mt-6 flex max-w-3xl items-center gap-3 text-sm text-muted">
              <KaiMark className="size-7" thinking />
              {say(
                `Kai (${currentModelObj.name}) consulte votre mémoire…`,
                `Kai (${currentModelObj.name}) is checking your memory…`
              )}
            </p>
          )}
        </div>

        {/* Input prompt area */}
        <div className="px-4 pb-4 sm:px-8">
          {error && (
            <p role="alert" className="mx-auto mb-3 max-w-2xl rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              {error}
            </p>
          )}
          {!!messages.length && composer}
          <p className="mt-2 text-center text-[10px] text-subtle">
            {say(
              "Conversations enregistrées · Réponses fondées sur les informations disponibles",
              "Conversations saved · Answers based on available information"
            )}
          </p>
        </div>
      </section>

      {/* ── Modal Confirmation: Delete Conversation ── */}
      {confirmDeleteConv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-5 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-start gap-3">
              <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-300">
                <AlertTriangle className="size-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-ink">
                  {say("Supprimer la conversation ?", "Delete conversation?")}
                </h4>
                <p className="mt-1 text-xs leading-5 text-muted">
                  {say(
                    `Voulez-vous supprimer « ${confirmDeleteConv.title} » ? Tous les messages seront définitivement effacés.`,
                    `Do you want to delete "${confirmDeleteConv.title}"? All messages will be permanently erased.`
                  )}
                </p>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setConfirmDeleteConv(null)}
                className="rounded-lg border border-line px-3 py-2 text-xs font-medium text-ink hover:bg-raised transition-colors"
              >
                {say("Annuler", "Cancel")}
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={executeDelete}
                className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? <Spinner className="size-3.5" /> : <Trash2 className="size-3.5" />}
                {say("Supprimer définitivement", "Delete permanently")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Rename Conversation ── */}
      {editingConv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleSaveTitle}
            className="w-full max-w-sm rounded-2xl border border-line bg-surface p-5 shadow-xl animate-in fade-in zoom-in-95"
          >
            <div className="flex items-start gap-3">
              <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-agent-soft text-agent">
                <Pencil className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-semibold text-ink">
                  {say("Renommer la discussion", "Rename conversation")}
                </h4>
                <p className="mt-1 text-xs text-muted">
                  {say(
                    "Choisissez un titre clair pour retrouver facilement cette conversation.",
                    "Choose a clear title to easily find this conversation."
                  )}
                </p>
                <div className="mt-3">
                  <input
                    type="text"
                    value={editTitleInput}
                    maxLength={120}
                    onChange={(e) => setEditTitleInput(e.target.value)}
                    autoFocus
                    placeholder={say("Titre de la conversation", "Conversation title")}
                    className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-xs text-ink outline-none focus:border-agent"
                  />
                </div>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={renaming}
                onClick={() => setEditingConv(null)}
                className="rounded-lg border border-line px-3 py-2 text-xs font-medium text-ink hover:bg-raised transition-colors"
              >
                {say("Annuler", "Cancel")}
              </button>
              <button
                type="submit"
                disabled={renaming || !editTitleInput.trim()}
                className="flex items-center gap-1.5 rounded-lg bg-ink px-3 py-2 text-xs font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {renaming ? <Spinner className="size-3.5" /> : <Check className="size-3.5" />}
                {say("Enregistrer", "Save")}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
