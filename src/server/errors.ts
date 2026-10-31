import { z } from "zod";
import { captureException } from "@/lib/error-tracking";

/**
 * Checks if an error message represents a known user-facing error condition:
 * - Validation errors
 * - "not found or not approved"
 * - Forbidden / unauthorized role
 * - Unauthenticated / auth credentials & rate limits
 */
function isUserFacingError(message: string): boolean {
  const lower = message.toLowerCase();

  // "not found or not approved"
  if (
    lower.includes("not found or not approved") ||
    lower.includes("startup not found")
  ) {
    return true;
  }

  // Forbidden / Permissions
  if (
    lower.includes("forbidden") ||
    lower.includes("admin privileges required") ||
    lower.includes("only users with the founder role")
  ) {
    return true;
  }

  // Submission & payment deletion / drafts
  if (
    lower.includes("only unpaid draft submissions awaiting payment can be deleted") ||
    lower.includes("this draft has a checkout in progress") ||
    lower.includes("startups with paid or refunded payments cannot be deleted") ||
    lower.includes("payment records cannot be deleted unless older than 7 days")
  ) {
    return true;
  }

  // Unauthenticated / Auth
  if (
    lower === "unauthenticated" ||
    lower.includes("unauthenticated") ||
    lower.includes("invalid login credentials") ||
    lower.includes("sign in") ||
    lower.includes("email and password are required") ||
    lower.includes("password must be at least") ||
    lower.includes("email is required") ||
    lower.includes("passwords do not match") ||
    lower.includes("user already registered") ||
    lower.includes("already in use") ||
    lower.includes("email not confirmed") ||
    lower.includes("rate limit") ||
    lower.includes("unreachable") ||
    lower.includes("payment gateway")
  ) {
    return true;
  }

  return false;
}

/**
 * Formats any action error:
 * - Zod validation errors: reduced to the first human-readable field message, NOT a JSON dump.
 * - Known user-facing errors: returned as friendly messages.
 * - Unexpected errors: logged on server with console.error and client gets
 *   "Something went wrong. Please try again."
 */
export function formatActionError(err: unknown): string {
  // 1. Zod validation error
  if (err instanceof z.ZodError) {
    const first = err.issues[0];
    if (!first) return "Invalid input.";

    const field = first.path.join(".");
    // If the message already includes the field name or there is no field path, return message directly
    if (!field || first.message.toLowerCase().includes(field.toLowerCase())) {
      return first.message;
    }
    return `${field}: ${first.message}`;
  }

  // 2. String error
  if (typeof err === "string") {
    const trimmed = err.trim();
    if (isUserFacingError(trimmed)) {
      return trimmed;
    }
    captureException(err, { context: "formatActionError:string" });
    console.error("[Action Unexpected Error]:", trimmed);
    return "Something went wrong. Please try again.";
  }

  // 3. Error instance
  if (err instanceof Error) {
    const msg = err.message || "";
    if (isUserFacingError(msg)) {
      return msg;
    }
    // Unexpected error: log on server (avoiding secrets)
    captureException(err, { context: "formatActionError:Error" });
    console.error("[Action Unexpected Error]:", err.message, err.stack);
    return "Something went wrong. Please try again.";
  }

  // 4. Plain error-like object with message property
  if (
    err &&
    typeof err === "object" &&
    "message" in err &&
    typeof (err as { message: unknown }).message === "string"
  ) {
    const msg = (err as { message: string }).message;
    if (isUserFacingError(msg)) {
      return msg;
    }
    captureException(err, { context: "formatActionError:object" });
    console.error("[Action Unexpected Error]:", msg);
    return "Something went wrong. Please try again.";
  }

  // 5. Fallback unknown error
  captureException(err, { context: "formatActionError:unknown" });
  console.error("[Action Unexpected Error]:", err);
  return "Something went wrong. Please try again.";
}

