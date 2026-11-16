/**
 * @vitest-environment jsdom
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import OnboardingRolePage, { metadata } from "@/app/onboarding/role/page";
import { RoleForm } from "@/app/onboarding/role/role-form";
import * as supabaseServer from "@/lib/supabase/server";
import * as actions from "@/server/actions";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/db/schema";

const mockPush = vi.fn();
const mockRefresh = vi.fn();
const mockRedirect = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
  redirect: (url: string) => {
    mockRedirect(url);
    throw new Error(`NEXT_REDIRECT:${url}`);
  },
}));

function mockAuth(
  userId: string,
  role: Profile["role"],
  roleChosenAt: Date | null = null
) {
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

describe("OnboardingRolePage (Server Page)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exports valid metadata", () => {
    expect(metadata.title).toBe("Welcome! Choose Your Role | Startup Showcase");
    expect(metadata.description).toBe("Welcome! How will you use Startup Showcase?");
  });

  it("redirects unauthenticated visitor directly to /login", async () => {
    vi.spyOn(supabaseServer, "getCurrentUserProfile").mockResolvedValue(null);

    await expect(
      OnboardingRolePage({ searchParams: Promise.resolve({}) })
    ).rejects.toThrow("NEXT_REDIRECT:/login");

    expect(mockRedirect).toHaveBeenCalledWith("/login");
  });

  it("redirects user to / if role_chosen_at is already set", async () => {
    vi.spyOn(supabaseServer, "getCurrentUserProfile").mockResolvedValue(
      mockAuth("user-1", "community", new Date())
    );

    await expect(
      OnboardingRolePage({ searchParams: Promise.resolve({}) })
    ).rejects.toThrow("NEXT_REDIRECT:/");

    expect(mockRedirect).toHaveBeenCalledWith("/");
  });

  it("redirects user to / if role is not community (e.g. founder)", async () => {
    vi.spyOn(supabaseServer, "getCurrentUserProfile").mockResolvedValue(
      mockAuth("user-2", "founder", null)
    );

    await expect(
      OnboardingRolePage({ searchParams: Promise.resolve({}) })
    ).rejects.toThrow("NEXT_REDIRECT:/");

    expect(mockRedirect).toHaveBeenCalledWith("/");
  });

  it("renders page title and choices for fresh community user", async () => {
    vi.spyOn(supabaseServer, "getCurrentUserProfile").mockResolvedValue(
      mockAuth("user-fresh", "community", null)
    );

    const jsx = await OnboardingRolePage({
      searchParams: Promise.resolve({ redirect: "/submit" }),
    });
    render(jsx);

    expect(
      screen.getByRole("heading", {
        name: "Welcome! How will you use Startup Showcase?",
      })
    ).toBeDefined();
    expect(
      screen.getByText("Founder / Builder (Submit startups)")
    ).toBeDefined();
    expect(
      screen.getByText("Investor / Angel / Mentor")
    ).toBeDefined();
    expect(
      screen.getByText("Community Member / Early Adopter")
    ).toBeDefined();
  });
});

describe("RoleForm (Client Form)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("submits founder role choice and routes to target redirect", async () => {
    const chooseSpy = vi
      .spyOn(actions, "chooseInitialRoleAction")
      .mockResolvedValue({ success: true, role: "founder" });

    render(<RoleForm targetRedirect="/submit" />);

    // Default is founder
    const submitBtn = screen.getByRole("button", { name: /continue/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(chooseSpy).toHaveBeenCalledWith("founder");
      expect(mockPush).toHaveBeenCalledWith("/submit");
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it("submits investor role choice when selected", async () => {
    const chooseSpy = vi
      .spyOn(actions, "chooseInitialRoleAction")
      .mockResolvedValue({ success: true, role: "investor" });

    render(<RoleForm targetRedirect="/investors" />);

    const investorRadio = screen.getByLabelText(/Investor \/ Angel \/ Mentor/i);
    fireEvent.click(investorRadio);

    const submitBtn = screen.getByRole("button", { name: /continue/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(chooseSpy).toHaveBeenCalledWith("investor");
      expect(mockPush).toHaveBeenCalledWith("/investors");
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it("submits community role via chooseCommunityRoleAction when selected", async () => {
    const communitySpy = vi
      .spyOn(actions, "chooseCommunityRoleAction")
      .mockResolvedValue({ success: true, role: "community" });

    render(<RoleForm targetRedirect="/" />);

    const communityRadio = screen.getByLabelText(
      /Community Member \/ Early Adopter/i
    );
    fireEvent.click(communityRadio);

    const submitBtn = screen.getByRole("button", { name: /continue/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(communitySpy).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/");
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it("displays inline error when role action returns an error", async () => {
    vi.spyOn(actions, "chooseInitialRoleAction").mockResolvedValue({
      error: "Initial role has already been chosen.",
    });

    render(<RoleForm targetRedirect="/" />);

    const submitBtn = screen.getByRole("button", { name: /continue/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText("Initial role has already been chosen.")
      ).toBeDefined();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });
});
