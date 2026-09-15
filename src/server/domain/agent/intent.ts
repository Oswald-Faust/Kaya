/**
 * Deterministic intent classification for the growth orchestrator. Used when
 * no LLM is configured, and as a guard even when one is: the handler that
 * runs is always one of these explicit, auditable paths.
 */
export type Intent = "diagnose" | "scale" | "allocate" | "grow";

export interface ClassifiedIntent {
  intent: Intent;
  amount: number | null;
  label: string;
}

const LABEL: Record<Intent, string> = {
  diagnose: "Diagnose a change in the funnel",
  scale: "Scale what is working, within guardrails",
  allocate: "Allocate a budget across channels",
  grow: "Find and launch the next best growth experiment",
};

export function classifyIntent(text: string): ClassifiedIntent {
  const t = text.toLowerCase();
  const amountMatch = t.match(/\$\s?(\d[\d,]*(?:\.\d+)?)\s*(k)?/) ?? t.match(/(\d[\d,]*)\s*(k)?\s*(?:\$|usd|dollars)/);
  const amount = amountMatch ? Number(amountMatch[1].replace(/,/g, "")) * (amountMatch[2] ? 1000 : 1) : null;

  let intent: Intent = "grow";
  if (/\bwhy\b|\bdrop|\bfell\b|\bfall|declin|\bspike|\bjump|what happened|went down|went up/.test(t)) intent = "diagnose";
  else if (/\bscale\b|double down|more budget|increase (the )?budget|spend more|what'?s working/.test(t)) intent = "scale";
  else if (/allocat|split|how should i spend|where should i spend|best way to (use|spend)/.test(t) || (amount !== null && /budget|spend|month/.test(t))) intent = "allocate";

  return { intent, amount, label: LABEL[intent] };
}
