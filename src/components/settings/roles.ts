export type Role = "owner" | "admin" | "member" | "viewer";

export const ROLES: { id: Role; label: string; description: string }[] = [
  { id: "owner", label: "Owner", description: "Everything, including deleting the workspace." },
  { id: "admin", label: "Admin", description: "Manages the team, billing and agent guardrails." },
  { id: "member", label: "Member", description: "Runs the agent, approves and launches experiments." },
  { id: "viewer", label: "Viewer", description: "Sees everything, changes nothing." },
];
