"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Check, Copy, Mail, MoreHorizontal, RotateCw, Send, Trash2, UserMinus } from "lucide-react";
import { buttonClass, Spinner } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import {
  changeRoleAction,
  inviteMemberAction,
  removeMemberAction,
  resendInvitationAction,
  revokeInvitationAction,
  type InviteActionResult,
  type SettingsResult,
} from "@/app/(app)/w/[workspace]/settings/actions";
import { Feedback } from "./forms";
import { inputClass } from "./primitives";
import { ROLES, type Role } from "./roles";

const selectClass =
  "h-9 appearance-none rounded-md border border-line-strong bg-surface bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%238c887f%22 stroke-width=%222%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[length:12px] bg-[right_8px_center] bg-no-repeat pr-7 pl-2.5 text-sm text-ink outline-none focus:border-agent disabled:bg-raised disabled:text-subtle";

export function InviteForm({ slug, actorRole, disabled }: { slug: string; actorRole: Role; disabled: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("member");
  const [result, setResult] = useState<InviteActionResult | null>(null);
  const [pending, start] = useTransition();
  const options = ROLES.filter((r) => r.id !== "owner" && (actorRole === "owner" || r.id !== "admin"));

  return (
    <div className="px-4 py-4">
      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            const r = await inviteMemberAction(slug, email, role);
            setResult(r);
            if (r.ok) {
              setEmail("");
              router.refresh();
            }
          });
        }}
      >
        <label className="sr-only" htmlFor="invite-email">
          Email address
        </label>
        <div className="relative flex-1">
          <Mail className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-subtle" />
          <input
            id="invite-email"
            type="email"
            required
            disabled={disabled}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="teammate@company.com"
            className={cn(inputClass, "pl-8")}
          />
        </div>
        <label className="sr-only" htmlFor="invite-role">
          Role
        </label>
        <select id="invite-role" disabled={disabled} value={role} onChange={(e) => setRole(e.target.value as Role)} className={cn(selectClass, "sm:w-32")}>
          {options.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </select>
        <button type="submit" disabled={disabled || pending || !email} className={buttonClass("primary", "md", "h-9 disabled:bg-line-strong")}>
          {pending ? <Spinner /> : <Send className="size-3.5" />}
          Invite
        </button>
      </form>
      <p className="mt-2 text-xs text-muted">{options.find((r) => r.id === role)?.description}</p>
      {result && !result.ok && (
        <p role="alert" className="mt-2 text-xs text-negative">
          {result.error}
        </p>
      )}
      {result?.ok && <InviteLink result={result} onDismiss={() => setResult(null)} />}
    </div>
  );
}

function InviteLink({ result, onDismiss }: { result: Extract<InviteActionResult, { ok: true }>; onDismiss: () => void }) {
  const [copied, setCopied] = useState(false);
  return (
    <div role="status" className="mt-3 rounded-md border border-positive/25 bg-positive-soft p-3">
      <p className="flex items-center gap-1.5 text-sm font-medium text-positive">
        <Check className="size-4" />
        {result.emailed ? `Invitation emailed to ${result.email}` : `Invitation ready for ${result.email}`}
      </p>
      <p className="mt-0.5 text-xs text-muted">
        {result.emailed ? "You can also share this link directly. It works once and expires in 7 days." : "Send them this link. It works once, only for that email address, and expires in 7 days."}
      </p>
      <div className="mt-2 flex gap-2">
        <input readOnly value={result.inviteUrl} onFocus={(e) => e.target.select()} className={cn(inputClass, "h-8 bg-surface text-xs")} aria-label="Invitation link" />
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard.writeText(result.inviteUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
          }}
          className={buttonClass("secondary", "sm", "h-8")}
        >
          {copied ? <Check className="size-3.5 text-positive" /> : <Copy className="size-3.5" />}
          {copied ? "Copied" : "Copy link"}
        </button>
        <button type="button" onClick={onDismiss} className={buttonClass("ghost", "sm", "h-8")}>
          Done
        </button>
      </div>
    </div>
  );
}

function useOutside(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && close();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);
  return ref;
}

