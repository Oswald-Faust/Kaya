import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Clock, LinkIcon, MailWarning } from "lucide-react";
import { KayaWordmark } from "@/components/brand/logo";
import { LanguageSwitcher } from "@/components/marketing/language-switcher";
import { Avatar } from "@/components/settings/primitives";
import { buttonClass } from "@/components/ui/button";
import { currentUser } from "@/server/context";
import { findInvitation } from "@/server/services/team";
import { getI18n } from "@/i18n/server";
import { fmt, plural } from "@/i18n/format";
import { AcceptButton } from "./accept-button";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.settings.invite.metaTitle, robots: { index: false } };
}

export default async function InvitePage({ params }: PageProps<"/invite/[token]">) {
  const { token } = await params;
  const [invite, user, { t, locale }] = await Promise.all([findInvitation(token), currentUser(), getI18n()]);
  const iv = t.settings.invite;
  const signedIn = user && !user.isGuest ? user : null;
  const next = encodeURIComponent(`/invite/${token}`);

  if (invite.status !== "valid") {
    const copy = {
      expired: { icon: <Clock />, title: iv.expiredTitle, body: iv.expiredBody },
      used: { icon: <LinkIcon />, title: iv.usedTitle, body: iv.usedBody },
      invalid: { icon: <LinkIcon />, title: iv.invalidTitle, body: iv.invalidBody },
    }[invite.status];
    return (
      <Frame homeLabel={iv.homeLabel}>
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-sunken text-muted [&_svg]:size-5">{copy.icon}</span>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight text-ink">{copy.title}</h1>
        <p className="mt-2 text-sm text-muted">{copy.body}</p>
        <Link href={signedIn ? "/start" : "/login"} className={buttonClass("secondary", "lg", "mt-6")}>
          {signedIn ? iv.goToWorkspaces : iv.logIn}
        </Link>
      </Frame>
    );
  }

  const mismatch = signedIn && signedIn.email.toLowerCase() !== invite.email;
  const [joinBefore, joinAfter] = iv.join.split("{workspace}");

  return (
    <Frame homeLabel={iv.homeLabel}>
      <Avatar name={invite.workspaceName} src={invite.workspaceIconUrl} className="mx-auto size-16 rounded-xl text-2xl shadow-float" />
      <h1 className="mt-6 text-[28px] leading-tight font-semibold tracking-tight text-ink">
        {joinBefore}
        <span className="text-agent">{invite.workspaceName}</span>
        {joinAfter}
      </h1>
      <p className="mt-2 text-sm text-muted">{fmt(iv.invitedYou, { inviter: invite.inviterName ?? iv.aTeammate, role: iv.roleArticle[invite.role] })}</p>

      <div className="mt-6 flex items-center gap-3 rounded-lg border border-line bg-surface p-3 text-left">
        <Avatar name={invite.workspaceName} src={invite.workspaceIconUrl} className="size-9 rounded-md text-sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink">{invite.workspaceName}</p>
          <p className="truncate text-xs text-muted">{plural(locale, invite.memberCount, iv.members, { email: invite.email })}</p>
        </div>
      </div>

      <div className="mt-6">
        {!signedIn ? (
          <div className="flex flex-col gap-2">
            <Link href={`/signup?next=${next}`} className={buttonClass("primary", "lg", "h-11 w-full")}>
              {fmt(iv.createAccount, { email: invite.email })}
            </Link>
            <Link href={`/login?next=${next}`} className={buttonClass("secondary", "lg", "h-11 w-full")}>
              {iv.haveAccount}
            </Link>
          </div>
        ) : mismatch ? (
          <div className="rounded-lg bg-warning-soft p-4 text-left">
            <p className="flex items-center gap-2 text-sm font-medium text-warning">
              <MailWarning className="size-4" />
              {iv.mismatchTitle}
            </p>
            <p className="mt-1 text-xs text-muted">{fmt(iv.mismatchBody, { current: signedIn.email, email: invite.email })}</p>
            <form action="/logout" method="post" className="mt-3">
              <button type="submit" className={buttonClass("secondary", "md")}>
                {iv.signOut}
              </button>
            </form>
          </div>
        ) : (
          <>
            <AcceptButton token={token} workspaceName={invite.workspaceName} />
            <p className="mt-3 text-xs text-subtle">{fmt(iv.signedInAs, { email: signedIn.email })}</p>
          </>
        )}
      </div>
    </Frame>
  );
}

function Frame({ children, homeLabel }: { children: ReactNode; homeLabel: string }) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas px-4">
      <header className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between">
        <Link href="/" aria-label={homeLabel}>
          <KayaWordmark className="text-[20px]" markClassName="size-6" />
        </Link>
        <LanguageSwitcher />
      </header>
      <main className="flex flex-1 items-center justify-center pb-16">
        <div className="w-full max-w-[400px] text-center">{children}</div>
      </main>
    </div>
  );
}
