import Link from "next/link";
import { Trash2 } from "lucide-react";
import { purgeGuestsAction } from "@/app/admin/actions";
import { CreateUserButton } from "@/components/admin/create-user-modal";
import { UserRowActions } from "@/components/admin/user-row-actions";
import { ActionButton } from "@/components/admin/action-button";
import { AdminPage, Avatar, Card, FilterTabs, Pill, PlanPill, SearchForm, Table, Td, When } from "@/components/admin/ui";
import { requireAdmin } from "@/server/admin/guard";
import { listUsers, type UserFilter } from "@/server/services/admin";

export const metadata = { title: "Users" };

const FILTERS: UserFilter[] = ["all", "paying", "admins", "suspended", "guests"];

export default async function AdminUsersPage({ searchParams }: PageProps<"/admin/users">) {
  await requireAdmin();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 100) : undefined;
  const filter = FILTERS.includes(sp.filter as UserFilter) ? (sp.filter as UserFilter) : "all";
  const { rows, counts } = await listUsers({ q, filter });

  return (
    <AdminPage
      title="Users"
      description={`${counts.all} accounts · ${counts.guests} anonymous guests`}
      actions={
        <>
          <CreateUserButton />
          <ActionButton action={purgeGuestsAction} icon={<Trash2 className="size-3.5" />} confirm="Delete guests older than 7 days that own nothing?">
            Purge old guests
          </ActionButton>
        </>
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterTabs
          base="/admin/users"
          current={filter}
          keep={{ q }}
          options={[
            { value: "all", label: "All", count: counts.all },
            { value: "paying", label: "Paying" },
            { value: "admins", label: "Admins", count: counts.admins },
            { value: "suspended", label: "Suspended", count: counts.suspended },
            { value: "guests", label: "Guests", count: counts.guests },
          ]}
        />
        <SearchForm placeholder="Search name or email" defaultValue={q} hidden={{ filter: filter === "all" ? undefined : filter }} />
      </div>

      <Card>
        <Table head={["User", "Plan", "Sign-in", "Orgs", "Joined", "Last sign-in", "Actions"]} empty={rows.length === 0}>
          {rows.map((u) => {
            const [plan, status] = u.bestPlan?.split(":") ?? ["none", "none"];
            return (
              <tr key={u.id} className="hover:bg-raised">
                <Td>
                  <Link href={`/admin/users/${u.id}`} className="flex items-center gap-3">
                    <Avatar name={u.name} email={u.email} />
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5 font-medium">
                        <span className="truncate">{u.name}</span>
                        {u.isPlatformAdmin && <Pill tone="ink">Admin</Pill>}
                        {u.suspendedAt && <Pill tone="negative">Suspended</Pill>}
                      </span>
                      <span className="block truncate text-xs text-muted">{u.email}</span>
                    </span>
                  </Link>
                </Td>
                <Td>
                  <PlanPill plan={plan} status={status} />
                </Td>
                <Td className="text-xs text-muted">{[u.hasPassword && "Password", u.googleSub && "Google"].filter(Boolean).join(" + ") || "—"}</Td>
                <Td className="tabular">{u.orgCount}</Td>
                <Td className="text-xs">
                  <When date={u.createdAt} />
                </Td>
                <Td className="text-xs">
                  <When date={u.lastSignIn} />
                </Td>
                <Td className="text-right">
                  <UserRowActions user={u} />
                </Td>
              </tr>
            );
          })}
        </Table>
      </Card>
    </AdminPage>
  );
}
