/* eslint-disable @next/next/no-img-element */
/* eslint-disable jsx-a11y/alt-text */
/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import React from "react";
import { Navbar } from "@/components/navbar";

// Mock next/navigation
let currentPathname = "/";
vi.mock("next/navigation", () => ({
  usePathname: () => currentPathname,
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock next/image
vi.mock("next/image", () => ({
  default: (props: {
    src: string;
    alt: string;
    className?: string;
    priority?: boolean;
    [key: string]: unknown;
  }) => {
    const { priority: _unused, ...imgProps } = props;
    void _unused;
    return <img {...imgProps} />;
  },
}));

// Mock next/dynamic
vi.mock("next/dynamic", () => ({
  default: () => {
    return function MockDynamicComponent(props: {
      isOpen: boolean;
      onClose: () => void;
      triggerRef?: React.RefObject<HTMLButtonElement | null>;
    }) {
      if (!props.isOpen) return null;
      return (
        <div role="dialog" aria-label="Investors">
          <button
            type="button"
            onClick={() => {
              props.onClose();
              props.triggerRef?.current?.focus();
            }}
            aria-label="Close Investors"
          >
            Close Investors
          </button>
        </div>
      );
    };
  },
}));

// Mock theme toggle
vi.mock("@/components/theme-toggle", () => ({
  ThemeToggle: ({ className }: { className?: string }) => (
    <button type="button" className={className} aria-label="Toggle theme">
      Toggle theme
    </button>
  ),
}));

// Mock theme provider
vi.mock("@/components/theme-provider", () => ({
  useTheme: () => ({
    theme: "light",
    resolvedTheme: "light",
    setTheme: vi.fn(),
    toggleTheme: vi.fn(),
  }),
}));

// Mock server actions
vi.mock("@/server/actions", () => ({
  signOutAction: vi.fn(),
}));

describe("Navbar Component", () => {
  const originalBodyOverflow = document.body.style.overflow;

  beforeEach(() => {
    currentPathname = "/";
    document.body.style.overflow = "";
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.body.style.overflow = originalBodyOverflow;
  });

  it("renders centered logo with correct aria-label and sr-only text", () => {
    render(<Navbar />);

    const logoLinks = screen.getAllByRole("link", {
      name: "Startup Showcase Global Home",
    });
    expect(logoLinks.length).toBeGreaterThan(0);

    const mainLogoLink = logoLinks[0];
    expect(mainLogoLink.getAttribute("href")).toBe("/");

    expect(mainLogoLink.classList.contains("navbar-logo-link")).toBe(true);

    const logoSvg = mainLogoLink.querySelector("svg");
    expect(logoSvg).not.toBeNull();
    expect(logoSvg?.getAttribute("viewBox")).toBe("0 0 100 100");
    expect(logoSvg?.querySelector(".orbit")).not.toBeNull();

    const srOnlyText = mainLogoLink.querySelector(".sr-only");
    expect(srOnlyText?.textContent).toBe("Startup Showcase Global");
  });

  it("renders hamburger button with exact aria-label 'Toggle mobile menu'", () => {
    render(<Navbar />);

    const hamburger = screen.getByRole("button", {
      name: "Toggle mobile menu",
    });
    expect(hamburger).toBeDefined();
    expect(hamburger.getAttribute("aria-expanded")).toBe("false");
    expect(hamburger.getAttribute("aria-controls")).toBe("mobile-menu");
  });

  it("opens full-screen mobile menu on hamburger click and closes with close button", () => {
    render(<Navbar />);

    const hamburger = screen.getByRole("button", {
      name: "Toggle mobile menu",
    });

    // Before click, mobile menu dialog does not exist
    expect(screen.queryByRole("dialog", { name: "Main menu" })).toBeNull();

    // Click hamburger to open
    fireEvent.click(hamburger);

    const dialog = screen.getByRole("dialog", { name: "Main menu" });
    expect(dialog).toBeDefined();
    expect(dialog.id).toBe("mobile-menu");
    expect(dialog.parentElement).toBe(document.body);
    expect(document.body.style.overflow).toBe("hidden");

    // Close button exists inside overlay
    const closeBtn = screen.getByRole("button", { name: "Close menu" });
    expect(closeBtn).toBeDefined();

    // Click close button
    fireEvent.click(closeBtn);

    // Dialog should be closed and removed from DOM
    expect(screen.queryByRole("dialog", { name: "Main menu" })).toBeNull();
    expect(document.body.style.overflow).toBe("");
  });

  it("closes full-screen mobile menu when Escape key is pressed", () => {
    render(<Navbar />);

    const hamburger = screen.getByRole("button", {
      name: "Toggle mobile menu",
    });
    fireEvent.click(hamburger);

    expect(screen.getByRole("dialog", { name: "Main menu" })).toBeDefined();

    fireEvent.keyDown(window, { key: "Escape" });

    expect(screen.queryByRole("dialog", { name: "Main menu" })).toBeNull();
  });

  it("renders links for signed-out visitors (desktop and mobile overlay)", () => {
    render(<Navbar user={null} profile={null} />);

    // Primary nav links & Investors buttons
    expect(screen.getAllByRole("link", { name: "Home" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Browse" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "Investors" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "About" }).length).toBeGreaterThan(0);

    // Sign in and Sign up
    expect(screen.getByRole("link", { name: "Sign in" })).toBeDefined();
    expect(screen.getByRole("link", { name: "Sign up" })).toBeDefined();

    // Submit Startup CTA
    const submitLinks = screen.getAllByRole("link", { name: /Submit Startup/i });
    expect(submitLinks.length).toBeGreaterThan(0);

    // Open mobile menu
    const hamburger = screen.getByRole("button", { name: "Toggle mobile menu" });
    fireEvent.click(hamburger);

    const dialog = screen.getByRole("dialog", { name: "Main menu" });
    expect(dialog).toBeDefined();

    // Both Sign in and Sign up present in overlay
    const overlaySignIn = screen.getAllByRole("link", { name: "Sign in" });
    expect(overlaySignIn.length).toBe(2); // desktop + mobile overlay

    const overlaySignUp = screen.getAllByRole("link", { name: "Sign up" });
    expect(overlaySignUp.length).toBe(2); // desktop + mobile overlay
  });

  it("renders links and sign-out form for signed-in user", () => {
    const mockUser = { id: "user-123", email: "founder@example.com" };
    const mockProfile = { id: "user-123", displayName: "Founder", role: "founder" };

    render(<Navbar user={mockUser} profile={mockProfile} />);

    // Open mobile menu
    const hamburger = screen.getByRole("button", { name: "Toggle mobile menu" });
    fireEvent.click(hamburger);

    expect(screen.getByRole("link", { name: "Public Profile" })).toBeDefined();
    expect(screen.getByRole("link", { name: "My Submissions" })).toBeDefined();
    expect(screen.getByRole("link", { name: "Saved Startups" })).toBeDefined();
    expect(screen.getByText("founder@example.com")).toBeDefined();

    // Sign out button should be present in mobile overlay
    const signOutBtn = screen.getByRole("button", { name: "Sign out" });
    expect(signOutBtn).toBeDefined();
    expect(signOutBtn.closest("form")).not.toBeNull();

    // Non-admin should NOT see Admin Review
    expect(screen.queryByRole("link", { name: "Admin Review" })).toBeNull();
  });

  it("keeps the sign-out form and overlay mounted when Sign out button is clicked", () => {
    const mockUser = { id: "user-123", email: "founder@example.com" };
    const mockProfile = { id: "user-123", displayName: "Founder", role: "founder" };

    render(<Navbar user={mockUser} profile={mockProfile} />);

    const hamburger = screen.getByRole("button", { name: "Toggle mobile menu" });
    fireEvent.click(hamburger);

    const dialog = screen.getByRole("dialog", { name: "Main menu" });
    expect(dialog).toBeDefined();

    const signOutBtn = screen.getByRole("button", { name: "Sign out" });
    const form = signOutBtn.closest("form");
    expect(form).not.toBeNull();

    // Clicking the Sign out button should NOT unmount the dialog or form prematurely
    fireEvent.click(signOutBtn);

    expect(screen.getByRole("dialog", { name: "Main menu" })).toBeDefined();
    expect(document.body.contains(form)).toBe(true);
  });

  it("renders Admin Review link for admin users", () => {
    const mockUser = { id: "admin-456", email: "admin@example.com" };
    const mockProfile = { id: "admin-456", displayName: "Admin User", role: "admin" };

    render(<Navbar user={mockUser} profile={mockProfile} />);

    // Open mobile menu
    const hamburger = screen.getByRole("button", { name: "Toggle mobile menu" });
    fireEvent.click(hamburger);

    const adminLink = screen.getByRole("link", { name: "Admin Review" });
    expect(adminLink).toBeDefined();
    expect(adminLink.getAttribute("href")).toBe("/admin");
    expect(adminLink.className).toContain("text-amber-600");
  });

  it("closes mobile menu when any navigation link is clicked", () => {
    render(<Navbar user={null} profile={null} />);

    const hamburger = screen.getByRole("button", { name: "Toggle mobile menu" });
    fireEvent.click(hamburger);

    expect(screen.getByRole("dialog", { name: "Main menu" })).toBeDefined();

    // Click Browse link inside dialog
    const browseLinks = screen.getAllByRole("link", { name: "Browse" });
    const overlayBrowseLink = browseLinks[browseLinks.length - 1];
    fireEvent.click(overlayBrowseLink);

    expect(screen.queryByRole("dialog", { name: "Main menu" })).toBeNull();
  });

  it("manages focus properly between hamburger and close button", async () => {
    vi.useFakeTimers();
    render(<Navbar user={null} profile={null} />);

    const hamburger = screen.getByRole("button", { name: "Toggle mobile menu" });
    fireEvent.click(hamburger);

    // Fast-forward setTimeout in useEffect
    act(() => {
      vi.runAllTimers();
    });

    const closeBtn = screen.getByRole("button", { name: "Close menu" });
    expect(document.activeElement).toBe(closeBtn);

    // Click close button
    fireEvent.click(closeBtn);

    expect(document.activeElement).toBe(hamburger);
    vi.useRealTimers();
  });

  it("opens Investors modal from desktop button", async () => {
    render(<Navbar user={null} profile={null} />);

    const investorButtons = screen.getAllByRole("button", {
      name: "Investors",
    });
    const desktopBtn = investorButtons[0];

    fireEvent.click(desktopBtn);

    // Modal opens with dialog
    const dialog = await screen.findByRole("dialog", {
      name: "Investors",
    });
    expect(dialog).toBeDefined();

    // Close modal
    const closeBtn = screen.getByRole("button", {
      name: "Close Investors",
    });
    fireEvent.click(closeBtn);

    expect(
      screen.queryByRole("dialog", { name: "Investors" })
    ).toBeNull();
  });

  it("opens Investors modal from mobile menu and closes menu first", async () => {
    render(<Navbar user={null} profile={null} />);

    const hamburger = screen.getByRole("button", { name: "Toggle mobile menu" });
    fireEvent.click(hamburger);

    expect(screen.getByRole("dialog", { name: "Main menu" })).toBeDefined();

    const mobileInvestorBtn = screen.getAllByRole("button", {
      name: "Investors",
    })[1];
    fireEvent.click(mobileInvestorBtn);

    // Mobile menu dialog should be closed
    expect(screen.queryByRole("dialog", { name: "Main menu" })).toBeNull();

    // Investors dialog should be opened
    const dialog = await screen.findByRole("dialog", {
      name: "Investors",
    });
    expect(dialog).toBeDefined();
  });
});
