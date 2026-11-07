/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";

describe("Modal Component (Portaled)", () => {
  const originalBodyOverflow = document.body.style.overflow;

  beforeEach(() => {
    document.body.style.overflow = "";
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.body.style.overflow = originalBodyOverflow;
  });

  it("renders the dialog into document.body and NOT inside the component container", () => {
    const handleClose = vi.fn();
    const { container } = render(
      <div data-testid="parent-wrapper">
        <Modal
          isOpen={true}
          onClose={handleClose}
          title="Test Modal Title"
          subtitle="Test Subtitle"
        >
          <p>Modal Body Content</p>
        </Modal>
      </div>
    );

    // Dialog should NOT be inside the parent container
    expect(container.querySelector('[role="dialog"]')).toBeNull();

    // Dialog MUST be a child of document.body
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeDefined();
    expect(dialog.parentElement).toBe(document.body);
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(dialog.getAttribute("aria-labelledby")).toBe("modal-title");

    // Title and content should be visible
    expect(screen.getByText("Test Modal Title")).toBeDefined();
    expect(screen.getByText("Test Subtitle")).toBeDefined();
    expect(screen.getByText("Modal Body Content")).toBeDefined();
  });

  it("renders null and removes dialog from DOM when isOpen is false", () => {
    const { container, rerender } = render(
      <Modal isOpen={false} onClose={vi.fn()} title="Closed Modal">
        <p>Hidden Content</p>
      </Modal>
    );

    expect(container.firstChild).toBeNull();
    expect(screen.queryByRole("dialog")).toBeNull();

    // Rerender as open
    rerender(
      <Modal isOpen={true} onClose={vi.fn()} title="Open Modal">
        <p>Visible Content</p>
      </Modal>
    );

    expect(screen.getByRole("dialog")).toBeDefined();
    expect(screen.getByText("Open Modal")).toBeDefined();

    // Rerender back to closed
    rerender(
      <Modal isOpen={false} onClose={vi.fn()} title="Closed Modal">
        <p>Hidden Content</p>
      </Modal>
    );

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("locks document.body scroll to hidden while open and restores previous overflow on close", () => {
    document.body.style.overflow = "scroll";

    function TestHarness() {
      const [open, setOpen] = useState(true);
      return (
        <div>
          <button onClick={() => setOpen(false)}>Close Modal</button>
          <Modal isOpen={open} onClose={() => setOpen(false)} title="Scroll Lock Test">
            <p>Body content</p>
          </Modal>
        </div>
      );
    }

    render(<TestHarness />);

    // When open, overflow must be hidden
    expect(document.body.style.overflow).toBe("hidden");

    // Close the modal
    fireEvent.click(screen.getByText("Close Modal"));

    // Previous overflow must be restored
    expect(document.body.style.overflow).toBe("scroll");
  });

  it("calls onClose when Escape key is pressed", () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Escape Test">
        <p>Content</p>
      </Modal>
    );

    fireEvent.keyDown(window, { key: "Escape" });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when clicking the backdrop, but not when clicking inside modal content", () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Backdrop Test">
        <button data-testid="inner-button">Inner Action</button>
      </Modal>
    );

    // Clicking inside the modal content must NOT trigger onClose (stopPropagation)
    fireEvent.click(screen.getByTestId("inner-button"));
    expect(handleClose).not.toHaveBeenCalled();

    // Clicking the backdrop dialog element triggers onClose
    const dialog = screen.getByRole("dialog");
    fireEvent.click(dialog);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when clicking OK button", () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="OK Button Test">
        <p>Content</p>
      </Modal>
    );

    const okButton = screen.getByRole("button", { name: "OK" });
    fireEvent.click(okButton);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("renders close X button and calls onClose when clicked", () => {
    const handleClose = vi.fn();
    render(
      <Modal
        isOpen={true}
        onClose={handleClose}
        title="Close X Test"
        showCloseButton={true}
        hideOkButton={true}
      >
        <p>Content</p>
      </Modal>
    );

    const closeButton = screen.getByRole("button", { name: "Close dialog" });
    fireEvent.click(closeButton);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
