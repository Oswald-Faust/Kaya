import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

class MemoryStorage {
  private store = new Map<string, string>();
  getItem(key: string) {
    return this.store.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.store.set(key, String(value));
  }
  removeItem(key: string) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
}

describe("nav-auth persistence", () => {
  let originalWindow: unknown;
  let originalDocument: unknown;
  let originalLocalStorage: unknown;
  let mockStorage: MemoryStorage;
  let listeners: Record<string, ((e: any) => void)[]> = {};

  beforeEach(() => {
    originalWindow = (globalThis as any).window;
    originalDocument = (globalThis as any).document;
    originalLocalStorage = (globalThis as any).localStorage;

    mockStorage = new MemoryStorage();
    listeners = {};

    const mockWindow = {
      addEventListener: (event: string, cb: (e: any) => void) => {
        listeners[event] = listeners[event] || [];
        listeners[event].push(cb);
      },
      removeEventListener: (event: string, cb: (e: any) => void) => {
        listeners[event] = (listeners[event] || []).filter((l) => l !== cb);
      },
      dispatchEvent: (event: any) => {
        (listeners[event.type] || []).forEach((cb) => cb(event));
      },
    };

    const mockDoc = {
      visibilityState: "visible",
      addEventListener: (event: string, cb: (e: any) => void) => {
        listeners[event] = listeners[event] || [];
        listeners[event].push(cb);
      },
      removeEventListener: (event: string, cb: (e: any) => void) => {
        listeners[event] = (listeners[event] || []).filter((l) => l !== cb);
      },
    };

    (globalThis as any).window = mockWindow;
    (globalThis as any).document = mockDoc;
    (globalThis as any).localStorage = mockStorage;
  });

  afterEach(() => {
    (globalThis as any).window = originalWindow;
    (globalThis as any).document = originalDocument;
    (globalThis as any).localStorage = originalLocalStorage;
  });

  it("returns null when no auth is stored in localStorage", async () => {
    const { getStoredNavAuth } = await import("./nav-auth");
    expect(getStoredNavAuth()).toBeNull();
  });

  it("stores and retrieves auth state with workspace link and subscription", async () => {
    const { getStoredNavAuth, setStoredNavAuth } = await import("./nav-auth");
    setStoredNavAuth({
      appHref: "/w/acme-growth",
      demoHref: "/w/demo-saas",
      authenticated: true,
      subscription: {
        plan: "growth",
        status: "trialing",
        workspaceSlug: "acme-growth",
        workspaceName: "Acme Growth",
        trialDaysLeft: 12,
        billingManaged: false,
      },
    });
    const stored = getStoredNavAuth();
    expect(stored).not.toBeNull();
    expect(stored?.appHref).toBe("/w/acme-growth");
    expect(stored?.demoHref).toBe("/w/demo-saas");
    expect(stored?.authenticated).toBe(true);
    expect(stored?.subscription?.plan).toBe("growth");
    expect(stored?.subscription?.trialDaysLeft).toBe(12);
    expect(typeof stored?.timestamp).toBe("number");
  });

  it("clears stored auth state", async () => {
    const { getStoredNavAuth, setStoredNavAuth, clearStoredNavAuth } = await import("./nav-auth");
    setStoredNavAuth({ appHref: "/w/acme-growth", authenticated: true });
    expect(getStoredNavAuth()).not.toBeNull();

    clearStoredNavAuth();
    expect(getStoredNavAuth()).toBeNull();
  });

  it("subscribes to storage events and triggers callback", async () => {
    const { subscribeToNavAuth } = await import("./nav-auth");
    const callback = vi.fn();
    const unsubscribe = subscribeToNavAuth(callback);

    // Simulate storage event from another tab
    const event = {
      type: "storage",
      key: "kaya_nav_auth",
      newValue: JSON.stringify({
        appHref: "/w/other-workspace",
        demoHref: "/demo",
        authenticated: true,
        timestamp: Date.now(),
      }),
    };

    (globalThis as any).window.dispatchEvent(event);

    expect(callback).toHaveBeenCalledWith(
      expect.objectContaining({
        appHref: "/w/other-workspace",
        authenticated: true,
      }),
    );

    unsubscribe();
  });
});
