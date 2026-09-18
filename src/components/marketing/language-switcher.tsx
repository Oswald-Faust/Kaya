"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Globe } from "lucide-react";
import { Spinner } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { setLocaleAction } from "@/app/actions/locale";
import { useI18n } from "@/i18n/client";
import { LOCALE_NAMES, LOCALES } from "@/i18n/config";

/** Compact language menu for public pages. Signed-in users also find it in Settings → Language. */
export function LanguageSwitcher({ className, align = "right" }: { className?: string; align?: "left" | "right" }) {
  const router = useRouter();
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const ref = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  // The menu is portaled with fixed coordinates: parents like the site nav clip their overflow.
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!ref.current?.contains(target) && !menuRef.current?.contains(target)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onMove = () => setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onMove);
    window.addEventListener("scroll", onMove, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onMove);
      window.removeEventListener("scroll", onMove, true);
    };
  }, [open]);

  const toggle = () => {
    const rect = ref.current?.getBoundingClientRect();
    if (rect) {
      // Keep the menu inside the viewport; open upward when there is no room below (footer).
      const width = 160;
      const height = 12 + LOCALES.length * 32;
      const left = Math.min(Math.max(8, align === "right" ? rect.right - width : rect.left), window.innerWidth - width - 8);
      const top = rect.bottom + 6 + height > window.innerHeight ? rect.top - 6 - height : rect.bottom + 6;
      setPos({ top, left });
    }
    setOpen((o) => !o);
  };

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t.common.language.switchTo}
        onClick={toggle}
        className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-sm text-muted transition-colors hover:bg-sunken hover:text-ink"
      >
        {pending ? <Spinner className="size-3.5" /> : <Globe className="size-3.5" />}
        <span className="font-medium uppercase">{locale}</span>
        <ChevronDown className="size-3" />
      </button>
      {open &&
        pos &&
        createPortal(
        <div
          ref={menuRef}
          role="menu"
          style={{ top: pos.top, left: pos.left }}
          className="fixed z-[100] w-40 rounded-lg bg-surface p-1 shadow-pop"
        >
          {LOCALES.map((l) => (
            <button
              key={l}
              type="button"
              role="menuitemradio"
              aria-checked={l === locale}
              lang={l}
              onClick={() => {
                setOpen(false);
                if (l === locale) return;
                start(async () => {
                  await setLocaleAction(l);
                  router.refresh();
                });
              }}
              className="flex h-8 w-full items-center justify-between rounded-md px-2 text-sm text-ink hover:bg-sunken"
            >
              {LOCALE_NAMES[l].native}
              {l === locale && <Check className="size-3.5 text-muted" />}
            </button>
          ))}
        </div>,
          document.body,
        )}
    </div>
  );
}
