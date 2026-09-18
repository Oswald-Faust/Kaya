import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { ROLE_IDS, type Role } from "@/components/settings/roles";
import { InvitationControls, InviteForm, MemberControls } from "@/components/settings/team";
import { Avatar, Meter, SettingsHeader, SettingsSection } from "@/components/settings/primitives";
import { PLANS } from "@/components/pricing/plans";
import { requireWorkspace } from "@/server/context";
import { canAssignRole, canManageMember, canManageTeam, planForSeats, seatLimit } from "@/server/domain/team/seats";
import { getTeam } from "@/server/services/team";
import { formatDate } from "@/lib/format";
import { getI18n } from "@/i18n/server";
import { fmt, plural } from "@/i18n/format";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.settings.team.title };
}

export default async function TeamSettingsPage({ params }: PageProps<"/w/[workspace]/settings/team">) {
  const { workspace } = await params;
  const ctx = await requireWorkspace(workspace);
  const [{ members, invites, plan, seats }, { t, locale }] = await Promise.all([getTeam(ctx), getI18n()]);
  const tm = t.settings.team;
  const manager = canManageTeam(ctx.role) && !ctx.isDemo;
  const owners = members.filter((m) => m.role === "owner").length;
  const planName = plan.plan === "none" ? tm.noPlan : (PLANS.find((p) => p.id === plan.plan)?.name ?? plan.plan);
  const nextPlan = PLANS.find((p) => p.id === planForSeats(seats.used + 1));
  const nextSeats = nextPlan ? seatLimit(nextPlan.id) : null;
  const upgradeHref = plan.billingManaged ? null : `/start/${ctx.workspaceSlug}/plan`;
  const date = (d: Date, withYear = false) => formatDate(d, withYear ? { month: "short", day: "numeric", year: "numeric" } : { month: "short", day: "numeric" }, locale);

  const upgradeButton = (
    <>
      {tm.upgrade}
      <ArrowUpRight className="size-3.5" />
    </>
  );

  return (
    <>
      <SettingsHeader title={tm.title} description={tm.description} />

      <SettingsSection>
        <div className="px-4 py-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm font-medium text-ink tabular">
              {seats.limit === null ? plural(locale, seats.used, tm.seatsUnlimited, { plan: planName }) : plural(locale, seats.limit, tm.seatsUsed, { used: seats.used })}
            </p>
            <span className="text-xs text-muted">
              {fmt(tm.planLine, { plan: planName })}
              {plan.status === "trialing" && plan.trialDaysLeft !== null ? fmt(tm.trialLine, { days: plural(locale, plan.trialDaysLeft, t.shell.topbar.daysLeft) }) : ""}
            </span>
          </div>
          <Meter value={seats.used} max={seats.limit} className="mt-2.5" />
          <p className="mt-2 text-xs text-muted">
            {plural(locale, members.length, tm.members)}
            {invites.length > 0 && plural(locale, invites.length, tm.pendingHolding)}
          </p>
        </div>

        {seats.full && (
          <div className="flex flex-col gap-3 bg-sun-soft px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex gap-2 text-sm text-sun-deep">
              <Sparkles className="mt-0.5 size-4 shrink-0" />
              <span>
                {seats.limit === 1 ? fmt(tm.fullOneSeat, { plan: planName }) : fmt(tm.fullSeats, { count: seats.limit ?? 0, plan: planName })}{" "}
                {nextPlan && nextSeats !== null ? fmt(tm.upgradeTo, { plan: nextPlan.name, count: nextSeats }) : tm.scaleUnlimited}
              </span>
            </p>
            {manager &&
              (upgradeHref ? (
                <Link href={upgradeHref} className={buttonClass("primary", "sm", "shrink-0")}>
                  {upgradeButton}
                </Link>
              ) : (
                <form action="/api/billing/portal" method="post">
                  <input type="hidden" name="workspace" value={ctx.workspaceSlug} />
                  <button type="submit" className={buttonClass("primary", "sm", "shrink-0")}>
                    {upgradeButton}
                  </button>
                </form>
              ))}
          </div>
        )}
      </SettingsSection>

      {manager && (
        <SettingsSection title={tm.inviteTitle} description={tm.inviteHint}>
          <InviteForm slug={ctx.workspaceSlug} actorRole={ctx.role} disabled={seats.full} />
        </SettingsSection>
      )}

      <SettingsSection title={fmt(tm.membersTitle, { count: members.length })}>
        {members.map((m) => {
          const self = m.userId === ctx.userId;
          const roleOptions: Role[] = manager && !self && canManageMember(ctx.role, m.role) ? ROLE_IDS.filter((r) => canAssignRole(ctx.role, r)) : [];
          const lastOwner = m.role === "owner" && owners <= 1;
          const canRemove = !ctx.isDemo && !lastOwner && (self || (manager && canManageMember(ctx.role, m.role)));
          return (
            <div key={m.id} className="flex items-center gap-3 px-4 py-3">
              <Avatar name={m.name} src={m.avatarUrl} className="size-9 rounded-full text-xs" />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 truncate text-sm font-medium text-ink">
                  {m.name}
                  {self && <span className="font-normal text-subtle">{tm.you}</span>}
                </p>
                <p className="truncate text-xs text-muted">{fmt(tm.joined, { email: m.email, date: date(m.joinedAt, true) })}</p>
              </div>
              <MemberControls slug={ctx.workspaceSlug} memberId={m.id} role={m.role} roleOptions={roleOptions} canRemove={canRemove} isSelf={self} name={m.name} />
            </div>
          );
        })}
      </SettingsSection>

      {invites.length > 0 && (
        <SettingsSection title={fmt(tm.pendingTitle, { count: invites.length })}>
          {invites.map((inv) => (
            <div key={inv.id} className="flex items-center gap-3 px-4 py-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-full border border-dashed border-line-strong text-subtle">
                <span className="text-xs">@</span>
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 truncate text-sm font-medium text-ink">
                  {inv.email}
                  <Badge tone="outline">{t.settings.roles[inv.role].label}</Badge>
                </p>
                <p className="truncate text-xs text-muted">
                  {fmt(tm.invited, { date: date(inv.sentAt) })}
                  {inv.invitedBy ? fmt(tm.invitedBy, { name: inv.invitedBy }) : ""}
                  {fmt(tm.expires, { date: date(inv.expiresAt) })}
                </p>
              </div>
              <InvitationControls slug={ctx.workspaceSlug} invitationId={inv.id} email={inv.email} canManage={manager && canAssignRole(ctx.role, inv.role)} />
            </div>
          ))}
        </SettingsSection>
      )}

      <SettingsSection title={tm.rolesTitle}>
        {ROLE_IDS.map((r) => (
          <div key={r} className="flex items-baseline gap-3 px-4 py-2.5">
            <span className="w-24 shrink-0 text-sm font-medium text-ink">{t.settings.roles[r].label}</span>
            <span className="text-xs text-muted">{t.settings.roles[r].description}</span>
          </div>
        ))}
      </SettingsSection>
    </>
  );
}
