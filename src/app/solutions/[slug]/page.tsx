import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SolutionLayout } from "@/components/marketing/solution-layout";
import { SOLUTIONS, getSolutionBySlug } from "@/data/solutions-data";

import { getI18n } from "@/i18n/server";
import { getMarketingLinks } from "@/server/marketing";

export async function generateStaticParams() {
  return SOLUTIONS.map((sol) => ({
    slug: sol.slug,
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

  const solution = getSolutionBySlug(slug);

  if (!solution) {
    return {
      title: isEn ? "Solution not found · Kaya" : "Solution introuvable · Kaya",
    };
  }

  const title = isEn ? `${solution.titleEn} · Kaya Solution` : `${solution.title} · Solution Kaya`;
  const description = isEn ? solution.leadEn : solution.lead;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
    },
  };
}

export default async function SolutionDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const [{ slug }, links] = await Promise.all([params, getMarketingLinks()]);
  const solution = getSolutionBySlug(slug);

  if (!solution) {
    notFound();
  }

  return <SolutionLayout slug={slug} appHref={links.appHref} demoHref={links.demoHref} />;
}
