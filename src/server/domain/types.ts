/**
 * Shared domain types. Pure TypeScript: importable from server, client and tests.
 */
import type { Channel } from "./channels";

export type { Channel };

export type RiskClass = "R0" | "R1" | "R2" | "R3" | "R4";
export type AutonomyMode = "observe" | "suggest" | "copilot" | "autopilot";
export type FactKind = "verified" | "inferred" | "hypothesis" | "user_correction" | "learning";
export type FactStatus = "proposed" | "confirmed" | "rejected" | "superseded";

export type ExperimentStatus =
  | "idea"
  | "proposed"
  | "awaiting_approval"
  | "scheduled"
  | "running"
  | "evaluating"
  | "completed"
  | "archived"
  | "suppressed";

export type ExperimentOutcome = "winner" | "loser" | "inconclusive";
export type PrimaryMetric = "signup_rate" | "activation_rate" | "trial_to_paid" | "ctr" | "cac";

/* ── Product Intelligence ── */

export type PageKind = "home" | "pricing" | "features" | "about" | "docs" | "customers" | "blog" | "other";

export interface SnapshotPage {
  url: string;
  kind: PageKind;
  title: string | null;
  status: number | "error" | "skipped";
  bytes: number;
  fetchedAt: string;
  error?: string;
}

export interface Extracted<T> {
  value: T;
  confidence: number; // 0–1
  evidence?: string; // short verbatim quote from the source
  sourceUrl?: string;
}

export interface PricingPlan {
  name: string;
  price: number | null;
  period: "month" | "year" | "one_time" | null;
  highlights: string[];
}

export interface ExtractionResult {
  productName: Extracted<string>;
  oneLiner: Extracted<string>;
  category: Extracted<string>;
  valueProposition: Extracted<string>;
  features: Extracted<string>[];
  pricing: {
    model: Extracted<string>;
    plans: PricingPlan[];
    freeTrial: Extracted<boolean> | null;
    sourceUrl?: string;
  };
  audiences: { name: string; description: string; confidence: number; evidence?: string }[];
  competitors: { name: string; url: string | null; kind: "direct" | "indirect" | "alternative"; reason: string; confidence: number }[];
  brand: { traits: string[]; voiceSummary: string; confidence: number };
  ctas: string[];
  channels: { channel: string; signal: string; confidence: number }[];
  proof: string[];
  logoUrl: string | null;
  language: string;
  warnings: string[];
}

/* ── Strategy ── */

export interface ChannelFactors {
  audiencePresence: number;
  purchaseIntent: number;
  cacFit: number;
  budgetFit: number;
  creativeEase: number;
  organicPotential: number;
  currentTraction: number;
  evidenceAdjustment: number;
  expectedCac: number;
}

export interface StrategyContent {
  situation: string;
  objective: string;
  baseline: { label: string; value: string }[];
  bottleneck: { title: string; detail: string };
  positioning: { statement: string; forWho: string; insteadOf: string; because: string };
  messagingPillars: { pillar: string; proof: string; channels: Channel[] }[];
  icpPriorities: { name: string; why: string }[];
  competitorWedges: { competitor: string; wedge: string }[];
  channelsToAvoid: { channel: Channel; reason: string }[];
  budget: {
    monthly: number;
    paidShare: number;
    allocation: { channel: Channel; amount: number; purpose: string }[];
  };
  plan: { days30: string[]; days60: string[]; days90: string[] };
  assumptions: { statement: string; confidence: number; howToValidate: string }[];
}

/* ── Governance ── */

export interface PolicyCheck {
  rule: string;
  passed: boolean;
  detail: string;
  hard: boolean;
}

export interface PolicyDecision {
  outcome: "allow" | "require_approval" | "block";
  reasons: string[];
  checks: PolicyCheck[];
  evaluatedAt: string;
}

/* ── Agent ── */

export interface AgentPlanStep {
  id: string;
  title: string;
  why: string;
  tool?: string;
  risk: RiskClass;
}

export interface AgentPlan {
  objective: string;
  assumptions: string[];
  steps: AgentPlanStep[];
}
