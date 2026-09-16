import { eq } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { CopyField, DeleteWorkspace, WorkspaceNameForm } from "@/components/settings/forms";
import { Monogram, SettingsHeader, SettingsRow, SettingsSection } from "@/components/settings/primitives";
import { requireWorkspace } from "@/server/context";
import { db } from "@/server/db/client";
import { organizations } from "@/server/db/schema";
import { appOrigin } from "@/server/services/billing";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Workspace settings" };

const ROLE_LABEL = { owner: "Owner", admin: "Admin", member: "Member", viewer: "Viewer" } as const;

export default async function WorkspaceSettingsPage({ params }: PageProps<"/w/[workspace]/settings">) {
  const { workspace } = await params;
  const ctx = await requireWorkspace(workspace);
  const [origin, org] = await Promise.all([appOrigin(), db.query.organizations.findFirst({ where: eq(organizations.id, ctx.organizationId) })]);
  const canEdit = !ctx.isDemo && (ctx.role === "owner" || ctx.role === "admin");
  const liveSubscription = Boolean(org?.stripeSubscriptionId) && ["trialing", "active", "past_due"].includes(org?.planStatus ?? "");
  const blockedReason = ctx.isDemo
    ? "The demo workspace can't be deleted."
    : ctx.role !== "owner"
      ? "Only an owner can delete the workspace."
      : liveSubscription
        ? "Cancel the subscription in Plan & billing first."
        : null;

  return (
    <>
      <SettingsHeader title="Workspace" description="How this workspace appears to you and your team." />

      <SettingsSection>
        <div className="flex items-center gap-4 px-4 py-4">
          <Monogram name={ctx.workspaceName} className="size-14 rounded-lg text-xl" />
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-ink">{ctx.workspaceName}</p>
            <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted">
              <Badge tone="outline">{ROLE_LABEL[ctx.role]}</Badge>
              {org && <span>Created {formatDate(org.createdAt, { month: "long", day: "numeric", year: "numeric" })}</span>}
              {ctx.isDemo && <Badge tone="warning">Demo</Badge>}
            </p>
          </div>
        </div>
        <SettingsRow label="Workspace name" description="Shown in the sidebar, invitations and emails.">
          <WorkspaceNameForm slug={ctx.workspaceSlug} name={ctx.workspaceName} disabled={!canEdit} />
        </SettingsRow>
        <SettingsRow label="Workspace URL" description="Share it with teammates who already have access.">
          <CopyField value={`${origin.replace(/^https?:\/\//, "")}/w/${ctx.workspaceSlug}`} label="Copy workspace URL" />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="Danger zone" className="mt-10">
        <SettingsRow
          label="Delete workspace"
          description="Permanently removes the strategy, experiments, learnings, business memory and connections. This can't be undone."
          className="[&>div:first-child>div:first-child]:text-negative"
        >
          <DeleteWorkspace slug={ctx.workspaceSlug} name={ctx.workspaceName} blockedReason={blockedReason} />
        </SettingsRow>
      </SettingsSection>
    </>
  );
}
