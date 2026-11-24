/**
 * @vitest-environment jsdom
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { VoteButton } from "@/components/startup/vote-button";
import * as actions from "@/server/actions";

// Mock router
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe("VoteButton Component - Heart-Only Everywhere (All Widths & Sizes)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockPush.mockClear();
  });

  it("does not render any visible count text or Like/Liked text in any size (sm, default, lg)", () => {
    const sizes: Array<"sm" | "default" | "lg"> = ["sm", "default", "lg"];

    for (const size of sizes) {
      const { unmount } = render(
        <VoteButton
          startupIdOrSlug="test-startup"
          startupName="Test Startup"
          initialLikes={42}
          initialLiked={false}
          size={size}
        />
      );

      const button = screen.getByRole("button", { name: "Like Test Startup, currently 42 likes" });
      expect(button).toBeDefined();

      // No span elements in the DOM
      expect(button.querySelector("span")).toBeNull();

      // No visible count text
      expect(button.textContent).toBe("");

      // No "Like" or "Liked" text rendered inside the button
      expect(screen.queryByText(/^42$/)).toBeNull();
      expect(screen.queryByText(/^Like$/i)).toBeNull();
      expect(screen.queryByText(/^Liked$/i)).toBeNull();

      unmount();
    }
  });

  it("has no border, background, or shadow classes at any breakpoint (unscoped or lg:)", () => {
    const { rerender } = render(
      <VoteButton
        startupIdOrSlug="test-startup"
        startupName="Test Startup"
        initialLikes={10}
        initialLiked={false}
        size="default"
      />
    );

    let button = screen.getByRole("button");

    // No border classes at all
    expect(button.className).not.toMatch(/\bborder\b/);
    expect(button.className).not.toMatch(/lg:border/);

    // No background classes at all
    expect(button.className).not.toMatch(/\bbg-/);
    expect(button.className).not.toMatch(/lg:bg-/);

    // No shadow classes at all
    expect(button.className).not.toMatch(/\bshadow\b/);
    expect(button.className).not.toMatch(/lg:shadow/);

    // Touch/click target of at least 44x44px (w-11 h-11 = 44x44px)
    expect(button.classList.contains("w-11")).toBe(true);
    expect(button.classList.contains("h-11")).toBe(true);

    // Circular focus ring
    expect(button.classList.contains("rounded-full")).toBe(true);
    expect(button.className).toContain("focus-visible:ring-2");
    expect(button.className).toContain("focus-visible:ring-brand-500");

    // Verify same lack of container classes when liked
    rerender(
      <VoteButton
        startupIdOrSlug="test-startup"
        startupName="Test Startup"
        initialLikes={11}
        initialLiked={true}
        size="lg"
      />
    );

    button = screen.getByRole("button");
    expect(button.className).not.toMatch(/\bborder\b/);
    expect(button.className).not.toMatch(/lg:border/);
    expect(button.className).not.toMatch(/\bbg-/);
    expect(button.className).not.toMatch(/lg:bg-/);
    expect(button.className).not.toMatch(/\bshadow\b/);
    expect(button.className).not.toMatch(/lg:shadow/);
  });

  it("applies heart classes w-6 h-6 lg:w-7 lg:h-7 across all sizes (sm, default, lg)", () => {
    const sizes: Array<"sm" | "default" | "lg"> = ["sm", "default", "lg"];

    for (const size of sizes) {
      const { unmount } = render(
        <VoteButton startupName="SizeTest" size={size} initialLikes={5} initialLiked={false} />
      );

      const heart = screen.getByRole("button").querySelector("svg");
      expect(heart).not.toBeNull();
      expect(heart?.classList.contains("w-6")).toBe(true);
      expect(heart?.classList.contains("h-6")).toBe(true);
      expect(heart?.classList.contains("lg:w-7")).toBe(true);
      expect(heart?.classList.contains("lg:h-7")).toBe(true);

      // Outline in muted slate when not liked
      expect(heart?.classList.contains("fill-none")).toBe(true);
      const heartClass = heart?.getAttribute("class") ?? "";
      expect(heartClass).toContain("text-slate-400");
      expect(heartClass).toContain("group-hover/vote:text-slate-900");

      unmount();
    }
  });

  it("renders filled rose heart when liked with hover feedback", () => {
    render(<VoteButton startupName="LikedStartup" initialLikes={7} initialLiked={true} />);

    const heart = screen.getByRole("button").querySelector("svg");
    expect(heart).not.toBeNull();
    expect(heart?.classList.contains("fill-current")).toBe(true);
    const heartClass = heart?.getAttribute("class") ?? "";
    expect(heartClass).toContain("text-rose-500");
  });

  it("keeps aria-label containing startup name and count, and title attribute", () => {
    render(
      <VoteButton
        startupIdOrSlug="test-startup"
        startupName="Acme Corp"
        initialLikes={25}
        initialLiked={false}
      />
    );

    const button = screen.getByRole("button");
    expect(button.getAttribute("aria-label")).toBe("Like Acme Corp, currently 25 likes");
    expect(button.getAttribute("title")).toBe("Like this startup");
  });

  it("toggling still updates the aria-label count immediately (optimistic toggle)", async () => {
    const voteSpy = vi.spyOn(actions, "voteAction").mockResolvedValue({
      success: true,
      liked: true,
      likesCount: 6,
    });

    render(
      <VoteButton
        startupIdOrSlug="test-slug"
        startupName="Acme"
        initialLikes={5}
        initialLiked={false}
      />
    );

    const button = screen.getByRole("button");
    expect(button.getAttribute("aria-label")).toBe("Like Acme, currently 5 likes");
    expect(button.getAttribute("title")).toBe("Like this startup");

    // Click to like (+1)
    fireEvent.click(button);

    // Optimistically updated aria-label and title
    expect(button.getAttribute("aria-label")).toBe("Like Acme, currently 6 likes");
    expect(button.getAttribute("title")).toBe("Liked! Click to undo");
    const heart = button.querySelector("svg");
    expect(heart?.classList.contains("fill-current")).toBe(true);

    await waitFor(() => {
      expect(voteSpy).toHaveBeenCalledWith("test-slug");
    });
  });

  it("redirects unauthenticated users to login and reverts optimistic update", async () => {
    vi.spyOn(actions, "voteAction").mockResolvedValue({
      error: "unauthenticated",
    });

    render(
      <VoteButton
        startupIdOrSlug="test-slug"
        startupName="Acme"
        initialLikes={5}
        initialLiked={false}
      />
    );

    const button = screen.getByRole("button");
    fireEvent.click(button);

    // Optimistic toggle
    expect(button.getAttribute("aria-label")).toBe("Like Acme, currently 6 likes");

    // After failure response, reverted
    await waitFor(() => {
      expect(button.getAttribute("aria-label")).toBe("Like Acme, currently 5 likes");
      expect(button.getAttribute("title")).toBe("Like this startup");
      expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("/login?redirect="));
    });
  });
});
