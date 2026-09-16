import Link from "next/link";
import type { ReactNode } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatDate, relativeTime } from "@/lib/format";

export function AdminPage({ title, description, actions, children }: { title: string; description?: ReactNode; actions?: ReactNode; children: ReactNode }) {
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] leading-tight font-medium tracking-[-0.03em] text-ink">{title}</h1>
          {description && <p className="mt-1 text-sm text-muted">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </header>
      {children}
    </div>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("rounded-2xl border border-line bg-surface", className)}>{children}</section>;
}

export function CardHeader({ title, description, actions }: { title: ReactNode; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-3.5">
      <div>
        <h2 className="text-sm font-medium text-ink">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
      </div>
      {actions}
    </div>
  );
}

export function Stat({ label, value, hint, tone = "plain" }: { label: string; value: ReactNode; hint?: ReactNode; tone?: "plain" | "lime" | "ink" }) {
  return (
    <div className={cn("rounded-2xl border p-5", tone === "lime" ? "border-transparent bg-lime" : tone === "ink" ? "border-transparent bg-ink text-white" : "border-line bg-surface")}>
      <p className={cn("text-xs", tone === "ink" ? "text-white/60" : "text-muted")}>{label}</p>
      <p className="mt-2 text-[30px] leading-none font-medium tracking-[-0.04em] tabular">{value}</p>
      {hint && <p className={cn("mt-2 text-xs", tone === "ink" ? "text-white/60" : "text-muted")}>{hint}</p>}
    </div>
  );
}

const PILL = {
  neutral: "bg-sunken text-muted",
  positive: "bg-positive-soft text-positive",
  negative: "bg-negative-soft text-negative",
  warning: "bg-warning-soft text-warning",
  agent: "bg-agent-soft text-agent",
  lime: "bg-lime-soft text-lime-deep",
  ink: "bg-ink text-white",
} as const;

export function Pill({ tone = "neutral", children }: { tone?: keyof typeof PILL; children: ReactNode }) {
  return <span className={cn("inline-flex h-5 items-center gap-1 rounded-full px-2 text-2xs font-medium whitespace-nowrap", PILL[tone])}>{children}</span>;
}

export function PlanPill({ plan, status }: { plan: string; status: string }) {
  if (plan === "none") return <Pill>No plan</Pill>;
  const name = plan[0].toUpperCase() + plan.slice(1);
  if (plan === "free") return <Pill tone="lime">Free</Pill>;
  if (status === "trialing") return <Pill tone="warning">{name} · trial</Pill>;
  if (status === "past_due") return <Pill tone="negative">{name} · past due</Pill>;
  if (status === "canceled") return <Pill>{name} · canceled</Pill>;
  return <Pill tone="positive">{name}</Pill>;
}

export function RunStatusPill({ status }: { status: string }) {
  const tone = status === "completed" ? "positive" : status === "failed" ? "negative" : status === "running" || status === "queued" ? "agent" : "neutral";
  return <Pill tone={tone}>{status.replace(/_/g, " ")}</Pill>;
}

export function SearchForm({ placeholder, defaultValue, hidden }: { placeholder: string; defaultValue?: string; hidden?: Record<string, string | undefined> }) {
  return (
    <form role="search" className="relative w-full max-w-sm">
      {Object.entries(hidden ?? {}).map(([k, v]) => (v ? <input key={k} type="hidden" name={k} value={v} /> : null))}
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" />
      <input name="q" defaultValue={defaultValue} placeholder={placeholder} aria-label={placeholder} className="h-9 w-full rounded-lg border border-line bg-surface pr-3 pl-9 text-sm outline-none focus:border-ink" />
    </form>
  );
}

