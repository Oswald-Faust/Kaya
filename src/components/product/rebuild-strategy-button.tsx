"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { startStrategyAction } from "@/app/(onboarding)/start/actions";
import { Button } from "@/components/ui/button";

/** Starts a new strategy run from current memory, goal and learnings, then shows its live progress. */
export function RebuildStrategyButton({ slug }: { slug: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <Button
        size="sm"
        variant="secondary"
        pending={pending}
        icon={<RefreshCw className="size-3.5" />}
        onClick={() =>
          start(async () => {
            const r = await startStrategyAction(slug);
            if (r.ok) router.push(`/start/${slug}/strategy`);
            else setError(r.error);
          })
        }
      >
        Rebuild from current memory
      </Button>
      {error && (
        <span role="alert" className="text-2xs text-negative">
          {error}
        </span>
      )}
    </span>
  );
}
