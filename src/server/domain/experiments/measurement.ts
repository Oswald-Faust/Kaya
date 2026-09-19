/**
 * How each kind of experiment is launched, proven live and evaluated.
 * The agent reads this before acting and before judging a result, so a
 * comparison page, a Show HN post and an ad campaign are each measured the
 * way they actually work. Pure: no I/O.
 */

import type { Capability } from "@/server/integrations/catalog";

export type Deliverable = "page" | "community_post" | "social_post" | "campaign" | "email" | "creator_deal" | "in_product";

export interface ProofRequirement {
  kind: "page_url" | "post_url" | "campaign_link" | "send_record" | "affiliate_link" | "none";
  /** Short label for the field the founder or agent fills in. */
  label: string;
  /** Hosts a valid proof URL must be on (e.g. news.ycombinator.com). Empty = any host. */
  hosts: string[];
  /** The proof must be on the product's own domain (pages Kaya or the founder publish). */
  onProductDomain: boolean;
  example: string;
}

export interface MeasurementPlan {
  deliverable: Deliverable;
  /** Who puts it live: a connected tool, or the founder by hand. */
  launch: "integration" | "founder";
  proof: ProofRequirement;
  /** At least one of these must be connected to measure automatically. */
  requires: { anyOf: Capability[]; why: string };
  attribution: { method: "path" | "utm" | "campaign" | "email" | "affiliate" | "product"; utm: { source: string; medium: string } | null };
  /** How the result is computed, in plain words. */
  evaluation: string;
  /** Minimum days before a result can be trusted. */
  signalDays: number;
  /** What the founder does, in order, when the launch is manual. */
  founderSteps: string[];
}

export interface PlanInput {
  type: string;
  channel: string;
  primaryMetric: string;
  number: number;
}

const COMMUNITY: Record<string, { hosts: string[]; source: string; name: string; example: string; steps: string[] }> = {
  hacker_news: {
    hosts: ["news.ycombinator.com"],
    source: "hackernews",
    name: "Hacker News",
    example: "https://news.ycombinator.com/item?id=41234567",
    steps: [
      "Post it on news.ycombinator.com/submit with the title “Show HN: …” and the tracked link below.",
      "Add the first comment from the draft right after posting: who you are and what feedback you want.",
      "Stay in the thread for the first 2–3 hours and answer every question.",
      "Paste the item URL here so Kaya can verify it and start measuring.",
    ],
  },
  reddit: {
    hosts: ["reddit.com", "www.reddit.com", "old.reddit.com"],
    source: "reddit",
    name: "Reddit",
    example: "https://www.reddit.com/r/SaaS/comments/abc123/…",
    steps: [
      "Check the subreddit's self-promotion rules before posting.",
      "Post the draft with the tracked link below (or in your first comment if links are restricted).",
      "Answer comments during the first hours.",
      "Paste the post URL here so Kaya can verify it and start measuring.",
    ],
  },
};

const SOCIAL: Record<string, { hosts: string[]; source: string; example: string }> = {
  x_organic: { hosts: ["x.com", "twitter.com"], source: "x", example: "https://x.com/you/status/1834…" },
  linkedin: { hosts: ["linkedin.com", "www.linkedin.com"], source: "linkedin", example: "https://www.linkedin.com/feed/update/urn:li:share:…" },
  tiktok: { hosts: ["tiktok.com", "www.tiktok.com"], source: "tiktok", example: "https://www.tiktok.com/@you/video/…" },
};

const ANALYTICS: Capability[] = ["READ_ANALYTICS"];

