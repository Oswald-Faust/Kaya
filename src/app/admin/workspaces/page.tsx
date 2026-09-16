import Link from "next/link";
import { AdminPage, Card, FilterTabs, Pill, PlanPill, SearchForm, Table, Td, When } from "@/components/admin/ui";
import { requireAdmin } from "@/server/admin/guard";
import { listWorkspaces } from "@/server/services/admin";

export const metadata = { title: "Workspaces" };

const PLAN_FILTERS = ["all", "launch", "growth", "free", "trialing", "past_due", "none"];

export default async function AdminWorkspacesPage({ searchParams }: PageProps<"/admin/workspaces">) {
  await requireAdmin();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 100) : undefined;
  const plan = PLAN_FILTERS.includes(sp.plan as string) ? (sp.plan as string) : "all";
  const rows = await listWorkspaces({ q, plan });

  return (
    <AdminPage title="Workspaces" description={`${rows.length} workspace${rows.length === 1 ? "" : "s"}${plan !== "all" ? " in this filter" : ""}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterTabs
          base="/admin/workspaces"
          param="plan"
          current={plan}
          keep={{ q }}
          options={[
            { value: "all", label: "All" },
            { value: "launch", label: "Launch" },
            { value: "growth", label: "Growth" },
            { value: "trialing", label: "In trial" },
            { value: "free", label: "Free" },
            { value: "past_due", label: "Past due" },
            { value: "none", label: "No plan" },
          ]}
        />
        <SearchForm placeholder="Search workspace" defaultValue={q} hidden={{ plan: plan === "all" ? undefined : plan }} />
      </div>

      <Card>
        <Table head={["Workspace", "Product", "Onboarding", "Plan", "Owner", "Members", "Created"]} empty={rows.length === 0}>
          {rows.map((w) => (
            <tr key={w.id} className="hover:bg-raised">
              <Td>
                <Link href={`/admin/workspaces/${w.id}`} className="font-medium hover:underline">
                  {w.name}
                </Link>
                <span className="mt-0.5 flex items-center gap-1.5 font-mono text-2xs text-subtle">
                  /{w.slug}
                  {w.isDemo && <Pill tone="agent">Demo</Pill>}
                </span>
              </Td>
              <Td>
                {w.product ? (
                  <>
                    <span className="block">{w.product.name}</span>
                    <span className="block text-xs text-muted">{w.product.domain}</span>
                  </>
                ) : (
                  <span className="text-subtle">—</span>
                )}
              </Td>
              <Td>{w.product ? <Pill tone={w.product.step === "done" ? "positive" : "neutral"}>{w.product.step}</Pill> : "—"}</Td>
              <Td>
                <PlanPill plan={w.org.plan} status={w.org.planStatus} />
              </Td>
              <Td className="max-w-[200px] truncate text-xs text-muted">{w.owner ?? "—"}</Td>
              <Td className="tabular">{w.memberCount}</Td>
              <Td className="text-xs">
                <When date={w.createdAt} />
              </Td>
            </tr>
          ))}
        </Table>
      </Card>
    </AdminPage>
  );
}
