import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { ROLES, type Role } from "@/components/settings/roles";
import { InvitationControls, InviteForm, MemberControls } from "@/components/settings/team";
import { Meter, Monogram, SettingsHeader, SettingsSection } from "@/components/settings/primitives";
import { PLANS } from "@/components/pricing/plans";
import { requireWorkspace } from "@/server/context";
import { canAssignRole, canManageMember, canManageTeam, planForSeats, seatLimit } from "@/server/domain/team/seats";
import { getTeam } from "@/server/services/team";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Team" };

export default async function TeamSettingsPage({ params }: PageProps<"/w/[workspace]/settings/team">) {
  const { workspace } = await params;
  const ctx = await requireWorkspace(workspace);
  const { members, invites, plan, seats } = await getTeam(ctx);
  const manager = canManageTeam(ctx.role) && !ctx.isDemo;
  const owners = members.filter((m) => m.role === "owner").length;
  const planName = plan.plan === "none" ? "No plan" : (PLANS.find((p) => p.id === plan.plan)?.name ?? plan.plan);
  const nextPlan = PLANS.find((p) => p.id === planForSeats(seats.used + 1));
  const upgradeHref = plan.billingManaged ? null : `/start/${ctx.workspaceSlug}/plan`;

  return (
    <>
      <SettingsHeader title="Team" description="Invite teammates to this workspace and choose what each person can do." />

      <SettingsSection>
        <div className="px-4 py-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm font-medium text-ink">
              {seats.limit === null ? (
                <>
                  {seats.used} seat{seats.used === 1 ? "" : "s"} used · unlimited on {planName}
                </>
              ) : (
                <>
                  <span className="tabular">
                    {seats.used} of {seats.limit}
                  </span>{" "}
                  seat{seats.limit === 1 ? "" : "s"} used
                </>
              )}
            </p>
            <span className="text-xs text-muted">
              {planName} plan
              {plan.status === "trialing" && plan.trialDaysLeft !== null ? ` · trial, ${plan.trialDaysLeft} day${plan.trialDaysLeft === 1 ? "" : "s"} left` : ""}
            </span>
          </div>
          <Meter value={seats.used} max={seats.limit} className="mt-2.5" />
          <p className="mt-2 text-xs text-muted">
            {members.length} member{members.length === 1 ? "" : "s"}
            {invites.length > 0 && ` · ${invites.length} pending invitation${invites.length === 1 ? "" : "s"} holding a seat`}
          </p>
        </div>

        {seats.full && (
          <div className="flex flex-col gap-3 bg-sun-soft px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex gap-2 text-sm text-sun-deep">
              <Sparkles className="mt-0.5 size-4 shrink-0" />
              <span>
                {seats.limit === 1 ? `The ${planName} plan includes 1 seat.` : `All ${seats.limit} seats on the ${planName} plan are taken.`}{" "}
                {nextPlan && seatLimit(nextPlan.id) !== null ? `Upgrade to ${nextPlan.name} for up to ${seatLimit(nextPlan.id)} seats.` : "Scale includes unlimited seats."}
              </span>
            </p>
            {manager &&
              (upgradeHref ? (
                <Link href={upgradeHref} className={buttonClass("primary", "sm", "shrink-0")}>
                  Upgrade plan
                  <ArrowUpRight className="size-3.5" />
                </Link>
              ) : (
                <form action="/api/billing/portal" method="post">
                  <input type="hidden" name="workspace" value={ctx.workspaceSlug} />
                  <button type="submit" className={buttonClass("primary", "sm", "shrink-0")}>
                    Upgrade plan
                    <ArrowUpRight className="size-3.5" />
                  </button>
                </form>
              ))}
          </div>
        )}
      </SettingsSection>

      {manager && (
        <SettingsSection title="Invite people" description="They get a link that works once, for their email address only.">
          <InviteForm slug={ctx.workspaceSlug} actorRole={ctx.role} disabled={seats.full} />
        </SettingsSection>
      )}

      <SettingsSection title={`Members · ${members.length}`}>
        {members.map((m) => {
          const self = m.userId === ctx.userId;
          const roleOptions: Role[] = manager && !self && canManageMember(ctx.role, m.role) ? ROLES.map((r) => r.id).filter((r) => canAssignRole(ctx.role, r)) : [];
          const lastOwner = m.role === "owner" && owners <= 1;
          const canRemove = !ctx.isDemo && !lastOwner && (self || (manager && canManageMember(ctx.role, m.role)));
          return (
            <div key={m.id} className="flex items-center gap-3 px-4 py-3">
              {m.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.avatarUrl} alt="" className="size-9 shrink-0 rounded-full object-cover" />
              ) : (
                <Monogram name={m.name} className="size-9 rounded-full text-xs" />
              )}
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 truncate text-sm font-medium text-ink">
                  {m.name}
                  {self && <span className="font-normal text-subtle">(you)</span>}
                </p>
                <p className="truncate text-xs text-muted">
                  {m.email} · joined {formatDate(m.joinedAt, { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>
              <MemberControls slug={ctx.workspaceSlug} memberId={m.id} role={m.role} roleOptions={roleOptions} canRemove={canRemove} isSelf={self} name={m.name} />
            </div>
          );
        })}
      </SettingsSection>

      {invites.length > 0 && (
        <SettingsSection title={`Pending invitations · ${invites.length}`}>
          {invites.map((inv) => (
            <div key={inv.id} className="flex items-center gap-3 px-4 py-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-full border border-dashed border-line-strong text-subtle">
                <span className="text-xs">@</span>
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 truncate text-sm font-medium text-ink">
                  {inv.email}
                  <Badge tone="outline">{ROLES.find((r) => r.id === inv.role)?.label}</Badge>
                </p>
                <p className="truncate text-xs text-muted">
                  Invited {formatDate(inv.sentAt, { month: "short", day: "numeric" })}
                  {inv.invitedBy ? ` by ${inv.invitedBy}` : ""} · expires {formatDate(inv.expiresAt, { month: "short", day: "numeric" })}
                </p>
              </div>
              <InvitationControls slug={ctx.workspaceSlug} invitationId={inv.id} email={inv.email} canManage={manager && canAssignRole(ctx.role, inv.role)} />
            </div>
          ))}
        </SettingsSection>
      )}

      <SettingsSection title="Roles">
        {ROLES.map((r) => (
          <div key={r.id} className="flex items-baseline gap-3 px-4 py-2.5">
            <span className="w-16 shrink-0 text-sm font-medium text-ink">{r.label}</span>
            <span className="text-xs text-muted">{r.description}</span>
          </div>
        ))}
      </SettingsSection>
    </>
  );
}
