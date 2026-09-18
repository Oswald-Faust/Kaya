import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { LogOut } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { PasswordForm, ProfileNameForm } from "@/components/settings/forms";
import { AvatarField } from "@/components/settings/image-fields";
import { SettingsHeader, SettingsRow, SettingsSection } from "@/components/settings/primitives";
import { requireWorkspace } from "@/server/context";
import { db } from "@/server/db/client";
import { users } from "@/server/db/schema";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.settings.nav.profile };
}

export default async function AccountSettingsPage({ params }: PageProps<"/w/[workspace]/settings/account">) {
  const { workspace } = await params;
  const ctx = await requireWorkspace(workspace);
  const [user, { t }] = await Promise.all([
    db.query.users.findFirst({ where: eq(users.id, ctx.userId), columns: { passwordHash: true, googleSub: true, avatarUrl: true } }),
    getI18n(),
  ]);
  const p = t.settings.profile;

  return (
    <>
      <SettingsHeader title={p.title} description={p.description} />

      <SettingsSection>
        <SettingsRow label={p.photo} description={p.photoHint} stack>
          <AvatarField slug={ctx.workspaceSlug} name={ctx.name} src={user?.avatarUrl ?? null} />
        </SettingsRow>
        <SettingsRow label={p.name} description={p.nameHint}>
          <ProfileNameForm slug={ctx.workspaceSlug} name={ctx.name} />
        </SettingsRow>
        <SettingsRow label={p.email} description={user?.googleSub ? p.emailGoogle : p.emailHint}>
          <input value={ctx.email} readOnly disabled aria-label={p.email} className="h-9 w-full rounded-md border border-line bg-raised px-2.5 text-sm text-subtle xl:w-80" />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title={p.password} description={user?.passwordHash ? p.passwordHint : p.passwordHintGoogle}>
        <PasswordForm slug={ctx.workspaceSlug} hasPassword={Boolean(user?.passwordHash)} />
      </SettingsSection>

      <SettingsSection title={p.session}>
        <SettingsRow label={p.signOut} description={p.signOutHint}>
          <form action="/logout" method="post">
            <button type="submit" className={buttonClass("secondary", "md")}>
              <LogOut className="size-3.5" />
              {p.signOut}
            </button>
          </form>
        </SettingsRow>
      </SettingsSection>
    </>
  );
}
