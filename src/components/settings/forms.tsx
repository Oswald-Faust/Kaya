"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { AlertTriangle, Check, Copy, X } from "lucide-react";
import { buttonClass, Spinner } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import {
  changePasswordAction,
  deleteWorkspaceAction,
  renameWorkspaceAction,
  updateProfileAction,
  type SettingsResult,
} from "@/app/(app)/w/[workspace]/settings/actions";
import { inputClass } from "./primitives";

export function Feedback({ result }: { result: SettingsResult | null }) {
  if (!result) return null;
  return result.ok ? (
    <p role="status" className="flex items-center gap-1.5 text-xs text-positive">
      <Check className="size-3.5" />
      {result.message ?? "Saved."}
    </p>
  ) : (
    <p role="alert" className="text-xs text-negative">
      {result.error}
    </p>
  );
}

/** One text value with an inline Save that only lights up once the value changes (Clay, Fibery). */
function InlineTextForm({
  initial,
  name,
  placeholder,
  disabled,
  maxLength,
  onSave,
}: {
  initial: string;
  name: string;
  placeholder?: string;
  disabled?: boolean;
  maxLength: number;
  onSave: (value: string) => Promise<SettingsResult>;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [result, setResult] = useState<SettingsResult | null>(null);
  const [pending, start] = useTransition();
  const dirty = value.trim() !== saved && value.trim().length > 0;

  return (
    <form
      className="w-full xl:w-80"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await onSave(value.trim());
          setResult(r);
          if (r.ok) {
            setSaved(value.trim());
            router.refresh();
          }
        });
      }}
    >
      <div className="flex gap-2">
        <input
          name={name}
          aria-label={placeholder}
          value={value}
          maxLength={maxLength}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(e) => {
            setValue(e.target.value);
            setResult(null);
          }}
          className={inputClass}
        />
        {!disabled && (
          <button type="submit" disabled={!dirty || pending} className={buttonClass("primary", "md", "h-9 disabled:bg-line-strong")}>
            {pending && <Spinner />}
            Save
          </button>
        )}
      </div>
      <div className="mt-1.5 min-h-4">
        <Feedback result={result} />
      </div>
    </form>
  );
}

export function WorkspaceNameForm({ slug, name, disabled }: { slug: string; name: string; disabled: boolean }) {
  return <InlineTextForm initial={name} name="name" placeholder="Workspace name" maxLength={60} disabled={disabled} onSave={(v) => renameWorkspaceAction(slug, v)} />;
}

export function ProfileNameForm({ slug, name }: { slug: string; name: string }) {
  return <InlineTextForm initial={name} name="name" placeholder="Your name" maxLength={80} onSave={(v) => updateProfileAction(slug, v)} />;
}

export function CopyField({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex h-9 w-full items-center gap-2 rounded-md border border-line bg-raised pr-1 pl-2.5 xl:w-80">
      <span className="min-w-0 flex-1 truncate text-sm text-muted">{value}</span>
      <button
        type="button"
        aria-label={copied ? "Copied" : label}
        onClick={() => {
          void navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        }}
        className="grid size-7 place-items-center rounded-md text-subtle hover:bg-sunken hover:text-ink"
      >
        {copied ? <Check className="size-3.5 text-positive" /> : <Copy className="size-3.5" />}
      </button>
    </div>
  );
}

export function Modal({ open, onClose, title, children, labelledBy }: { open: boolean; onClose: () => void; title: string; children: ReactNode; labelledBy: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className="m-auto w-[min(440px,calc(100vw-24px))] rounded-lg bg-surface p-0 text-ink shadow-pop backdrop:bg-ink/40"
    >
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <h2 id={labelledBy} className="text-base font-semibold">
          {title}
        </h2>
        <button type="button" onClick={onClose} aria-label="Close" className="grid size-7 place-items-center rounded-md text-subtle hover:bg-sunken hover:text-ink">
          <X className="size-4" />
        </button>
      </div>
      {open && children}
    </dialog>
  );
}

/** GitHub/Fibery pattern: typing the exact name arms the destructive button. */
export function DeleteWorkspace({ slug, name, blockedReason }: { slug: string; name: string; blockedReason: string | null }) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [result, setResult] = useState<SettingsResult | null>(null);
  const [pending, start] = useTransition();

  return (
    <>
      <button type="button" disabled={Boolean(blockedReason)} title={blockedReason ?? undefined} onClick={() => setOpen(true)} className={buttonClass("danger", "md")}>
        Delete workspace
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Delete this workspace?" labelledBy="delete-ws-title">
        <form
          className="space-y-4 p-4"
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => setResult(await deleteWorkspaceAction(slug, typed)));
          }}
        >
          <div className="flex gap-3 rounded-md bg-negative-soft p-3 text-sm text-negative">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <p>This permanently deletes the strategy, experiments, learnings, business memory and connections of {name}. It can&apos;t be undone.</p>
          </div>
          <label className="block">
            <span className="text-xs text-muted">
              Type <strong className="font-semibold text-ink">{name}</strong> to confirm
            </span>
            <input value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" className={cn(inputClass, "mt-1")} />
          </label>
          <Feedback result={result} />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className={buttonClass("secondary", "md")}>
              Cancel
            </button>
            <button type="submit" disabled={typed.trim() !== name || pending} className={buttonClass("primary", "md", "bg-negative hover:bg-negative disabled:bg-negative/40")}>
              {pending && <Spinner />}
              Delete forever
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export function PasswordForm({ slug, hasPassword }: { slug: string; hasPassword: boolean }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [result, setResult] = useState<SettingsResult | null>(null);
  const [pending, start] = useTransition();

  return (
    <form
      className="grid gap-3 px-4 py-3.5 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await changePasswordAction(slug, current, next);
          setResult(r);
          if (r.ok) {
            setCurrent("");
            setNext("");
          }
        });
      }}
    >
      {hasPassword && (
        <label className="block">
          <span className="text-xs text-muted">Current password</span>
          <input type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} className={cn(inputClass, "mt-1")} />
        </label>
      )}
      <label className={cn("block", !hasPassword && "sm:col-span-2")}>
        <span className="text-xs text-muted">{hasPassword ? "New password" : "Set a password"}</span>
        <input type="password" autoComplete="new-password" minLength={8} value={next} onChange={(e) => setNext(e.target.value)} placeholder="At least 8 characters" className={cn(inputClass, "mt-1")} />
      </label>
      <button type="submit" disabled={pending || next.length < 8 || (hasPassword && !current)} className={buttonClass("primary", "md", "h-9 disabled:bg-line-strong")}>
        {pending && <Spinner />}
        {hasPassword ? "Update password" : "Set password"}
      </button>
      <div className="sm:col-span-3">
        <Feedback result={result} />
      </div>
    </form>
  );
}
