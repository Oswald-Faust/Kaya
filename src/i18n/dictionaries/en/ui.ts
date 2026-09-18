export const ui = {
  chart: { noData: "No data for this range", label: "Chart from {from} to {to}, range {min} to {max}" },
  status: {
    idea: "Idea",
    proposed: "Proposed",
    awaiting_approval: "Awaiting approval",
    scheduled: "Scheduled",
    running: "Running",
    evaluating: "Evaluating",
    completed: "Completed",
    archived: "Archived",
    suppressed: "Suppressed",
  },
  outcome: { winner: "Winner", loser: "Loser", inconclusive: "Inconclusive" },
  confidence: "confidence",
  risk: { R0: "R0 Read", R1: "R1 Draft", R2: "R2 Publish", R3: "R3 Spend", R4: "R4 Sensitive" },
  goal: {
    onTrack: "On track",
    behindPlan: "Behind plan",
    of: "{current} of {target}",
    daysLeft: { one: "{count} day left", other: "{count} days left" },
    expectedByToday: "Expected by today: {pct}%",
  },
};
