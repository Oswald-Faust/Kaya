"use server";

import { redirect } from "next/navigation";
import { currentUser } from "@/server/context";
import { isDomainError } from "@/server/domain/errors";
import { acceptInvitation } from "@/server/services/team";

export type AcceptState = { error: string | null };

export async function acceptInvitationAction(token: string): Promise<AcceptState> {
  const user = await currentUser();
  if (!user || user.isGuest) redirect(`/login?next=${encodeURIComponent(`/invite/${token}`)}`);
  let slug: string;
  try {
    slug = await acceptInvitation(user, token);
  } catch (error) {
    if (isDomainError(error)) return { error: error.message };
    console.error(JSON.stringify({ level: "error", msg: "accept_invitation_failed", error: String(error) }));
    return { error: "Something went wrong. Try again in a moment." };
  }
  redirect(`/w/${slug}`);
}
