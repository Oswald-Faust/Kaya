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

export const metadata: Metadata = {
  title: "About Kaya — The AI Agent That Does Marketing For Builders",
  description:
    "We're on a mission to give every product builder an autonomous, accountable marketing team. Clear before clever, proof over promises, playful, never silly.",
  openGraph: {
    title: "About Kaya — Built for Founders Who Build",
    description:
      "Kaya is the autonomous growth agent with hard budget guardrails, statistical experiment evaluation, and 0% ad spend commission.",
  },
};

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
