import type { Metadata } from "next";
import { LegalLayout } from "@/components/marketing/legal-layout";
import { getI18n } from "@/i18n/server";

import { getMarketingLinks } from "@/server/marketing";

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getI18n();
  const isEn = locale === "en";

  return {
    title: isEn
      ? "Privacy Policy · Kaya — Marketing OS"
      : "Politique de Confidentialité · Kaya — Marketing OS",
    description: isEn
      ? "Protection of personal data, GDPR compliance, and our strict zero AI training guarantee at Kaya."
      : "Protection de vos données personnelles, conformité RGPD, et engagement de non-entraînement des modèles d'IA chez Kaya.",
  };
}

export default async function PrivacyPage() {
  const links = await getMarketingLinks();
  return <LegalLayout docId="privacy" appHref={links.appHref} demoHref={links.demoHref} />;
}
