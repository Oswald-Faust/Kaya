import { DeleteWorkspace } from "@/components/settings/forms";
import { getI18n } from "@/i18n/server";
import { requireWorkspace } from "@/server/context";

/**
 * A workspace still in onboarding never reaches its settings, so the way to
 * abandon it lives here: only its owner sees it, and the demo is never deletable.
 */
export default async function OnboardingWorkspaceLayout({ children, params }: LayoutProps<"/start/[workspace]">) {
  const { workspace } = await params;
  const ctx = await requireWorkspace(workspace);
  const { t } = await getI18n();
  const canDelete = ctx.role === "owner" && !ctx.isDemo && !ctx.isGuest;

  return (
    <>
      {children}
      {canDelete && (
        <div className="mx-auto flex max-w-[1180px] flex-col items-center gap-2 px-5 pt-2 pb-10 text-center">
          <p className="text-xs text-muted">{t.onboarding.abandonHint}</p>
          <DeleteWorkspace slug={ctx.workspaceSlug} name={ctx.workspaceName} blockedReason={null} variant="link" />
        </div>
      )}
    </>
  );
}
