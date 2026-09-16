"use client";

import { useState } from "react";
import { ChevronDown, History } from "lucide-react";
import { AuditLine, Card } from "@/components/admin/ui";

export function CollapsibleAuditLog({
  activity,
  defaultOpen = false,
}: {
  activity: Array<{
    id: string;
    action: string;
    actorType: string;
    targetType?: string | null;
    createdAt: Date | string;
  }>;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-3 p-4 sm:px-5 hover:bg-raised/50 transition-colors text-left"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2.5">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-sunken text-ink">
            <History className="size-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-ink">Journal d&apos;audit du workspace</h2>
              <span className="rounded-full bg-sunken px-2 py-0.5 font-mono text-2xs text-muted">
                {activity.length}
              </span>
            </div>
            <p className="text-xs text-muted">Événements et actions enregistrées pour cet espace</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-medium text-muted hover:text-ink">
          <span>{open ? "Masquer" : "Afficher"}</span>
          <ChevronDown
            className={`size-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {open && (
        <div className="border-t border-line">
          {activity.length > 0 ? (
            <ul className="divide-y divide-line max-h-80 overflow-y-auto">
              {activity.map((a) => (
                <AuditLine
                  key={a.id}
                  action={a.action}
                  actor={a.actorType}
                  where={a.targetType ?? undefined}
                  at={new Date(a.createdAt)}
                />
              ))}
            </ul>
          ) : (
            <p className="px-5 py-8 text-center text-xs text-muted">
              Aucune activité enregistrée pour cet espace.
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
