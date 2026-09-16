import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AdminPage, AuditLine, Avatar, BarChart, Card, CardHeader, RunStatusPill, Stat, When } from "@/components/admin/ui";
import { requireAdmin } from "@/server/admin/guard";
import { getOverview } from "@/server/services/admin";
import { formatPct, formatUsd } from "@/lib/format";

export const metadata = { title: "Overview" };

export default async function AdminOverviewPage() {
  const admin = await requireAdmin();
  const o = await getOverview();
  const funnel = [
    { label: "Paying", value: o.byStatus.paying, className: "bg-ink" },
    { label: "In trial", value: o.byStatus.trialing, className: "bg-sun" },
    { label: "Free", value: o.byStatus.free, className: "bg-lime" },
    { label: "No plan yet", value: o.byStatus.noPlan, className: "bg-line-strong" },
    { label: "Canceled", value: o.byStatus.canceled, className: "bg-negative/60" },
  ];
  const total = Math.max(1, funnel.reduce((s, f) => s + f.value, 0));

  return (
    <AdminPage title={`Good to see you, ${admin.name.split(" ")[0]}`} description="Everything happening across Kaya, live from the database.">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat tone="ink" label="Monthly recurring revenue" value={formatUsd(o.mrr)} hint={`${formatUsd(o.arr)} ARR · ${o.byStatus.paying} paying`} />
        <Stat tone="lime" label="Trial pipeline" value={formatUsd(o.trialPipeline)} hint={`${o.byStatus.trialing} trials · ${o.trialsEndingSoon} ending in 3 days`} />
        <Stat label="Users" value={o.userCount} hint={`+${o.signups7} this week · ${o.guests} guests`} />
        <Stat label="Workspaces" value={o.workspaceCount} hint={o.conversion === null ? "No plans chosen yet" : `${formatPct(o.conversion, 0)} of chosen plans are paid`} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader title="Signups" description={`${o.signups30} accounts created in the last 30 days`} actions={<Link href="/admin/users" className="text-xs text-muted hover:text-ink">All users →</Link>} />
          <div className="p-5">
            <BarChart data={o.signupSeries} label="Daily signups, last 30 days" />
          </div>
        </Card>

        <Card>
          <CardHeader title="Plans" description="Where every organization stands" actions={<Link href="/admin/subscriptions" className="text-xs text-muted hover:text-ink">Subscriptions →</Link>} />
          <div className="space-y-4 p-5">
            <div className="flex h-3 overflow-hidden rounded-full bg-sunken">
              {funnel.map((f) => (f.value ? <div key={f.label} className={f.className} style={{ width: `${(f.value / total) * 100}%` }} title={`${f.label}: ${f.value}`} /> : null))}
            </div>
            <ul className="space-y-2.5">
              {funnel.map((f) => (
                <li key={f.label} className="flex items-center gap-2.5 text-sm">
                  <span className={`size-2.5 rounded-full ${f.className}`} aria-hidden />
                  <span className="text-muted">{f.label}</span>
                  <span className="ml-auto font-medium tabular">{f.value}</span>
                </li>
              ))}
            </ul>
            {o.byStatus.pastDue > 0 && (
              <Link href="/admin/subscriptions?status=past_due" className="flex items-center justify-between rounded-xl bg-negative-soft px-3 py-2.5 text-sm text-negative">
                {o.byStatus.pastDue} payment{o.byStatus.pastDue === 1 ? "" : "s"} failing
                <ArrowRight className="size-4" />
              </Link>
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader title="Newest users" />
          <ul className="divide-y divide-line">
            {o.recentUsers.map((u) => (
              <li key={u.id}>
                <Link href={`/admin/users/${u.id}`} className="flex items-center gap-3 px-5 py-2.5 hover:bg-raised">
                  <Avatar name={u.name} email={u.email} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{u.name}</p>
                    <p className="truncate text-xs text-muted">{u.email}</p>
                  </div>
                  <span className="text-2xs">
                    <When date={u.createdAt} />
                  </span>
                </Link>
              </li>
            ))}
            {o.recentUsers.length === 0 && <li className="px-5 py-8 text-center text-sm text-muted">No signups yet.</li>}
          </ul>
        </Card>

        <Card>
          <CardHeader title="Agent runs" description={`${o.runs30} in 30 days · ${o.failed30} failed`} actions={<Link href="/admin/runs" className="text-xs text-muted hover:text-ink">All runs →</Link>} />
          <ul className="divide-y divide-line">
            {o.runs.map((r) => (
              <li key={r.id} className="flex items-center gap-3 px-5 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{r.kind.replace(/_/g, " ")}</p>
                  <p className="truncate text-xs text-muted">
                    {r.workspace} · {r.planner === "llm" ? "Claude" : "deterministic"}
                  </p>
                </div>
                <RunStatusPill status={r.status} />
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader title="Latest activity" actions={<Link href="/admin/audit" className="text-xs text-muted hover:text-ink">Audit log →</Link>} />
          <ul className="divide-y divide-line">
            {o.activity.slice(0, 8).map((a) => (
              <AuditLine key={a.id} action={a.action} actor={a.actorType === "user" ? "User" : a.actorType === "agent" ? "Agent" : "System"} at={a.createdAt} />
            ))}
          </ul>
        </Card>
      </div>
    </AdminPage>
  );
}
