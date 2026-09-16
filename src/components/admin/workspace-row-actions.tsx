"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowUpRight, Eye, Pencil, Trash2, X, AlertCircle, Check, Bot } from "lucide-react";
import { deleteWorkspaceAction, updateWorkspaceAction } from "@/app/admin/actions";
import { ActionButton } from "@/components/admin/action-button";
import { buttonClass, Spinner } from "@/components/ui/button";

export interface WorkspaceRowData {
  id: string;
  name: string;
  slug: string;
  autonomyMode: "observe" | "suggest" | "copilot" | "autopilot";
  isDemo?: boolean;
}

export function WorkspaceRowActions({ workspace }: { workspace: WorkspaceRowData }) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  // Edit state
  const [name, setName] = useState(workspace.name);
  const [autonomyMode, setAutonomyMode] = useState(workspace.autonomyMode);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const res = await updateWorkspaceAction(workspace.id, {
        name,
        autonomyMode,
      });

      if (!res.ok) {
        setError(res.error || "Erreur lors de la mise à jour.");
      } else {
        setSuccess(true);
        setTimeout(() => {
          setEditing(false);
          setSuccess(false);
        }, 800);
      }
    });
  };

  return (
    <>
      <div className="flex items-center gap-1 justify-end">
        {/* 👁️ Voir */}
        <Link
          href={`/admin/workspaces/${workspace.id}`}
          title="Voir la fiche workspace"
          className="inline-flex size-7 items-center justify-center rounded-md border border-line bg-surface text-muted transition-colors hover:border-ink hover:text-ink hover:bg-sunken shadow-2xs"
        >
          <Eye className="size-3.5" />
          <span className="sr-only">Voir</span>
        </Link>

        {/* ✏️ Modifier */}
        <button
          type="button"
          onClick={() => {
            setName(workspace.name);
            setAutonomyMode(workspace.autonomyMode);
            setError(null);
            setEditing(true);
          }}
          title="Modifier le workspace"
          className="inline-flex size-7 items-center justify-center rounded-md border border-line bg-surface text-muted transition-colors hover:border-ink hover:text-ink hover:bg-sunken shadow-2xs"
        >
          <Pencil className="size-3.5" />
          <span className="sr-only">Modifier</span>
        </button>

        {/* ↗️ Ouvrir client */}
        <Link
          href={`/w/${workspace.slug}`}
          title="Ouvrir l'espace client"
          className="inline-flex size-7 items-center justify-center rounded-md border border-line bg-surface text-muted transition-colors hover:border-ink hover:text-ink hover:bg-sunken shadow-2xs"
        >
          <ArrowUpRight className="size-3.5" />
          <span className="sr-only">Ouvrir</span>
        </Link>

        {/* 🗑️ Supprimer */}
        {!workspace.isDemo && (
          <ActionButton
            action={deleteWorkspaceAction.bind(null, workspace.id)}
            variant="ghost"
            icon={<Trash2 className="size-3.5 text-muted hover:text-negative" />}
            confirm="Supprimer ce workspace et toutes ses données ?"
            typeToConfirm={workspace.slug}
            className="text-xs"
          >
            <span className="sr-only">Supprimer</span>
          </ActionButton>
        )}
      </div>

      {/* Edit Workspace Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-ink/40 backdrop-blur-xs"
            onClick={() => setEditing(false)}
          />

          <div
            role="dialog"
            aria-modal="true"
            className="relative z-10 w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-pop animate-rise"
          >
            <div className="flex items-start justify-between gap-4 border-b border-line pb-4">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-sunken text-ink">
                  <Pencil className="size-4" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-ink">Modifier le workspace</h2>
                  <p className="font-mono text-2xs text-muted">/{workspace.slug}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="grid size-8 place-items-center rounded-lg text-muted hover:bg-sunken hover:text-ink"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 pt-4">
              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-negative/20 bg-negative-soft p-3 text-xs text-negative">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="flex items-center gap-2 rounded-lg border border-positive/20 bg-positive-soft p-3 text-xs text-positive">
                  <Check className="size-4 shrink-0" />
                  <span>Workspace mis à jour !</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-ink">Nom du workspace</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 h-9 w-full rounded-lg border border-line bg-surface px-3 text-sm outline-none focus:border-ink"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink mb-1.5 flex items-center gap-1.5">
                  <Bot className="size-3.5 text-agent" /> Mode d&apos;autonomie de l&apos;agent
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(["observe", "suggest", "copilot", "autopilot"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setAutonomyMode(m)}
                      className={`h-8 rounded-lg border text-xs font-medium capitalize transition-colors ${
                        autonomyMode === m
                          ? "border-ink bg-ink text-white"
                          : "border-line bg-surface text-muted hover:text-ink hover:bg-sunken"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-line pt-4">
                <Link
                  href={`/admin/workspaces/${workspace.id}`}
                  className="text-xs text-muted hover:text-ink hover:underline"
                >
                  Ouvrir les réglages complets →
                </Link>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className={buttonClass("secondary", "sm")}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={pending}
                    className={buttonClass("primary", "sm")}
                  >
                    {pending ? <Spinner /> : "Enregistrer"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
