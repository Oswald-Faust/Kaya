import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { Badge, ChannelBadge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/panel";
import { cn } from "@/lib/cn";
import { experimentKey, formatUsd } from "@/lib/format";
import { CHANNELS, isChannel } from "@/server/domain/channels";
import type { ChannelFactors, StrategyContent } from "@/server/domain/types";
import { metricLabel, thresholdLabel } from "./experiment-format";
import { getI18n } from "@/i18n/server";
import { fmt } from "@/i18n/format";
import type { Dictionary } from "@/i18n/dictionaries";

export interface ChannelAssessmentView {
  channel: string;
  score: number;
  verdict: string;
  rationale: string;
  factors: ChannelFactors;
  evidence: string[];
}

export interface StrategyExperimentView {
  id: string;
  number: number;
  name: string;
  channel: string;
  primaryMetric: string;
  successThreshold: number;
  budget: number;
  informationGain: number;
  timeToSignalDays: number;
  status: string;
  suppressedReason: string | null;
}

const FACTORS: (keyof ChannelFactors & keyof Dictionary["app"]["strategy"]["factors"])[] = ["audiencePresence", "purchaseIntent", "cacFit", "budgetFit", "creativeEase", "organicPotential", "currentTraction"];


/** The strategy as a structured, living object. Used in onboarding (animated reveal) and on the Strategy page. */
export async function StrategySections({
  slug,
  content,
  channels,
  experiments,
  animate = false,
}: {
  slug: string;
  content: StrategyContent;
  channels: ChannelAssessmentView[];
  experiments: StrategyExperimentView[];
  animate?: boolean;
}) {
  const { t, locale } = await getI18n();
  const st = t.app.strategy;
  const usd = (v: number) => formatUsd(v, {}, locale);
  let order = 0;
  const reveal = (): { className?: string; style?: CSSProperties } =>
    animate ? { className: "animate-rise", style: { animationDelay: `${order++ * 110}ms` } } : {};

  const focus = channels.filter((c) => c.verdict !== "avoid");
  const avoid = channels.filter((c) => c.verdict === "avoid").sort((a, b) => a.score - b.score);
  const totalBudget = content.budget.allocation.reduce((s, a) => s + a.amount, 0);
  const queued = experiments.filter((e) => e.status !== "completed" && e.status !== "archived");

  return (
    <div className="space-y-4">
      <Section {...reveal()} className={cn("p-5", reveal().className)}>
        <Label>{st.objective}</Label>
        <p className="mt-1 text-xl font-semibold tracking-tight text-ink">{content.objective}</p>
        <p className="mt-2 max-w-3xl text-base text-ink/80">{content.situation}</p>
        {content.baseline.length > 0 && (
          <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-3 border-t border-line pt-3">
            {content.baseline.map((b) => (
              <div key={b.label}>
                <dt className="text-2xs text-muted">{b.label}</dt>
                <dd className="text-sm font-semibold text-ink tabular">{b.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </Section>

      <div className="grid gap-4 lg:grid-cols-2" {...(animate ? { style: { animationDelay: `${order * 110}ms` } } : {})}>
        <Section {...reveal()} className={cn("border-l-2 border-l-agent p-5", animate && "animate-rise")}>
          <Label tone="agent">{st.bottleneck}</Label>
          <p className="mt-1 text-lg font-semibold text-ink">{content.bottleneck.title}</p>
          <p className="mt-1.5 text-sm text-muted">{content.bottleneck.detail}</p>
        </Section>
        <Section {...reveal()} className={cn("p-5", animate && "animate-rise")}>
          <Label>{st.positioning}</Label>
          <p className="mt-1 text-base font-medium text-ink">{content.positioning.statement}</p>
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
            <Kv k={st.for}>{content.positioning.forWho}</Kv>
            <Kv k={st.insteadOf}>{content.positioning.insteadOf}</Kv>
            <Kv k={st.because}>{content.positioning.because}</Kv>
          </dl>
        </Section>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Section {...reveal()} className={cn("p-5", animate && "animate-rise")}>
          <Label>{st.priorityCustomers}</Label>
          <ol className="mt-2 space-y-3">
            {content.icpPriorities.map((i, idx) => (
              <li key={i.name} className="grid grid-cols-[18px_minmax(0,1fr)] gap-2">
                <span className="text-xs text-subtle tabular">{idx + 1}</span>
                <div>
                  <p className="text-sm font-medium text-ink">{i.name}</p>
                  <p className="text-xs text-muted">{i.why}</p>
                </div>
              </li>
            ))}
            {content.icpPriorities.length === 0 && <p className="text-sm text-subtle">{st.confirmAudience}</p>}
          </ol>
        </Section>
        <Section {...reveal()} className={cn("p-5", animate && "animate-rise")}>
          <Label>{st.messaging}</Label>
          <ul className="mt-2 space-y-3">
            {content.messagingPillars.map((m) => (
              <li key={m.pillar}>
                <p className="text-sm font-medium text-ink">{m.pillar}</p>
                <p className="text-xs text-muted">{m.proof}</p>
              </li>
            ))}
            {content.messagingPillars.length === 0 && <p className="text-sm text-subtle">{st.confirmFeatures}</p>}
          </ul>
        </Section>
        <Section {...reveal()} className={cn("p-5", animate && "animate-rise")}>
          <Label>{st.winAgainst}</Label>
          <ul className="mt-2 space-y-3">
            {content.competitorWedges.map((c) => (
              <li key={c.competitor}>
                <p className="text-sm font-medium text-ink">{c.competitor}</p>
                <p className="text-xs text-muted">{c.wedge}</p>
              </li>
            ))}
            {content.competitorWedges.length === 0 && <p className="text-sm text-subtle">{st.noCompetitors}</p>}
          </ul>
        </Section>
      </div>

      <Section {...reveal()} className={cn("overflow-hidden", animate && "animate-rise")}>
        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]">
          <div className="p-5">
            <Label>{st.channelFit}</Label>
            <p className="mt-0.5 text-xs text-muted">{st.channelFitHint}</p>
            <ul className="mt-3 divide-y divide-line">
              {focus.map((c) => (
                <ChannelRow key={c.channel} c={c} st={st} />
              ))}
            </ul>
          </div>
          <div className="border-t border-line bg-raised p-5 lg:border-t-0 lg:border-l">
            <Label tone="negative">{st.dontUse}</Label>
            <ul className="mt-3 divide-y divide-line">
              {avoid.map((c) => (
                <ChannelRow key={c.channel} c={c} st={st} />
              ))}
              {avoid.length === 0 && <p className="text-sm text-subtle">{st.everyWorth}</p>}
            </ul>
          </div>
        </div>
      </Section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Section {...reveal()} className={cn("p-5", animate && "animate-rise")}>
          <Label>{st.budget}</Label>
          <p className="mt-1 text-lg font-semibold text-ink tabular">
            {content.budget.monthly > 0 ? fmt(st.perMonth, { amount: usd(content.budget.monthly) }) : st.organicOnly}
            {content.budget.monthly > 0 && <span className="ml-2 text-xs font-normal text-muted">{fmt(st.paidShare, { pct: Math.round(content.budget.paidShare * 100) })}</span>}
          </p>
          {totalBudget > 0 ? (
            <>
              <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-sunken" aria-hidden>
                {content.budget.allocation.map((a, i) => (
                  <span key={a.channel} className={cn("h-full", ["bg-ink", "bg-muted", "bg-subtle", "bg-line-strong"][i % 4])} style={{ width: `${(a.amount / totalBudget) * 100}%` }} />
                ))}
              </div>
              <ul className="mt-3 space-y-2">
                {content.budget.allocation.map((a, i) => (
                  <li key={a.channel} className="grid grid-cols-[10px_minmax(0,1fr)_auto] items-start gap-2.5">
                    <span className={cn("mt-1.5 size-2 rounded-full", ["bg-ink", "bg-muted", "bg-subtle", "bg-line-strong"][i % 4])} aria-hidden />
                    <div className="min-w-0">
                      <p className="text-sm text-ink">{t.common.channels[a.channel] ?? a.channel}</p>
                      <p className="text-xs text-muted">{a.purpose}</p>
                    </div>
                    <span className="text-sm font-medium tabular">{usd(a.amount)}</span>
                  </li>
                ))}
              </ul>
              {content.budget.monthly - totalBudget > 0 && (
                <p className="mt-3 border-t border-line pt-2.5 text-xs text-muted">
                  <span className="font-medium text-ink tabular">{usd(content.budget.monthly - totalBudget)}</span> {st.reserve}
                </p>
              )}
            </>
          ) : (
            <p className="mt-2 text-sm text-muted">{st.noPaid}</p>
          )}
        </Section>

        <Section {...reveal()} className={cn("overflow-hidden", animate && "animate-rise")}>
          <div className="px-5 pt-5">
            <Label>{st.firstExperiments}</Label>
            <p className="mt-0.5 text-xs text-muted">{st.firstExperimentsHint}</p>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-y border-line text-left text-2xs text-subtle">
                  <th className="px-5 py-2 font-medium">{t.app.common.experiment}</th>
                  <th className="px-3 py-2 font-medium">{st.successIf}</th>
                  <th className="px-3 py-2 text-right font-medium">{t.app.experiments.cost}</th>
                  <th className="px-3 py-2 font-medium">{st.infoGain}</th>
                  <th className="px-5 py-2 text-right font-medium">{st.signal}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {queued.map((e) => (
                  <tr key={e.id} className={cn(e.status === "suppressed" && "opacity-60")}>
                    <td className="px-5 py-2.5">
                      <Link href={`/w/${slug}/experiments/${e.number}`} className="font-medium text-ink hover:underline">
                        {e.name}
                      </Link>
                      <div className="mt-0.5 flex items-center gap-2 text-2xs text-muted">
                        <span className="tabular">{experimentKey(e.number)}</span>
                        <ChannelBadge channel={e.channel} />
                      </div>
                      {e.suppressedReason && <p className="mt-0.5 text-2xs text-negative">{fmt(st.suppressed, { reason: e.suppressedReason })}</p>}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-muted">
                      {metricLabel(e.primaryMetric, t)} {thresholdLabel(e.primaryMetric, e.successThreshold, t, locale)}
                    </td>
                    <td className="px-3 py-2.5 text-right text-xs tabular">{e.budget > 0 ? usd(e.budget) : t.app.common.organic}</td>
                    <td className="px-3 py-2.5">
                      <Dots n={e.informationGain} label={fmt(t.app.metrics.infoGain, { n: e.informationGain })} />
                    </td>
                    <td className="px-5 py-2.5 text-right text-xs tabular">{fmt(t.app.common.days, { count: e.timeToSignalDays })}</td>
                  </tr>
                ))}
                {queued.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-4 text-sm text-subtle">
                      {st.noExperiment}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Section>
      </div>

      <Section {...reveal()} className={cn("p-5", animate && "animate-rise")}>
        <Label>{st.plan}</Label>
        <div className="mt-3 grid gap-5 md:grid-cols-3">
          {(
            [
              [st.next30, content.plan.days30],
              [st.days60, content.plan.days60],
              [st.days90, content.plan.days90],
            ] as const
          ).map(([title, items]) => (
            <div key={title}>
              <p className="text-xs font-medium text-ink">{title}</p>
              <ul className="mt-2 space-y-1.5 border-l border-line pl-3">
                {items.map((item) => (
                  <li key={item} className="text-sm text-ink/85">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <Section {...reveal()} className={cn("overflow-hidden", animate && "animate-rise")}>
        <div className="px-5 pt-5">
          <Label>{st.assumptions}</Label>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-y border-line text-left text-2xs text-subtle">
                <th className="px-5 py-2 font-medium">{st.assumption}</th>
                <th className="px-3 py-2 font-medium">{t.app.common.confidence}</th>
                <th className="px-5 py-2 font-medium">{st.howToKnow}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {content.assumptions.map((a) => (
                <tr key={a.statement}>
                  <td className="px-5 py-2.5 text-ink">{a.statement}</td>
                  <td className="px-3 py-2.5 text-xs text-muted tabular">{Math.round(a.confidence * 100)}%</td>
                  <td className="px-5 py-2.5 text-xs text-muted">{a.howToValidate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}

function ChannelRow({ c, st }: { c: ChannelAssessmentView; st: Dictionary["app"]["strategy"] }) {
  const tone = c.verdict === "prioritize" ? "positive" : c.verdict === "avoid" ? "negative" : "neutral";
  const kind = isChannel(c.channel) ? CHANNELS[c.channel].kind : "";
  return (
    <li className="py-2.5">
      <details className="group">
        <summary className="grid cursor-pointer list-none grid-cols-[minmax(0,1fr)_auto] items-start gap-3 [&::-webkit-details-marker]:hidden">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <ChannelBadge channel={c.channel} className="text-sm text-ink" />
              <Badge tone={tone}>{st.verdict[c.verdict] ?? st.verdict.test}</Badge>
              <span className="text-2xs text-subtle">{st.kinds[kind] ?? kind}</span>
            </div>
            <p className="mt-1 text-xs text-muted">{c.rationale}</p>
          </div>
          <span className="flex items-center gap-2">
            <span className="h-1 w-14 overflow-hidden rounded-full bg-sunken" aria-hidden>
              <span className={cn("block h-full rounded-full", c.verdict === "avoid" ? "bg-negative/60" : "bg-ink")} style={{ width: `${c.score}%` }} />
            </span>
            <span className="w-7 text-right text-sm font-semibold tabular">{c.score}</span>
          </span>
        </summary>
        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 rounded-md bg-surface p-2.5 text-2xs sm:grid-cols-4">
          {FACTORS.map((key) => (
            <span key={key} className="flex justify-between gap-2 text-muted">
              {st.factors[key]} <span className="text-ink tabular">{c.factors[key]}</span>
            </span>
          ))}
          <span className="flex justify-between gap-2 text-muted">
            {st.expectedCac} <span className="text-ink tabular">${c.factors.expectedCac}</span>
          </span>
          {c.factors.evidenceAdjustment !== 0 && (
            <span className="col-span-full text-muted">
              {st.evidenceAdjustment} <span className={c.factors.evidenceAdjustment > 0 ? "text-positive" : "text-negative"}>{c.factors.evidenceAdjustment > 0 ? "+" : ""}{c.factors.evidenceAdjustment}</span>
              {c.evidence[0] ? ` · ${c.evidence.join("; ")}` : ""}
            </span>
          )}
        </div>
      </details>
    </li>
  );
}

function Section({ children, className, style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <Panel as="section" className={className}>
      <div style={style} className="contents">
        {children}
      </div>
    </Panel>
  );
}

function Label({ children, tone }: { children: ReactNode; tone?: "agent" | "negative" }) {
  return <p className={cn("text-2xs font-medium", tone === "agent" ? "text-agent" : tone === "negative" ? "text-negative" : "text-subtle")}>{children}</p>;
}

function Kv({ k, children }: { k: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-2xs text-muted">{k}</dt>
      <dd className="text-ink">{children}</dd>
    </div>
  );
}

function Dots({ n, label }: { n: number; label: string }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={label}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={cn("size-1.5 rounded-full", i < n ? "bg-agent" : "bg-line")} />
      ))}
    </span>
  );
}
