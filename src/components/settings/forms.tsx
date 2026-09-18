"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { AlertTriangle, Check, Copy, Upload, X } from "lucide-react";
import { buttonClass, Spinner } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n/format";
import {
  changePasswordAction,
  deleteWorkspaceAction,
  renameWorkspaceAction,
  updateProfileAction,
  type SettingsResult,
} from "@/app/(app)/w/[workspace]/settings/actions";
import { Avatar, inputClass } from "./primitives";

export function Feedback({ result }: { result: SettingsResult | null }) {
  const { t } = useI18n();
  if (!result) return null;
  return result.ok ? (
    <p role="status" className="flex items-center gap-1.5 text-xs text-positive">
      <Check className="size-3.5" />
      {result.message ?? t.common.saved}
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
  const { t } = useI18n();
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
            {t.common.save}
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
  const { t } = useI18n();
  return <InlineTextForm initial={name} name="name" placeholder={t.settings.general.namePlaceholder} maxLength={60} disabled={disabled} onSave={(v) => renameWorkspaceAction(slug, v)} />;
}

export function ProfileNameForm({ slug, name }: { slug: string; name: string }) {
  const { t } = useI18n();
  return <InlineTextForm initial={name} name="name" placeholder={t.settings.profile.namePlaceholder} maxLength={80} onSave={(v) => updateProfileAction(slug, v)} />;
}

export function CopyField({ value, label }: { value: string; label: string }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex h-9 w-full items-center gap-2 rounded-md border border-line bg-raised pr-1 pl-2.5 xl:w-80">
      <span className="min-w-0 flex-1 truncate text-sm text-muted">{value}</span>
      <button
        type="button"
        aria-label={copied ? t.common.copied : label}
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

const MAX_SOURCE_BYTES = 10 * 1024 * 1024;
const OUTPUT_SIZE = 256;

/** Center-crops to a square and resizes in the browser, so uploads stay small whatever the camera. */
async function toSquareImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("canvas");
  context.imageSmoothingQuality = "high";
  context.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
  bitmap.close();
  const encode = (type: string) => new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.9));
  const webp = await encode("image/webp");
  if (webp?.type === "image/webp") return webp;
  const png = await encode("image/png");
  if (!png) throw new Error("encode");
  return png;
}

/** Clay/Workable pattern: the current picture, Upload and Remove, plus drag and drop onto the picture. */
export function ImageUploader({
  name,
  src,
  shape,
  disabled,
  onUpload,
  onRemove,
}: {
  name: string;
  src: string | null;
  shape: "circle" | "square";
  disabled?: boolean;
  onUpload: (data: FormData) => Promise<SettingsResult>;
  onRemove: () => Promise<SettingsResult>;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [result, setResult] = useState<SettingsResult | null>(null);
  const [pending, start] = useTransition();
  const shown = preview ?? src;

  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);

  const handle = (file: File | undefined) => {
    if (!file || disabled) return;
    if (file.size > MAX_SOURCE_BYTES) return setResult({ ok: false, error: t.settings.image.tooLarge });
    start(async () => {
      let blob: Blob;
      try {
        blob = await toSquareImage(file);
      } catch {
        setResult({ ok: false, error: t.settings.image.unreadable });
        return;
      }
      setPreview(URL.createObjectURL(blob));
      const data = new FormData();
      data.append("image", blob, "image");
      const r = await onUpload(data);
      setResult(r);
      if (!r.ok) setPreview(null);
      router.refresh();
    });
  };

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        disabled={disabled || pending}
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handle(e.dataTransfer.files[0]);
        }}
        aria-label={t.settings.image.upload}
        className={cn(
          "group relative shrink-0 overflow-hidden outline-offset-2 disabled:cursor-default",
          shape === "circle" ? "rounded-full" : "rounded-lg",
          dragging && "ring-2 ring-agent ring-offset-2",
        )}
      >
        <Avatar name={name} src={shown} className={cn("size-16 text-xl", shape === "circle" ? "rounded-full" : "rounded-lg")} />
        {!disabled && (
          <span className={cn("absolute inset-0 grid place-items-center bg-ink/45 text-white transition-opacity", pending ? "opacity-100" : "opacity-0 group-hover:opacity-100")}>
            {pending ? <Spinner /> : <Upload className="size-4" />}
          </span>
        )}
      </button>
      <div className="min-w-0">
        {!disabled && (
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={pending} onClick={() => input.current?.click()} className={buttonClass("primary", "sm")}>
              {pending ? t.settings.image.uploading : shown ? t.settings.image.replace : t.settings.image.upload}
            </button>
            {shown && (
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    const r = await onRemove();
                    setResult(r);
                    if (r.ok) setPreview(null);
                    router.refresh();
                  })
                }
                className={buttonClass("secondary", "sm")}
              >
                {t.settings.image.remove}
              </button>
            )}
          </div>
        )}
        <p className="mt-1.5 text-xs text-muted">{t.settings.image.hint}</p>
        <div className="mt-1 min-h-4">
          <Feedback result={result} />
        </div>
      </div>
      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          handle(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}

