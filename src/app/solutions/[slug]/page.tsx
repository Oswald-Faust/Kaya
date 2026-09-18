import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SolutionLayout } from "@/components/marketing/solution-layout";
import { SOLUTIONS, getSolutionBySlug } from "@/data/solutions-data";

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
  const solution = getSolutionBySlug(slug);

  if (!solution) {
    return {
      title: "Solution introuvable · Kaya",
    };
  }

  return {
    title: `${solution.title} · Solution Kaya`,
    description: solution.lead,
    openGraph: {
      title: `${solution.title} · Solution Kaya`,
      description: solution.lead,
    },
  };
}

export default async function SolutionDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const solution = getSolutionBySlug(slug);

  if (!solution) {
    notFound();
  }

  return <SolutionLayout slug={slug} />;
}
