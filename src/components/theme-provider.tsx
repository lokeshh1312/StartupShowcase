"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ThemePreference, ResolvedTheme } from "@/lib/theme";
import {
  parseThemeCookie,
  resolveThemeClass,
  buildThemeCookieValue,
} from "@/lib/theme";

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface ThemeContextValue {
  /** The user's stored preference ("light" | "dark" | "system"). */
  preference: ThemePreference;
  /** The resolved value currently applied to `<html>`. */
  resolved: ResolvedTheme;
  /** Cycle through light → dark → system → light … */
  toggleTheme: () => void;
  /** Set an explicit preference. */
  setPreference: (pref: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// ---------------------------------------------------------------------------
// Helpers (client-only, guarded)
// ---------------------------------------------------------------------------

function systemPrefersDark(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyToDOM(resolved: ResolvedTheme) {
  const el = document.documentElement;
  el.classList.remove("light", "dark");
  el.classList.add(resolved);
  el.setAttribute("data-theme", resolved);
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

/**
 * ThemeProvider reads the initial preference from the cookie (set by the
 * inline `<head>` script and/or previous visits).
 *
 * It never branches on client-only APIs during the initial `useState` call
 * — the inline script has already applied the correct class to `<html>`,
 * and this provider simply keeps React state in sync.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // On the server this returns null → we default to "system".
  // On the client the inline script has already run, so the DOM is correct;
  // we just read the cookie to seed React state.
  const [preference, setPreference] = useState<ThemePreference>(() => {
    if (typeof document === "undefined") return "system";
    return parseThemeCookie(document.cookie) ?? "system";
  });

  // Resolve once per preference change (and on first mount).
  const resolved = useMemo<ResolvedTheme>(
    () => resolveThemeClass(preference, systemPrefersDark()),
    [preference],
  );

  // Sync DOM + cookie whenever resolved changes.
  useEffect(() => {
    applyToDOM(resolved);
    document.cookie = buildThemeCookieValue(preference);
  }, [resolved, preference]);

  // Listen for OS-level dark mode changes when preference === "system".
  useEffect(() => {
    if (preference !== "system") return;

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      applyToDOM(e.matches ? "dark" : "light");
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [preference]);

  const toggleTheme = useCallback(() => {
    setPreference((prev) => {
      if (prev === "light") return "dark";
      if (prev === "dark") return "system";
      return "light"; // system → light
    });
  }, []);

  const ctx = useMemo<ThemeContextValue>(
    () => ({ preference, resolved, toggleTheme, setPreference }),
    [preference, resolved, toggleTheme],
  );

  return <ThemeContext.Provider value={ctx}>{children}</ThemeContext.Provider>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}
