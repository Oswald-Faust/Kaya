import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Clock, LinkIcon, MailWarning } from "lucide-react";
import { KayaWordmark } from "@/components/brand/logo";
import { Monogram } from "@/components/settings/primitives";
import { buttonClass } from "@/components/ui/button";
import { currentUser } from "@/server/context";
import { findInvitation } from "@/server/services/team";
import { AcceptButton } from "./accept-button";

export const metadata: Metadata = { title: "Join your team", robots: { index: false } };

const ROLE_LABEL = { owner: "an owner", admin: "an admin", member: "a member", viewer: "a viewer" } as const;

export default async function InvitePage({ params }: PageProps<"/invite/[token]">) {
  const { token } = await params;
  const [invite, user] = await Promise.all([findInvitation(token), currentUser()]);
  const signedIn = user && !user.isGuest ? user : null;
  const next = encodeURIComponent(`/invite/${token}`);

  if (invite.status !== "valid") {
    const copy = {
      expired: { icon: <Clock />, title: "This invitation has expired", body: "Invitations last 7 days. Ask whoever invited you to send a new one." },
      used: { icon: <LinkIcon />, title: "This invitation was already used", body: "If it was you, log in to open the workspace." },
      invalid: { icon: <LinkIcon />, title: "This invitation isn't valid", body: "The link may have been revoked or replaced by a newer one. Ask for a new invitation." },
    }[invite.status];
    return (
      <Frame>
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-sunken text-muted [&_svg]:size-5">{copy.icon}</span>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight text-ink">{copy.title}</h1>
        <p className="mt-2 text-sm text-muted">{copy.body}</p>
        <Link href={signedIn ? "/start" : "/login"} className={buttonClass("secondary", "lg", "mt-6")}>
          {signedIn ? "Go to my workspaces" : "Log in"}
        </Link>
      </Frame>
    );
  }

  const mismatch = signedIn && signedIn.email.toLowerCase() !== invite.email;

  return (
    <Frame>
      <Monogram name={invite.workspaceName} className="mx-auto size-16 rounded-xl text-2xl shadow-float" />
      <h1 className="mt-6 text-[28px] leading-tight font-semibold tracking-tight text-ink">
        Join <span className="text-agent">{invite.workspaceName}</span> on Kaya
      </h1>
      <p className="mt-2 text-sm text-muted">
        {invite.inviterName ? <strong className="font-medium text-ink">{invite.inviterName}</strong> : "A teammate"} invited you to join as {ROLE_LABEL[invite.role]}.
      </p>

      <div className="mt-6 flex items-center gap-3 rounded-lg border border-line bg-surface p-3 text-left">
        <Monogram name={invite.workspaceName} className="size-9 text-sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink">{invite.workspaceName}</p>
          <p className="truncate text-xs text-muted">
            {invite.memberCount} member{invite.memberCount === 1 ? "" : "s"} · invitation for {invite.email}
          </p>
        </div>
      </div>

      <div className="mt-6">
        {!signedIn ? (
          <div className="flex flex-col gap-2">
            <Link href={`/signup?next=${next}`} className={buttonClass("primary", "lg", "h-11 w-full")}>
              Create an account with {invite.email}
            </Link>
            <Link href={`/login?next=${next}`} className={buttonClass("secondary", "lg", "h-11 w-full")}>
              I already have an account
            </Link>
          </div>
        ) : mismatch ? (
          <div className="rounded-lg bg-warning-soft p-4 text-left">
            <p className="flex items-center gap-2 text-sm font-medium text-warning">
              <MailWarning className="size-4" />
              Signed in with a different email
            </p>
            <p className="mt-1 text-xs text-muted">
              You&apos;re signed in as {signedIn.email}, but this invitation is for {invite.email}. Sign out, then log in or sign up with {invite.email}.
            </p>
            <form action="/logout" method="post" className="mt-3">
              <button type="submit" className={buttonClass("secondary", "md")}>
                Sign out
              </button>
            </form>
          </div>
        ) : (
          <>
            <AcceptButton token={token} workspaceName={invite.workspaceName} />
            <p className="mt-3 text-xs text-subtle">Signed in as {signedIn.email}</p>
          </>
        )}
      </div>
    </Frame>
  );
}

function Frame({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas px-4">
      <header className="mx-auto flex h-16 w-full max-w-5xl items-center">
        <Link href="/" aria-label="Kaya home">
          <KayaWordmark className="text-[20px]" markClassName="size-6" />
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center pb-16">
        <div className="w-full max-w-[400px] text-center">{children}</div>
      </main>
    </div>
  );
}
