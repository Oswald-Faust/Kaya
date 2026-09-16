import Link from "next/link";
import { AdminPage, Card, FilterTabs, RunStatusPill, Table, Td, When } from "@/components/admin/ui";
import { requireAdmin } from "@/server/admin/guard";
import { listRuns } from "@/server/services/admin";

export const metadata = { title: "Agent runs" };

const STATUSES = ["all", "running", "completed", "failed"];

export default async function AdminRunsPage({ searchParams }: PageProps<"/admin/runs">) {
  await requireAdmin();
  const sp = await searchParams;
  const status = STATUSES.includes(sp.status as string) ? (sp.status as string) : "all";
  const rows = await listRuns({ status });
  const llm = rows.filter((r) => r.run.planner === "llm").length;

  return (
    <AdminPage title="Agent runs" description={`Latest ${rows.length} runs · ${llm} used Claude. Product analyses, strategies and briefs across every workspace.`}>
      <FilterTabs
        base="/admin/runs"
        param="status"
        current={status}
        options={[
          { value: "all", label: "All" },
          { value: "running", label: "Running" },
          { value: "completed", label: "Completed" },
          { value: "failed", label: "Failed" },
        ]}
      />
      <Card>
        <Table head={["Run", "Workspace", "Engine", "Status", "Duration", "Started"]} empty={rows.length === 0}>
          {rows.map(({ run, workspace, product }) => {
            const seconds = run.startedAt && run.finishedAt ? Math.round((run.finishedAt.getTime() - run.startedAt.getTime()) / 1000) : null;
            return (
              <tr key={run.id} className="hover:bg-raised">
                <Td>
                  <span className="block">{run.kind.replace(/_/g, " ")}</span>
                  <span className="block max-w-sm truncate text-xs text-muted">{product?.domain ?? run.goal}</span>
                  {run.error && <span className="block max-w-sm truncate text-xs text-negative">{run.error}</span>}
                </Td>
                <Td>
                  <Link href={`/admin/workspaces/${workspace.id}`} className="hover:underline">
                    {workspace.name}
                  </Link>
                </Td>
                <Td className="text-xs text-muted">
                  {run.planner === "llm" ? run.model ?? "Claude" : "deterministic"}
                  {run.promptVersion && <span className="block font-mono text-2xs text-subtle">{run.promptVersion}</span>}
                </Td>
                <Td>
                  <RunStatusPill status={run.status} />
                </Td>
                <Td className="text-xs tabular text-muted">{seconds === null ? "—" : seconds < 90 ? `${seconds}s` : `${Math.round(seconds / 60)}m`}</Td>
                <Td className="text-xs">
                  <When date={run.createdAt} />
                </Td>
              </tr>
            );
          })}
        </Table>
      </Card>
    </AdminPage>
  );
}