export function Modal({ open, onClose, title, children, labelledBy }: { open: boolean; onClose: () => void; title: string; children: ReactNode; labelledBy: string }) {
  const { t } = useI18n();
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
        <button type="button" onClick={onClose} aria-label={t.common.close} className="grid size-7 place-items-center rounded-md text-subtle hover:bg-sunken hover:text-ink">
          <X className="size-4" />
        </button>
      </div>
      {open && children}
    </dialog>
  );
}

/** GitHub/Fibery pattern: typing the exact name arms the destructive button. */
export function DeleteWorkspace({ slug, name, blockedReason, variant = "button" }: { slug: string; name: string; blockedReason: string | null; variant?: "button" | "link" }) {
  const { t } = useI18n();
  const g = t.settings.general;
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [result, setResult] = useState<SettingsResult | null>(null);
  const [pending, start] = useTransition();
  const [before, after] = g.deleteConfirm.split("{name}");

  return (
    <>
      <div className="flex flex-col items-start gap-1.5 sm:items-end">
        <button
          type="button"
          disabled={Boolean(blockedReason)}
          onClick={() => setOpen(true)}
          className={variant === "link" ? "rounded-md px-2 py-1 text-xs font-medium text-negative underline decoration-negative/30 underline-offset-4 hover:decoration-negative" : buttonClass("danger", "md")}
        >
          {g.delete}
        </button>
        {blockedReason && <p className="max-w-xs text-xs text-muted sm:text-right">{blockedReason}</p>}
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title={g.deleteTitle} labelledBy="delete-ws-title">
        <form
          className="space-y-4 p-4"
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => setResult(await deleteWorkspaceAction(slug, typed)));
          }}
        >
          <div className="flex gap-3 rounded-md bg-negative-soft p-3 text-sm text-negative">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <p>{fmt(g.deleteWarning, { name })}</p>
          </div>
          <label className="block">
            <span className="text-xs text-muted">
              {before}
              <strong className="font-semibold text-ink">{name}</strong>
              {after}
            </span>
            <input value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" className={cn(inputClass, "mt-1")} />
          </label>
          <Feedback result={result} />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className={buttonClass("secondary", "md")}>
              {t.common.cancel}
            </button>
            <button type="submit" disabled={typed.trim() !== name || pending} className={buttonClass("primary", "md", "bg-negative hover:bg-negative disabled:bg-negative/40")}>
              {pending && <Spinner />}
              {g.deleteForever}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export function PasswordForm({ slug, hasPassword }: { slug: string; hasPassword: boolean }) {
  const { t } = useI18n();
  const p = t.settings.profile;
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
          <span className="text-xs text-muted">{p.currentPassword}</span>
          <input type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} className={cn(inputClass, "mt-1")} />
        </label>
      )}
      <label className={cn("block", !hasPassword && "sm:col-span-2")}>
        <span className="text-xs text-muted">{hasPassword ? p.newPassword : p.setPassword}</span>
        <input type="password" autoComplete="new-password" minLength={8} value={next} onChange={(e) => setNext(e.target.value)} placeholder={p.passwordPlaceholder} className={cn(inputClass, "mt-1")} />
      </label>
      <button type="submit" disabled={pending || next.length < 8 || (hasPassword && !current)} className={buttonClass("primary", "md", "h-9 disabled:bg-line-strong")}>
        {pending && <Spinner />}
        {hasPassword ? p.updatePassword : p.setPasswordButton}
      </button>
      <div className="sm:col-span-3">
        <Feedback result={result} />
      </div>
    </form>
  );
}
