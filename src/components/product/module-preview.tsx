import Link from "next/link";
import { ChannelBadge, StatusBadge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { getI18n } from "@/i18n/server";
import { experimentKey } from "@/lib/format";
import type { ExperimentStatus, ExperimentOutcome } from "@/server/domain/types";

/**
 * Honest surface for a channel module that isn't fully built: states what it
 * will do, what it depends on, and shows the real experiments that already
 * cover this channel so the page is still useful.
 */
export async function ModulePreview({
  slug,
  title,
  description,
  status,
  capabilities,
  dependsOn,
  experiments,
}: {
  slug: string;
  title: string;
  description: string;
  status: string;
  capabilities: string[];
  dependsOn: string[];
  experiments: { id: string; number: number; name: string; channel: string; status: ExperimentStatus; outcome: ExperimentOutcome | null }[];
}) {
  const mt = (await getI18n()).t.app.module;
  return (
    <div className="mx-auto max-w-[1100px] space-y-5 px-3 py-5 sm:px-5 lg:py-6">
      <PageHeader tour="module-header" title={title} description={description} />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Panel tour="module-experiments">
          <PanelHeader title={mt.onChannel} count={experiments.length} description={mt.onChannelHint} />
          {experiments.length === 0 ? (
            <p className="border-t border-line px-4 py-4 text-sm text-muted">{mt.noneOnChannel}</p>
          ) : (
            <ul className="divide-y divide-line border-t border-line">
              {experiments.map((e) => (
                <li key={e.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="w-14 text-2xs text-muted tabular">{experimentKey(e.number)}</span>
                  <Link href={`/w/${slug}/experiments/${e.number}`} className="min-w-0 flex-1 truncate text-sm text-ink hover:underline">
                    {e.name}
                  </Link>
                  <ChannelBadge channel={e.channel} className="hidden sm:inline-flex" />
                  <StatusBadge status={e.status} outcome={e.outcome} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel tour="module-roadmap" className="p-4">
          <p className="text-2xs font-medium text-subtle">{mt.status}</p>
          <p className="mt-1 text-sm font-medium text-ink">{status}</p>
          <p className="mt-3 text-2xs font-medium text-subtle">{mt.planned}</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-4 text-sm text-ink/85">
            {capabilities.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          <p className="mt-3 text-2xs font-medium text-subtle">{mt.dependsOn}</p>
          <ul className="mt-1 space-y-0.5 text-sm text-muted">
            {dependsOn.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
