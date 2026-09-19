import { useId } from "react";
import { cn } from "@/lib/cn";

/**
 * The Kai mark: a speech bubble holding Kaya's three rising pills. Kai is how
 * Kaya speaks, so the pills become the "typing" dots of a conversation. With
 * `thinking`, the pills breathe one after another like an answer being written.
 */
export function KaiMark({ className, tile = true, thinking = false }: { className?: string; tile?: boolean; thinking?: boolean }) {
  const id = useId().replace(/:/g, "");
  const pill = (x: number, y: number, h: number, fill: string, delay: string) => (
    <rect
      x={x}
      y={y}
      width="3.8"
      height={h}
      rx="1.9"
      fill={fill}
      className={thinking ? "kai-pill" : undefined}
      style={thinking ? { animationDelay: delay, transformOrigin: `${x + 1.9}px ${y + h}px`, transformBox: "view-box" } : undefined}
    />
  );
  return (
    <svg viewBox="0 0 32 32" className={cn("size-6 shrink-0", className)} aria-hidden>
      <defs>
        <linearGradient id={`${id}-tile`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a2a3a" />
          <stop offset="0.5" stopColor="#111114" />
          <stop offset="1" stopColor="#060607" />
        </linearGradient>
        <linearGradient id={`${id}-bubble`} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.7" stopColor="#f1f3ff" />
          <stop offset="1" stopColor="#d9e0ff" />
        </linearGradient>
        <linearGradient id={`${id}-t`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#ffb58f" />
          <stop offset="1" stopColor="#e8611f" />
        </linearGradient>
        <linearGradient id={`${id}-l`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#e4ff8a" />
          <stop offset="1" stopColor="#9fc02e" />
        </linearGradient>
        <linearGradient id={`${id}-b`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#8fa9ff" />
          <stop offset="1" stopColor="#2f56e8" />
        </linearGradient>
      </defs>
      {tile && (
        <>
          <rect width="32" height="32" rx="9" fill={`url(#${id}-tile)`} />
          <rect x="0.3" y="0.3" width="31.4" height="31.4" rx="8.7" fill="none" stroke="#ffffff" strokeOpacity="0.1" strokeWidth="0.6" />
        </>
      )}
      {/* The bubble: a soft squircle with its tail tucked bottom-left. */}
      <g fill={tile ? `url(#${id}-bubble)` : "currentColor"}>
        <rect x="4.6" y="5.2" width="22.8" height="17.4" rx="7.6" />
        <path d="M8.2 20.2 7.4 26c-.1.8.7 1.2 1.3.8l6.4-4.6Z" />
      </g>
      {pill(9.1, 13.3, 4.6, `url(#${id}-t)`, "0ms")}
      {pill(14.1, 10.9, 7, `url(#${id}-l)`, "140ms")}
      {pill(19.1, 8.5, 9.4, `url(#${id}-b)`, "280ms")}
    </svg>
  );
}
