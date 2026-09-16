/**
 * Team invitations against a real database: seats follow the plan, links are
 * bound to their email and single-use, and a workspace never loses its last owner.
 */
import { and, eq } from "drizzle-orm";
import { beforeAll, describe, expect, it, vi } from "vitest";
import type { WorkspaceContext } from "@/server/context";
import { db } from "@/server/db/client";
import * as t from "@/server/db/schema";
import { acceptInvitation, changeMemberRole, findInvitation, getTeam, inviteMember, removeMember, revokeInvitation } from "@/server/services/team";
import { newId } from "@/lib/ids";

vi.mock("next/headers", () => ({ headers: async () => new Headers({ host: "localhost:3000" }) }));

let owner: WorkspaceContext;
const tokenOf = (url: string) => url.split("/invite/")[1]!;

async function createUser(email: string) {
  const id = newId("usr");
  await db.insert(t.users).values({ id, email, name: email.split("@")[0]! });
  return { userId: id, email };
}

beforeAll(async () => {
  const orgId = newId("org");
  const wsId = newId("ws");
  const user = await createUser("owner@team-test.dev");
  await db.insert(t.organizations).values({ id: orgId, name: "Team test", slug: `team-test-${orgId.slice(-6)}`, plan: "launch", planStatus: "trialing", trialEndsAt: new Date(Date.now() + 5 * 86_400_000) });
  await db.insert(t.workspaces).values({ id: wsId, organizationId: orgId, name: "Team test", slug: `team-test-${wsId.slice(-6)}` });
  await db.insert(t.members).values({ id: newId("mem"), organizationId: orgId, userId: user.userId, role: "owner" });
  owner = { ...user, name: "Owner", isGuest: false, organizationId: orgId, workspaceId: wsId, workspaceSlug: `team-test-${wsId.slice(-6)}`, workspaceName: "Team test", role: "owner", autonomyMode: "copilot", isDemo: false };
});

describe("invitations and seats", () => {
  let adaToken: string;
  let graceInvite: string;

  it("reserves a seat per pending invitation and returns a single link", async () => {
    const ada = await inviteMember(owner, { email: "Ada@Team-Test.dev ", role: "member" });
    expect(ada.email).toBe("ada@team-test.dev");
    expect(ada.inviteUrl).toMatch(/^http:\/\/localhost:3000\/invite\/[\w-]{20,}$/);
    expect(ada.emailed).toBe(false);
    adaToken = tokenOf(ada.inviteUrl);

    const grace = await inviteMember(owner, { email: "grace@team-test.dev", role: "viewer" });
    graceInvite = (await findInvitation(tokenOf(grace.inviteUrl))).status === "valid" ? tokenOf(grace.inviteUrl) : "";

    const team = await getTeam(owner);
    expect(team.seats).toEqual({ limit: 3, used: 3, available: 0, full: true });
  });

  it("refuses duplicates and invitations beyond the plan's seats", async () => {
    await expect(inviteMember(owner, { email: "ada@team-test.dev", role: "member" })).rejects.toThrow(/pending invitation/);
    await expect(inviteMember(owner, { email: "linus@team-test.dev", role: "member" })).rejects.toThrow(/seats on your plan are taken/);
  });

  it("frees the seat when an invitation is revoked, and kills its link", async () => {
    const lookup = await findInvitation(graceInvite);
    expect(lookup.status).toBe("valid");
    await revokeInvitation(owner, (lookup as { id: string }).id);
    expect((await findInvitation(graceInvite)).status).toBe("invalid");
    expect((await getTeam(owner)).seats.used).toBe(2);
  });

  it("only lets managers invite", async () => {
    await expect(inviteMember({ ...owner, role: "member" }, { email: "x@team-test.dev", role: "viewer" })).rejects.toThrow(/owners and admins/);
    await expect(inviteMember({ ...owner, role: "admin" }, { email: "x@team-test.dev", role: "admin" })).rejects.toThrow(/Only an owner/);
  });

  it("binds the link to the invited email and makes it single-use", async () => {
    const stranger = await createUser("stranger@team-test.dev");
    await expect(acceptInvitation(stranger, adaToken)).rejects.toThrow(/sent to ada@team-test.dev/);

    const ada = await createUser("ada@team-test.dev");
    const slug = await acceptInvitation(ada, adaToken);
    expect(slug).toBe(owner.workspaceSlug);
    const member = await db.query.members.findFirst({ where: and(eq(t.members.organizationId, owner.organizationId), eq(t.members.userId, ada.userId)) });
    expect(member?.role).toBe("member");
    expect((await findInvitation(adaToken)).status).toBe("used");
    await expect(acceptInvitation(ada, adaToken)).rejects.toThrow(/no longer valid/);
  });

  it("never leaves a workspace without an owner", async () => {
    const [self] = await db.select().from(t.members).where(and(eq(t.members.organizationId, owner.organizationId), eq(t.members.userId, owner.userId)));
    await expect(changeMemberRole(owner, self!.id, "admin")).rejects.toThrow(/at least one owner/);
    await expect(removeMember(owner, self!.id)).rejects.toThrow(/last owner/);
  });
});
