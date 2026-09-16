"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { AlertTriangle, Check, ChevronDown, ExternalLink, Eye, EyeOff, KeyRound, Lock, PenLine, RefreshCw, Unplug } from "lucide-react";
import { connectApiKeyAction, connectDemoAction, disconnectAction, selectAccountAction, syncAction, type IntegrationResult } from "@/app/actions/integrations";
import { BrandIcon, type BrandName } from "@/components/brand/brand-logos";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClass, Spinner } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { relativeTime } from "@/lib/format";
import type { IntegrationDefinition } from "@/server/integrations/catalog";
import type { ConnectionView, ConnectSpec } from "@/server/integrations/view";

export type Recommendation = { label: string; tone: "agent" | "neutral" | "outline" };

const BRAND: Record<string, BrandName> = {
  stripe: "stripe",
  paddle: "paddle",
  lemon_squeezy: "lemonsqueezy",
  google_analytics: "googleanalytics",
  posthog: "posthog",
  plausible: "plausible",
  search_console: "searchconsole",
  google_ads: "googleads",
  meta_ads: "meta",
  linkedin_ads: "linkedin",
  linkedin_organic: "linkedin",
  tiktok_ads: "tiktok",
  x: "x",
  resend: "resend",
  brevo: "brevo",
  hubspot: "hubspot",
  github: "github",
};

const OAUTH_LABEL: Record<string, string> = {
  google_analytics: "Continue with Google",
  search_console: "Continue with Google",
  google_ads: "Continue with Google",
  meta_ads: "Continue with Facebook",
  x: "Continue with X",
  linkedin_organic: "Continue with LinkedIn",
};

export function IntegrationLogo({ provider, name }: { provider: string; name: string }) {
  const brand = BRAND[provider];
  return (
    <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-xl border border-line bg-surface">
      {brand ? <BrandIcon brand={brand} className="size-5" /> : <span className="text-xs font-semibold text-ink">{name.slice(0, 2)}</span>}
    </span>
  );
}

