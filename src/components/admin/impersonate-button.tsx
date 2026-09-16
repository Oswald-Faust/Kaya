"use client";

import { useState, useTransition } from "react";
import { UserCheck } from "lucide-react";
import { impersonateUserAction } from "@/app/admin/actions";
import { buttonClass, Spinner } from "@/components/ui/button";

export function ImpersonateButton({
  userId,
  userName,
  userEmail,
  compact = false,
}: {
  userId: string;
  userName: string;
  userEmail: string;
  compact?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImpersonate = () => {
    startTransition(async () => {
      try {
        setError(null);
        await impersonateUserAction(userId);
      } catch (err) {
        // Next.js redirect throws an internal error that should be re-thrown
        if (err && typeof err === "object" && "digest" in err && String((err as Record<string, unknown>).digest).startsWith("NEXT_REDIRECT")) {
          throw err;
        }
        setError(err instanceof Error ? err.message : "Erreur lors de la connexion en tant que cet utilisateur.");
        setAsking(false);
      }
    });
  };

  if (asking) {
    return (
      <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-line-strong bg-surface p-1.5 shadow-pop text-xs">
        <span className="px-1 text-xs text-muted">
          Accéder à <strong className="font-semibold text-ink">{userName || userEmail}</strong> ?
        </span>
        <button
          type="button"
          onClick={() => setAsking(false)}
          className={buttonClass("ghost", "sm")}
        >
          Non
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={handleImpersonate}
          className={buttonClass("primary", "sm")}
        >
          {pending && <Spinner />}
          Oui
        </button>
      </div>
    );
  }

  return (
    <div className="relative inline-flex flex-col items-start shrink-0">
      <button
        type="button"
        disabled={pending}
        onClick={() => setAsking(true)}
        title={`Se connecter en tant que ${userName || userEmail}`}
        className={`inline-flex items-center gap-1.5 rounded-lg border border-ink bg-ink font-medium text-white transition-all hover:bg-ink-hover active:scale-[0.98] disabled:opacity-50 whitespace-nowrap ${
          compact ? "h-7 px-2 text-2xs" : "h-8 px-3 text-xs"
        }`}
      >
        {pending ? <Spinner /> : <UserCheck className="size-3.5 text-lilac shrink-0" />}
        <span>{compact ? "Impersoner" : "Se connecter en tant que"}</span>
      </button>
      {error && (
        <span className="absolute top-full left-0 z-10 mt-1 rounded-md bg-negative-soft px-2 py-1 text-2xs text-negative shadow-pop whitespace-nowrap">
          {error}
        </span>
      )}
    </div>
  );
}
