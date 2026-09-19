"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { ArrowRight, X } from "lucide-react";
import { ClayHand } from "@/components/brand/clay-hand";
import { KaiMark } from "@/components/brand/kai-mark";
import { cn } from "@/lib/cn";

export interface KaiAskItem {
  title: string;
  hint: string;
  href: string;
}

/**
 * The right half of the Kai card: Kai's question picker floating on a warm
 * panel. The pick moves from question to question on its own, follows the
 * pointer on hover, and each question opens Kai in the demo, ready to send.
 */
export function KaiAskPanel({ title, close, items }: { title: string; close: string; items: KaiAskItem[] }) {
  const reduce = useReducedMotion();
  const root = useRef<HTMLDivElement>(null);
  const inView = useInView(root, { amount: 0.4 });
  const [active, setActive] = useState(Math.min(3, items.length - 1));
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    if (!inView || hovering || reduce) return;
    const timer = window.setInterval(() => setActive((i) => (i + 1) % items.length), 2600);
    return () => window.clearInterval(timer);
  }, [inView, hovering, reduce, items.length]);

  return (
    <div
      ref={root}
      className="relative flex min-h-[460px] items-center justify-center overflow-hidden rounded-[26px] bg-[#efeee9] px-5 py-12 sm:min-h-[540px] sm:px-10"
      onMouseLeave={() => setHovering(false)}
    >
      {/* Paper grain, as on Clay's panels. */}
      <svg aria-hidden className="pointer-events-none absolute inset-0 size-full opacity-[0.35] mix-blend-multiply">
        <filter id="kai-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix values="0 0 0 0 0.55  0 0 0 0 0.54  0 0 0 0 0.5  0 0 0 0.18 0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#kai-grain)" />
      </svg>

      <div className="relative w-full max-w-[460px]">
        <div className="flex items-center gap-3 rounded-2xl bg-surface px-5 py-4 shadow-[0_1px_2px_rgba(11,11,11,0.05)]">
          <KaiMark className="size-7" />
          <p className="flex-1 text-[17px] font-medium tracking-[-0.01em]">{title}</p>
          <X aria-label={close} className="size-5 text-ink/70" />
        </div>
        <ul className="mt-3 space-y-3 px-4 sm:px-7">
          {items.map((item, i) => {
            const on = i === active;
            return (
              <li key={item.title} className="relative">
                <a
                  href={item.href}
                  onMouseEnter={() => {
                    setHovering(true);
                    setActive(i);
                  }}
                  onFocus={() => setActive(i)}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-5 py-3.5 transition-colors duration-300",
                    on ? "bg-blue text-white shadow-[0_10px_24px_-12px_rgba(47,86,232,0.7)]" : "bg-surface text-ink",
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-medium">{item.title}</span>
                    <span className={cn("mt-0.5 block truncate text-sm", on ? "text-white/75" : "text-muted")}>{item.hint}</span>
                  </span>
                  <ArrowRight className={cn("size-5 shrink-0 transition-opacity", on ? "opacity-100" : "opacity-0")} />
                </a>
                {on && (
                  <motion.span
                    layoutId="kai-hand"
                    aria-hidden
                    className="pointer-events-none absolute -bottom-9 right-10 z-10 sm:right-14"
                    transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 26 }}
                  >
                    <ClayHand className="size-[68px]" />
                  </motion.span>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
