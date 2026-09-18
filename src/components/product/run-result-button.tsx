"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { recordExperimentResultAction } from "@/app/(app)/w/[workspace]/actions";
import { Button, type ButtonSize, type ButtonVariant } from "@/components/ui/button";
import { useI18n } from "@/i18n/client";

export function RecordResultButton({
  slug,
  experimentId,
  mode,
  label,
  variant = "secondary",
  size = "sm",
}: {
  slug: string;
  experimentId: string;
  mode: "evaluate" | "simulate";
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  return (
    <span className="inline-flex flex-col items-start gap-1">
      <Button
        size={size}
        variant={variant}
        pending={pending}
        onClick={() =>
          start(async () => {
            const r = await recordExperimentResultAction(slug, experimentId, mode);
            setMessage(r.ok ? { ok: true, text: r.message ?? t.app.approval.done } : { ok: false, text: r.error });
            router.refresh();
          })
        }
      >
        {label}
      </Button>
      {message && (
        <span role={message.ok ? "status" : "alert"} className={message.ok ? "text-2xs text-muted" : "text-2xs text-negative"}>
          {message.text}
        </span>
      )}
    </span>
  );
}
