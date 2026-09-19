import type { Metadata } from "next";
import { LegalLayout } from "@/components/marketing/legal-layout";
import { getI18n } from "@/i18n/server";

import { getMarketingLinks } from "@/server/marketing";

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getI18n();
  const isEn = locale === "en";

  return {
    title: isEn
      ? "Legal Notice · Kaya — Marketing OS"
      : "Mentions Légales · Kaya — Marketing OS",
    description: isEn
      ? "Legal information, corporate publisher details, and cloud hosting infrastructure of the Kaya platform."
      : "Informations légales, société éditrice et hébergement de la plateforme Kaya.",
  };
}

export default async function LegalPage() {
  const links = await getMarketingLinks();
  return <LegalLayout docId="legal" appHref={links.appHref} demoHref={links.demoHref} />;
}
