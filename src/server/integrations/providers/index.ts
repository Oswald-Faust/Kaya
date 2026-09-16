import { googleAdsProvider, googleAnalyticsProvider, searchConsoleProvider } from "./google";
import { posthogProvider, plausibleProvider } from "./analytics";
import { brevoProvider, resendProvider, rewardfulProvider } from "./email";
import { lemonSqueezyProvider, paddleProvider, stripeProvider } from "./revenue";
import { linkedinProvider, metaAdsProvider, xProvider } from "./social";
import type { LiveProvider } from "./types";

/** Every integration with a real, live implementation. Providers not listed here have no live connection yet. */
export const LIVE_PROVIDERS: Record<string, LiveProvider> = Object.fromEntries(
  [
    stripeProvider,
    paddleProvider,
    lemonSqueezyProvider,
    googleAnalyticsProvider,
    posthogProvider,
    plausibleProvider,
    searchConsoleProvider,
    googleAdsProvider,
    metaAdsProvider,
    resendProvider,
    brevoProvider,
    xProvider,
    linkedinProvider,
    rewardfulProvider,
  ].map((p) => [p.provider, p]),
);

export function getLiveProvider(provider: string): LiveProvider | undefined {
  return LIVE_PROVIDERS[provider];
}

export type { LiveProvider } from "./types";
