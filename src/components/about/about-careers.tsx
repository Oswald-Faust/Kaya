"use client";

import { Reveal, Stagger, StaggerItem } from "@/components/marketing/motion";
import { ArrowUpRight, MapPin, Sparkles } from "lucide-react";
import { useI18n } from "@/i18n/client";


const ROLES = [
  {
    tags: ["TypeScript", "Next.js", "PostgreSQL", "Drizzle"],
  },
  {
    tags: ["LLM Grounding", "Causal Inference", "Python/TypeScript", "Stats"],
  },
  {
    tags: ["Figma", "Design Systems", "Motion", "Tailwind"],
  },
];

export function AboutCareers() {
  const c = useI18n().t.about.careers;
  return (
    <section id="careers" className="py-20 sm:py-28 bg-surface border-t border-line">
      <div className="mx-auto max-w-[1360px] px-5 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal>
            <div className="inline-flex items-center gap-2 rounded-full border border-line bg-cream px-3 py-1 text-xs font-medium text-ink mb-3">
              <Sparkles className="size-3 text-agent" />
              <span>{c.badge}</span>
            </div>
            <h2 className="text-[clamp(32px,4vw,52px)] leading-[1.05] font-[560] tracking-[-0.04em] text-ink">
              {c.title}
            </h2>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="mt-4 text-lg text-muted">
              {c.lead}
            </p>
          </Reveal>
        </div>

        {/* Roles List */}
        <Stagger className="mt-14 space-y-4 max-w-4xl mx-auto">
          {ROLES.map((base, i) => ({ ...base, ...c.roles[i] })).map((role) => (
            <StaggerItem key={role.title}>
              <a
                href={`mailto:careers@kaya.so?subject=${encodeURIComponent(c.mailSubject + role.title)}`}
                className="group flex flex-col sm:flex-row sm:items-center justify-between gap-6 rounded-2xl border border-line bg-surface p-6 sm:p-7 transition-all hover:border-agent hover:bg-cream/40 hover:shadow-sm"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-[560] text-ink group-hover:text-agent transition-colors">
                      {role.title}
                    </h3>
                    <span className="rounded-md bg-stone px-2.5 py-0.5 font-mono text-[10px] text-ink font-medium">
                      {role.team}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted max-w-xl leading-relaxed">
                    {role.desc}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {role.tags.map((tag) => (
                      <span key={tag} className="text-[11px] font-mono text-subtle bg-cream px-2 py-0.5 rounded border border-line/60">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex sm:flex-col sm:items-end justify-between items-center shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-line/60">
                  <div className="flex items-center gap-1.5 text-xs text-muted">
                    <MapPin className="size-3 text-subtle" />
                    <span>{role.location}</span>
                  </div>
                  <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-agent group-hover:underline">
                    <span>{c.apply}</span>
                    <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </span>
                </div>
              </a>
            </StaggerItem>
          ))}
        </Stagger>

        {/* Open application note */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted">
            {c.openNote}{" "}
            <a
              href="mailto:founders@kaya.so"
              className="font-medium text-ink underline underline-offset-4 hover:text-agent"
            >
              {c.emailFounders}
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
