/**
 * Deleting a workspace against a real database: only an owner can do it, the
 * name must be typed back, a live subscription blocks it, and everything the
 * workspace owned goes with it.
 */
import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import type { WorkspaceContext } from "@/server/context";
import { db } from "@/server/db/client";
import * as t from "@/server/db/schema";
import { deleteOwnWorkspace } from "@/server/services/settings";
import { newId } from "@/lib/ids";

let owner: WorkspaceContext;
let orgId: string;
let wsId: string;
let productId: string;

beforeAll(async () => {
  orgId = newId("org");
  wsId = newId("ws");
  productId = newId("prd");
  const userId = newId("usr");
  await db.insert(t.users).values({ id: userId, email: `owner-${userId.slice(-6)}@delete-test.dev`, name: "Owner" });
  await db.insert(t.organizations).values({ id: orgId, name: "Delete test", slug: `delete-test-${orgId.slice(-6)}`, plan: "launch", planStatus: "trialing" });
  await db.insert(t.workspaces).values({ id: wsId, organizationId: orgId, name: "Delete test", slug: `delete-test-${wsId.slice(-6)}` });
  await db.insert(t.members).values({ id: newId("mem"), organizationId: orgId, userId, role: "owner" });
  await db.insert(t.products).values({ id: productId, workspaceId: wsId, name: "Delete test", url: "https://delete.test", domain: "delete.test" });
  owner = {
    userId,
    email: `owner-${userId.slice(-6)}@delete-test.dev`,
    name: "Owner",
    isGuest: false,
    organizationId: orgId,
    workspaceId: wsId,
    workspaceSlug: `delete-test-${wsId.slice(-6)}`,
    workspaceName: "Delete test",
    workspaceIconUrl: null,
    role: "owner",
    autonomyMode: "copilot",
    isDemo: false,
  };
});

describe("deleting a workspace", () => {
  it("refuses the demo workspace, a non-owner and a mistyped name", async () => {
    await expect(deleteOwnWorkspace({ ...owner, isDemo: true }, "Delete test")).rejects.toThrow();
    await expect(deleteOwnWorkspace({ ...owner, role: "admin" }, "Delete test")).rejects.toThrow();
    await expect(deleteOwnWorkspace(owner, "delete test")).rejects.toThrow();
    expect(await db.query.workspaces.findFirst({ where: eq(t.workspaces.id, wsId) })).toBeTruthy();
  });

  it("refuses while a paid subscription is live", async () => {
    await db.update(t.organizations).set({ stripeSubscriptionId: "sub_test", planStatus: "active" }).where(eq(t.organizations.id, orgId));
    await expect(deleteOwnWorkspace(owner, "Delete test")).rejects.toThrow();
    await db.update(t.organizations).set({ stripeSubscriptionId: null, planStatus: "trialing" }).where(eq(t.organizations.id, orgId));
  });

  it("deletes the workspace, its content and the now-empty organization", async () => {
    await deleteOwnWorkspace(owner, "Delete test");
    expect(await db.query.workspaces.findFirst({ where: eq(t.workspaces.id, wsId) })).toBeUndefined();
    expect(await db.query.products.findFirst({ where: eq(t.products.id, productId) })).toBeUndefined();
    expect(await db.query.organizations.findFirst({ where: eq(t.organizations.id, orgId) })).toBeUndefined();
  });
});
