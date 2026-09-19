import type { UserSubscriptionSummary } from "@/components/pricing/plans";

export interface NavAuthState {
  appHref: string | null;
  demoHref?: string;
  authenticated: boolean;
  timestamp: number;
  subscription?: UserSubscriptionSummary | null;
}

const STORAGE_KEY = "kaya_nav_auth";
const CHANNEL_NAME = "kaya_auth_channel";

function getBroadcastChannel(): BroadcastChannel | null {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") {
    return null;
  }
  try {
    return new BroadcastChannel(CHANNEL_NAME);
  } catch {
    return null;
  }
}

export function getStoredNavAuth(): NavAuthState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed === "object" && parsed !== null) {
      return parsed as NavAuthState;
    }
    return null;
  } catch {
    return null;
  }
}

export function setStoredNavAuth(data: { appHref: string | null; demoHref?: string; authenticated?: boolean; subscription?: UserSubscriptionSummary | null }): void {
  if (typeof window === "undefined") return;
  const payload: NavAuthState = {
    appHref: data.appHref,
    demoHref: data.demoHref,
    authenticated: data.authenticated ?? Boolean(data.appHref),
    timestamp: Date.now(),
    subscription: data.subscription,
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // LocalStorage might fail in private browsing quota exceeded
  }

  const channel = getBroadcastChannel();
  if (channel) {
    try {
      channel.postMessage(payload);
      channel.close();
    } catch {
      // Ignore broadcast errors
    }
  }
}

export function clearStoredNavAuth(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore error
  }

  const payload: NavAuthState = {
    appHref: null,
    authenticated: false,
    timestamp: Date.now(),
  };

  const channel = getBroadcastChannel();
  if (channel) {
    try {
      channel.postMessage(payload);
      channel.close();
    } catch {
      // Ignore error
    }
  }
}

/**
 * Subscribes to auth state changes from other tabs and windows.
 * Listens to BroadcastChannel, storage events, and visibility change.
 */
export function subscribeToNavAuth(callback: (state: NavAuthState) => void): () => void {
  if (typeof window === "undefined") return () => {};

  let channel: BroadcastChannel | null = null;
  try {
    if (typeof BroadcastChannel !== "undefined") {
      channel = new BroadcastChannel(CHANNEL_NAME);
      channel.onmessage = (event) => {
        if (event.data && typeof event.data === "object") {
          callback(event.data as NavAuthState);
        }
      };
    }
  } catch {
    channel = null;
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      if (event.newValue) {
        try {
          const parsed = JSON.parse(event.newValue) as NavAuthState;
          callback(parsed);
        } catch {
          callback({ appHref: null, authenticated: false, timestamp: Date.now() });
        }
      } else {
        callback({ appHref: null, authenticated: false, timestamp: Date.now() });
      }
    }
  };

  const handleVisibility = () => {
    if (document.visibilityState === "visible") {
      const stored = getStoredNavAuth();
      if (stored) {
        callback(stored);
      }
    }
  };

  window.addEventListener("storage", handleStorage);
  document.addEventListener("visibilitychange", handleVisibility);

  const handleSubmit = (e: SubmitEvent) => {
    const form = e.target as HTMLFormElement | null;
    if (form?.action && (form.action.endsWith("/logout") || form.action.includes("/logout"))) {
      clearStoredNavAuth();
    }
  };
  document.addEventListener("submit", handleSubmit, true);

  return () => {
    window.removeEventListener("storage", handleStorage);
    document.removeEventListener("visibilitychange", handleVisibility);
    document.removeEventListener("submit", handleSubmit, true);
    if (channel) {
      try {
        channel.close();
      } catch {
        // Ignore
      }
    }
  };
}