export function FilterTabs({ current, options, param = "filter", base, keep }: { current: string; options: { value: string; label: string; count?: number }[]; param?: string; base: string; keep?: Record<string, string | undefined> }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const qs = new URLSearchParams(Object.entries({ ...keep, [param]: o.value === "all" ? undefined : o.value }).filter(([, v]) => v) as [string, string][]);
        const active = current === o.value;
        return (
          <Link key={o.value} href={`${base}${qs.size ? `?${qs}` : ""}`} className={cn("inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors", active ? "border-ink bg-ink text-white" : "border-line bg-surface text-muted hover:border-line-strong hover:text-ink")}>
            {o.label}
            {o.count !== undefined && <span className={cn("tabular", active ? "text-white/60" : "text-subtle")}>{o.count}</span>}
          </Link>
        );
      })}
    </div>
  );
}

export function Table({ head, children, empty }: { head: ReactNode[]; children: ReactNode; empty?: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-line text-xs text-subtle">
            {head.map((h, i) => (
              <th key={i} scope="col" className="px-5 py-2.5 font-normal whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
      {empty && <p className="px-5 py-10 text-center text-sm text-muted">Nothing here yet.</p>}
    </div>
  );
}

export function Td({ children, className }: { children: ReactNode; className?: string }) {
  return <td className={cn("px-5 py-3 align-middle", className)}>{children}</td>;
}

export function Avatar({ name, email }: { name: string; email: string }) {
  const initials = (name || email).split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((s) => s[0]!.toUpperCase()).join("");
  const hue = [...email].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);
  return (
    <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full text-2xs font-medium text-ink" style={{ background: `hsl(${hue} 80% 88%)` }}>
      {initials}
    </span>
  );
}

const isRecent = (d: Date) => Date.now() - d.getTime() < 7 * 86_400_000;

export function When({ date }: { date: Date | string | null | undefined }) {
  if (!date) return <span className="text-subtle">—</span>;
  const d = new Date(date);
  return (
    <time dateTime={d.toISOString()} title={d.toLocaleString("en-US")} className="whitespace-nowrap text-muted">
      {isRecent(d) ? relativeTime(d) : formatDate(d, { month: "short", day: "numeric", year: "numeric" })}
    </time>
  );
}

export function Dl({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className="divide-y divide-line">
      {items.map(([k, v]) => (
        <div key={k} className="flex items-start justify-between gap-4 px-5 py-2.5 text-sm">
          <dt className="text-muted">{k}</dt>
          <dd className="min-w-0 text-right break-words text-ink">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function BarChart({ data, label }: { data: { x: string; y: number }[]; label: string }) {
  const max = Math.max(1, ...data.map((d) => d.y));
  return (
    <figure aria-label={label}>
      <div className="flex h-40 items-end gap-[3px]">
        {data.map((d) => (
          <div key={d.x} className="group relative flex h-full flex-1 items-end">
            <div className={cn("w-full rounded-t-[3px] transition-colors", d.y ? "bg-ink group-hover:bg-agent" : "bg-sunken")} style={{ height: `${Math.max(3, (d.y / max) * 100)}%` }} />
            <span className="pointer-events-none absolute bottom-full left-1/2 mb-1 hidden -translate-x-1/2 rounded bg-ink px-1.5 py-0.5 text-2xs whitespace-nowrap text-white group-hover:block">
              {formatDate(`${d.x}T12:00:00Z`)} · {d.y}
            </span>
          </div>
        ))}
      </div>
      <figcaption className="mt-2 flex justify-between text-2xs text-subtle">
        <span>{formatDate(`${data[0]?.x}T12:00:00Z`)}</span>
        <span>Today</span>
      </figcaption>
    </figure>
  );
}

export function AuditLine({ action, actor, where, at }: { action: string; actor: string; where?: string; at: Date }) {
  return (
    <li className="flex items-start gap-3 px-5 py-2.5">
      <span className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", action.startsWith("admin.") ? "bg-negative" : action.startsWith("plan.") ? "bg-grass" : "bg-line-strong")} aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="truncate font-mono text-xs text-ink">{action}</p>
        <p className="truncate text-2xs text-muted">
          {actor}
          {where ? ` · ${where}` : ""}
        </p>
      </div>
      <span className="shrink-0 text-2xs text-subtle">
        <When date={at} />
      </span>
    </li>
  );
}
