"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Eye, Pencil, Trash2, X, AlertCircle, Check } from "lucide-react";
import { deleteUserAction, updateUserAction } from "@/app/admin/actions";
import { ActionButton } from "@/components/admin/action-button";
import { buttonClass, Spinner } from "@/components/ui/button";

export interface UserRowData {
  id: string;
  name: string;
  email: string;
  isPlatformAdmin: boolean;
  suspendedAt: Date | string | null;
  isGuest?: boolean;
}

export function UserRowActions({ user }: { user: UserRowData }) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  // Edit form state
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(user.isPlatformAdmin);
  const [isSuspended, setIsSuspended] = useState(Boolean(user.suspendedAt));
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const res = await updateUserAction(user.id, {
        name,
        email,
        isPlatformAdmin,
        suspended: isSuspended,
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
          href={`/admin/users/${user.id}`}
          title="Voir la fiche détaillée"
          className="inline-flex size-7 items-center justify-center rounded-md border border-line bg-surface text-muted transition-colors hover:border-ink hover:text-ink hover:bg-sunken shadow-2xs"
        >
          <Eye className="size-3.5" />
          <span className="sr-only">Voir</span>
        </Link>

        {/* ✏️ Modifier */}
        <button
          type="button"
          onClick={() => {
            setName(user.name);
            setEmail(user.email);
            setIsPlatformAdmin(user.isPlatformAdmin);
            setIsSuspended(Boolean(user.suspendedAt));
            setError(null);
            setEditing(true);
          }}
          title="Modifier l'utilisateur"
          className="inline-flex size-7 items-center justify-center rounded-md border border-line bg-surface text-muted transition-colors hover:border-ink hover:text-ink hover:bg-sunken shadow-2xs"
        >
          <Pencil className="size-3.5" />
          <span className="sr-only">Modifier</span>
        </button>

        {/* 🗑️ Supprimer */}
        <ActionButton
          action={deleteUserAction.bind(null, user.id)}
          variant="ghost"
          icon={<Trash2 className="size-3.5 text-muted hover:text-negative" />}
          confirm="Supprimer ce compte définitivement ?"
          typeToConfirm="DELETE"
          className="text-xs"
        >
          <span className="sr-only">Supprimer</span>
        </ActionButton>
      </div>

      {/* Edit User Modal */}
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
                  <h2 className="text-base font-semibold text-ink">Modifier l&apos;utilisateur</h2>
                  <p className="font-mono text-2xs text-muted">ID: {user.id}</p>
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
                  <span>Modifications enregistrées !</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-ink">Nom complet</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 h-9 w-full rounded-lg border border-line bg-surface px-3 text-sm outline-none focus:border-ink"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink">Adresse email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 h-9 w-full rounded-lg border border-line bg-surface px-3 text-sm outline-none focus:border-ink"
                />
              </div>

              <div className="space-y-2 rounded-xl border border-line bg-raised p-3 text-xs">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isPlatformAdmin}
                    onChange={(e) => setIsPlatformAdmin(e.target.checked)}
                    className="size-4 rounded border-line text-ink accent-ink focus:ring-0"
                  />
                  <span className="font-medium text-ink">Droits administrateur Kaya</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isSuspended}
                    onChange={(e) => setIsSuspended(e.target.checked)}
                    className="size-4 rounded border-line text-ink accent-ink focus:ring-0"
                  />
                  <span className="font-medium text-negative">Suspendre le compte</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-line pt-4">
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
            </form>
          </div>
        </div>
      )}
    </>
  );
}
