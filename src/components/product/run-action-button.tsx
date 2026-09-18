"use client";

import { useTransition } from "react";
import { Play } from "lucide-react";
import { runExperimentAction } from "@/app/(app)/w/[workspace]/actions";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/client";

/**
 * Hands one experiment to the agent: it drafts what the experiment needs and
 * runs it, stopping at approval whenever the workspace's guardrails say so.
 */
export function RunActionButton({ slug, experimentId, variant = "primary", label }: { slug: string; experimentId: string; label?: string; variant?: "primary" | "secondary" }) {
  const { t } = useI18n();
  const [pending, start] = useTransition();

  return (
    <Button
      size="sm"
      variant={variant}
      pending={pending}
      icon={<Play className="size-3.5" />}
      onClick={() => start(async () => void (await runExperimentAction(slug, experimentId)))}
    >
      {label ?? t.app.command.run}
    </Button>
  );
}
