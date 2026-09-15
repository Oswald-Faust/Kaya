import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/landing-page";
import { HeroClay3D, HeroProduct, HeroTypewriter } from "@/components/landing/hero-variants";
import { HeroClayClassic } from "@/components/landing/hero-clay-classic";
import { getMarketingLinks } from "@/server/marketing";

export const metadata: Metadata = {
  title: { absolute: "Kaya — The AI agent that does your marketing" },
  description:
    "Paste your URL. Kaya reads your product, picks the channels worth your money, runs experiments and learns what grows revenue, with every dollar behind your approval.",
};

/** Landing page, version 1: the 3D Kaya mark hero. `?hero=b|c|clay` previews the alternates. */
export default async function Home({ searchParams }: PageProps<"/">) {
  const [{ hero }, links] = await Promise.all([searchParams, getMarketingLinks()]);

  if (hero === "clay") {
    return <LandingPage links={links} overlapStack hero={<HeroClayClassic demoHref={links.demoHref} />} />;
  }
  const Hero = hero === "b" ? HeroProduct : hero === "c" ? HeroTypewriter : HeroClay3D;
  return <LandingPage links={links} hero={<Hero demoHref={links.demoHref} />} />;
}
