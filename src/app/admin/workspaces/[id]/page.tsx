import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarPlus, DoorOpen, ExternalLink, RefreshCw, Trash2, UserMinus, XCircle } from "lucide-react";
import { cancelSubscriptionAction, deleteWorkspaceAction, extendTrialAction, joinWorkspaceAction, overridePlanAction, removeMemberAction, resyncSubscriptionAction, setAutonomyAction } from "@/app/admin/actions";
import { ActionButton } from "@/components/admin/action-button";
import { PlanOverrideForm } from "@/components/admin/plan-override-form";
import { AdminPage, AuditLine, Card, CardHeader, Dl, Pill, PlanPill, RunStatusPill, Table, Td, When } from "@/components/admin/ui";
import { requireAdmin } from "@/server/admin/guard";
import { listPrice, monthlyRevenue } from "@/server/admin/metrics";
import { getWorkspaceDetail } from "@/server/services/admin";
import { env } from "@/server/env";
import { formatUsd } from "@/lib/format";

export const metadata = { title: "Workspace" };

const stripeBase = () => `https://dashboard.stripe.com${env.STRIPE_SECRET_KEY?.startsWith("sk_test_") ? "/test" : ""}`;

export default async function AdminWorkspacePage({ params }: PageProps<"/admin/workspaces/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const d = await getWorkspaceDetail(id);
  if (!d) notFound();
  const { ws, org, products, members, runs, activity } = d;
  const liveStripe = Boolean(org.stripeSubscriptionId) && ["trialing", "active", "past_due"].includes(org.planStatus);

  return (
    <AdminPage
      title={ws.name}
      description={
        <Link href="/admin/workspaces" className="inline-flex items-center gap-1 hover:text-ink">
          <ArrowLeft className="size-3.5" /> All workspaces
        </Link>
      }
      actions={
        <>
          <ActionButton action={joinWorkspaceAction.bind(null, ws.id)} icon={<DoorOpen className="size-3.5" />} confirm="Join this organization as admin and open the workspace?">
            Open workspace
          </ActionButton>
          {!ws.isDemo && (
            <ActionButton action={deleteWorkspaceAction.bind(null, ws.id)} variant="danger" icon={<Trash2 className="size-3.5" />} confirm="Deletes the workspace and all its data." typeToConfirm={ws.slug}>
              Delete
            </ActionButton>
          )}
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          ["Plan", <PlanPill key="p" plan={org.plan} status={org.planStatus} />],
          ["MRR", formatUsd(monthlyRevenue(org))],
          ["Business facts", d.facts],
          ["Experiments", d.experiments],
        ].map(([label, value]) => (
          <div key={label as string} className="rounded-2xl border border-line bg-surface p-4">
            <p className="text-xs text-muted">{label}</p>
            <div className="mt-1.5 text-xl font-medium tabular">{value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <Card>
            <CardHeader title="Products" />
            <Table head={["Product", "Status", "Onboarding", "Updated"]} empty={products.length === 0}>
              {products.map((p) => (
                <tr key={p.id}>
                  <Td>
                    <span className="block font-medium">{p.name}</span>
                    <a href={p.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-muted hover:text-ink">
                      {p.domain} <ExternalLink className="size-3" />
                    </a>
                  </Td>
                  <Td>
                    <Pill tone={p.status === "active" ? "positive" : p.status === "failed" ? "negative" : "neutral"}>{p.status.replace("_", " ")}</Pill>
                  </Td>
                  <Td>{p.onboardingStep}</Td>
                  <Td className="text-xs">
                    <When date={p.updatedAt} />
                  </Td>
                </tr>
              ))}
            </Table>
          </Card>

          <Card>
            <CardHeader title="Members" description={`${members.length} in this organization`} />
            <Table head={["Member", "Role", "Joined", ""]} empty={members.length === 0}>
              {members.map((m) => (
                <tr key={m.id}>
                  <Td>
                    <Link href={`/admin/users/${m.userId}`} className="font-medium hover:underline">
                      {m.name}
                    </Link>
                    <span className="block text-xs text-muted">{m.isGuest ? "Guest visitor" : m.email}</span>
                  </Td>
                  <Td className="capitalize">{m.role}</Td>
                  <Td className="text-xs">
                    <When date={m.joinedAt} />
                  </Td>
                  <Td className="text-right">
                    <ActionButton action={removeMemberAction.bind(null, m.id)} variant="ghost" icon={<UserMinus className="size-3.5" />} confirm="Remove from organization?">
                      Remove
                    </ActionButton>
                  </Td>
                </tr>
              ))}
            </Table>
          </Card>

          <Card>
            <CardHeader title="Agent runs" />
            <Table head={["Run", "Engine", "Status", "Started"]} empty={runs.length === 0}>
              {runs.map((r) => (
                <tr key={r.id}>
                  <Td>
                    <span className="block">{r.kind.replace(/_/g, " ")}</span>
                    {r.error && <span className="block max-w-md truncate text-xs text-negative">{r.error}</span>}
                  </Td>
                  <Td className="text-xs text-muted">{r.planner === "llm" ? (r.model ?? "Claude") : "deterministic"}</Td>
                  <Td>
                    <RunStatusPill status={r.status} />
                  </Td>
                  <Td className="text-xs">
                    <When date={r.createdAt} />
                  </Td>
                </tr>
              ))}
            </Table>
          </Card>

          <Card>
            <CardHeader title="Audit trail" />
            <ul className="divide-y divide-line">
              {activity.map((a) => (
                <AuditLine key={a.id} action={a.action} actor={a.actorType} where={a.targetType} at={a.createdAt} />
              ))}
              {activity.length === 0 && <li className="px-5 py-8 text-center text-sm text-muted">No activity yet.</li>}
            </ul>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Billing" />
            <Dl
              items={[
                ["Organization", <code key="o" className="font-mono text-xs">{org.id}</code>],
                ["Plan price", `${formatUsd(listPrice(org))}/mo${org.planInterval === "year" ? " (annual)" : ""}`],
                ["Agent actions", org.planActions?.toLocaleString("en-US") ?? "—"],
                ["Trial ends", <When key="t" date={org.trialEndsAt} />],
                [
                  "Stripe customer",
                  org.stripeCustomerId ? (
                    <a key="c" href={`${stripeBase()}/customers/${org.stripeCustomerId}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-mono text-xs hover:underline">
                      {org.stripeCustomerId} <ExternalLink className="size-3" />
                    </a>
                  ) : (
                    "—"
                  ),
                ],
                [
                  "Subscription",
                  org.stripeSubscriptionId ? (
                    <a key="s" href={`${stripeBase()}/subscriptions/${org.stripeSubscriptionId}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-mono text-xs hover:underline">
                      {org.stripeSubscriptionId} <ExternalLink className="size-3" />
                    </a>
                  ) : (
                    "—"
                  ),
                ],
              ]}
            />
            <div className="flex flex-wrap gap-2 border-t border-line p-4">
              <ActionButton action={extendTrialAction.bind(null, org.id, 14)} icon={<CalendarPlus className="size-3.5" />} confirm="Extend the trial by 14 days?">
                +14 days trial
              </ActionButton>
              {org.stripeSubscriptionId && (
                <ActionButton action={resyncSubscriptionAction.bind(null, org.id)} icon={<RefreshCw className="size-3.5" />}>
                  Resync Stripe
                </ActionButton>
              )}
              {liveStripe && (
                <>
                  <ActionButton action={cancelSubscriptionAction.bind(null, org.id, false)} icon={<XCircle className="size-3.5" />} confirm="Cancel at the end of the period?">
                    Cancel at period end
                  </ActionButton>
                  <ActionButton action={cancelSubscriptionAction.bind(null, org.id, true)} variant="danger" icon={<XCircle className="size-3.5" />} confirm="Cancel now. Access ends immediately." typeToConfirm="CANCEL">
                    Cancel now
                  </ActionButton>
                </>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title="Override plan" description="Set any plan by hand (comps, partners, fixes)" />
            <PlanOverrideForm org={org} action={overridePlanAction.bind(null, org.id)} />
          </Card>

          <Card>
            <CardHeader title="Agent autonomy" description={`Currently ${ws.autonomyMode}`} />
            <div className="flex flex-wrap gap-2 p-4">
              {(["observe", "suggest", "copilot", "autopilot"] as const).map((mode) => (
                <ActionButton key={mode} action={setAutonomyAction.bind(null, ws.id, mode)} variant={ws.autonomyMode === mode ? "primary" : "secondary"}>
                  {mode}
                </ActionButton>
              ))}
            </div>
          </Card>

          <Card>
            <Dl
              items={[
                ["Workspace ID", <code key="w" className="font-mono text-xs">{ws.id}</code>],
                ["Slug", `/${ws.slug}`],
                ["Created", <When key="c" date={ws.createdAt} />],
                ["Demo", ws.isDemo ? "Yes" : "No"],
              ]}
            />
          </Card>
        </div>
      </div>
    </AdminPage>
  );
}
