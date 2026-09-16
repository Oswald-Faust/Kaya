/**
 * Team rules, decided in code. Seats are counted per organization: members plus
 * pending invitations, so an invite reserves its seat until it's accepted,
 * revoked or expired.
 */

import type { PlanId } from "@/server/domain/billing/plan-state";

export type MemberRole = "owner" | "admin" | "member" | "viewer";
export type InvitableRole = Exclude<MemberRole, "owner">;

export const INVITABLE_ROLES: InvitableRole[] = ["admin", "member", "viewer"];
export const INVITATION_TTL_DAYS = 7;

/** null means unlimited. Mirrors the seats listed on the pricing page. */
const SEATS: Record<PlanId, number | null> = { none: 1, free: 1, launch: 3, growth: 10, scale: null };

export function seatLimit(plan: PlanId): number | null {
  return SEATS[plan];
}

export interface SeatUsage {
  limit: number | null;
  used: number;
  available: number | null;
  full: boolean;
}

export function seatUsage(plan: PlanId, members: number, pendingInvites: number): SeatUsage {
  const limit = seatLimit(plan);
  const used = members + pendingInvites;
  if (limit === null) return { limit, used, available: null, full: false };
  const available = Math.max(0, limit - used);
  return { limit, used, available, full: available === 0 };
}

/** The smallest plan that fits `seats`, for upgrade prompts. */
export function planForSeats(seats: number): "launch" | "growth" | "scale" {
  if (seats <= (SEATS.launch ?? Infinity)) return "launch";
  if (seats <= (SEATS.growth ?? Infinity)) return "growth";
  return "scale";
}

export function canManageTeam(role: MemberRole): boolean {
  return role === "owner" || role === "admin";
}

/** Admins manage members and viewers; only owners touch admins and other owners. */
export function canManageMember(actor: MemberRole, target: MemberRole): boolean {
  if (actor === "owner") return true;
  if (actor === "admin") return target === "member" || target === "viewer";
  return false;
}

export function canAssignRole(actor: MemberRole, role: MemberRole): boolean {
  if (actor === "owner") return true;
  if (actor === "admin") return role === "member" || role === "viewer";
  return false;
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}