export function MemberControls({
  slug,
  memberId,
  role,
  roleOptions,
  canRemove,
  isSelf,
  name,
}: {
  slug: string;
  memberId: string;
  role: Role;
  /** Empty when the viewer can't change this person's role. */
  roleOptions: Role[];
  canRemove: boolean;
  isSelf: boolean;
  name: string;
}) {
  const router = useRouter();
  const [result, setResult] = useState<SettingsResult | null>(null);
  const [menu, setMenu] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [pending, start] = useTransition();
  const close = () => {
    setMenu(false);
    setConfirming(false);
  };
  const ref = useOutside(menu, close);

  const run = (fn: () => Promise<SettingsResult>) =>
    start(async () => {
      const r = await fn();
      setResult(r.ok ? null : r);
      if (r.ok) router.refresh();
    });

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-1.5">
        {pending && <Spinner className="text-subtle" />}
        {roleOptions.length > 0 ? (
          <select
            aria-label={`Role for ${name}`}
            value={role}
            disabled={pending}
            onChange={(e) => run(() => changeRoleAction(slug, memberId, e.target.value))}
            className={cn(selectClass, "h-8 w-28 text-xs")}
          >
            {roleOptions.map((r) => (
              <option key={r} value={r}>
                {ROLES.find((x) => x.id === r)?.label}
              </option>
            ))}
          </select>
        ) : (
          <span className="inline-flex h-8 w-28 items-center px-2.5 text-xs text-muted">{ROLES.find((x) => x.id === role)?.label}</span>
        )}
        {canRemove ? (
          <div ref={ref} className="relative">
            <button type="button" aria-label={`More actions for ${name}`} aria-expanded={menu} onClick={() => setMenu((o) => !o)} className="grid size-8 place-items-center rounded-md text-subtle hover:bg-sunken hover:text-ink">
              <MoreHorizontal className="size-4" />
            </button>
            {menu && (
              <div className="absolute top-9 right-0 z-20 w-52 rounded-md bg-surface p-1 shadow-pop">
                {!confirming ? (
                  <button type="button" onClick={() => setConfirming(true)} className="flex h-8 w-full items-center gap-2 rounded-sm px-2 text-sm text-negative hover:bg-negative-soft">
                    <UserMinus className="size-3.5" />
                    {isSelf ? "Leave workspace" : "Remove from workspace"}
                  </button>
                ) : (
                  <div className="p-1.5">
                    <p className="text-xs text-muted">{isSelf ? "You'll lose access right away." : `${name} loses access right away and frees a seat.`}</p>
                    <div className="mt-2 flex gap-1.5">
                      <button type="button" onClick={close} className={buttonClass("secondary", "sm", "flex-1")}>
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          close();
                          run(() => removeMemberAction(slug, memberId));
                        }}
                        className={buttonClass("primary", "sm", "flex-1 bg-negative hover:bg-negative")}
                      >
                        {isSelf ? "Leave" : "Remove"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <span className="size-8" aria-hidden />
        )}
      </div>
      <Feedback result={result} />
    </div>
  );
}

export function InvitationControls({ slug, invitationId, email, canManage }: { slug: string; invitationId: string; email: string; canManage: boolean }) {
  const router = useRouter();
  const [link, setLink] = useState<InviteActionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  if (!canManage) return null;

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-1">
        {pending && <Spinner className="text-subtle" />}
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = await resendInvitationAction(slug, invitationId);
              setError(r.ok ? null : r.error);
              setLink(r.ok ? r : null);
              router.refresh();
            })
          }
          className={buttonClass("secondary", "sm")}
        >
          <RotateCw className="size-3.5" />
          Resend
        </button>
        <button
          type="button"
          aria-label={`Revoke invitation for ${email}`}
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = await revokeInvitationAction(slug, invitationId);
              setError(r.ok ? null : r.error);
              router.refresh();
            })
          }
          className="grid size-7 place-items-center rounded-md text-subtle hover:bg-negative-soft hover:text-negative"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
      {error && <p className="text-xs text-negative">{error}</p>}
      {link?.ok && <CopyNewLink url={link.inviteUrl} emailed={link.emailed} />}
    </div>
  );
}

function CopyNewLink({ url, emailed }: { url: string; emailed: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(url);
        setCopied(true);
      }}
      className="flex items-center gap-1 text-xs text-agent hover:underline"
    >
      {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
      {copied ? "New link copied" : emailed ? "Emailed · copy new link" : "Copy new link"}
    </button>
  );
}
