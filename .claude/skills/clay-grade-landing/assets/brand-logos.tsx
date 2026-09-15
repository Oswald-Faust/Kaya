import {
  siAppstore,
  siBrevo,
  siDiscord,
  siFramer,
  siGithub,
  siGoogleads,
  siGoogleanalytics,
  siGoogleplay,
  siGooglesearchconsole,
  siHotjar,
  siHubspot,
  siInstagram,
  siIntercom,
  siKit,
  siLemonsqueezy,
  siLoops,
  siMailchimp,
  siMake,
  siMeta,
  siMixpanel,
  siNotion,
  siPaddle,
  siPlausibleanalytics,
  siPosthog,
  siProducthunt,
  siReddit,
  siResend,
  siRevenuecat,
  siShopify,
  siStripe,
  siSubstack,
  siSupabase,
  siTiktok,
  siTypeform,
  siWebflow,
  siWordpress,
  siX,
  siYcombinator,
  siYoutube,
  siZapier,
} from "simple-icons";
import { cn } from "@/lib/cn";

/** Real third-party marks (Simple Icons, CC0). Shown for tools Kaya connects to or plans to, never as customer endorsements. */
type Icon = { title: string; hex: string; path: string };

const LINKEDIN: Icon = {
  title: "LinkedIn",
  hex: "0A66C2",
  path: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125zM7.119 20.452H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
};

export const BRANDS = {
  stripe: siStripe,
  paddle: siPaddle,
  lemonsqueezy: siLemonsqueezy,
  revenuecat: siRevenuecat,
  appstore: { ...siAppstore, title: "App Store" },
  googleplay: { ...siGoogleplay, title: "Google Play" },
  googleads: siGoogleads,
  meta: siMeta,
  linkedin: LINKEDIN,
  tiktok: siTiktok,
  x: siX,
  reddit: siReddit,
  hackernews: { ...siYcombinator, title: "Hacker News" },
  producthunt: { ...siProducthunt, title: "Product Hunt" },
  youtube: siYoutube,
  instagram: siInstagram,
  discord: siDiscord,
  googleanalytics: { ...siGoogleanalytics, title: "Google Analytics 4" },
  posthog: siPosthog,
  plausible: { ...siPlausibleanalytics, title: "Plausible" },
  mixpanel: siMixpanel,
  hotjar: siHotjar,
  searchconsole: { ...siGooglesearchconsole, title: "Search Console" },
  resend: siResend,
  brevo: siBrevo,
  loops: siLoops,
  mailchimp: siMailchimp,
  kit: { ...siKit, title: "Kit" },
  hubspot: siHubspot,
  intercom: siIntercom,
  github: siGithub,
  webflow: siWebflow,
  framer: siFramer,
  wordpress: { ...siWordpress, title: "WordPress" },
  shopify: siShopify,
  substack: siSubstack,
  notion: siNotion,
  zapier: siZapier,
  make: siMake,
  typeform: siTypeform,
  supabase: siSupabase,
} satisfies Record<string, Icon>;

export type BrandName = keyof typeof BRANDS;

/** Providers with an adapter contract in src/server/integrations/catalog.ts. */
export const CONNECTED = new Set<BrandName>([
  "stripe",
  "paddle",
  "lemonsqueezy",
  "googleanalytics",
  "posthog",
  "plausible",
  "searchconsole",
  "googleads",
  "meta",
  "linkedin",
  "tiktok",
  "x",
  "resend",
  "brevo",
  "hubspot",
  "github",
]);

/** Channels Kaya plans and drafts for, where the founder publishes. */
export const CHANNEL_ONLY = new Set<BrandName>(["reddit", "hackernews", "producthunt", "youtube"]);

export function brandStatus(brand: BrandName): "connected" | "channel" | "soon" {
  if (CONNECTED.has(brand)) return "connected";
  if (CHANNEL_ONLY.has(brand)) return "channel";
  return "soon";
}

export function BrandIcon({ brand, className, mono = false }: { brand: BrandName; className?: string; mono?: boolean }) {
  const icon: Icon = BRANDS[brand];
  return (
    <svg viewBox="0 0 24 24" role="img" aria-label={icon.title} className={cn("size-5 shrink-0", className)} fill={mono ? "currentColor" : `#${icon.hex}`}>
      <path d={icon.path} />
    </svg>
  );
}

export function BrandLockup({ brand, className, mono = false }: { brand: BrandName; className?: string; mono?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-[17px] font-semibold tracking-[-0.03em] text-ink", className)}>
      <BrandIcon brand={brand} mono={mono} className="size-[1.15em]" />
      <span aria-hidden>{BRANDS[brand].title}</span>
    </span>
  );
}
