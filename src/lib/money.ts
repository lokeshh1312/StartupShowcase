export type PaymentCurrency = "INR" | "USD";

/**
 * Shared currency formatter for Startup Showcase.
 * Formats minor currency units (paise for INR, cents for USD) into user-facing currency strings.
 * Never prints "$" for an INR payment.
 */
export function formatMoney(amountMinor: number, currency: string = "USD"): string {
  const curr = (currency || "USD").toUpperCase();
  const major = (amountMinor / 100).toFixed(2);
  if (curr === "INR") {
    return `₹${major}`;
  }
  return `$${major}`;
}

/**
 * Returns a concise formatted price for action buttons (e.g. "Rs 999" or "$10").
 * Omit decimals if amount is an exact whole integer.
 */
export function formatPriceButton(amountMinor: number, currency: string = "USD"): string {
  const curr = (currency || "USD").toUpperCase();
  const major = amountMinor / 100;
  const numStr = Number.isInteger(major) ? major.toString() : major.toFixed(2);
  if (curr === "INR") {
    return `Rs ${numStr}`;
  }
  return `$${numStr}`;
}
