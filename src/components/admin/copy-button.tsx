"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/cn";

export function CopyButton({
  text,
  className,
  label = "Copier",
}: {
  text: string;
  className?: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copied ? "Copié !" : label}
      aria-label={copied ? "Copié !" : label}
      className={cn(
        "inline-flex size-6 items-center justify-center rounded-md text-muted transition-colors hover:bg-sunken hover:text-ink",
        className,
      )}
    >
      {copied ? <Check className="size-3 text-positive" /> : <Copy className="size-3" />}
    </button>
  );
}
