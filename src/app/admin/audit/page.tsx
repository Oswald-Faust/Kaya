import { AdminPage, Card, FilterTabs, Pill, SearchForm, Table, Td, When } from "@/components/admin/ui";
import { requireAdmin } from "@/server/admin/guard";
import { listAudit } from "@/server/services/admin";

export const metadata = { title: "Audit log" };

export default async function AdminAuditPage({ searchParams }: PageProps<"/admin/audit">) {
  await requireAdmin();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 100) : undefined;
  const scope = sp.scope === "platform" ? "platform" : "all";
  const rows = await listAudit({ q, scope });

  return (
    <AdminPage title="Audit log" description="Append-only record of every action by founders, the agent, Stripe and admins. Entries can't be edited or deleted.">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterTabs
          base="/admin/audit"
          param="scope"
          current={scope}
          keep={{ q }}
          options={[
            { value: "all", label: "Everything" },
            { value: "platform", label: "Admin actions" },
          ]}
        />
        <SearchForm placeholder="Search action or ID" defaultValue={q} hidden={{ scope: scope === "all" ? undefined : scope }} />
      </div>
      <Card>
        <Table head={["Action", "Actor", "Where", "Target", "Details", "When"]} empty={rows.length === 0}>
          {rows.map((r) => (
            <tr key={r.id} className="align-top hover:bg-raised">
              <Td>
                <span className="font-mono text-xs">{r.action}</span>
                {r.isExternalMutation && (
                  <span className="ml-1.5">
                    <Pill tone="warning">external</Pill>
                  </span>
                )}
              </Td>
              <Td className="text-xs">
                <Pill tone={r.actorType === "agent" ? "agent" : r.actorType === "system" ? "neutral" : "lime"}>{r.actorType}</Pill>
                <span className="mt-1 block max-w-[180px] truncate text-muted">{r.actorEmail ?? r.actorId}</span>
              </Td>
              <Td className="text-xs text-muted">{r.workspaceName}</Td>
              <Td className="text-xs text-muted">
                {r.targetType}
                {r.targetId && <span className="block max-w-[160px] truncate font-mono text-2xs text-subtle">{r.targetId}</span>}
              </Td>
              <Td>
                {Object.keys(r.payload).length > 0 ? (
                  <details className="max-w-xs text-xs">
                    <summary className="cursor-pointer text-muted hover:text-ink">{Object.keys(r.payload).slice(0, 3).join(", ")}</summary>
                    <pre className="mt-1 max-h-48 overflow-auto rounded-lg bg-sunken p-2 font-mono text-2xs whitespace-pre-wrap">{JSON.stringify(r.payload, null, 2)}</pre>
                  </details>
                ) : (
                  <span className="text-subtle">—</span>
                )}
              </Td>
              <Td className="text-xs">
                <When date={r.createdAt} />
              </Td>
            </tr>
          ))}
        </Table>
      </Card>
    </AdminPage>
  );
}
