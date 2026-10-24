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
  /** Flip between light and dark based on the currently applied theme. */
  toggleTheme: () => void;
  /** Set an explicit preference. */
  setPreference: (pref: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// ---------------------------------------------------------------------------
// Helpers (client-only, guarded)
// ---------------------------------------------------------------------------

function getSystemPrefersDark(): boolean {
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
 * ThemeProvider reads the initial preference from the cookie ("light" | "dark").
 * When no cookie exists, it defaults to "system".
 *
 * Clicking toggle flips between "light" and "dark" based on the currently
 * applied theme, and writes "light" or "dark" to the cookie.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // If no cookie exists, preference defaults to "system".
  const [preference, setPreference] = useState<ThemePreference>(() => {
    if (typeof document === "undefined") return "system";
    return parseThemeCookie(document.cookie) ?? "system";
  });

  const [systemDark, setSystemDark] = useState<boolean>(() =>
    getSystemPrefersDark(),
  );

  // Keep system preference in sync when preference is "system".
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemDark(mq.matches);
    const handler = (e: MediaQueryListEvent) => {
      setSystemDark(e.matches);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const resolved = useMemo<ResolvedTheme>(
    () => resolveThemeClass(preference, systemDark),
    [preference, systemDark],
  );

  // Sync DOM + cookie whenever resolved / preference changes.
  useEffect(() => {
    applyToDOM(resolved);
    if (preference === "light" || preference === "dark") {
      document.cookie = buildThemeCookieValue(preference);
    }
  }, [resolved, preference]);

  const toggleTheme = useCallback(() => {
    // Flip based on the currently applied theme (from DOM or resolved state).
    const isCurrentlyDark =
      typeof document !== "undefined"
        ? document.documentElement.classList.contains("dark")
        : resolved === "dark";
    const nextTheme: ResolvedTheme = isCurrentlyDark ? "light" : "dark";
    setPreference(nextTheme);
  }, [resolved]);

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
