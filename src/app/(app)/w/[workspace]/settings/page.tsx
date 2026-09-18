import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { CopyField, DeleteWorkspace, WorkspaceNameForm } from "@/components/settings/forms";
import { WorkspaceIconField } from "@/components/settings/image-fields";
import { SettingsHeader, SettingsRow, SettingsSection } from "@/components/settings/primitives";
import { requireWorkspace } from "@/server/context";
import { db } from "@/server/db/client";
import { organizations } from "@/server/db/schema";
import { appOrigin } from "@/server/services/billing";
import { formatDate } from "@/lib/format";
import { getI18n } from "@/i18n/server";
import { fmt } from "@/i18n/format";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.settings.general.metaTitle };
}

export default async function WorkspaceSettingsPage({ params }: PageProps<"/w/[workspace]/settings">) {
  const { workspace } = await params;
  const ctx = await requireWorkspace(workspace);
  const [{ t, locale }, origin, org] = await Promise.all([getI18n(), appOrigin(), db.query.organizations.findFirst({ where: eq(organizations.id, ctx.organizationId) })]);
  const g = t.settings.general;
  const canEdit = !ctx.isDemo && (ctx.role === "owner" || ctx.role === "admin");
  const liveSubscription = Boolean(org?.stripeSubscriptionId) && ["trialing", "active", "past_due"].includes(org?.planStatus ?? "");
  const blockedReason = ctx.isDemo ? g.blockedDemo : ctx.role !== "owner" ? g.blockedRole : liveSubscription ? g.blockedSubscription : null;

  return (
    <>
      <SettingsHeader title={g.title} description={g.description} />

      <SettingsSection>
        <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-ink">{ctx.workspaceName}</p>
            <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted">
              <Badge tone="outline">{t.settings.roles[ctx.role].label}</Badge>
              {org && <span>{fmt(g.created, { date: formatDate(org.createdAt, { month: "long", day: "numeric", year: "numeric" }, locale) })}</span>}
              {ctx.isDemo && <Badge tone="warning">{g.demo}</Badge>}
            </p>
          </div>
        </div>
        <SettingsRow label={g.icon} description={g.iconHint} stack>
          <WorkspaceIconField slug={ctx.workspaceSlug} name={ctx.workspaceName} src={ctx.workspaceIconUrl} disabled={!canEdit} />
        </SettingsRow>
        <SettingsRow label={g.name} description={g.nameHint}>
          <WorkspaceNameForm slug={ctx.workspaceSlug} name={ctx.workspaceName} disabled={!canEdit} />
        </SettingsRow>
        <SettingsRow label={g.url} description={g.urlHint}>
          <CopyField value={`${origin.replace(/^https?:\/\//, "")}/w/${ctx.workspaceSlug}`} label={g.copyUrl} />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title={g.danger} className="mt-10">
        <SettingsRow label={g.delete} description={g.deleteHint} className="[&>div:first-child>div:first-child]:text-negative">
          <DeleteWorkspace slug={ctx.workspaceSlug} name={ctx.workspaceName} blockedReason={blockedReason} />
        </SettingsRow>
      </SettingsSection>
    </>
  );
}
