import type { Metadata } from "next";
import { LegalLayout } from "@/components/marketing/legal-layout";
import { getI18n } from "@/i18n/server";

import { getMarketingLinks } from "@/server/marketing";

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getI18n();
  const isEn = locale === "en";

  return {
    title: isEn
      ? "Terms of Service & Sales · Kaya — Marketing OS"
      : "Conditions Générales d'Utilisation et de Vente · Kaya — Marketing OS",
    description: isEn
      ? "Contractual terms, autonomous agent governance rules, financial spend hard caps, and service commitments at Kaya."
      : "Conditions contractuelles, règles d'autonomie de l'agent, gouvernance financière et engagements de service chez Kaya.",
  };
}

export default async function TermsPage() {
  const links = await getMarketingLinks();
  return <LegalLayout docId="terms" appHref={links.appHref} demoHref={links.demoHref} />;
}
