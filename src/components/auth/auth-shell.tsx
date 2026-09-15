import Link from "next/link";
import type { ReactNode } from "react";
import { Check, FlaskConical, Newspaper } from "lucide-react";
import { KayaWordmark } from "@/components/brand/logo";
import { BrandIcon, type BrandName } from "@/components/brand/brand-logos";
import { HeroScene } from "@/components/brand/clay";

const STACK: BrandName[] = ["stripe", "googleads", "meta", "posthog", "hubspot", "linkedin"];

/** Split-screen auth layout: form on the left, Kaya's clay world on the right. */
export function AuthShell({ children, variant }: { children: ReactNode; variant: "login" | "signup" }) {
  return (
    <div className="grid min-h-screen bg-surface lg:grid-cols-2">
      <div className="flex min-h-screen flex-col px-6 py-8 sm:px-12 lg:px-16 xl:px-24">
        <Link href="/" aria-label="Kaya home" className="w-fit">
          <KayaWordmark className="text-[22px]" markClassName="size-7" />
        </Link>
        <div className="my-auto w-full max-w-[440px] py-12">{children}</div>
        <p className="text-sm text-subtle">By continuing you agree to Kaya&apos;s terms and privacy policy.</p>
      </div>

      <aside className="relative hidden flex-col overflow-hidden lg:flex">
        <div className="relative flex-1 bg-[#b7dcf0]">
          <HeroScene className="absolute inset-0 h-full w-full" />
          <div className="clay-float absolute right-10 bottom-10 w-72 rounded-2xl bg-surface/95 p-4 shadow-pop backdrop-blur">
            {variant === "login" ? (
              <>
                <p className="flex items-center gap-2 font-mono text-[11px] tracking-wide text-subtle uppercase">
                  <Newspaper className="size-3.5" /> Monday brief
                </p>
                <p className="mt-2 text-[15px] leading-snug font-medium tracking-[-0.01em]">Organic signups +9% this week, led by your comparison page.</p>
                <p className="mt-2 text-sm text-agent">1 approval waiting</p>
              </>
            ) : (
              <>
                <p className="flex items-center gap-2 font-mono text-[11px] tracking-wide text-subtle uppercase">
                  <FlaskConical className="size-3.5" /> In your first 2 minutes
                </p>
                <ul className="mt-2 space-y-1.5 text-sm">
                  {["Your product, read and summarized", "Channels scored from 0 to 100", "Your first experiments, ready"].map((line) => (
                    <li key={line} className="flex items-center gap-2">
                      <Check className="size-3.5 text-grass-deep" /> {line}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
        <div className="bg-cream px-12 py-10 text-center">
          <p className="text-sm font-medium text-ink">Works with the stack you already run</p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-ink/70">
            {STACK.map((b) => (
              <BrandIcon key={b} brand={b} className="size-7" />
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
