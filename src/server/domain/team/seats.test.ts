import { describe, expect, it } from "vitest";
import { canAssignRole, canManageMember, canManageTeam, planForSeats, seatLimit, seatUsage } from "./seats";

describe("seats", () => {
  it("follows the pricing page", () => {
    expect(seatLimit("free")).toBe(1);
    expect(seatLimit("launch")).toBe(3);
    expect(seatLimit("growth")).toBe(10);
    expect(seatLimit("scale")).toBeNull();
  });

  it("counts pending invitations as used seats", () => {
    expect(seatUsage("launch", 2, 1)).toEqual({ limit: 3, used: 3, available: 0, full: true });
    expect(seatUsage("growth", 2, 1)).toEqual({ limit: 10, used: 3, available: 7, full: false });
  });

  it("never reports negative availability after a downgrade", () => {
    expect(seatUsage("free", 4, 0)).toMatchObject({ available: 0, full: true });
  });

  it("is never full on Scale", () => {
    expect(seatUsage("scale", 500, 20)).toMatchObject({ limit: null, full: false });
  });

  it("recommends the smallest plan that fits", () => {
    expect(planForSeats(2)).toBe("launch");
    expect(planForSeats(4)).toBe("growth");
    expect(planForSeats(11)).toBe("scale");
  });
});

describe("roles", () => {
  it("lets owners and admins manage the team", () => {
    expect(canManageTeam("owner")).toBe(true);
    expect(canManageTeam("admin")).toBe(true);
    expect(canManageTeam("member")).toBe(false);
    expect(canManageTeam("viewer")).toBe(false);
  });

  it("keeps admins away from owners and other admins", () => {
    expect(canManageMember("admin", "member")).toBe(true);
    expect(canManageMember("admin", "admin")).toBe(false);
    expect(canManageMember("admin", "owner")).toBe(false);
    expect(canAssignRole("admin", "admin")).toBe(false);
    expect(canAssignRole("owner", "admin")).toBe(true);
  });
});
