import type { Metadata } from "next";
import { LegalLayout } from "@/components/marketing/legal-layout";

import { getMarketingLinks } from "@/server/marketing";

export const metadata: Metadata = {
  title: "Legal Notice · Kaya — Marketing OS",
  description: "Legal notice, company publisher and hosting information for Kaya.",
};

export default async function LegalNoticePage() {
  const links = await getMarketingLinks();
  return <LegalLayout docId="legal" appHref={links.appHref} demoHref={links.demoHref} />;
}
