import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/landing-page";
import { HeroClayClassic } from "@/components/landing/hero-clay-classic";
import { getMarketingLinks } from "@/server/marketing";

export const metadata: Metadata = {
  title: { absolute: "Kaya — The AI agent that does your marketing" },
  description:
    "Paste your URL. Kaya reads your product, picks the channels worth your money, runs experiments and learns what grows revenue, with every dollar behind your approval.",
};

/** Landing page, version 2: the Clay-style hero with a 3D clay growth machine over a green field. */
export default async function HomeV2() {
  const links = await getMarketingLinks();
  return <LandingPage links={links} overlapStack hero={<HeroClayClassic demoHref={links.demoHref} />} />;
}