export function measurementPlanFor(exp: PlanInput): MeasurementPlan {
  if (exp.type === "seo_page" || exp.type === "landing_page" || exp.type === "pricing") {
    const seo = exp.type === "seo_page";
    return {
      deliverable: "page",
      launch: "integration",
      proof: { kind: "page_url", label: "Published page URL", hosts: [], onProductDomain: true, example: "https://yourproduct.com/alternatives/competitor" },
      requires: { anyOf: seo ? ["READ_ANALYTICS", "READ_SEARCH_QUERIES"] : ANALYTICS, why: "Visits and signups on the page come from your analytics tool." },
      attribution: { method: "path", utm: null },
      evaluation: seo
        ? "Signup rate of visitors who land on this page, compared with the homepage over the same period, plus the queries and impressions it earns in Search Console."
        : "Signup rate of visitors who land on this page, compared with the page it replaces over the same period.",
      signalDays: seo ? 21 : 14,
      founderSteps: ["Publish the page (Kaya can host it), then paste its public URL so Kaya can check it answers with HTTP 200."],
    };
  }

  const community = COMMUNITY[exp.channel];
  if (exp.type === "community" && community) {
    return {
      deliverable: "community_post",
      launch: "founder",
      proof: { kind: "post_url", label: `${community.name} post URL`, hosts: community.hosts, onProductDomain: false, example: community.example },
      requires: { anyOf: ANALYTICS, why: "Visitors and signups from the post are counted by your analytics tool through the tracked link." },
      attribution: { method: "utm", utm: { source: community.source, medium: "community" } },
      evaluation: `Visits and signups tagged utm_source=${community.source} (or referred by ${community.hosts[0]}) in the 7 days after posting, compared with the 7 days before.`,
      signalDays: 7,
      founderSteps: community.steps,
    };
  }

  const social = SOCIAL[exp.channel];
  if (social && (exp.type === "messaging" || exp.type === "community" || exp.type === "creator")) {
    return {
      deliverable: "social_post",
      launch: exp.channel === "x_organic" || exp.channel === "linkedin" ? "integration" : "founder",
      proof: { kind: "post_url", label: "Post URL", hosts: social.hosts, onProductDomain: false, example: social.example },
      requires: { anyOf: ANALYTICS, why: "Clicks and signups from the post are counted through the tracked link." },
      attribution: { method: "utm", utm: { source: social.source, medium: "social" } },
      evaluation: `Clicks and signups tagged utm_source=${social.source} in the 7 days after posting, plus the post's engagement.`,
      signalDays: 7,
      founderSteps: ["Publish the post with the tracked link below.", "Paste the post URL here so Kaya can verify it and start measuring."],
    };
  }

  if (exp.type === "paid_ad") {
    return {
      deliverable: "campaign",
      launch: "integration",
      proof: { kind: "campaign_link", label: "Campaign in your ad account", hosts: [], onProductDomain: false, example: "Linked automatically when Kaya launches or imports it" },
      requires: { anyOf: ["READ_AD_INSIGHTS"], why: "Spend, clicks and conversions come from the connected ad account; paying customers from your revenue tool." },
      attribution: { method: "campaign", utm: null },
      evaluation: "CAC = campaign spend ÷ paying customers it brought, compared with the target; the campaign pauses automatically when it clearly loses.",
      signalDays: 14,
      founderSteps: ["Connect the ad account so Kaya can launch the campaign and read its results."],
    };
  }

  if (exp.type === "email" || exp.type === "activation") {
    return {
      deliverable: "email",
      launch: "integration",
      proof: { kind: "send_record", label: "Sent through Resend or Brevo", hosts: [], onProductDomain: false, example: "Recorded automatically on send" },
      requires: { anyOf: ["READ_EMAIL_METRICS", "READ_PRODUCT_EVENTS"], why: "Delivery and clicks come from the email tool; activation from product analytics." },
      attribution: { method: "email", utm: { source: "email", medium: "lifecycle" } },
      evaluation: "Activation or trial-to-paid rate of people who received the email, compared with those who didn't (holdout).",
      signalDays: 14,
      founderSteps: ["Connect Resend or Brevo so Kaya can send and track the sequence."],
    };
  }

  if (exp.type === "creator") {
    return {
      deliverable: "creator_deal",
      launch: "founder",
      proof: { kind: "affiliate_link", label: "Creator's content or affiliate link", hosts: [], onProductDomain: false, example: "https://youtube.com/watch?v=… or the Rewardful link" },
      requires: { anyOf: ["TRACK_CREATOR_DEALS", "READ_REVENUE"], why: "Revenue is attributed to the creator's link or code." },
      attribution: { method: "affiliate", utm: { source: "creator", medium: "affiliate" } },
      evaluation: "Revenue and paying customers attributed to the creator's link or code, against what the deal cost.",
      signalDays: 21,
      founderSteps: ["Agree the deal, give the creator their tracked link or code, and paste the published content URL here."],
    };
  }

  return {
    deliverable: "in_product",
    launch: "founder",
    proof: { kind: "none", label: "Nothing to publish", hosts: [], onProductDomain: false, example: "" },
    requires: { anyOf: ["READ_PRODUCT_EVENTS", "READ_ANALYTICS"], why: "The change is measured on product events." },
    attribution: { method: "product", utm: null },
    evaluation: "The primary metric for users exposed to the change, compared with before the change.",
    signalDays: 14,
    founderSteps: ["Ship the change, then mark it launched here."],
  };
}

