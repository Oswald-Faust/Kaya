import { eq } from "drizzle-orm";
import { LogOut } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { PasswordForm, ProfileNameForm } from "@/components/settings/forms";
import { Monogram, SettingsHeader, SettingsRow, SettingsSection } from "@/components/settings/primitives";
import { requireWorkspace } from "@/server/context";
import { db } from "@/server/db/client";
import { users } from "@/server/db/schema";

export const metadata = { title: "Profile" };

export default async function AccountSettingsPage({ params }: PageProps<"/w/[workspace]/settings/account">) {
  const { workspace } = await params;
  const ctx = await requireWorkspace(workspace);
  const user = await db.query.users.findFirst({ where: eq(users.id, ctx.userId), columns: { passwordHash: true, googleSub: true, avatarUrl: true } });

  return (
    <>
      <SettingsHeader title="Your profile" description="Personal settings follow you across every workspace." />

      <SettingsSection>
        <div className="flex items-center gap-4 px-4 py-4">
          {user?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatarUrl} alt="" className="size-14 rounded-full object-cover" />
          ) : (
            <Monogram name={ctx.name} className="size-14 rounded-full text-lg" />
          )}
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-ink">{ctx.name}</p>
            <p className="truncate text-xs text-muted">{ctx.email}</p>
          </div>
        </div>
        <SettingsRow label="Name" description="How teammates see you in approvals and invitations.">
          <ProfileNameForm slug={ctx.workspaceSlug} name={ctx.name} />
        </SettingsRow>
        <SettingsRow label="Email" description={user?.googleSub ? "Signed in with Google." : "Used to sign in. Contact support to change it."}>
          <input value={ctx.email} readOnly disabled aria-label="Email" className="h-9 w-full rounded-md border border-line bg-raised px-2.5 text-sm text-subtle xl:w-80" />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="Password" description={user?.passwordHash ? "Use at least 8 characters." : "Add a password to sign in with your email as well as Google."}>
        <PasswordForm slug={ctx.workspaceSlug} hasPassword={Boolean(user?.passwordHash)} />
      </SettingsSection>

      <SettingsSection title="Session">
        <SettingsRow label="Sign out" description="Ends your session on this device.">
          <form action="/logout" method="post">
            <button type="submit" className={buttonClass("secondary", "md")}>
              <LogOut className="size-3.5" />
              Sign out
            </button>
          </form>
        </SettingsRow>
      </SettingsSection>
    </>
  );
}
