"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, FileText, Printer, Shield, ShieldCheck } from "lucide-react";
import { SiteNav } from "./site-nav";
import { SiteFooter } from "./site-footer";
import { Reveal } from "./motion";
import { getLegalDoc, type LegalDocument } from "@/data/legal-data";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/cn";

const DOC_TABS = [
  { id: "legal", href: "/legal", label: "Mentions Légales", labelEn: "Legal Notice" },
  { id: "privacy", href: "/privacy", label: "Confidentialité", labelEn: "Privacy Policy" },
  { id: "terms", href: "/terms", label: "Conditions Générales", labelEn: "Terms of Service" },
  { id: "dpa", href: "/dpa", label: "Accord DPA", labelEn: "DPA Agreement" },
];

interface LegalLayoutProps {
  docId: "legal" | "privacy" | "terms" | "dpa";
  appHref?: string | null;
  demoHref?: string;
}

export function LegalLayout({ docId, appHref, demoHref }: LegalLayoutProps) {
  const { locale } = useI18n();
  const isEn = locale === "en";

  const doc: LegalDocument = getLegalDoc(docId, locale) || getLegalDoc("legal", locale)!;
  const [activeSection, setActiveSection] = useState<string>(doc.sections[0]?.id || "");

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200;
      for (const section of doc.sections) {
        const el = document.getElementById(section.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [doc.sections]);

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="min-h-screen bg-surface text-ink font-sans antialiased selection:bg-lime-soft selection:text-lime-deep">
      <SiteNav appHref={appHref} demoHref={demoHref} />

      <main className="mx-auto max-w-[1360px] px-5 pt-12 sm:pt-18 pb-24">
        {/* Document Switcher Tabs */}
        <div className="mb-10 overflow-x-auto pb-2 [scrollbar-width:none]">
          <nav
            aria-label={isEn ? "Legal documents" : "Documents juridiques"}
            className="flex items-center gap-2 min-w-max border-b border-line pb-4"
          >
            {DOC_TABS.map((tab) => {
              const isActive = tab.id === doc.id;
              return (
                <Link
                  key={tab.id}
                  href={tab.href}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all",
                    isActive
                      ? "bg-ink text-white shadow-sm"
                      : "bg-cream text-ink/75 hover:bg-stone hover:text-ink"
                  )}
                >
                  <FileText className="size-3.5" />
                  <span>{isEn ? tab.labelEn : tab.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Hero Header */}
        <header className="max-w-3xl pb-12 border-b border-line">
          <Reveal>
            <div className="inline-flex items-center gap-2 rounded-full border border-line bg-cream px-3 py-1 text-xs font-mono tracking-wide text-ink">
              <ShieldCheck className="size-3 text-grass-deep" />
              <span>{doc.kicker}</span>
              <span className="text-subtle">·</span>
              <span className="text-muted">
                {isEn ? "Last updated" : "Mise à jour"} : {doc.lastUpdated}
              </span>
            </div>

            <h1 className="mt-4 text-[clamp(38px,5vw,68px)] leading-[0.96] font-[560] tracking-[-0.045em] text-ink">
              {doc.title}
            </h1>

            <p className="mt-5 text-base sm:text-lg leading-relaxed text-muted">
              {doc.summary}
            </p>
          </Reveal>
        </header>

        {/* Two-column layout: Sticky TOC + Content */}
        <div className="mt-12 grid gap-12 lg:grid-cols-[280px_1fr] items-start">
          {/* Sticky Left Sidebar: Table of Contents */}
          <aside className="hidden lg:block sticky top-28 space-y-6">
            <div className="rounded-2xl border border-line bg-cream/40 p-5 shadow-2xs">
              <p className="font-mono text-[11px] uppercase tracking-wider text-muted font-medium mb-3">
                {isEn ? "Document Outline" : "Sommaire du document"}
              </p>
              <nav
                aria-label={isEn ? "Table of contents" : "Table des matières"}
                className="space-y-1 text-xs"
              >
                {doc.sections.map((section) => {
                  const isActive = activeSection === section.id;
                  return (
                    <a
                      key={section.id}
                      href={`#${section.id}`}
                      className={cn(
                        "block rounded-lg px-2.5 py-1.5 transition-colors leading-snug",
                        isActive
                          ? "bg-surface font-semibold text-ink shadow-2xs border border-line/60"
                          : "text-muted hover:text-ink hover:bg-stone/50"
                      )}
                    >
                      {section.title}
                    </a>
                  );
                })}
              </nav>

              <div className="mt-6 pt-4 border-t border-line/50 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-ink hover:text-ink-hover transition-colors"
                >
                  <Printer className="size-3.5 text-subtle" />
                  <span>{isEn ? "Print this document" : "Imprimer ce document"}</span>
                </button>
                <a
                  href="mailto:legal@kaya.ai"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-ink hover:text-ink-hover transition-colors"
                >
                  <ArrowUpRight className="size-3.5 text-subtle" />
                  <span>{isEn ? "Contact legal team" : "Contacter le pôle juridique"}</span>
                </a>
              </div>
            </div>

            {/* Security Guarantee Badge */}
            <div className="rounded-2xl border border-line bg-lime-soft/40 p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-lime-deep">
                <Shield className="size-4" />
                <span>{isEn ? "Zero-Training Guarantee" : "Garantie de non-entraînement"}</span>
              </div>
              <p className="mt-1.5 text-[11px] text-ink/75 leading-relaxed">
                {isEn
                  ? "Your software telemetry and financial records are never retained or used to train AI models."
                  : "Vos données produit et financières ne sont jamais conservées ni utilisées pour l'entraînement de modèles d'IA."}
              </p>
            </div>
          </aside>

          {/* Right Column: Main Document Text */}
          <article className="max-w-[760px] space-y-12">
            {doc.sections.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-32">
                <h2 className="text-xl sm:text-2xl font-medium tracking-tight text-ink border-b border-line pb-2">
                  {section.title}
                </h2>

                {/* Optional Key Takeaway Card */}
                {section.keyTakeaway && (
                  <div className="mt-4 rounded-xl border border-line bg-cream/70 p-4 text-sm text-ink leading-relaxed">
                    <span className="font-mono text-[11px] uppercase tracking-wider text-muted block mb-1 font-semibold">
                      {isEn ? "Key takeaway :" : "En clair / Key Takeaway :"}
                    </span>
                    {section.keyTakeaway}
                  </div>
                )}

                {/* Section Paragraphs */}
                <div className="mt-4 space-y-3 text-sm sm:text-base leading-relaxed text-ink/80">
                  {section.paragraphs.map((p, pIdx) => (
                    <p key={pIdx}>{p}</p>
                  ))}
                </div>

                {/* Subsections & Tables */}
                {section.subsections && (
                  <div className="mt-6 space-y-6">
                    {section.subsections.map((sub, sIdx) => (
                      <div key={sIdx} className="space-y-2">
                        <h3 className="text-base font-semibold text-ink">{sub.title}</h3>
                        <div className="space-y-2 text-sm leading-relaxed text-ink/80">
                          {sub.paragraphs.map((subP, subPIdx) => (
                            <p key={subPIdx}>{subP}</p>
                          ))}
                        </div>

                        {/* Data Table */}
                        {sub.table && (
                          <div className="mt-4 overflow-x-auto rounded-xl border border-line shadow-2xs">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="bg-cream border-b border-line">
                                  {sub.table.headers.map((h, hIdx) => (
                                    <th key={hIdx} className="p-3 font-mono font-medium text-ink">
                                      {h}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {sub.table.rows.map((row, rIdx) => (
                                  <tr
                                    key={rIdx}
                                    className="border-b border-line/60 last:border-0 hover:bg-cream/40 transition-colors"
                                  >
                                    {row.map((cell, cIdx) => (
                                      <td key={cIdx} className="p-3 text-ink/80 font-mono text-[11px]">
                                        {cell}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            ))}
          </article>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