export function IntegrationCard({
  slug,
  def,
  spec,
  connection,
  recommendation,
  canManage,
  isDemo,
  returnTo,
}: {
  slug: string;
  def: IntegrationDefinition;
  spec: ConnectSpec;
  connection: ConnectionView | null;
  recommendation: Recommendation;
  canManage: boolean;
  isDemo: boolean;
  returnTo: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<IntegrationResult | null>(null);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  const run = (key: string, fn: () => Promise<IntegrationResult>, after?: () => void) => {
    setBusy(key);
    start(async () => {
      const r = await fn();
      setFeedback(r);
      setBusy(null);
      if (r.ok) {
        after?.();
        router.refresh();
      }
    });
  };

  const connected = connection !== null;
  const failing = connection?.status === "error";

  return (
    <article className={cn("rounded-2xl border bg-surface transition-colors", open ? "border-line-strong shadow-sm" : "border-line", failing && "border-negative/40")}>
      <div className="flex items-start gap-3.5 p-4">
        <IntegrationLogo provider={def.provider} name={def.name} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[15px] font-medium text-ink">{def.name}</h3>
            {connected ? (
              failing ? (
                <Badge tone="negative">
                  <AlertTriangle className="size-3" /> Reconnect needed
                </Badge>
              ) : (
                <Badge tone="positive">
                  <Check className="size-3" /> {connection.mode === "demo" ? "Demo" : "Connected"}
                </Badge>
              )
            ) : (
              <Badge tone={recommendation.tone}>{recommendation.label}</Badge>
            )}
          </div>
          {connected && connection.accountLabel ? (
            <p className="mt-0.5 truncate text-sm text-ink">{connection.accountLabel}</p>
          ) : (
            <p className="mt-0.5 text-sm text-muted">{def.unlocks}</p>
          )}
        </div>
        {canManage && !connected && spec.type !== "none" && (
          <Button size="sm" variant={open ? "ghost" : "secondary"} onClick={() => setOpen((o) => !o)} aria-expanded={open}>
            {open ? "Close" : "Connect"}
          </Button>
        )}
        {spec.type === "none" && !connected && <span className="text-xs text-subtle">Coming soon</span>}
      </div>

      {connected && (
        <div className="space-y-3 border-t border-line px-4 py-3">
          {connection.mode === "live" && (
            <>
              {connection.syncError ? (
                <p className={cn("flex items-start gap-1.5 text-xs", failing ? "text-negative" : "text-warning")}>
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                  {connection.syncError}
                </p>
              ) : connection.lastSyncSummary ? (
                <p className="text-xs text-muted">
                  <span className="text-ink">{connection.lastSyncSummary}</span>
                  {connection.lastSyncAt && <span className="text-subtle"> · synced {relativeTime(connection.lastSyncAt)}</span>}
                </p>
              ) : (
                <p className="text-xs text-subtle">Not synced yet.</p>
              )}
              {connection.accounts.length > 1 && canManage && (
                <label className="relative block">
                  <span className="sr-only">Account</span>
                  <select
                    value={connection.accountId ?? ""}
                    disabled={pending}
                    onChange={(e) => run("account", () => selectAccountAction(slug, def.provider, e.target.value))}
                    className="h-9 w-full appearance-none rounded-lg border border-line bg-surface pr-8 pl-3 text-sm outline-none focus:border-ink"
                  >
                    {connection.accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.label}
                        {a.detail ? ` · ${a.detail}` : ""}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-subtle" />
                </label>
              )}
            </>
          )}
          {canManage && (
            <div className="flex flex-wrap items-center gap-2">
              {connection.mode === "live" &&
                (failing && spec.type === "oauth" && spec.available ? (
                  <a href={`/api/integrations/${def.provider}/connect?workspace=${slug}&returnTo=${encodeURIComponent(returnTo)}`} className={buttonClass("primary", "sm")}>
                    Reconnect
                  </a>
                ) : failing ? (
                  <Button size="sm" variant="primary" onClick={() => setOpen(true)}>
                    Update key
                  </Button>
                ) : (
                  <Button size="sm" variant="secondary" pending={busy === "sync"} icon={<RefreshCw className="size-3.5" />} onClick={() => run("sync", () => syncAction(slug, def.provider))}>
                    Sync now
                  </Button>
                ))}
              {confirmDisconnect ? (
                <span className="flex items-center gap-1.5 text-xs text-muted">
                  Delete stored access?
                  <Button size="sm" variant="danger" pending={busy === "disconnect"} onClick={() => run("disconnect", () => disconnectAction(slug, def.provider), () => setConfirmDisconnect(false))}>
                    Disconnect
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setConfirmDisconnect(false)}>
                    Keep
                  </Button>
                </span>
              ) : (
                <Button size="sm" variant="ghost" icon={<Unplug className="size-3.5" />} onClick={() => setConfirmDisconnect(true)}>
                  Disconnect
                </Button>
              )}
            </div>
          )}
          {feedback && <Feedback result={feedback} />}
        </div>
      )}

      {open && (!connected || failing) && (
        <div className="space-y-4 border-t border-line bg-raised px-4 py-4">
          <div>
            <p className="text-xs font-medium text-subtle">Kaya will be able to</p>
            <ul className="mt-2 space-y-1.5">
              {def.permissions.map((p) => (
                <li key={p.label} className="flex items-start gap-2 text-sm text-ink">
                  {p.access === "read" ? <Eye className="mt-0.5 size-4 shrink-0 text-muted" /> : <PenLine className="mt-0.5 size-4 shrink-0 text-warning" />}
                  <span>
                    <span className={cn("mr-1.5 text-xs font-medium", p.access === "read" ? "text-muted" : "text-warning")}>{p.access === "read" ? "Read" : "Write"}</span>
                    {p.label}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-muted">Writes always go through your autonomy mode and budget limits and are recorded in the audit log. Credentials are encrypted and deleted when you disconnect.</p>
          </div>

          {isDemo ? (
            <Button size="sm" variant="primary" pending={busy === "demo"} onClick={() => run("demo", () => connectDemoAction(slug, def.provider), () => setOpen(false))}>
              Connect in demo mode
            </Button>
          ) : spec.type === "api_key" ? (
            spec.available ? (
              <ApiKeyForm spec={spec} name={def.name} pending={busy === "key"} onSubmit={(values) => run("key", () => connectApiKeyAction(slug, def.provider, values), () => setOpen(false))} />
            ) : (
              <Unavailable reason={spec.unavailableReason} />
            )
          ) : spec.type === "oauth" ? (
            spec.available ? (
              <div className="flex flex-wrap items-center gap-3">
                <a href={`/api/integrations/${def.provider}/connect?workspace=${slug}&returnTo=${encodeURIComponent(returnTo)}`} className={buttonClass("primary", "lg")}>
                  {BRAND[def.provider] && <BrandIcon brand={BRAND[def.provider]} mono className="size-4" />}
                  {OAUTH_LABEL[def.provider] ?? "Continue"}
                </a>
                <span className="flex items-center gap-1 text-xs text-muted">
                  <Lock className="size-3" /> You approve access on {def.name.split(" ")[0]}&apos;s own page
                </span>
              </div>
            ) : (
              <Unavailable reason={spec.unavailableReason} />
            )
          ) : null}
          {!connected && feedback && <Feedback result={feedback} />}
        </div>
      )}
    </article>
  );
}

function Feedback({ result }: { result: IntegrationResult }) {
  return (
    <p role="status" className={cn("flex items-start gap-1.5 text-xs", result.ok ? "text-positive" : "text-negative")}>
      {result.ok ? <Check className="mt-0.5 size-3.5 shrink-0" /> : <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />}
      {result.ok ? result.message : result.error}
    </p>
  );
}

function Unavailable({ reason }: { reason?: string }) {
  return (
    <p className="flex items-start gap-2 rounded-xl border border-dashed border-line-strong bg-surface px-3 py-2.5 text-xs text-muted">
      <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-warning" />
      {reason ?? "Not available yet."}
    </p>
  );
}

function ApiKeyForm({ spec, name, pending, onSubmit }: { spec: Extract<ConnectSpec, { type: "api_key" }>; name: string; pending: boolean; onSubmit: (values: Record<string, string>) => void }) {
  const [reveal, setReveal] = useState(false);
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    onSubmit(Object.fromEntries(spec.fields.map((f) => [f.name, String(data.get(f.name) ?? "")])));
  };
  return (
    <form onSubmit={submit} className="space-y-3">
      <ol className="space-y-1 rounded-xl bg-surface px-3.5 py-3 text-sm text-ink">
        {spec.instructions.map((step, i) => (
          <li key={i} className="flex gap-2">
            <span className="grid size-5 shrink-0 place-items-center rounded-full bg-sunken text-2xs font-medium text-muted">{i + 1}</span>
            <span>{step}</span>
          </li>
        ))}
        <li className="pt-1">
          <a href={spec.docsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-agent hover:underline">
            Open {name} <ExternalLink className="size-3" />
          </a>
        </li>
      </ol>
      <div className="grid gap-3 sm:grid-cols-2">
        {spec.fields.map((f) => (
          <label key={f.name} className={cn("block space-y-1", (f.secret || spec.fields.length === 1) && "sm:col-span-2")}>
            <span className="text-xs font-medium text-muted">
              {f.label}
              {f.optional && <span className="font-normal text-subtle"> · optional</span>}
            </span>
            {f.options ? (
              <select name={f.name} defaultValue={f.options[0].value} className="h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm outline-none focus:border-ink">
                {f.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : (
              <span className="relative block">
                {f.secret && <KeyRound className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" />}
                <input
                  name={f.name}
                  type={f.secret && !reveal ? "password" : "text"}
                  required={!f.optional}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder={f.placeholder}
                  className={cn("h-11 w-full rounded-lg border border-line bg-surface text-sm outline-none focus:border-ink", f.secret ? "pr-10 pl-9 font-mono" : "px-3")}
                />
                {f.secret && (
                  <button type="button" onClick={() => setReveal((r) => !r)} aria-label={reveal ? "Hide key" : "Show key"} className="absolute top-1/2 right-2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-subtle hover:text-ink">
                    {reveal ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                )}
              </span>
            )}
          </label>
        ))}
      </div>
      <button type="submit" disabled={pending} className={buttonClass("primary", "lg")}>
        {pending && <Spinner />}
        {pending ? `Checking with ${name}…` : "Verify and connect"}
      </button>
    </form>
  );
}
