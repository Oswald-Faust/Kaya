import { CHANNELS, isChannel } from "../channels";

export interface AllocationInput {
  channel: string;
  score: number;
}

export interface AllocationLine {
  channel: string;
  amount: number;
  share: number;
  reason: string;
}

export interface Allocation {
  lines: AllocationLine[];
  excluded: { channel: string; reason: string }[];
  /** Budget deliberately kept in reserve because no remaining channel can use it well. */
  unallocated: number;
}

interface Candidate extends AllocationInput {
  weight: number;
  paid: boolean;
  min: number;
}

/** Organic channels get production money (writing, design), capped because their main cost is time. */
const ORGANIC_CAP = 0.3;
/** A paid line below half its channel's minimum learning budget can't produce a readable CAC. */
const MIN_SHARE_OF_LEARNING_BUDGET = 0.5;

/**
 * Splits a budget across channels in proportion to fit above the "test"
 * threshold. Paid channels that can't get enough money to learn anything are
 * excluded rather than under-funded; what no channel can use well is kept in
 * reserve instead of being spread thin.
 */
export function allocateBudget(amount: number, channels: AllocationInput[]): Allocation {
  const excluded: Allocation["excluded"] = [];
  let eligible: Candidate[] = [];

  for (const c of channels) {
    if (!isChannel(c.channel)) continue;
    const meta = CHANNELS[c.channel];
    if (c.score < 45) {
      excluded.push({ channel: c.channel, reason: `Fit score ${c.score} is below the test threshold` });
      continue;
    }
    const paid = meta.kind === "paid" || meta.kind === "creator";
    if (paid && amount < meta.minMonthlyBudget * MIN_SHARE_OF_LEARNING_BUDGET) {
      excluded.push({ channel: c.channel, reason: `Needs ~$${meta.minMonthlyBudget}/mo to produce a readable signal` });
      continue;
    }
    if (!paid && c.channel !== "seo_content" && c.channel !== "email_lifecycle") {
      excluded.push({ channel: c.channel, reason: "Runs on founder time rather than budget" });
      continue;
    }
    eligible.push({ ...c, paid, min: meta.minMonthlyBudget, weight: Math.pow(c.score - 40, 1.5) });
  }

  if (amount <= 0 || eligible.length === 0) return { lines: [], excluded, unallocated: Math.max(0, amount) };

  for (;;) {
    const lines = split(amount, eligible);
    const tooSmall = lines.filter((l) => l.paid && l.amount < l.min * MIN_SHARE_OF_LEARNING_BUDGET);
    if (tooSmall.length === 0) {
      const total = lines.reduce((s, l) => s + l.amount, 0);
      return {
        lines: lines
          .filter((l) => l.amount > 0)
          .map(({ channel, amount: a, reason }) => ({ channel, amount: a, reason, share: a / amount }))
          .sort((x, y) => y.amount - x.amount),
        excluded,
        unallocated: amount - total,
      };
    }
    for (const l of tooSmall) {
      excluded.push({ channel: l.channel, reason: `A $${l.amount}/mo share is too small to learn from; needs ~$${l.min}/mo` });
    }
    eligible = eligible.filter((c) => !tooSmall.some((l) => l.channel === c.channel));
    if (eligible.length === 0) return { lines: [], excluded, unallocated: amount };
  }
}

function split(amount: number, eligible: Candidate[]) {
  const totalWeight = eligible.reduce((s, c) => s + c.weight, 0);
  const lines = eligible.map((c) => {
    let raw = (c.weight / totalWeight) * amount;
    if (!c.paid) raw = Math.min(raw, amount * ORGANIC_CAP);
    return {
      channel: c.channel,
      paid: c.paid,
      min: c.min,
      weight: c.weight,
      amount: Math.floor(raw / 10) * 10,
      reason: c.paid ? `Fit ${c.score}: paid test budget` : `Fit ${c.score}: production budget (writing, design)`,
    };
  });
  // Rounding and organic caps leave a remainder; it can only go to a paid channel, where money is the constraint.
  const remainder = amount - lines.reduce((s, l) => s + l.amount, 0);
  const topPaid = lines.filter((l) => l.paid).sort((a, b) => b.weight - a.weight)[0];
  if (topPaid && remainder > 0) topPaid.amount += remainder;
  return lines;
}
