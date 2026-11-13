export const PROMO_BANNER_ENABLED = true;
export const PROMO_BANNER_END = "2026-11-30T23:59:59+05:30";

/**
 * Checks whether the promotional banner is active.
 * Returns true if PROMO_BANNER_ENABLED is true and the given date is before or equal to PROMO_BANNER_END.
 */
export function isPromoBannerActive(now: Date = new Date()): boolean {
  if (!PROMO_BANNER_ENABLED) return false;
  const endDate = new Date(PROMO_BANNER_END);
  if (isNaN(endDate.getTime())) return false;
  return now.getTime() <= endDate.getTime();
}