/** The link the founder shares, tagged so analytics can attribute visits to this experiment. */
export function trackedLink(productUrl: string, plan: MeasurementPlan, number: number): string | null {
  if (!plan.attribution.utm || !productUrl) return null;
  try {
    const u = new URL(productUrl);
    u.searchParams.set("utm_source", plan.attribution.utm.source);
    u.searchParams.set("utm_medium", plan.attribution.utm.medium);
    u.searchParams.set("utm_campaign", `exp-${String(number).padStart(3, "0")}`);
    return u.toString();
  } catch {
    return null;
  }
}

/** Checks a proof URL against the plan. Returns a reason when it doesn't fit, null when it does. */
export function proofUrlProblem(url: string, plan: MeasurementPlan, productUrl: string | null): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return "That isn't a valid URL.";
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return "The URL must start with https://.";
  const host = parsed.hostname.toLowerCase();
  const matches = (h: string) => host === h || host.endsWith(`.${h.replace(/^www\./, "")}`) || host === h.replace(/^www\./, "");
  if (plan.proof.hosts.length && !plan.proof.hosts.some(matches)) {
    return `This should be a ${plan.proof.label.replace(/ URL$/, "")} link on ${plan.proof.hosts[0]}.`;
  }
  if (plan.proof.onProductDomain && productUrl) {
    try {
      const product = new URL(productUrl).hostname.replace(/^www\./, "").toLowerCase();
      if (!(host === product || host.endsWith(`.${product}`))) return `The page should be on your product's domain (${product}).`;
    } catch {
      // No usable product URL: accept any host.
    }
  }
  return null;
}

export interface Readiness {
  /** Proven live (URL verified, campaign linked, or sent). */
  launched: boolean;
  /** Can be measured automatically with what's connected. */
  measurable: boolean;
  missing: { id: "proof" | "analytics"; label: string; action: string }[];
}

export function assessReadiness(plan: MeasurementPlan, state: { proofUrl: string | null; campaignLinked: boolean; sent: boolean; connected: Capability[] }): Readiness {
  const launched =
    plan.proof.kind === "none" ||
    (plan.proof.kind === "campaign_link" ? state.campaignLinked : plan.proof.kind === "send_record" ? state.sent : Boolean(state.proofUrl));
  const measurable = plan.requires.anyOf.some((c) => state.connected.includes(c));
  const missing: Readiness["missing"] = [];
  if (!launched) missing.push({ id: "proof", label: plan.proof.label, action: plan.proof.kind === "post_url" || plan.proof.kind === "page_url" || plan.proof.kind === "affiliate_link" ? "Paste and verify the URL" : plan.founderSteps[0] });
  if (!measurable) missing.push({ id: "analytics", label: "Measurement source", action: `Connect a tool that provides ${plan.requires.anyOf.join(" or ")}` });
  return { launched, measurable, missing };
}
