import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { KaiMark } from "@/components/brand/kai-mark";
import { KaiAskPanel } from "@/components/landing/kai-ask-panel";
import { Reveal } from "@/components/marketing/motion";
import { getI18n } from "@/i18n/server";

/**
 * Kai on the home page, built on Clay's Claygent section: a white card, the
 * promise on the left, and on the right a soft panel where Kai's questions
 * float, one of them picked by a clay hand.
 */
export async function KaiSection({ demoSlug }: { demoSlug: string | null }) {
  const { t } = await getI18n();
  const s = t.kai.home;
  const ask = (q: string) => {
    const path = `/kai?q=${encodeURIComponent(q)}`;
    return demoSlug ? `/w/${demoSlug}${path}` : `/demo?to=${encodeURIComponent(path)}`;
  };

  return (
    <section id="kai" aria-labelledby="kai-title" className="scroll-mt-24 px-3 pt-4 sm:px-5 sm:pt-5">
      <div className="mx-auto grid max-w-[1360px] items-center gap-4 rounded-[32px] border border-line bg-surface p-3 sm:p-4 lg:grid-cols-2">
        <Reveal className="px-4 py-10 sm:px-10 lg:py-16">
          <p className="inline-flex items-center gap-2 text-sm font-medium">
            <KaiMark className="size-6" />
            Kai
            <span className="rounded-full bg-lime px-2 py-0.5 font-mono text-[10px] tracking-[0.12em] uppercase">{t.kai.newBadge}</span>
          </p>
          <h2 id="kai-title" className="mt-5 text-[clamp(36px,4.2vw,56px)] leading-[1.02] font-medium tracking-[-0.045em]">
            {s.title}
          </h2>
          <p className="mt-4 max-w-md text-[17px] leading-relaxed text-ink/80">{s.body}</p>
          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
            <Link href="/kai" className="inline-flex h-11 items-center gap-2 rounded-xl bg-ink px-5 text-[15px] font-medium text-white transition-colors hover:bg-ink-hover">
              {s.cta} <ArrowRight className="size-4" />
            </Link>
            <a href={ask(s.items[0].question)} className="text-[15px] font-medium text-ink underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-ink">
              {t.kai.tryDemo}
            </a>
          </div>
        </Reveal>

        <KaiAskPanel title={s.panelTitle} close={s.close} items={s.items.map((item) => ({ ...item, href: ask(item.question) }))} />
      </div>
    </section>
  );
}
