import { requireWorkspace } from "@/server/context";
import { SettingsNav } from "@/components/settings/settings-nav";

export default async function SettingsLayout({ children, params }: LayoutProps<"/w/[workspace]/settings">) {
  const { workspace } = await params;
  const ctx = await requireWorkspace(workspace);

  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-5 px-3 py-5 sm:px-5 lg:flex-row lg:gap-10 lg:py-8">
      <SettingsNav slug={ctx.workspaceSlug} workspaceName={ctx.workspaceName} />
      <div className="min-w-0 flex-1 lg:max-w-[720px]">{children}</div>
    </div>
  );
}
