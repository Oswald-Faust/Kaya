import Link from "next/link";
import { ArrowRight, CalendarDays, Coins, FlaskConical, Lock, MessageSquareQuote, Radar, Sparkles } from "lucide-react";
import type { ComponentProps } from "react";
import { channelLabel } from "@/server/domain/channels";
import type { StrategySections } from "./strategy-sections";

type Props = ComponentProps<typeof StrategySections>;

/**
 * The strategy as seen before a plan is chosen: the positioning, the top channel
 * and the first experiment are real; everything else is withheld server-side
 * (placeholders only, never blurred real data).
 */
export function StrategyTeaser({ content, channels, experiments, unlockHref }: Pick<Props, "content" | "channels" | "experiments"> & { unlockHref: string }) {
  const focus = [...channels].filter((c) => c.verdict !== "avoid").sort((a, b) => b.score - a.score);
  const top = focus[0];
  const first = experiments[0];
  const locked = [
    { icon: Radar, title: "Channel fit for every channel", detail: `${Math.max(channels.length - 1, 0)} more channels scored, with reasons and what to skip` },
    { icon: Coins, title: "Budget allocation", detail: "Where each dollar goes, with a reserve and hard caps" },
    { icon: CalendarDays, title: "30, 60 and 90-day plan", detail: "Milestones tied to your goal" },
    { icon: FlaskConical, title: "Experiment queue", detail: `${Math.max(experiments.length - 1, 0)} more experiments ranked and ready to launch` },
    { icon: MessageSquareQuote, title: "Messaging and competitor wedges", detail: "Pillars, proof points and how to win the switch" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-line bg-surface p-6 md:col-span-3">
          <p className="font-mono text-[11px] tracking-[0.12em] text-subtle uppercase">Positioning</p>
          <p className="mt-2 text-[clamp(20px,2vw,26px)] leading-snug font-medium tracking-[-0.02em] text-ink">{content.positioning.statement}</p>
        </div>
        {top && (
          <div className="rounded-3xl bg-tangerine-soft p-6 md:col-span-1">
            <p className="font-mono text-[11px] tracking-[0.12em] text-tangerine-deep uppercase">Your best channel</p>
            <p className="mt-3 text-5xl font-medium tracking-[-0.05em] tabular">{top.score}</p>
            <p className="mt-1 text-lg font-medium">{channelLabel(top.channel)}</p>
          </div>
        )}
        {first && (
          <div className="rounded-3xl bg-grass-soft p-6 md:col-span-2">
            <p className="font-mono text-[11px] tracking-[0.12em] text-grass-deep uppercase">First experiment</p>
            <p className="mt-3 text-2xl leading-snug font-medium tracking-[-0.02em]">{first.name}</p>
          </div>
        )}
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-line bg-surface">
        <ul aria-hidden className="grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
          {locked.map((item) => (
            <li key={item.title} className="bg-surface p-6">
              <div className="flex items-center gap-2 text-subtle">
                <item.icon className="size-4" />
                <span className="text-sm font-medium text-muted">{item.title}</span>
                <Lock className="ml-auto size-3.5" />
              </div>
              <div className="mt-4 space-y-2 blur-[3px]">
                <div className="h-3 w-4/5 rounded-full bg-sunken" />
                <div className="h-3 w-3/5 rounded-full bg-sunken" />
                <div className="h-3 w-2/3 rounded-full bg-sunken" />
              </div>
              <p className="mt-4 text-xs text-subtle">{item.detail}</p>
            </li>
          ))}
          <li className="bg-surface p-6">
            <div className="h-full rounded-2xl bg-sunken/60" />
          </li>
        </ul>
        <div className="absolute inset-0 grid place-items-center bg-gradient-to-b from-surface/40 via-surface/80 to-surface p-6">
          <div className="max-w-md rounded-3xl bg-ink p-7 text-center text-white shadow-pop">
            <Sparkles className="mx-auto size-6 text-lime" />
            <p className="mt-3 text-2xl font-medium tracking-[-0.03em]">Unlock your full strategy</p>
            <p className="mt-2 text-[15px] text-white/70">Start a 14-day free trial to see every channel, the budget split and your experiment queue, and let Kaya start working.</p>
            <Link href={unlockHref} className="mt-5 inline-flex h-12 items-center gap-2 rounded-xl bg-lime px-5 text-[15px] font-medium text-ink hover:brightness-95">
              Start free trial <ArrowRight className="size-4" />
            </Link>
            <p className="mt-3 text-xs text-white/50">No card required</p>
          </div>
        </div>
      </div>
    </div>
  );
}
