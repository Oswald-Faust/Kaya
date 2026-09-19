import { beforeAll, describe, expect, it } from "vitest";
import { db } from "@/server/db/client";
import * as t from "@/server/db/schema";
import { getDefaultDashboardUrl, resolvePostLoginRedirect } from "@/server/services/account";
import { newId } from "@/lib/ids";

describe("post-login redirection", () => {
  let userNoProduct: string;
  let userWithProduct: string;
  let adminUser: string;
  let userMultiWorkspace: string;
  let primarySlug: string;
  let multiRealSlug: string;

  beforeAll(async () => {
    // 1. User with no product
    userNoProduct = newId("usr");
    await db.insert(t.users).values({ id: userNoProduct, email: "noproduct@test.dev", name: "No Product" });

    // Also a workspace with no product to verify workspace alone doesn't trigger redirect
    const emptyOrgId = newId("org");
    const emptyWsId = newId("ws");
    await db.insert(t.organizations).values({ id: emptyOrgId, name: "Empty Org", slug: `empty-org-${emptyOrgId.slice(-6)}` });
    await db.insert(t.workspaces).values({ id: emptyWsId, organizationId: emptyOrgId, name: "Empty Ws", slug: `empty-ws-${emptyWsId.slice(-6)}` });
    await db.insert(t.members).values({ id: newId("mem"), organizationId: emptyOrgId, userId: userNoProduct, role: "owner" });

    // 2. User with a workspace and a product
    userWithProduct = newId("usr");
    await db.insert(t.users).values({ id: userWithProduct, email: "withproduct@test.dev", name: "With Product" });
    const orgId = newId("org");
    const wsId = newId("ws");
    primarySlug = `real-ws-${wsId.slice(-6)}`;
    await db.insert(t.organizations).values({ id: orgId, name: "Real Org", slug: `real-org-${orgId.slice(-6)}` });
    await db.insert(t.workspaces).values({ id: wsId, organizationId: orgId, name: "Real Ws", slug: primarySlug, createdAt: new Date(Date.now() - 10_000) });
    await db.insert(t.members).values({ id: newId("mem"), organizationId: orgId, userId: userWithProduct, role: "owner" });
    await db.insert(t.products).values({
      id: newId("prd"),
      workspaceId: wsId,
      name: "Real Product",
      url: "https://realproduct.test",
      domain: "realproduct.test",
      status: "active",
      onboardingStep: "done",
    });

    // 3. Platform admin
    adminUser = newId("usr");
    await db.insert(t.users).values({ id: adminUser, email: "admin@test.dev", name: "Admin", isPlatformAdmin: true });

    // 4. User with demo workspace and real workspace with product
    userMultiWorkspace = newId("usr");
    await db.insert(t.users).values({ id: userMultiWorkspace, email: "multi@test.dev", name: "Multi User" });

    const demoOrgId = newId("org");
    const demoWsId = newId("ws");
    await db.insert(t.organizations).values({ id: demoOrgId, name: "Demo Org", slug: `demo-org-${demoOrgId.slice(-6)}` });
    await db.insert(t.workspaces).values({ id: demoWsId, organizationId: demoOrgId, name: "Demo Ws", slug: `demo-ws-${demoWsId.slice(-6)}`, isDemo: true, createdAt: new Date() });
    await db.insert(t.members).values({ id: newId("mem"), organizationId: demoOrgId, userId: userMultiWorkspace, role: "owner" });
    await db.insert(t.products).values({
      id: newId("prd"),
      workspaceId: demoWsId,
      name: "Demo Product",
      url: "https://demoproduct.test",
      domain: "demoproduct.test",
      status: "active",
      onboardingStep: "done",
    });

    const multiRealOrgId = newId("org");
    const multiRealWsId = newId("ws");
    multiRealSlug = `multi-real-ws-${multiRealWsId.slice(-6)}`;
    await db.insert(t.organizations).values({ id: multiRealOrgId, name: "Multi Real Org", slug: `multi-real-org-${multiRealOrgId.slice(-6)}` });
    await db.insert(t.workspaces).values({ id: multiRealWsId, organizationId: multiRealOrgId, name: "Multi Real Ws", slug: multiRealSlug, isDemo: false, createdAt: new Date(Date.now() - 5_000) });
    await db.insert(t.members).values({ id: newId("mem"), organizationId: multiRealOrgId, userId: userMultiWorkspace, role: "owner" });
    await db.insert(t.products).values({
      id: newId("prd"),
      workspaceId: multiRealWsId,
      name: "Multi Real Product",
      url: "https://multireal.test",
      domain: "multireal.test",
      status: "active",
      onboardingStep: "done",
    });
  });

  it("returns null dashboard and /start for a user without products", async () => {
    expect(await getDefaultDashboardUrl(userNoProduct)).toBeNull();
    expect(await resolvePostLoginRedirect(userNoProduct)).toBe("/start");
    expect(await resolvePostLoginRedirect(userNoProduct, "/start")).toBe("/start");
  });

  it("redirects to the dashboard when the user already has a product", async () => {
    expect(await getDefaultDashboardUrl(userWithProduct)).toBe(`/w/${primarySlug}`);
    // When no next param is passed:
    expect(await resolvePostLoginRedirect(userWithProduct)).toBe(`/w/${primarySlug}`);
    // When next was /start (the product URL input screen):
    expect(await resolvePostLoginRedirect(userWithProduct, "/start")).toBe(`/w/${primarySlug}`);
  });

  it("preserves explicit next destination when provided", async () => {
    expect(await resolvePostLoginRedirect(userWithProduct, "/w/some-other/settings")).toBe("/w/some-other/settings");
    expect(await resolvePostLoginRedirect(userWithProduct, "/admin")).toBe("/admin");
  });

  it("redirects platform admin to /admin when next is not specified", async () => {
    expect(await resolvePostLoginRedirect(adminUser)).toBe("/admin");
    expect(await resolvePostLoginRedirect(adminUser, "/start")).toBe("/admin");
  });

  it("prefers non-demo workspaces when resolving default dashboard", async () => {
    expect(await getDefaultDashboardUrl(userMultiWorkspace)).toBe(`/w/${multiRealSlug}`);
    expect(await resolvePostLoginRedirect(userMultiWorkspace)).toBe(`/w/${multiRealSlug}`);
  });
});
