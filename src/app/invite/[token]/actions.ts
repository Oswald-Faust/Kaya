"use server";

import { redirect } from "next/navigation";
import { currentUser } from "@/server/context";
import { acceptInvitation } from "@/server/services/team";
import { localizeError } from "@/i18n/errors";
import { getI18n } from "@/i18n/server";

export type AcceptState = { error: string | null };

export async function acceptInvitationAction(token: string): Promise<AcceptState> {
  const user = await currentUser();
  if (!user || user.isGuest) redirect(`/login?next=${encodeURIComponent(`/invite/${token}`)}`);
  let slug: string;
  try {
    slug = await acceptInvitation(user, token);
  } catch (error) {
    const { locale, t } = await getI18n();
    const message = localizeError(error, locale);
    if (!message) console.error(JSON.stringify({ level: "error", msg: "accept_invitation_failed", error: String(error) }));
    return { error: message ?? t.common.somethingWentWrong };
  }
  redirect(`/w/${slug}`);
}
