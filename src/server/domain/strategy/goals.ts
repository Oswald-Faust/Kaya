export type GoalMetric = "customers" | "mrr" | "signups" | "cac" | "trial_conversion" | "custom";
export type GoalUnit = "usd" | "count" | "pct";

export interface GoalTemplate {
  id: string;
  label: string;
  description: string;
  metric: GoalMetric;
  unit: GoalUnit;
  baseline: number | null;
  target: number | null;
  /** Whether the founder must tell us where they are today. */
  asksBaseline: boolean;
  asksTarget: boolean;
}

export const GOAL_TEMPLATES: GoalTemplate[] = [
  { id: "first_customers", label: "Get my first 10 customers", description: "Find the people who will pay, and prove they will.", metric: "customers", unit: "count", baseline: 0, target: 10, asksBaseline: false, asksTarget: true },
  { id: "reach_1k_mrr", label: "Reach $1k MRR", description: "Turn early traction into a repeatable revenue line.", metric: "mrr", unit: "usd", baseline: 0, target: 1000, asksBaseline: true, asksTarget: false },
  { id: "grow_mrr", label: "Grow MRR", description: "For example from $5k to $10k.", metric: "mrr", unit: "usd", baseline: null, target: null, asksBaseline: true, asksTarget: true },
  { id: "signups_100", label: "Get 100 qualified signups a month", description: "Fill the top of the funnel with the right people.", metric: "signups", unit: "count", baseline: null, target: 100, asksBaseline: true, asksTarget: true },
  { id: "reduce_cac", label: "Reduce CAC below $30", description: "Spend the same, acquire more.", metric: "cac", unit: "usd", baseline: null, target: 30, asksBaseline: true, asksTarget: true },
  { id: "trial_conversion", label: "Increase trial → paid conversion", description: "Get more of the people already trying it to pay.", metric: "trial_conversion", unit: "pct", baseline: null, target: 0.15, asksBaseline: true, asksTarget: true },
  { id: "new_market", label: "Launch into a new market", description: "Win the first customers in a new segment or country.", metric: "customers", unit: "count", baseline: 0, target: 10, asksBaseline: false, asksTarget: true },
  { id: "custom", label: "Custom goal", description: "Describe it in your own words.", metric: "custom", unit: "count", baseline: null, target: null, asksBaseline: false, asksTarget: false },
];

export interface BudgetBand {
  id: string;
  label: string;
  monthly: number | null;
}

export const BUDGET_BANDS: BudgetBand[] = [
  { id: "organic", label: "$0 · organic only", monthly: 0 },
  { id: "lt_250", label: "Under $250", monthly: 200 },
  { id: "250_1k", label: "$250–1k", monthly: 750 },
  { id: "1k_5k", label: "$1k–5k", monthly: 2500 },
  { id: "custom", label: "Custom", monthly: null },
];

export function getGoalTemplate(id: string): GoalTemplate | undefined {
  return GOAL_TEMPLATES.find((t) => t.id === id);
}

function money(n: number): string {
  return n >= 1000 ? `$${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : `$${Math.round(n)}`;
}

export function goalTitle(template: GoalTemplate, baseline: number | null, target: number | null, custom?: string): string {
  switch (template.id) {
    case "first_customers":
      return `Get my first ${target ?? 10} customers`;
    case "reach_1k_mrr":
      return `Reach ${money(target ?? 1000)} MRR`;
    case "grow_mrr":
      return baseline !== null && target !== null ? `Grow MRR from ${money(baseline)} to ${money(target)}` : "Grow MRR";
    case "signups_100":
      return `Get ${target ?? 100} qualified signups a month`;
    case "reduce_cac":
      return `Reduce CAC below ${money(target ?? 30)}`;
    case "trial_conversion":
      return target !== null ? `Increase trial → paid conversion to ${Math.round(target * 100)}%` : "Increase trial → paid conversion";
    case "new_market":
      return custom ? `Launch into ${custom}` : "Launch into a new market";
    default:
      return custom?.trim() || "Custom growth goal";
  }
}
