/**
 * Theme utilities — pure functions with no DOM/React dependency.
 * Safe to import on the server AND the client.
 */

/** The persisted preference values or default. */
export type ThemePreference = "light" | "dark" | "system";

/** The two resolved (applied) values. */
export type ResolvedTheme = "light" | "dark";

/**
 * Parse the `theme` cookie value from a raw `document.cookie` or
 * `Cookie` header string.
 *
 * Cookies only store "light" or "dark". Returns `null` when the cookie
 * is missing or has an unrecognised value.
 */
export function parseThemeCookie(
  cookieString: string | undefined | null,
): ResolvedTheme | null {
  if (!cookieString) return null;
  const match = cookieString.match(/(?:^|;\s*)theme=(light|dark)(?:;|$)/);
  if (!match) return null;
  return match[1] as ResolvedTheme;
}

/**
 * Given a preference and the system setting, return the concrete theme
 * class to put on `<html>`.
 *
 * @param preference  The stored cookie value (or null / "system" → defaults to system).
 * @param systemDark  Whether the OS / browser prefers dark mode.
 */
export function resolveThemeClass(
  preference: ThemePreference | null,
  systemDark: boolean,
): ResolvedTheme {
  if (preference === "light") return "light";
  if (preference === "dark") return "dark";
  // "system" or null
  return systemDark ? "dark" : "light";
}

/**
 * Build the `Set-Cookie`-style value used by `document.cookie`.
 * max-age = 1 year, path = /, SameSite = Lax.
 * Stores only "light" or "dark".
 */
export function buildThemeCookieValue(theme: ResolvedTheme): string {
  return `theme=${theme};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`;
}

/**
 * The inline script injected into `<head>` by the root layout.
 *
 * It runs **before** first paint and:
 *   1. Reads the `theme` cookie (storing "light" or "dark").
 *   2. If missing, uses `matchMedia("(prefers-color-scheme: dark)")` (system default).
 *   3. Adds the resolved `dark` or `light` class (and `data-theme`) to `<html>`.
 *
 * This prevents any flash of wrong theme (FOWT).
 */
export const themeInitScript = `
(function(){
  try {
    var m = document.cookie.match(/(?:^|;\\s*)theme=(light|dark)(?:;|$)/);
    var pref = m ? m[1] : null;
    var resolved = pref ? pref : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    var el = document.documentElement;
    el.classList.remove("light","dark");
    el.classList.add(resolved);
    el.setAttribute("data-theme", resolved);
  } catch(e){}
})();
`.trim();
