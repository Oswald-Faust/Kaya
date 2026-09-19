import { useId } from "react";
import { cn } from "@/lib/cn";

/**
 * A clay pointing hand, the cursor Clay uses to pick an option. Built from
 * capsules (fingers) over a rounded palm, with a darker copy underneath for
 * thickness and a highlight on the index finger.
 */
export function ClayHand({ className }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  const shapes = (
    <>
      <rect x="17" y="3" width="11" height="36" rx="5.5" />
      <rect x="27.5" y="19" width="10" height="21" rx="5" />
      <rect x="36.5" y="22.5" width="9.5" height="19" rx="4.75" />
      <rect x="45" y="27" width="8.5" height="15.5" rx="4.25" />
      <rect x="17" y="30" width="36.5" height="27" rx="12.5" />
      <rect x="5.5" y="31" width="10.5" height="21" rx="5.25" transform="rotate(-38 10.75 41.5)" />
    </>
  );
  return (
    <svg viewBox="0 0 64 64" className={cn("size-16", className)} aria-hidden>
      <defs>
        <linearGradient id={`${id}-skin`} x1="0.1" y1="0" x2="0.8" y2="1">
          <stop offset="0" stopColor="#bfd0ff" />
          <stop offset="0.45" stopColor="#6f93ff" />
          <stop offset="1" stopColor="#3558e0" />
        </linearGradient>
        <filter id={`${id}-soft`} x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#1b2f8a" floodOpacity="0.28" />
        </filter>
      </defs>
      <g transform="rotate(-24 32 34)" filter={`url(#${id}-soft)`}>
        {/* Thickness */}
        <g fill="#2442b8" transform="translate(1.4 2.2)">
          {shapes}
        </g>
        <g fill={`url(#${id}-skin)`}>{shapes}</g>
        <rect x="19.2" y="5.5" width="4.6" height="24" rx="2.3" fill="#ffffff" opacity="0.35" />
        <rect x="29.5" y="21" width="3.4" height="9" rx="1.7" fill="#ffffff" opacity="0.25" />
      </g>
    </svg>
  );
}
