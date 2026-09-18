import type { Metadata } from "next";
import { SiteNav } from "@/components/marketing/site-nav";
import { SiteFooter } from "@/components/marketing/site-footer";
import { ClosingCta } from "@/components/marketing/closing-cta";
import { AboutHero } from "@/components/about/about-hero";
import { AboutStory } from "@/components/about/about-story";
import { AboutValues } from "@/components/about/about-values";
import { AboutTeam } from "@/components/about/about-team";
import { AboutNumbers } from "@/components/about/about-numbers";
import { AboutCulture } from "@/components/about/about-culture";
import { AboutCareers } from "@/components/about/about-careers";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  const a = t.about;
  return { title: a.metaTitle, description: a.metaDescription, openGraph: { title: a.ogTitle, description: a.ogDescription } };
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-surface text-ink font-sans antialiased selection:bg-lime-soft selection:text-lime-deep">
      {/* Global Marketing Navigation with Mega-menu */}
      <SiteNav />

      {/* Main Content Sections */}
      <main id="main-content">
        <AboutHero />
        <AboutStory />
        <AboutValues />
        <AboutTeam />
        <AboutNumbers />
        <AboutCulture />
        <AboutCareers />
        <ClosingCta />
      </main>

      {/* Global Site Footer */}
      <SiteFooter />
    </div>
  );
}
