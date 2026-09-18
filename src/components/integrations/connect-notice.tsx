"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, CheckCircle2, X } from "lucide-react";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n/format";
import { translateServerText } from "@/i18n/server-text";
import { INTEGRATIONS } from "@/server/integrations/catalog";

/** Shows the outcome of an OAuth round-trip (?connected= or ?integration_error=), then clears the URL. */
export function ConnectNotice() {
  const sp = useSearchParams();
  const router = useRouter();
  const { t, locale } = useI18n();
  const connected = sp.get("connected");
  const error = sp.get("integration_error");
  if (!connected && !error) return null;
  const name = INTEGRATIONS.find((i) => i.provider === (connected ?? sp.get("provider")))?.name;

  const dismiss = () => {
    const url = new URL(window.location.href);
    ["connected", "integration_error", "provider"].forEach((k) => url.searchParams.delete(k));
    router.replace(url.pathname + url.search, { scroll: false });
  };

  return (
    <div role="status" className={`flex items-start gap-3 rounded-2xl px-4 py-3 text-sm ${connected ? "bg-positive-soft text-positive" : "bg-negative-soft text-negative"}`}>
      {connected ? <CheckCircle2 className="mt-0.5 size-4 shrink-0" /> : <AlertTriangle className="mt-0.5 size-4 shrink-0" />}
      <p className="flex-1">{connected ? fmt(t.integrations.connectedNotice, { name: name ?? t.integrations.integrationFallback }) : `${name ? `${name}: ` : ""}${translateServerText(error, locale)}`}</p>
      <button type="button" onClick={dismiss} aria-label={t.integrations.dismiss} className="shrink-0 opacity-70 hover:opacity-100">
        <X className="size-4" />
      </button>
    </div>
  );
}
