import type { z } from "zod";
import type { ActionRequest } from "@/server/domain/governance/policy";
import type { RiskClass } from "@/server/domain/types";

export interface ToolContext {
  workspaceId: string;
  productId: string;
  runId: string;
  actor: { type: "agent" | "user"; id: string };
  isDemo: boolean;
  now: Date;
}

export interface ToolRunResult {
  output: Record<string, unknown>;
  /** Provider adapter that performed the action, if any. */
  adapter?: string;
  /** True when the action touched demo state only. */
  isDemo?: boolean;
  targetType?: string;
  targetId?: string;
}

/**
 * A typed tool (spec §15). Tools are product infrastructure: each one declares
 * its capability, risk class, idempotency, dry-run support and audit metadata,
 * and the executor enforces governance before `run` is ever called.
 */
export interface ToolDefinition<S extends z.ZodType = z.ZodType> {
  name: string;
  title: string;
  description: string;
  capability: string;
  risk: RiskClass;
  /** Mutates a system outside Kaya (ads account, site, inbox). */
  external: boolean;
  supportsDryRun: boolean;
  input: S;
  /** Roles allowed to trigger the tool (agent runs inherit the requester's role). */
  permissions: ("owner" | "admin" | "member")[];
  /**
   * Stable identity of the action for idempotency. Writes with the same key
   * are executed once; reads are scoped to the run.
   */
  idempotencyKey: (input: z.infer<S>) => string;
  describe: (input: z.infer<S>) => { title: string; change?: string };
  policy?: (input: z.infer<S>, ctx: ToolContext) => Promise<Partial<ActionRequest>>;
  run: (input: z.infer<S>, ctx: ToolContext, opts: { dryRun: boolean; idempotencyKey: string }) => Promise<ToolRunResult>;
}

export function defineTool<S extends z.ZodType>(def: ToolDefinition<S>): ToolDefinition<S> {
  return def;
}
