import { DomainError } from "../errors";
import type { ExperimentStatus } from "../types";

const TRANSITIONS: Record<ExperimentStatus, readonly ExperimentStatus[]> = {
  idea: ["proposed", "archived"],
  proposed: ["awaiting_approval", "scheduled", "archived", "suppressed"],
  awaiting_approval: ["scheduled", "running", "proposed", "archived"],
  scheduled: ["running", "archived"],
  running: ["evaluating", "archived"],
  evaluating: ["completed", "running"],
  completed: ["archived"],
  archived: [],
  suppressed: ["proposed", "archived"],
};

export const STATUS_LABEL: Record<ExperimentStatus, string> = {
  idea: "Idea",
  proposed: "Proposed",
  awaiting_approval: "Awaiting approval",
  scheduled: "Scheduled",
  running: "Running",
  evaluating: "Evaluating",
  completed: "Completed",
  archived: "Archived",
  suppressed: "Suppressed",
};

export function canTransition(from: ExperimentStatus, to: ExperimentStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export function assertTransition(from: ExperimentStatus, to: ExperimentStatus): void {
  if (!canTransition(from, to)) {
    throw new DomainError(
      "invalid_transition",
      `An experiment cannot move from ${STATUS_LABEL[from]} to ${STATUS_LABEL[to]}.`,
      { from, to },
    );
  }
}

export const ACTIVE_STATUSES: readonly ExperimentStatus[] = ["scheduled", "running", "evaluating"];
export const QUEUE_STATUSES: readonly ExperimentStatus[] = ["proposed", "awaiting_approval", "suppressed"];
