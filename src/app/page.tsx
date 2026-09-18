import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/landing-page";
import { HeroClay3D, HeroProduct, HeroTypewriter } from "@/components/landing/hero-variants";
import { HeroClayClassic } from "@/components/landing/hero-clay-classic";
import { getMarketingLinks } from "@/server/marketing";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: { absolute: t.landing.metaTitle }, description: t.landing.metaDescription };
}

/** Landing page, version 1: the 3D Kaya mark hero. `?hero=b|c|clay` previews the alternates. */
export default async function Home({ searchParams }: PageProps<"/">) {
  const [{ hero }, links] = await Promise.all([searchParams, getMarketingLinks()]);

  if (hero === "clay") {
    return <LandingPage links={links} overlapStack hero={<HeroClayClassic demoHref={links.demoHref} />} />;
  }
  const Hero = hero === "b" ? HeroProduct : hero === "c" ? HeroTypewriter : HeroClay3D;
  return <LandingPage links={links} hero={<Hero demoHref={links.demoHref} />} />;
}
