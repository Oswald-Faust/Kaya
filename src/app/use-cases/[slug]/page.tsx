import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { UseCaseLayout } from "@/components/marketing/use-case-layout";
import { USE_CASES, getUseCaseBySlug } from "@/data/use-cases-data";

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
  const useCase = getUseCaseBySlug(slug);

  if (!useCase) {
    return {
      title: "Cas d'usage introuvable · Kaya",
    };
  }

  return {
    title: `${useCase.title} · Cas d'usage Kaya`,
    description: useCase.lead,
    openGraph: {
      title: `${useCase.title} · Cas d'usage Kaya`,
      description: useCase.lead,
    },
  };
}

export default async function UseCaseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const useCase = getUseCaseBySlug(slug);

  if (!useCase) {
    notFound();
  }

  return <UseCaseLayout slug={slug} />;
}
