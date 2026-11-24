/**
 * Home Counter Configuration & Baseline Calculator
 *
 * How to customize:
 * - START_VALUE: Starting number of the counter (e.g. 2000).
 * - START_AT: ISO 8601 UTC timestamp marking when the counter began at START_VALUE.
 *             Update this to the current UTC timestamp right before deploying or merging.
 * - RATE_PER_SECOND: Average increment rate per second (5/3 ≈ 1.6667 per second,
 *                    or ~2.5 every 1.5 seconds).
 * - COUNTER_LABEL: Text displayed immediately following the counter digits (e.g. "hello").
 */

export const START_VALUE = 2000;
export const START_AT = "2026-11-24T09:48:00.000Z";
export const RATE_PER_SECOND = 5 / 3;
export const COUNTER_LABEL = "hello";

/**
 * Pure baseline calculation function.
 *
 * baseline(now) = START_VALUE + Math.floor(((now - START_AT) / 1000) * RATE_PER_SECOND),
 * never less than START_VALUE.
 *
 * @param now Current timestamp in milliseconds or Date instance (defaults to Date.now())
 * @returns Deterministic integer baseline count >= START_VALUE
 */
export function baseline(now: number | Date = Date.now()): number {
  const currentTime = typeof now === "number" ? now : now.getTime();
  const startTime = new Date(START_AT).getTime();
  const elapsedMs = currentTime - startTime;

  if (elapsedMs <= 0 || Number.isNaN(elapsedMs)) {
    return START_VALUE;
  }

  const added = Math.floor((elapsedMs / 1000) * RATE_PER_SECOND);
  return START_VALUE + Math.max(0, added);
}
