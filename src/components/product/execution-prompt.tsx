"use client";

import { useRef, useState } from "react";
import { Check, Copy, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ExecutionPrompt({
  prompt,
  title,
  description,
  copyLabel,
  copiedLabel,
  toolsLabel,
}: {
  prompt: string;
  title: string;
  description: string;
  copyLabel: string;
  copiedLabel: string;
  toolsLabel: string;
}) {
  const [copied, setCopied] = useState(false);
  const textarea = useRef<HTMLTextAreaElement>(null);

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(prompt);
    } catch {
      textarea.current?.select();
      document.execCommand("copy");
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <section className="rounded-lg border border-line bg-surface">
      <header className="px-4 pt-3.5 pb-3">
        <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
          <Terminal className="size-4 text-agent" />
          {title}
        </h2>
        <p className="mt-1 text-sm text-muted">{description}</p>
      </header>
      <div className="border-t border-line p-3">
        <div className="relative">
          <textarea
            ref={textarea}
            readOnly
            value={prompt}
            aria-label={title}
            onFocus={(event) => event.currentTarget.select()}
            className="block min-h-56 w-full resize-y rounded-md border border-line bg-raised p-3 pr-2 font-mono text-[11px] leading-5 text-ink outline-none focus:border-agent focus:ring-2 focus:ring-agent-soft"
          />
          <Button
            type="button"
            size="sm"
            variant="secondary"
            icon={copied ? <Check className="size-3.5 text-positive" /> : <Copy className="size-3.5" />}
            onClick={copyPrompt}
            className="absolute right-2 top-2 bg-surface/95"
            aria-label={copied ? copiedLabel : copyLabel}
          >
            {copied ? copiedLabel : copyLabel}
          </Button>
        </div>
        <p className="mt-2 text-2xs text-subtle">{toolsLabel}</p>
      </div>
    </section>
  );
}
