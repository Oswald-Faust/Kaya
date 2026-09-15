import type { Capability } from "./catalog";

export interface AdapterHealth {
  status: "ok" | "degraded" | "failing";
  detail: string;
  checkedAt: string;
}

export interface AdapterResult {
  /** Identifier in the external system, when the action created or changed something. */
  externalId?: string;
  data: Record<string, unknown>;
}

/**
 * Contract every integration implements (spec §20). `mode` is part of the
 * contract so demo adapters can never be mistaken for production connections:
 * everything they return is labelled as demo data by the tool layer.
 */
export interface MarketingIntegrationAdapter {
  readonly provider: string;
  readonly mode: "live" | "demo";
  capabilities(): Capability[];
  read(capability: Capability, input: Record<string, unknown>): Promise<AdapterResult>;
  execute(capability: Capability, input: Record<string, unknown>, opts: { idempotencyKey: string; dryRun: boolean }): Promise<AdapterResult>;
  healthCheck(): Promise<AdapterHealth>;
}

export class CapabilityNotSupportedError extends Error {
  constructor(provider: string, capability: Capability) {
    super(`${provider} cannot perform ${capability}`);
    this.name = "CapabilityNotSupportedError";
  }
}
