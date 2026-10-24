/**
 * Date and Time utilities for Startup Showcase
 * All database timestamps, launch months, and ranking periods use strict UTC boundaries.
 * Display formatting utilizes the visitor's locale via Intl.DateTimeFormat.
 */

export function getUtcMonthStart(dateInput: Date | string): Date {
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0, 0));
}

export function getUtcMonthEnd(dateInput: Date | string): Date {
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0, 23, 59, 59, 999));
}

export function toUtcDateString(dateInput: Date | string): string {
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Format a date in the visitor's locale
 */
export function formatDisplayDate(
  dateInput: Date | string | null | undefined,
  locale = "en-US",
  options?: Intl.DateTimeFormatOptions
): string {
  if (!dateInput) return "";
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return "";

  const defaultOptions: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...options,
  };

  return new Intl.DateTimeFormat(locale, defaultOptions).format(d);
}

/**
 * Format month and year (e.g. "October 2026") in the visitor's locale
 */
export function formatMonthYear(
  dateInput: Date | string,
  locale = "en-US"
): string {
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return "";

  return new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}
