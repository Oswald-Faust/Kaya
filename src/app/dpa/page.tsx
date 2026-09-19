import type { Metadata } from "next";
import { LegalLayout } from "@/components/marketing/legal-layout";
import { getI18n } from "@/i18n/server";

import { getMarketingLinks } from "@/server/marketing";

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getI18n();
  const isEn = locale === "en";

  return {
    title: isEn
      ? "Data Processing Agreement (DPA) · Kaya — Marketing OS"
      : "Accord de Traitement des Données (DPA) · Kaya — Marketing OS",
    description: isEn
      ? "Data Processing Agreement compliant with Article 28 of the GDPR, authorized sub-processors, and security commitments at Kaya."
      : "Data Processing Agreement conforme à l'Article 28 du RGPD, sous-traitants agréés et engagements de sécurité chez Kaya.",
  };
}

export default async function DpaPage() {
  const links = await getMarketingLinks();
  return <LegalLayout docId="dpa" appHref={links.appHref} demoHref={links.demoHref} />;
}
