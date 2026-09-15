/**
 * Growth Brief: the agent's daily summary, assembled deterministically from
 * computed metrics, experiment evaluations and the ranked queue. Every number
 * in it is passed in, not derived here from free text, so each sentence is
 * traceable to data. An LLM may later rephrase it; it may not change numbers.
 */
import { channelLabel } from "../channels";

export interface BriefInput {
  asOf: string;
  signups: { current: number; previous: number };
  signupRate: { current: number | null; previous: number | null };
  netNewMrr: { current: number; previous: number };
  channels: { channel: string; current: number; previous: number }[];
  goal: { title: string; onTrack: boolean; requiredPerWeek: number | null; daysLeft: number } | null;
  running: { key: string; name: string; decision: string; summary: string }[];
  topAction: { key: string; name: string; boostedBy: string | null } | null;
  pendingApproval: { id: string; title: string; change: string | null; reason: string } | null;
  integrationIssue: { name: string; detail: string } | null;
}

export interface BriefEvidence {
  label: string;
  value: string;
}

export interface GrowthBrief {
  headline: string;
  whatChanged: string;
  whyItMatters: string;
  opportunity: string;
  risk: string;
  recommendation: string;
  approvalId: string | null;
  evidence: BriefEvidence[];
}

const pct = (n: number | null) => (n === null ? "—" : `${(n * 100).toFixed(1)}%`);
const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const signed = (n: number) => `${n >= 0 ? "+" : "−"}${Math.abs(Math.round(n * 100))}%`;

export function buildGrowthBrief(input: BriefInput): GrowthBrief {
  const { signups } = input;
  const change = signups.previous > 0 ? (signups.current - signups.previous) / signups.previous : null;
  const driver = [...input.channels].sort((a, b) => Math.abs(b.current - b.previous) - Math.abs(a.current - a.previous))[0];

  const whatChanged =
    change === null
      ? `${signups.current} signups this week; there is no previous week to compare against yet.`
      : `Signups ${change >= 0 ? "rose" : "fell"} ${signed(change)} week over week (${signups.previous} → ${signups.current})` +
        (driver && driver.current !== driver.previous
          ? `, led by ${channelLabel(driver.channel)} (${driver.previous} → ${driver.current}).`
          : ".") +
        ` Signup rate is ${pct(input.signupRate.current)} vs ${pct(input.signupRate.previous)}.`;

  let whyItMatters: string;
  if (input.goal && input.goal.requiredPerWeek !== null) {
    const pace = input.netNewMrr.current;
    const needed = input.goal.requiredPerWeek;
    whyItMatters =
      pace >= needed
        ? `Net new MRR was ${usd(pace)} this week, ahead of the ${usd(needed)}/week needed to ${input.goal.title.toLowerCase()} in ${input.goal.daysLeft} days.`
        : `Net new MRR was ${usd(pace)} this week; the goal needs ${usd(needed)}/week for the next ${input.goal.daysLeft} days. The gap has to come from experiments, not from waiting.`;
  } else {
    whyItMatters = `Net new MRR was ${usd(input.netNewMrr.current)} this week (${usd(input.netNewMrr.previous)} the week before).`;
  }

  const quoted = (name: string) => (/^[“"]/.test(name) ? name : `“${name}”`);
  const opportunity = input.topAction
    ? `${input.topAction.key} ${quoted(input.topAction.name)} is the highest-value next experiment` +
      (input.topAction.boostedBy ? `, backed by ${input.topAction.boostedBy}.` : ".")
    : "The experiment queue is empty; ask the agent to research new opportunities.";

  const decided = input.running.find((r) => r.decision === "winner" || r.decision === "loser");
  const risk = decided
    ? `${decided.key} has reached a decision (${decided.decision}): ${decided.summary} Record it so the next recommendation uses it.`
    : input.integrationIssue
      ? `${input.integrationIssue.name}: ${input.integrationIssue.detail}`
      : input.goal && !input.goal.onTrack
        ? "The goal is behind plan at the current pace."
        : input.running[0]
          ? `${input.running[0].key} is still collecting data: ${input.running[0].summary}`
          : "No experiment is running, so the business is not learning this week.";

  const recommendation = input.pendingApproval
    ? `Approve “${input.pendingApproval.title}”${input.pendingApproval.change ? ` (${input.pendingApproval.change})` : ""}. ${input.pendingApproval.reason}`
    : input.topAction
      ? `Launch ${input.topAction.key}.`
      : "Review the strategy and add experiments.";

  const headline =
    change !== null && Math.abs(change) >= 0.1
      ? `Signups ${change >= 0 ? "up" : "down"} ${signed(change)} this week`
      : input.goal && !input.goal.onTrack
        ? "Growth is steady but behind the goal"
        : "Steady week";

  const evidence: BriefEvidence[] = [
    { label: "Signups (7d)", value: `${signups.previous} → ${signups.current}` },
    { label: "Signup rate", value: `${pct(input.signupRate.previous)} → ${pct(input.signupRate.current)}` },
    { label: "Net new MRR (7d)", value: usd(input.netNewMrr.current) },
  ];
  if (driver) evidence.push({ label: channelLabel(driver.channel), value: `${driver.previous} → ${driver.current} signups` });

  return { headline, whatChanged, whyItMatters, opportunity, risk, recommendation, approvalId: input.pendingApproval?.id ?? null, evidence };
}
