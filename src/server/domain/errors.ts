export type DomainErrorCode =
  | "not_found"
  | "forbidden"
  | "invalid_transition"
  | "policy_blocked"
  | "validation"
  | "conflict"
  | "unsafe_url"
  | "upstream";

/** Expected, user-explainable failure. Anything else is a bug. */
export class DomainError extends Error {
  constructor(
    public readonly code: DomainErrorCode,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "DomainError";
  }
}

export function isDomainError(error: unknown): error is DomainError {
  return error instanceof DomainError;
}
