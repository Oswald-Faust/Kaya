"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, KeyRound, ShieldAlert, Sparkles, UserPlus, X, AlertCircle } from "lucide-react";
import { createUserAction, type CreateUserResult } from "@/app/admin/actions";
import { buttonClass, Spinner } from "@/components/ui/button";

export function CreateUserButton() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [plan, setPlan] = useState<"launch" | "growth" | "scale" | "free" | "none">("launch");
  const [workspaceName, setWorkspaceName] = useState("");
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);

  // Result state
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CreateUserResult | null>(null);
  const [copied, setCopied] = useState(false);

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setPlan("launch");
    setWorkspaceName("");
    setIsPlatformAdmin(false);
    setError(null);
    setResult(null);
    setCopied(false);
  };

  const handleClose = () => {
    setOpen(false);
    resetForm();
  };

  const handleCopyPassword = (pwd: string) => {
    navigator.clipboard.writeText(pwd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim()) {
      setError("Le nom et l'adresse email sont requis.");
      return;
    }

    startTransition(async () => {
      const res = await createUserAction({
        name: name.trim(),
        email: email.trim(),
        password: password.trim() || undefined,
        plan,
        workspaceName: workspaceName.trim() || undefined,
        isPlatformAdmin,
      });

      if (!res.ok) {
        setError(res.error || "Erreur lors de la création.");
      } else {
        setResult(res);
        router.refresh();
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={buttonClass("primary", "sm")}
      >
        <UserPlus className="size-3.5" />
        <span>Ajouter un utilisateur</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-ink/40 backdrop-blur-xs transition-opacity"
            onClick={handleClose}
          />

          <div
            role="dialog"
            aria-modal="true"
            className="relative z-10 w-full max-w-lg rounded-2xl border border-line bg-surface p-6 shadow-pop animate-rise"
          >
            <div className="flex items-start justify-between gap-4 border-b border-line pb-4">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-sunken text-ink">
                  <UserPlus className="size-4.5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-ink">
                    {result ? "Utilisateur créé !" : "Créer un utilisateur"}
                  </h2>
                  <p className="text-xs text-muted">
                    {result
                      ? "Les identifiants et accès ont été configurés avec succès."
                      : "Créez un nouveau compte avec son espace de travail et son plan."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="grid size-8 place-items-center rounded-lg text-muted hover:bg-sunken hover:text-ink"
              >
                <X className="size-4" />
                <span className="sr-only">Fermer</span>
              </button>
            </div>

            {result ? (
              <div className="space-y-4 pt-5">
                <div className="rounded-xl border border-positive/20 bg-positive-soft p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-positive text-white">
                      <Check className="size-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-positive">Compte configuré avec succès</p>
                      <p className="mt-0.5 text-xs text-muted">
                        L&apos;utilisateur <strong>{result.user?.name}</strong> (<span className="text-ink">{result.user?.email}</span>) a été ajouté à la base avec le plan <strong>{result.user?.plan}</strong>.
                      </p>
                    </div>
                  </div>
                </div>

                {result.generatedPassword ? (
                  <div className="rounded-xl border border-sun-deep/30 bg-sun-soft p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-xs font-medium text-sun-deep">
                        <KeyRound className="size-3.5" /> Mot de passe généré
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyPassword(result.generatedPassword!)}
                        className="inline-flex h-7 items-center gap-1 rounded-md bg-white px-2.5 text-xs font-medium text-ink shadow-xs hover:bg-surface"
                      >
                        {copied ? (
                          <>
                            <Check className="size-3 text-positive" />
                            <span>Copié !</span>
                          </>
                        ) : (
                          <>
                            <Copy className="size-3" />
                            <span>Copier</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="mt-2 rounded-lg bg-white/80 p-2.5 font-mono text-sm font-semibold tracking-wider text-ink">
                      {result.generatedPassword}
                    </div>
                    <p className="mt-2 text-2xs text-sun-deep">
                      ⚠️ Ce mot de passe temporaire ne sera plus réaffiché. Veillez à le copier et à le transmettre à l&apos;utilisateur.
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-muted">
                    Le mot de passe personnalisé fourni a été chiffré avec scrypt et enregistré en toute sécurité.
                  </p>
                )}

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-line">
                  <button
                    type="button"
                    onClick={handleClose}
                    className={buttonClass("secondary", "sm")}
                  >
                    Fermer
                  </button>
                  {result.user?.id && (
                    <button
                      type="button"
                      onClick={() => {
                        handleClose();
                        router.push(`/admin/users/${result.user!.id}`);
                      }}
                      className={buttonClass("primary", "sm")}
                    >
                      Voir la fiche utilisateur
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                {error && (
                  <div className="flex items-center gap-2 rounded-lg border border-negative/20 bg-negative-soft p-3 text-xs text-negative">
                    <AlertCircle className="size-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-ink">
                      Nom complet <span className="text-negative">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="ex: Sophie Laurent"
                      className="mt-1 h-9 w-full rounded-lg border border-line bg-surface px-3 text-sm outline-none transition-colors focus:border-ink"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-ink">
                      Adresse email <span className="text-negative">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ex: sophie@entreprise.com"
                      className="mt-1 h-9 w-full rounded-lg border border-line bg-surface px-3 text-sm outline-none transition-colors focus:border-ink"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-medium text-ink">
                      Mot de passe
                    </label>
                    <span className="text-2xs text-muted">Laissez vide pour auto-générer</span>
                  </div>
                  <div className="relative mt-1">
                    <input
                      type="text"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="•••••••••••• (ou génération auto)"
                      className="h-9 w-full rounded-lg border border-line bg-surface px-3 pr-8 text-sm font-mono outline-none transition-colors focus:border-ink"
                    />
                    <Sparkles className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-subtle" />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-ink">
                      Formule (Plan)
                    </label>
                    <select
                      value={plan}
                      onChange={(e) => setPlan(e.target.value as typeof plan)}
                      className="mt-1 h-9 w-full rounded-lg border border-line bg-surface px-2.5 text-sm outline-none transition-colors focus:border-ink"
                    >
                      <option value="launch">Launch · Essai (14j)</option>
                      <option value="growth">Growth · Essai (14j)</option>
                      <option value="scale">Scale · Essai (14j)</option>
                      <option value="free">Gratuit (Free)</option>
                      <option value="none">Aucun plan</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-ink">
                      Nom de l&apos;espace
                    </label>
                    <input
                      type="text"
                      value={workspaceName}
                      onChange={(e) => setWorkspaceName(e.target.value)}
                      placeholder="ex: Mon Espace"
                      className="mt-1 h-9 w-full rounded-lg border border-line bg-surface px-3 text-sm outline-none transition-colors focus:border-ink"
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-line bg-raised p-3">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isPlatformAdmin}
                      onChange={(e) => setIsPlatformAdmin(e.target.checked)}
                      className="size-4 rounded border-line text-ink accent-ink focus:ring-0"
                    />
                    <div>
                      <span className="flex items-center gap-1.5 text-xs font-medium text-ink">
                        <ShieldAlert className="size-3.5 text-warning" /> Accès administrateur de plateforme
                      </span>
                      <p className="text-2xs text-muted">
                        Cet utilisateur aura accès à l&apos;ensemble du panneau /admin et aux données de tous les tenants.
                      </p>
                    </div>
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-line pt-4">
                  <button
                    type="button"
                    onClick={handleClose}
                    className={buttonClass("secondary", "sm")}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={pending}
                    className={buttonClass("primary", "sm")}
                  >
                    {pending ? (
                      <>
                        <Spinner />
                        <span>Création en cours...</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="size-3.5" />
                        <span>Créer le compte</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
