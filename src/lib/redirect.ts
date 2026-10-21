/**
 * Validates and sanitizes a redirect target path.
 *
 * Requirements:
 * - Only accept a target that starts with a single "/"
 * - Must NOT start with "//" or "/\"
 * - Must have no URI scheme (e.g. javascript:, https:, http:, data:)
 * - Must not contain backslashes anywhere in the path
 * - Otherwise falls back to "/" (or provided fallback)
 */
export function safeRedirectPath(
  target?: string | null,
  fallback: string = "/"
): string {
  if (!target || typeof target !== "string") {
    return fallback;
  }

  const trimmed = target.trim();

  // Must start with exactly one "/" and NOT start with "//" or "/\"
  if (
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    trimmed.startsWith("/\\")
  ) {
    return fallback;
  }

  // Reject any backslashes anywhere in path to prevent browser path normalization tricks
  if (trimmed.includes("\\")) {
    return fallback;
  }

  // Reject any URI scheme before query or hash (e.g. javascript:, data:, https:)
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
    return fallback;
  }

  // Verify URL parsing does not resolve to an external host or unexpected protocol
  try {
    const dummyBase = "http://localhost";
    const parsed = new URL(trimmed, dummyBase);

    if (parsed.origin !== dummyBase || parsed.protocol !== "http:") {
      return fallback;
    }

    return trimmed;
  } catch {
    return fallback;
  }
}
