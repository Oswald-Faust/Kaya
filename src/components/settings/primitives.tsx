import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Settings building blocks: a page title, titled sections, and label/control rows. */

export function SettingsHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {actions}
    </header>
  );
}

export function SettingsSection({ title, description, actions, children, className }: { title?: string; description?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("mt-8 first:mt-0", className)}>
      {(title || actions) && (
        <div className="mb-2.5 flex items-end justify-between gap-3">
          <div>
            {title && <h2 className="text-sm font-semibold text-ink">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      <div className="divide-y divide-line rounded-lg border border-line bg-surface">{children}</div>
    </section>
  );
}

export function SettingsRow({ label, description, children, className, stack }: { label: ReactNode; description?: ReactNode; children?: ReactNode; className?: string; stack?: boolean }) {
  return (
    <div className={cn("flex flex-col gap-3 px-4 py-3.5", !stack && "xl:flex-row xl:items-center xl:justify-between xl:gap-6", className)}>
      <div className="min-w-0">
        <div className="text-sm font-medium text-ink">{label}</div>
        {description && <div className="mt-0.5 text-xs text-muted">{description}</div>}
      </div>
      {children !== undefined && <div className={cn("min-w-0", !stack && "xl:shrink-0")}>{children}</div>}
    </div>
  );
}

/** An uploaded picture when there is one, otherwise initials. */
export function Avatar({ name, src, className }: { name: string; src?: string | null; className?: string }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" className={cn("shrink-0 object-cover", className)} />;
  }
  return <Monogram name={name} className={className} />;
}

const TONES = ["bg-lime text-ink", "bg-blue text-white", "bg-tangerine text-white", "bg-lilac text-white", "bg-sun text-ink", "bg-grass text-white", "bg-pink text-ink"];

/** Initials on a clay tile, colored deterministically from the name. */
export function Monogram({ name, className }: { name: string; className?: string }) {
  const initials =
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "?";
  const tone = TONES[[...name].reduce((sum, c) => sum + c.charCodeAt(0), 0) % TONES.length];
  return (
    <span aria-hidden className={cn("grid shrink-0 place-items-center rounded-md font-semibold select-none", tone, className)}>
      {initials}
    </span>
  );
}

export const inputClass =
  "h-9 w-full rounded-md border border-line-strong bg-surface px-2.5 text-sm text-ink outline-none placeholder:text-subtle focus:border-agent disabled:bg-raised disabled:text-subtle";

export function Meter({ value, max, className }: { value: number; max: number | null; className?: string }) {
  const pct = max === null ? 8 : max === 0 ? 100 : Math.min(100, (value / max) * 100);
  const full = max !== null && value >= max;
  return (
    <div className={cn("h-1.5 overflow-hidden rounded-full bg-sunken", className)}>
      <div className={cn("h-full rounded-full transition-[width]", full ? "bg-tangerine" : "bg-ink")} style={{ width: `${pct}%` }} />
    </div>
  );
}
