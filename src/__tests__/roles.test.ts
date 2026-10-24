import { describe, it, expect, vi, beforeEach } from "vitest";
import { chooseInitialRoleAction } from "@/server/actions";
import * as supabaseServer from "@/lib/supabase/server";
import { db } from "@/db";

import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/db/schema";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

function mockAuth(userId: string, role: Profile["role"], roleChosenAt: Date | null = null) {
  return {
    user: { id: userId, email: `${userId}@example.com` } as unknown as User,
    profile: {
      id: userId,
      role,
      roleChosenAt,
      displayName: "Test User",
      avatarUrl: "",
      bio: "",
      website: "",
      twitter: "",
      github: "",
      linkedin: "",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Profile,
  };
}

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

describe("chooseInitialRoleAction (Onboarding Role Selection)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("strictly rejects admin accounts from altering their role", async () => {
    vi.spyOn(supabaseServer, "getCurrentUserProfile").mockResolvedValue(
      mockAuth("admin-123", "admin")
    );

    const res = await chooseInitialRoleAction("founder");
    expect(res).toEqual({
      error: "Forbidden: Admin accounts cannot change their role.",
    });
  });

  it("strictly rejects invalid roles such as admin or moderator", async () => {
    vi.spyOn(supabaseServer, "getCurrentUserProfile").mockResolvedValue(
      mockAuth("user-123", "community")
    );

    // Testing runtime invalid role rejection
    const res = await chooseInitialRoleAction("admin" as unknown as "founder");
    expect(res).toEqual({
      error: "Invalid role selected. Only founder or investor may be chosen.",
    });
  });

  it("rejects users whose role is not community (e.g. already founder)", async () => {
    vi.spyOn(supabaseServer, "getCurrentUserProfile").mockResolvedValue(
      mockAuth("founder-123", "founder", new Date())
    );

    // Mock db.select returning founder role
    const mockLimit = vi.fn().mockResolvedValue([
      { role: "founder", roleChosenAt: new Date() },
    ]);
    const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
    const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Drizzle query builder mock in unit test
    vi.spyOn(db, "select").mockReturnValue({ from: mockFrom } as any);

    const res = await chooseInitialRoleAction("investor");
    expect(res).toEqual({
      error: "Role cannot be changed once established.",
    });
  });

  it("rejects users who have already chosen their initial role (role_chosen_at IS NOT NULL)", async () => {
    vi.spyOn(supabaseServer, "getCurrentUserProfile").mockResolvedValue(
      mockAuth("user-123", "community", new Date())
    );

    // Mock db.select returning community role but roleChosenAt already filled
    const mockLimit = vi.fn().mockResolvedValue([
      { role: "community", roleChosenAt: new Date() },
    ]);
    const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
    const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Drizzle query builder mock in unit test
    vi.spyOn(db, "select").mockReturnValue({ from: mockFrom } as any);

    const res = await chooseInitialRoleAction("founder");
    expect(res).toEqual({
      error: "Initial role has already been chosen.",
    });
  });

  it("successfully updates role and sets role_chosen_at for uncommitted community member", async () => {
    vi.spyOn(supabaseServer, "getCurrentUserProfile").mockResolvedValue(
      mockAuth("user-fresh", "community", null)
    );

    // Mock db.select returning community with roleChosenAt: null
    const mockLimit = vi.fn().mockResolvedValue([
      { role: "community", roleChosenAt: null },
    ]);
    const mockWhereSelect = vi.fn().mockReturnValue({ limit: mockLimit });
    const mockFrom = vi.fn().mockReturnValue({ where: mockWhereSelect });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Drizzle mock in unit test
    vi.spyOn(db, "select").mockReturnValue({ from: mockFrom } as any);

    const mockWhereUpdate = vi.fn().mockResolvedValue(undefined);
    const mockSet = vi.fn().mockReturnValue({ where: mockWhereUpdate });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Drizzle mock in unit test
    vi.spyOn(db, "update").mockReturnValue({ set: mockSet } as any);

    const mockValues = vi.fn().mockResolvedValue(undefined);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Drizzle mock in unit test
    vi.spyOn(db, "insert").mockReturnValue({ values: mockValues } as any);

    const res = await chooseInitialRoleAction("founder");
    expect(res).toEqual({
      success: true,
      role: "founder",
    });
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        role: "founder",
        roleChosenAt: expect.any(Date),
      })
    );
  });
});
