/**
 * Governance policy engine. Enforced in application code, never delegated to
 * the model. Hard guardrails cannot be overridden by an approval: a human can
 * approve a risky action, but not one that breaks the workspace's own limits.
 */
import type { AutonomyMode, PolicyCheck, PolicyDecision, RiskClass } from "../types";

export interface BudgetPolicy {
  monthlyBudget: number;
  maxDailySpend: number;
  maxExperimentBudget: number;
  maxAutoIncreasePct: number; // 0.2 = +20%
  autoPauseLosers: boolean;
  autoLaunchCampaigns: boolean;
  allowedChannels: string[]; // empty = all channels allowed
  neverWithoutApproval: string[]; // capabilities that always need a human
}

export interface ActionRequest {
  tool: string;
  capability: string;
  risk: RiskClass;
  channel?: string;
  /** Daily budget change for spend actions. */
  dailyBudget?: { current: number; proposed: number };
  /** Total budget of a new experiment or campaign. */
  totalBudget?: number;
  /** Spend already committed this calendar month, for projection. */
  monthSpendToDate?: number;
  /** Days left in the month, used to project a daily budget change. */
  daysLeftInMonth?: number;
  /** A reduction of risk exposure (pause, decrease) is always permitted. */
  reducesExposure?: boolean;
  /** Only a person can do this (post on Hacker News, sign a creator): never automatic, in any mode. */
  requiresHuman?: boolean;
}

export const RISK_LABEL: Record<RiskClass, string> = {
  R0: "Read",
  R1: "Draft",
  R2: "Publish",
  R3: "Spend",
  R4: "Sensitive",
};

export function evaluatePolicy(
  action: ActionRequest,
  mode: AutonomyMode,
  policy: BudgetPolicy,
  now: Date = new Date(),
): PolicyDecision {
  const checks: PolicyCheck[] = [];
  const add = (rule: string, passed: boolean, detail: string, hard: boolean) =>
    checks.push({ rule, passed, detail, hard });

  // ── Hard guardrails (apply in every mode, with or without approval) ──
  if (action.channel && policy.allowedChannels.length > 0) {
    add(
      "Allowed channels",
      policy.allowedChannels.includes(action.channel),
      policy.allowedChannels.includes(action.channel)
        ? `${action.channel} is allowed`
        : `${action.channel} is not in this workspace's allowed channels`,
      true,
    );
  }

  if (action.dailyBudget && !action.reducesExposure) {
    const { current, proposed } = action.dailyBudget;
    add(
      "Max daily spend",
      proposed <= policy.maxDailySpend,
      `$${fmt(proposed)}/day against a $${fmt(policy.maxDailySpend)}/day cap`,
      true,
    );
    if (action.monthSpendToDate !== undefined && action.daysLeftInMonth !== undefined) {
      const projected = action.monthSpendToDate + proposed * action.daysLeftInMonth;
      add(
        "Monthly budget",
        projected <= policy.monthlyBudget,
        `Projected month spend $${fmt(projected)} against $${fmt(policy.monthlyBudget)}`,
        true,
      );
    }
    const increase = current > 0 ? (proposed - current) / current : Number.POSITIVE_INFINITY;
    add(
      "Automatic increase limit",
      increase <= policy.maxAutoIncreasePct,
      current > 0
        ? `${increase >= 0 ? "+" : ""}${Math.round(increase * 100)}% change; automatic limit is +${Math.round(policy.maxAutoIncreasePct * 100)}%`
        : "New spend has no baseline to compare against",
      false,
    );
  }

  if (action.totalBudget !== undefined && !action.reducesExposure) {
    add(
      "Max experiment budget",
      action.totalBudget <= policy.maxExperimentBudget,
      `$${fmt(action.totalBudget)} against a $${fmt(policy.maxExperimentBudget)} per-experiment cap`,
      true,
    );
  }

  // ── Autonomy mode ──
  const modeAllowsAutomatic = automaticByMode(action, mode, policy);
  add("Autonomy mode", modeAllowsAutomatic.allowed, modeAllowsAutomatic.detail, false);

  if (action.requiresHuman) {
    add("Founder action", false, "Only you can do this step; Kaya prepared everything it needs", false);
  }

  if (policy.neverWithoutApproval.includes(action.capability)) {
    add("Always requires approval", false, `${action.capability} always needs a human decision`, false);
  }

  const hardFailures = checks.filter((c) => c.hard && !c.passed);
  const softFailures = checks.filter((c) => !c.hard && !c.passed);

  // A founder hand-off isn't the agent acting, so Observe mode still lets it reach the founder.
  const blockedByMode = mode === "observe" && action.risk !== "R0" && !action.requiresHuman;

  let outcome: PolicyDecision["outcome"];
  if (hardFailures.length > 0 || blockedByMode) outcome = "block";
  else if (softFailures.length > 0) outcome = "require_approval";
  else outcome = "allow";

  const reasons =
    outcome === "allow"
      ? ["Within policy"]
      : (hardFailures.length > 0 ? hardFailures : softFailures).map((c) => c.detail);

  return { outcome, reasons, checks, evaluatedAt: now.toISOString() };
}

function automaticByMode(
  action: ActionRequest,
  mode: AutonomyMode,
  policy: BudgetPolicy,
): { allowed: boolean; detail: string } {
  if (action.risk === "R0") return { allowed: true, detail: "Read-only actions run in every mode" };
  if (action.reducesExposure && policy.autoPauseLosers && mode !== "observe") {
    return { allowed: true, detail: "Reducing exposure is permitted automatically" };
  }
  switch (mode) {
    case "observe":
      return { allowed: false, detail: "Observe mode only allows read-only analysis" };
    case "suggest":
      return action.risk === "R1"
        ? { allowed: true, detail: "Suggest mode can prepare drafts" }
        : { allowed: false, detail: "Suggest mode never executes external actions without approval" };
    case "copilot":
      return action.risk === "R1"
        ? { allowed: true, detail: "Copilot prepares drafts automatically" }
        : { allowed: false, detail: `Copilot mode requires approval for ${RISK_LABEL[action.risk].toLowerCase()} actions` };
    case "autopilot":
      if (action.risk === "R4") return { allowed: false, detail: "Sensitive actions always require approval" };
      if (action.risk === "R3" && !action.dailyBudget && !action.reducesExposure && !policy.autoLaunchCampaigns) {
        return { allowed: false, detail: "Launching new paid campaigns automatically is turned off" };
      }
      return { allowed: true, detail: "Autopilot may act within guardrails" };
  }
}

function fmt(n: number): string {
  return Number.isInteger(n) ? n.toLocaleString("en-US") : n.toFixed(2);
}
