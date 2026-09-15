"use client";

import { animate, motion, useInView, type Variants } from "motion/react";
import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Kaya motion: soft ease-out, small distances, once per view. */
export const EASE = [0.2, 0.7, 0.2, 1] as const;

export function Reveal({ children, className, delay = 0, y = 28 }: { children: ReactNode; className?: string; delay?: number; y?: number }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.8, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

const container: Variants = {
  hidden: {},
  show: (stagger: number) => ({ transition: { staggerChildren: stagger } }),
};

const item: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

export function Stagger({ children, className, stagger = 0.08 }: { children: ReactNode; className?: string; stagger?: number }) {
  return (
    <motion.div className={className} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }} variants={container} custom={stagger}>
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={className} variants={item}>
      {children}
    </motion.div>
  );
}

/** Marks its subtree with data-inview once visible, so CSS illustration motion (.m-anim) starts. */
export function InView({ children, className, amount = 0.3 }: { children: ReactNode; className?: string; amount?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount });
  return (
    <div ref={ref} data-inview={inView ? "true" : "false"} className={className}>
      {children}
    </div>
  );
}

export function CountUp({ to, decimals = 0, prefix = "", suffix = "", className }: { to: number; decimals?: number; prefix?: string; suffix?: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const format = (v: number) => `${prefix}${v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`;

  useEffect(() => {
    const node = ref.current;
    if (!inView || !node) return;
    const controls = animate(0, to, {
      duration: 1.4,
      ease: EASE,
      onUpdate: (v) => {
        node.textContent = format(v);
      },
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, to]);

  return (
    <span ref={ref} className={cn("tabular", className)}>
      {format(to)}
    </span>
  );
}

export function WordRise({ text, className }: { text: string; className?: string }) {
  return (
    <motion.span className={cn("inline-flex overflow-hidden", className)} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.4 }} variants={container} custom={0.06} aria-label={text}>
      {text.split("").map((char, i) => (
        <motion.span
          key={i}
          aria-hidden
          className="inline-block"
          variants={{ hidden: { y: "105%" }, show: { y: "0%", transition: { duration: 0.8, ease: EASE } } }}
        >
          {char}
        </motion.span>
      ))}
    </motion.span>
  );
}
