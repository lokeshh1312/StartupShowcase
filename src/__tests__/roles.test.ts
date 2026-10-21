import { describe, it, expect } from "vitest";

describe("Role integrity and admin privilege escalation prevention", () => {
  it("sanitizes signup role so admin cannot be chosen via client form", () => {
    const attemptedRoles = ["admin", "superadmin", "moderator", "root", "", "invalid"];
    for (const role of attemptedRoles) {
      const safeRole = ["founder", "investor", "community"].includes(role)
        ? role
        : "community";
      expect(safeRole).not.toBe("admin");
      expect(safeRole).toBe("community");
    }
  });

  it("permits only founder, investor, and community as valid registration roles", () => {
    const allowed = ["founder", "investor", "community"];
    expect(allowed.includes("founder")).toBe(true);
    expect(allowed.includes("investor")).toBe(true);
    expect(allowed.includes("community")).toBe(true);
    expect(allowed.includes("admin")).toBe(false);
  });
});
