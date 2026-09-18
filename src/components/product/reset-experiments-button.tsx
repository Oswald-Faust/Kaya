"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { resetExperimentsAction } from "@/app/(app)/w/[workspace]/actions";
import { Modal } from "@/components/settings/forms";
import { inputClass } from "@/components/settings/primitives";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n/format";

export function ResetExperimentsButton({ slug, name }: { slug: string; name: string }) {
  const { t } = useI18n();
  const x = t.app.experiments;
  const router = useRouter();
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="flex max-w-sm flex-col items-end gap-2">
      <Button variant="secondary" size="sm" icon={<RotateCcw className="size-3.5" />} onClick={() => {
        setConfirmation(""); setError(null); setSuccess(null); setOpen(true);
      }}>{x.reset}</Button>
      {success && <p role="status" className="text-sm text-positive">{success}</p>}
      <Modal open={open} onClose={() => { if (!pending) setOpen(false); }} title={x.resetTitle} labelledBy={titleId}>
        <form className="space-y-4 p-4" onSubmit={(event) => {
          event.preventDefault();
          if (pending || confirmation.trim() !== name) return;
          start(async () => {
            setError(null);
            const result = await resetExperimentsAction(slug, confirmation);
            if (!result.ok) { setError(result.error); return; }
            setSuccess(result.message ?? null);
            setOpen(false);
            router.replace(`/w/${slug}/experiments`);
            router.refresh();
          });
        }}>
          <p className="text-sm leading-6">{x.resetBody}</p>
          <p className="text-sm leading-6 text-muted">{x.resetKept}</p>
          <p className="rounded-md bg-warning-soft p-3 text-sm leading-6">{x.resetExternal}</p>
          <label className="block space-y-2">
            <span className="text-xs text-muted">{fmt(x.resetConfirm, { name })}</span>
            <input className={inputClass} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="off" disabled={pending} />
          </label>
          {error && <p role="alert" className="text-sm text-negative">{error}</p>}
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="secondary" disabled={pending} onClick={() => setOpen(false)}>{t.common.cancel}</Button>
            <Button type="submit" variant="danger" pending={pending} disabled={confirmation.trim() !== name}>{x.resetSubmit}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
