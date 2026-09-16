import Link from "next/link";
import { AdminPage, Card, FilterTabs, PlanPill, Stat, Table, Td, When } from "@/components/admin/ui";
import { requireAdmin } from "@/server/admin/guard";
import { listSubscriptions } from "@/server/services/admin";
import { env } from "@/server/env";
import { formatUsd } from "@/lib/format";

export const metadata = { title: "Subscriptions" };

const STATUSES = ["all", "active", "trialing", "past_due", "canceled", "free"];

export default async function AdminSubscriptionsPage({ searchParams }: PageProps<"/admin/subscriptions">) {
  await requireAdmin();
  const sp = await searchParams;
  const status = STATUSES.includes(sp.status as string) ? (sp.status as string) : "all";
  const [rows, everything] = await Promise.all([listSubscriptions({ status }), status === "all" ? null : listSubscriptions({})]);
  const all = everything ?? rows;
  const mrr = all.reduce((s, r) => s + r.mrr, 0);
  const trials = all.filter((r) => r.org.planStatus === "trialing");
  const mode = env.STRIPE_SECRET_KEY ? (env.STRIPE_SECRET_KEY.startsWith("sk_live_") ? "Live" : "Test mode") : "Not connected";

  return (
    <AdminPage title="Subscriptions" description={`Stripe: ${mode}. Plans, trials and revenue per organization.`}>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat tone="ink" label="MRR" value={formatUsd(mrr)} hint={`${formatUsd(mrr * 12)} ARR`} />
        <Stat label="Paying" value={all.filter((r) => r.mrr > 0).length} />
        <Stat tone="lime" label="In trial" value={trials.length} hint={`${formatUsd(trials.reduce((s, r) => s + r.listPrice, 0))}/mo if all convert`} />
        <Stat label="Past due" value={all.filter((r) => r.org.planStatus === "past_due").length} hint="Stripe is retrying the card" />
      </div>

      <FilterTabs
        base="/admin/subscriptions"
        param="status"
        current={status}
        options={[
          { value: "all", label: "All" },
          { value: "active", label: "Active" },
          { value: "trialing", label: "Trialing" },
          { value: "past_due", label: "Past due" },
          { value: "canceled", label: "Canceled" },
          { value: "free", label: "Free" },
        ]}
      />

      <Card>
        <Table head={["Organization", "Plan", "Billing", "MRR", "Trial ends", "Owner", "Stripe", "Since"]} empty={rows.length === 0}>
          {rows.map((r) => (
            <tr key={r.org.id} className="hover:bg-raised">
              <Td>
                {r.workspaceId ? (
                  <Link href={`/admin/workspaces/${r.workspaceId}`} className="font-medium hover:underline">
                    {r.workspaceName ?? r.org.name}
                  </Link>
                ) : (
                  <span className="font-medium">{r.org.name}</span>
                )}
              </Td>
              <Td>
                <PlanPill plan={r.org.plan} status={r.org.planStatus} />
              </Td>
              <Td className="text-xs text-muted">{r.org.planInterval ? `${r.org.planInterval}ly · ${r.org.planActions?.toLocaleString("en-US") ?? "—"} actions` : "—"}</Td>
              <Td className="tabular">{r.mrr ? formatUsd(r.mrr) : <span className="text-subtle">{r.listPrice ? `(${formatUsd(r.listPrice)})` : "—"}</span>}</Td>
              <Td className="text-xs">{r.org.planStatus === "trialing" ? <When date={r.org.trialEndsAt} /> : "—"}</Td>
              <Td className="max-w-[180px] truncate text-xs text-muted">{r.owner ?? "—"}</Td>
              <Td className="text-xs">{r.org.stripeSubscriptionId ? <span className="text-positive">Connected</span> : <span className="text-subtle">Manual</span>}</Td>
              <Td className="text-xs">
                <When date={r.org.createdAt} />
              </Td>
            </tr>
          ))}
        </Table>
      </Card>
    </AdminPage>
  );
}
