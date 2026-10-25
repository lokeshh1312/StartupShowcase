/**
 * @vitest-environment jsdom
 */

import React, { useState } from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { TurnstileWidget } from "@/components/common/turnstile";

interface TurnstileRenderOptions {
  sitekey: string;
  callback: (token: string) => void;
  "expired-callback"?: () => void;
  "error-callback"?: (errorCode?: string | number) => void;
  theme?: "light" | "dark" | "auto";
}

describe("TurnstileWidget", () => {
  const originalEnv = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  let mockRender: ReturnType<typeof vi.fn>;
  let mockReset: ReturnType<typeof vi.fn>;
  let mockRemove: ReturnType<typeof vi.fn>;
  let capturedOptions: TurnstileRenderOptions | null = null;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = "1x00000000000000000000AA";
    capturedOptions = null;

    mockRender = vi.fn().mockImplementation((_container: HTMLElement, options: TurnstileRenderOptions) => {
      capturedOptions = options;
      return "widget-id-123";
    });
    mockReset = vi.fn();
    mockRemove = vi.fn();

    window.turnstile = {
      render: mockRender,
      reset: mockReset,
      remove: mockRemove,
    };
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = originalEnv;
    delete window.turnstile;
    vi.restoreAllMocks();
  });

  it("calls turnstile.render once even when the parent re-renders three times with new inline callbacks", () => {
    let parentRenderCount = 0;
    let triggerParentRerender: () => void = () => {};

    function TestParent() {
      const [, setTick] = useState(0);
      parentRenderCount++;
      triggerParentRerender = () => setTick((t) => t + 1);

      // Inline arrow functions passed on every render
      return (
        <TurnstileWidget
          onVerify={(token) => {
            void token;
          }}
          onExpire={() => {}}
        />
      );
    }

    render(<TestParent />);
    expect(parentRenderCount).toBe(1);
    expect(mockRender).toHaveBeenCalledTimes(1);

    // Re-render parent 1st time
    act(() => {
      triggerParentRerender();
    });
    expect(parentRenderCount).toBe(2);
    expect(mockRender).toHaveBeenCalledTimes(1);

    // Re-render parent 2nd time
    act(() => {
      triggerParentRerender();
    });
    expect(parentRenderCount).toBe(3);
    expect(mockRender).toHaveBeenCalledTimes(1);

    // Re-render parent 3rd time
    act(() => {
      triggerParentRerender();
    });
    expect(parentRenderCount).toBe(4);
    expect(mockRender).toHaveBeenCalledTimes(1);

    // Turnstile widget was rendered exactly once and never removed/re-created
    expect(mockRemove).not.toHaveBeenCalled();
  });

  it("updates onVerify ref so latest callback is invoked without re-rendering turnstile", () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    const { rerender } = render(
      <TurnstileWidget onVerify={callback1} onExpire={() => {}} />
    );
    expect(mockRender).toHaveBeenCalledTimes(1);

    // Re-render with new callback
    rerender(<TurnstileWidget onVerify={callback2} onExpire={() => {}} />);
    expect(mockRender).toHaveBeenCalledTimes(1);

    // Simulate Turnstile success callback
    act(() => {
      capturedOptions?.callback("token-xyz");
    });

    expect(callback1).not.toHaveBeenCalled();
    expect(callback2).toHaveBeenCalledWith("token-xyz");
  });

  it("calls window.turnstile.reset(widgetId) and onExpire when resetSignal changes", () => {
    const onExpire = vi.fn();
    const { rerender } = render(
      <TurnstileWidget
        onVerify={() => {}}
        onExpire={onExpire}
        resetSignal={0}
      />
    );

    expect(mockReset).not.toHaveBeenCalled();
    expect(onExpire).not.toHaveBeenCalled();

    // Increment resetSignal
    rerender(
      <TurnstileWidget
        onVerify={() => {}}
        onExpire={onExpire}
        resetSignal={1}
      />
    );

    expect(mockReset).toHaveBeenCalledTimes(1);
    expect(mockReset).toHaveBeenCalledWith("widget-id-123");
    expect(onExpire).toHaveBeenCalledTimes(1);

    // Increment resetSignal again
    rerender(
      <TurnstileWidget
        onVerify={() => {}}
        onExpire={onExpire}
        resetSignal={2}
      />
    );

    expect(mockReset).toHaveBeenCalledTimes(2);
    expect(onExpire).toHaveBeenCalledTimes(2);
  });

  it("properly handles error-callback: logs console.warn with error code and shows user-friendly message without leaking error code", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const onExpire = vi.fn();

    render(
      <TurnstileWidget
        onVerify={() => {}}
        onExpire={onExpire}
      />
    );

    expect(capturedOptions).toBeDefined();

    // Trigger error callback with a raw Cloudflare error code
    const rawErrorCode = "300030_internal_error";
    act(() => {
      capturedOptions?.["error-callback"]?.(rawErrorCode);
    });

    // Logs console.warn with the error code
    expect(warnSpy).toHaveBeenCalledWith("[Turnstile Error]:", rawErrorCode);
    // onExpire is triggered so parent clears invalid state
    expect(onExpire).toHaveBeenCalled();

    // Displays the user-friendly message
    const errorMsg = screen.getByRole("alert");
    expect(errorMsg).toBeDefined();
    expect(errorMsg.textContent).toBe(
      "Verification could not load. Disable ad blockers or try another browser."
    );

    // Ensure error code is NOT leaked to users
    expect(document.body.textContent).not.toContain(rawErrorCode);
  });

  it("renders null when siteKey is missing", () => {
    delete process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    const { container } = render(
      <TurnstileWidget onVerify={() => {}} />
    );
    expect(container.firstChild).toBeNull();
    expect(mockRender).not.toHaveBeenCalled();
  });

  it("removes widget on unmount", () => {
    const { unmount } = render(
      <TurnstileWidget onVerify={() => {}} />
    );
    expect(mockRemove).not.toHaveBeenCalled();

    unmount();
    expect(mockRemove).toHaveBeenCalledWith("widget-id-123");
  });
});
