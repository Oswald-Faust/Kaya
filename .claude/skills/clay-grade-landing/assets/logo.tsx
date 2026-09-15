import { cn } from "@/lib/cn";

/**
 * The Kaya mark: three clay pills rising on an ink tile — a product that grows
 * one step at a time. Tangerine (understand), lime (experiment), blue (the agent).
 */
export function KayaMark({ className, tile = true }: { className?: string; tile?: boolean }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-6 shrink-0", className)} aria-hidden>
      <defs>
        <linearGradient id="kaya-mark-t" x1="0" x2="1">
          <stop offset="0" stopColor="#ffb58f" />
          <stop offset="0.55" stopColor="#ff7a3d" />
          <stop offset="1" stopColor="#d9591c" />
        </linearGradient>
        <linearGradient id="kaya-mark-l" x1="0" x2="1">
          <stop offset="0" stopColor="#efffb0" />
          <stop offset="0.55" stopColor="#d4f36b" />
          <stop offset="1" stopColor="#a9c93a" />
        </linearGradient>
        <linearGradient id="kaya-mark-b" x1="0" x2="1">
          <stop offset="0" stopColor="#9fb7ff" />
          <stop offset="0.55" stopColor="#4d78ff" />
          <stop offset="1" stopColor="#2f56e8" />
        </linearGradient>
      </defs>
      {tile && <rect width="32" height="32" rx="9" fill="#0b0b0b" />}
      <rect x="6" y="16.5" width="5.6" height="9.5" rx="2.8" fill="url(#kaya-mark-t)" />
      <rect x="13.2" y="11" width="5.6" height="15" rx="2.8" fill="url(#kaya-mark-l)" />
      <rect x="20.4" y="6" width="5.6" height="20" rx="2.8" fill="url(#kaya-mark-b)" />
    </svg>
  );
}

export function KayaWordmark({ className, markClassName }: { className?: string; markClassName?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-[19px] font-semibold tracking-[-0.05em] text-ink", className)}>
      <KayaMark className={markClassName} />
      kaya
    </span>
  );
}
