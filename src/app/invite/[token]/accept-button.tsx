"use client";

import { useActionState } from "react";
import { ArrowRight } from "lucide-react";
import { buttonClass, Spinner } from "@/components/ui/button";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n/format";
import { acceptInvitationAction, type AcceptState } from "./actions";

export function AcceptButton({ token, workspaceName }: { token: string; workspaceName: string }) {
  const { t } = useI18n();
  const [state, action, pending] = useActionState<AcceptState>(acceptInvitationAction.bind(null, token), { error: null });
  return (
    <form action={action} className="w-full">
      <button type="submit" disabled={pending} className={buttonClass("primary", "lg", "h-11 w-full")}>
        {pending ? <Spinner /> : null}
        {fmt(t.settings.invite.joinButton, { workspace: workspaceName })}
        {!pending && <ArrowRight className="size-4" />}
      </button>
      {state.error && (
        <p role="alert" className="mt-3 text-sm text-negative">
          {state.error}
        </p>
      )}
    </form>
  );
}
