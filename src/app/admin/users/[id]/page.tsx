import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Ban, KeyRound, LogOut, ShieldCheck, ShieldOff, Trash2, UserCheck } from "lucide-react";
import { deleteUserAction, revokeSessionsAction, setAdminAction, setSuspendedAction } from "@/app/admin/actions";
import { ActionButton } from "@/components/admin/action-button";
import { AdminPage, AuditLine, Avatar, Card, CardHeader, Dl, Pill, PlanPill, Table, Td, When } from "@/components/admin/ui";
import { requireAdmin } from "@/server/admin/guard";
import { getUserDetail } from "@/server/services/admin";

export const metadata = { title: "User" };

export default async function AdminUserPage({ params }: PageProps<"/admin/users/[id]">) {
  const admin = await requireAdmin();
  const { id } = await params;
  const detail = await getUserDetail(id);
  if (!detail) notFound();
  const { user, memberships, sessions, activity } = detail;
  const self = user.id === admin.userId;
  const liveSessions = sessions.filter((s) => s.expiresAt > new Date());

  return (
    <AdminPage
      title={user.name}
      description={
        <Link href="/admin/users" className="inline-flex items-center gap-1 hover:text-ink">
          <ArrowLeft className="size-3.5" /> All users
        </Link>
      }
      actions={
        <>
          {user.isPlatformAdmin ? (
            <ActionButton action={setAdminAction.bind(null, user.id, false)} icon={<ShieldOff className="size-3.5" />} confirm="Remove admin access?">
              Remove admin
            </ActionButton>
          ) : (
            !user.isGuest && (
              <ActionButton action={setAdminAction.bind(null, user.id, true)} icon={<ShieldCheck className="size-3.5" />} confirm={`Give ${user.email} full admin access?`}>
                Make admin
              </ActionButton>
            )
          )}
          <ActionButton action={revokeSessionsAction.bind(null, user.id)} icon={<LogOut className="size-3.5" />} confirm="Sign this user out everywhere?">
            Sign out everywhere
          </ActionButton>
          {!self &&
            (user.suspendedAt ? (
              <ActionButton action={setSuspendedAction.bind(null, user.id, false)} icon={<UserCheck className="size-3.5" />}>
                Reactivate
              </ActionButton>
            ) : (
              <ActionButton action={setSuspendedAction.bind(null, user.id, true)} variant="danger" icon={<Ban className="size-3.5" />} confirm="Suspend and sign out?">
                Suspend
              </ActionButton>
            ))}
          {!self && (
            <ActionButton action={deleteUserAction.bind(null, user.id)} variant="danger" icon={<Trash2 className="size-3.5" />} confirm="Delete this account permanently." typeToConfirm="DELETE">
              Delete
            </ActionButton>
          )}
        </>
      }
    >
      <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
        <Card>
          <div className="flex items-center gap-3 border-b border-line px-5 py-4">
            <Avatar name={user.name} email={user.email} />
            <div className="min-w-0">
              <p className="truncate font-medium">{user.email}</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {user.isPlatformAdmin && <Pill tone="ink">Admin</Pill>}
                {user.isGuest && <Pill>Guest</Pill>}
                {user.suspendedAt ? <Pill tone="negative">Suspended</Pill> : <Pill tone="positive">Active</Pill>}
              </div>
            </div>
          </div>
          <Dl
            items={[
              ["User ID", <code key="id" className="font-mono text-xs">{user.id}</code>],
              ["Joined", <When key="j" date={user.createdAt} />],
              ["Sign-in methods", [user.hasPassword && "Password", user.googleSub && "Google"].filter(Boolean).join(", ") || "None"],
              ["Live sessions", liveSessions.length],
              ["Last sign-in", <When key="l" date={sessions[0]?.createdAt} />],
              ["Suspended", user.suspendedAt ? <When key="s" date={user.suspendedAt} /> : "No"],
            ]}
          />
          <p className="flex items-start gap-2 border-t border-line px-5 py-3 text-xs text-muted">
            <KeyRound className="mt-0.5 size-3.5 shrink-0" />
            Passwords are hashed with scrypt and can&apos;t be viewed. Ask the user to reset theirs.
          </p>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Workspaces" description={`Member of ${memberships.length} organization${memberships.length === 1 ? "" : "s"}`} />
            <Table head={["Workspace", "Role", "Plan", "Joined"]} empty={memberships.length === 0}>
              {memberships.flatMap((m) =>
                m.workspaces.map((w) => (
                  <tr key={w.id} className="hover:bg-raised">
                    <Td>
                      <Link href={`/admin/workspaces/${w.id}`} className="font-medium hover:underline">
                        {w.name}
                      </Link>
                      <span className="block font-mono text-2xs text-subtle">/{w.slug}</span>
                    </Td>
                    <Td className="capitalize">{m.role}</Td>
                    <Td>
                      <PlanPill plan={m.org.plan} status={m.org.planStatus} />
                    </Td>
                    <Td className="text-xs">
                      <When date={m.joinedAt} />
                    </Td>
                  </tr>
                )),
              )}
            </Table>
          </Card>

          <Card>
            <CardHeader title="Recent activity" description="Actions this user performed" />
            <ul className="divide-y divide-line">
              {activity.map((a) => (
                <AuditLine key={a.id} action={a.action} actor={a.targetType} where={a.targetId ?? undefined} at={a.createdAt} />
              ))}
              {activity.length === 0 && <li className="px-5 py-8 text-center text-sm text-muted">No recorded actions yet.</li>}
            </ul>
          </Card>
        </div>
      </div>
    </AdminPage>
  );
}
