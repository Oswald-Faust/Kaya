/**
 * Copy the agent writes for an experiment before it can be executed: a landing
 * page, an email, an ad or a social post. Deterministic and composed from what
 * the workspace already confirmed, so nothing here invents a claim, and written
 * in the founder's language.
 */
import { DEFAULT_LOCALE, type Locale } from "@/i18n/config";
import { dictionaries } from "@/i18n/dictionaries";
import { fmt } from "@/i18n/format";

export type AssetKind = "landing_page" | "email" | "ad_copy" | "social_post";

export interface DraftInput {
  experiment: { name: string; hypothesis: string; type: string; channel: string; audience: string };
  product: { name: string; oneLiner: string; url: string | null };
  /** Confirmed differentiators, most important first. */
  features: string[];
  icp: string | null;
  competitor: string | null;
  locale?: Locale;
}

export interface DraftedAsset {
  kind: AssetKind;
  title: string;
  body: string;
}

export function assetKindFor(type: string, channel: string): AssetKind | null {
  if (type === "seo_page" || type === "landing_page" || type === "pricing") return "landing_page";
  if (type === "email" || type === "activation") return "email";
  if (type === "paid_ad") return "ad_copy";
  if (type === "messaging" || type === "community" || channel === "x_organic" || channel === "linkedin") return "social_post";
  return null;
}

const list = (items: string[], bullet: string) => items.map((i) => `${bullet} ${i}`).join("\n");

/** The copy is a first draft for a human to approve, never a published claim. */
export function draftAsset(input: DraftInput): DraftedAsset | null {
  const locale = input.locale ?? DEFAULT_LOCALE;
  const c = dictionaries[locale].content;
  const kind = assetKindFor(input.experiment.type, input.experiment.channel);
  if (!kind) return null;

  const { product, experiment } = input;
  const features = input.features.slice(0, 3);
  const audience = input.icp ?? experiment.audience;
  const proof = features.length ? list(features, "—") : c.noProofYet;
  const link = product.url ?? "";

  if (kind === "landing_page") {
    const title = input.competitor ? fmt(c.page.titleVs, { product: product.name, competitor: input.competitor }) : fmt(c.page.titleFor, { product: product.name, audience });
    const body = [
      `# ${title}`,
      "",
      product.oneLiner,
      "",
      `## ${c.page.whyHeading}`,
      proof,
      "",
      `## ${c.page.forHeading}`,
      fmt(c.page.forBody, { audience }),
      "",
      `## ${c.page.ctaHeading}`,
      fmt(c.page.ctaBody, { product: product.name, link }),
      "",
      `<!-- ${fmt(c.draftNote, { experiment: experiment.name })} -->`,
    ].join("\n");
    return { kind, title, body };
  }

  if (kind === "email") {
    const title = fmt(c.email.subject, { product: product.name });
    const body = [
      fmt(c.email.greeting, { audience }),
      "",
      fmt(c.email.intro, { product: product.name, oneLiner: product.oneLiner }),
      "",
      proof,
      "",
      fmt(c.email.cta, { link }),
      "",
      c.email.signature,
      "",
      `<!-- ${fmt(c.draftNote, { experiment: experiment.name })} -->`,
    ].join("\n");
    return { kind, title, body };
  }

  if (kind === "ad_copy") {
    const title = fmt(c.ad.headline, { product: product.name });
    const body = [
      `${c.ad.headlineLabel}: ${title}`,
      `${c.ad.descriptionLabel}: ${product.oneLiner}`,
      `${c.ad.audienceLabel}: ${audience}`,
      `${c.ad.ctaLabel}: ${c.ad.cta}`,
      "",
      features.length ? `${c.ad.anglesLabel}:\n${list(features, "—")}` : c.noProofYet,
      "",
      `<!-- ${fmt(c.draftNote, { experiment: experiment.name })} -->`,
    ].join("\n");
    return { kind, title, body };
  }

  const title = fmt(c.post.title, { product: product.name });
  const body = [
    fmt(c.post.hook, { hypothesis: experiment.hypothesis.replace(/\.$/, "") }),
    "",
    product.oneLiner,
    "",
    features.length ? list(features, "•") : c.noProofYet,
    "",
    link,
    "",
    `<!-- ${fmt(c.draftNote, { experiment: experiment.name })} -->`,
  ].join("\n");
  return { kind, title, body };
}
