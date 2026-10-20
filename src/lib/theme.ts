/**
 * Theme utilities — pure functions with no DOM/React dependency.
 * Safe to import on the server AND the client.
 */

/** The three persisted preference values. */
export type ThemePreference = "light" | "dark" | "system";

/** The two resolved (applied) values. */
export type ResolvedTheme = "light" | "dark";

/**
 * Parse the `theme` cookie value from a raw `document.cookie` or
 * `Cookie` header string.
 *
 * Returns `null` when the cookie is missing or has an unrecognised value.
 */
export function parseThemeCookie(
  cookieString: string | undefined | null,
): ThemePreference | null {
  if (!cookieString) return null;
  const match = cookieString.match(/(?:^|;\s*)theme=(light|dark|system)/);
  if (!match) return null;
  return match[1] as ThemePreference;
}

/**
 * Given a preference and the system setting, return the concrete theme
 * class to put on `<html>`.
 *
 * @param preference  The stored cookie value (or `null` → defaults to "system").
 * @param systemDark  Whether the OS / browser prefers dark mode.
 */
export function resolveThemeClass(
  preference: ThemePreference | null,
  systemDark: boolean,
): ResolvedTheme {
  const pref = preference ?? "system";
  if (pref === "light") return "light";
  if (pref === "dark") return "dark";
  // "system"
  return systemDark ? "dark" : "light";
}

/**
 * Build the `Set-Cookie`-style value used by `document.cookie`.
 * max-age = 1 year, path = /, SameSite = Lax.
 */
export function buildThemeCookieValue(preference: ThemePreference): string {
  return `theme=${preference};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`;
}

/**
 * The inline script injected into `<head>` by the root layout.
 *
 * It runs **before** first paint and:
 *   1. Reads the `theme` cookie.
 *   2. If missing or "system", uses `matchMedia("(prefers-color-scheme: dark)")`.
 *   3. Adds the resolved `dark` or `light` class (and `data-theme`) to `<html>`.
 *
 * This prevents any flash of wrong theme (FOWT).
 *
 * We keep this as a plain string so it can be embedded with
 * `dangerouslySetInnerHTML` — no external script request.
 */
export const themeInitScript = `
(function(){
  try {
    var m = document.cookie.match(/(?:^|;\\s*)theme=(light|dark|system)/);
    var pref = m ? m[1] : "system";
    var resolved = pref === "system"
      ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : pref;
    var el = document.documentElement;
    el.classList.remove("light","dark");
    el.classList.add(resolved);
    el.setAttribute("data-theme", resolved);
  } catch(e){}
})();
`.trim();
