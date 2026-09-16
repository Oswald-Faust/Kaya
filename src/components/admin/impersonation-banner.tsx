import { UserCheck, ArrowLeft, ShieldAlert } from "lucide-react";
import { getImpersonatorState } from "@/server/auth/session";
import { stopImpersonatingAction } from "@/app/admin/actions";

export async function ImpersonationBanner() {
  const state = await getImpersonatorState();
  if (!state) return null;

  return (
    <div
      role="alert"
      className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-3 border-b border-lilac-deep/30 bg-ink px-4 py-2 text-xs text-white shadow-pop sm:px-6"
    >
      <div className="flex items-center gap-2.5">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-lilac/20 text-lilac">
          <UserCheck className="size-3.5" />
        </span>
        <div className="flex flex-wrap items-baseline gap-1.5">
          <span className="font-semibold tracking-wide text-lilac uppercase">Mode Impersonation</span>
          <span className="text-white/60">·</span>
          <span>
            Connecté en tant que <strong className="font-medium text-white">{state.targetUser?.name ?? "Utilisateur"}</strong>{" "}
            <span className="text-white/70">({state.targetUser?.email ?? state.targetUserId})</span>
          </span>
          {state.adminEmail && (
            <span className="hidden items-center gap-1 text-2xs text-white/50 md:inline-flex">
              <ShieldAlert className="size-3" /> Admin : {state.adminEmail}
            </span>
          )}
        </div>
      </div>

      <form action={stopImpersonatingAction} className="shrink-0">
        <button
          type="submit"
          className="inline-flex h-7 items-center gap-1.5 rounded-md bg-white px-3 text-xs font-medium text-ink transition-colors hover:bg-white/90 active:scale-[0.98]"
        >
          <ArrowLeft className="size-3.5" />
          <span>Quitter et retourner à l&apos;admin</span>
        </button>
      </form>
    </div>
  );
}
