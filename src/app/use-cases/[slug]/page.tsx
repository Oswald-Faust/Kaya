import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { UseCaseLayout } from "@/components/marketing/use-case-layout";
import { USE_CASES, getUseCaseBySlug } from "@/data/use-cases-data";

import { getI18n } from "@/i18n/server";
import { getMarketingLinks } from "@/server/marketing";

export async function generateStaticParams() {
  return USE_CASES.map((uc) => ({
    slug: uc.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { locale } = await getI18n();
  const isEn = locale === "en";

  const useCase = getUseCaseBySlug(slug);

  if (!useCase) {
    return {
      title: isEn ? "Use case not found · Kaya" : "Cas d'usage introuvable · Kaya",
    };
  }

  const title = isEn ? `${useCase.titleEn} · Kaya Use Case` : `${useCase.title} · Cas d'usage Kaya`;
  const description = isEn ? useCase.leadEn : useCase.lead;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
    },
  };
}

export default async function UseCaseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const [{ slug }, links] = await Promise.all([params, getMarketingLinks()]);
  const useCase = getUseCaseBySlug(slug);

  if (!useCase) {
    notFound();
  }

  return <UseCaseLayout slug={slug} appHref={links.appHref} demoHref={links.demoHref} />;
}
