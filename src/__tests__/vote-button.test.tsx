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

describe("VoteButton Component - Responsive Heart-Only and Desktop Sizing", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockPush.mockClear();
  });

  it("adds max-lg:hidden class to the count element and aria-label still contains the count", () => {
    render(
      <VoteButton
        startupIdOrSlug="test-startup"
        startupName="Test Startup"
        initialLikes={42}
        initialLiked={false}
        size="default"
      />
    );

    const button = screen.getByRole("button", { name: "Like Test Startup, currently 42 likes" });
    expect(button).toBeDefined();

    // Verify aria-label contains the count
    expect(button.getAttribute("aria-label")).toBe("Like Test Startup, currently 42 likes");
    expect(button.getAttribute("title")).toBe("Like this startup");

    // The count element must have the hide-below-breakpoint class
    const countElement = button.querySelector("span");
    expect(countElement).not.toBeNull();
    expect(countElement?.textContent).toBe("42");
    expect(countElement?.classList.contains("max-lg:hidden")).toBe(true);
  });

  it("applies container classes only at/above the breakpoint (lg:) and strips container box below lg", () => {
    render(
      <VoteButton
        startupIdOrSlug="test-startup"
        startupName="Test Startup"
        initialLikes={10}
        initialLiked={false}
        size="default"
      />
    );

    const button = screen.getByRole("button");

    // Below breakpoint: no container (no border, no bg, no shadow, no rounded box, no min-w/padding box)
    expect(button.classList.contains("border-0")).toBe(true);
    expect(button.classList.contains("bg-transparent")).toBe(true);
    expect(button.classList.contains("shadow-none")).toBe(true);
    expect(button.classList.contains("rounded-none")).toBe(true);
    expect(button.classList.contains("p-0")).toBe(true);

    // Touch target is >= 44x44px below lg (w-11 h-11 = 44x44px)
    expect(button.classList.contains("w-11")).toBe(true);
    expect(button.classList.contains("h-11")).toBe(true);

    // Desktop container classes are prefixed with lg:
    expect(button.className).toContain("lg:border");
    expect(button.className).toContain("lg:rounded-xl");
    expect(button.className).toContain("lg:min-w-[58px]");
    expect(button.className).toContain("lg:min-h-[36px]");
    expect(button.className).toContain("lg:shadow-2xs");
  });

  it("ensures liked state has no container box below lg and container styling is scoped to lg:", () => {
    render(
      <VoteButton
        startupIdOrSlug="test-startup"
        startupName="Test Startup"
        initialLikes={15}
        initialLiked={true}
        size="sm"
      />
    );

    const button = screen.getByRole("button");

    // Still no container below lg
    expect(button.classList.contains("border-0")).toBe(true);
    expect(button.classList.contains("bg-transparent")).toBe(true);
    expect(button.classList.contains("shadow-none")).toBe(true);

    // Desktop container classes when liked have lg: prefix
    expect(button.className).toContain("lg:bg-rose-50");
    expect(button.className).toContain("lg:border-rose-300");
    expect(button.className).toContain("lg:shadow-xs");
    expect(button.className).toContain("lg:rounded-lg");
  });

  it("renders heart icon about 24px (w-6 h-6) below breakpoint across all sizes, and scales at/above lg", () => {
    // 1. Small size
    const { rerender } = render(
      <VoteButton startupName="Small" size="sm" initialLikes={5} />
    );
    let heart = screen.getByRole("button").querySelector("svg");
    expect(heart?.classList.contains("w-6")).toBe(true);
    expect(heart?.classList.contains("h-6")).toBe(true);
    expect(heart?.classList.contains("lg:w-[18px]")).toBe(true);
    expect(heart?.classList.contains("lg:h-[18px]")).toBe(true);

    // 2. Default size
    rerender(<VoteButton startupName="Default" size="default" initialLikes={5} />);
    heart = screen.getByRole("button").querySelector("svg");
    expect(heart?.classList.contains("w-6")).toBe(true);
    expect(heart?.classList.contains("h-6")).toBe(true);
    expect(heart?.classList.contains("lg:w-5")).toBe(true);
    expect(heart?.classList.contains("lg:h-5")).toBe(true);

    // 3. Large size
    rerender(<VoteButton startupName="Large" size="lg" initialLikes={5} />);
    heart = screen.getByRole("button").querySelector("svg");
    expect(heart?.classList.contains("w-6")).toBe(true);
    expect(heart?.classList.contains("h-6")).toBe(true);
  });

  it("hides Like/Liked label on size lg below breakpoint with max-lg:hidden", () => {
    render(<VoteButton startupName="Large" size="lg" initialLikes={10} initialLiked={false} />);

    const button = screen.getByRole("button");
    const spans = button.querySelectorAll("span");
    expect(spans.length).toBe(2);

    // Count span
    expect(spans[0].textContent).toBe("10");
    expect(spans[0].classList.contains("max-lg:hidden")).toBe(true);

    // Label span
    expect(spans[1].textContent).toBe("Like");
    expect(spans[1].classList.contains("max-lg:hidden")).toBe(true);
  });

  it("performs optimistic toggle (+1 / -1) and updates aria-label immediately", async () => {
    const voteSpy = vi.spyOn(actions, "voteAction").mockResolvedValue({
      success: true,
      liked: true,
      likesCount: 6,
    });

    render(<VoteButton startupIdOrSlug="test-slug" startupName="Acme" initialLikes={5} initialLiked={false} />);

    const button = screen.getByRole("button");
    expect(button.getAttribute("aria-label")).toBe("Like Acme, currently 5 likes");

    // Click to like
    fireEvent.click(button);

    // Optimistically updated
    expect(button.getAttribute("aria-label")).toBe("Like Acme, currently 6 likes");
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

    render(<VoteButton startupIdOrSlug="test-slug" startupName="Acme" initialLikes={5} initialLiked={false} />);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    // Optimistic toggle
    expect(button.getAttribute("aria-label")).toBe("Like Acme, currently 6 likes");

    // After failure response, reverted
    await waitFor(() => {
      expect(button.getAttribute("aria-label")).toBe("Like Acme, currently 5 likes");
      expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("/login?redirect="));
    });
  });
});
