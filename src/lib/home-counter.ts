/**
 * Home Counter Configuration & Deterministic Daily-Reset Calculator
 *
 * Design:
 * - The counter resets to DAILY_START_VALUE (0) every day at 00:00:00.000 in the
 *   configured timezone (default: Indian Standard Time, UTC+05:30) and climbs
 *   monotonically until 23:59:59.999, then resets to 0 again at the next midnight.
 * - Each day has a deterministic pseudo-random target between DAILY_TARGET_MIN (50,000)
 *   and DAILY_TARGET_MAX (65,000), seeded by dayIndex via mulberry32 (no Math.random).
 * - Every tick adds 2 or 3, spaced by whole-millisecond gaps in [meanGapMs - 500, meanGapMs + 500],
 *   where meanGapMs = 86_400_000 * 2.5 / target (~3.3s to ~4.3s), landing within 1% of target.
 * - One day's tick list is generated on demand and memoized in a 2-entry module-level cache
 *   (current and next day), with binary search for O(log N) lookup in baseline(now) and nextTickAt(now).
 * - Pure function of the clock: every visitor sees the exact same number at the same instant,
 *   with zero localStorage, cookies, database, or network calls.
 *
 * How to customize:
 * - COUNTER_UTC_OFFSET_MINUTES: Timezone offset from UTC in minutes (default: 330 for IST UTC+05:30).
 * - DAILY_START_VALUE: Value at 00:00:00.000 each day (default: 0).
 * - DAILY_TARGET_MIN / DAILY_TARGET_MAX: Daily end-of-day target range (default: 50,000 to 65,000).
 * - COUNTER_LABEL: Text displayed beside the counter digits.
 */

export const COUNTER_UTC_OFFSET_MINUTES = 330; // Indian Standard Time (UTC+05:30)
export const DAILY_START_VALUE = 0;
export const DAILY_TARGET_MIN = 50000;
export const DAILY_TARGET_MAX = 65000;
export const COUNTER_LABEL = "daily visits";

const MS_PER_DAY = 86_400_000;
const GAP_JITTER_MS = 500;

interface DayData {
  dayIndex: number;
  target: number;
  minGapMs: number;
  maxGapMs: number;
  /** Tick offsets in ms from local midnight (strictly within (0, 86_400_000)) */
  tickOffsets: number[];
  /** Cumulative counter value at each corresponding tick */
  tickTotals: number[];
}

// Keep only up to 2 days (e.g. current and next day) in module-level cache
const dayCache = new Map<number, DayData>();

/**
 * 32-bit Mulberry32 seeded pseudo-random number generator.
 */
function mulberry32(seed: number): () => number {
  let a = seed | 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function getDayIndex(nowMs: number): number {
  const offsetMs = COUNTER_UTC_OFFSET_MINUTES * 60_000;
  return Math.floor((nowMs + offsetMs) / MS_PER_DAY);
}

function getDayStartMs(dayIndex: number): number {
  const offsetMs = COUNTER_UTC_OFFSET_MINUTES * 60_000;
  return dayIndex * MS_PER_DAY - offsetMs;
}

function generateDay(dayIndex: number): DayData {
  // Mix dayIndex into a well-distributed 32-bit seed
  const seed = Math.imul(dayIndex | 0, 0x45d9f3b) ^ 0x9e3779b9;
  const rng = mulberry32(seed);

  const target =
    DAILY_TARGET_MIN +
    Math.floor(rng() * (DAILY_TARGET_MAX - DAILY_TARGET_MIN + 1));

  const meanGapMs = (MS_PER_DAY * 2.5) / target;
  const minGapMs = Math.max(1, Math.round(meanGapMs - GAP_JITTER_MS));
  const maxGapMs = Math.max(minGapMs, Math.round(meanGapMs + GAP_JITTER_MS));
  const gapSpan = maxGapMs - minGapMs + 1;

  const tickOffsets: number[] = [];
  const tickIncs: number[] = [];

  let t = 0;
  let total = DAILY_START_VALUE;

  while (true) {
    const gap = minGapMs + Math.floor(rng() * gapSpan);
    const inc = rng() < 0.5 ? 2 : 3;
    const nextT = t + gap;
    if (nextT >= MS_PER_DAY) {
      break;
    }
    t = nextT;
    total += inc;
    tickOffsets.push(t);
    tickIncs.push(inc);
  }

  // Ensure end-of-day total lands within 1% of target without breaking the 2-or-3 rule
  const maxDeviation = Math.floor(target * 0.01);
  if (Math.abs(total - target) > maxDeviation && tickIncs.length > 0) {
    let diff = target - total;
    for (let i = tickIncs.length - 1; i >= 0 && Math.abs(diff) > maxDeviation; i--) {
      if (diff > 0 && tickIncs[i] === 2) {
        tickIncs[i] = 3;
        diff -= 1;
      } else if (diff < 0 && tickIncs[i] === 3) {
        tickIncs[i] = 2;
        diff += 1;
      }
    }
  }

  const tickTotals: number[] = new Array(tickIncs.length);
  let running = DAILY_START_VALUE;
  for (let i = 0; i < tickIncs.length; i++) {
    running += tickIncs[i];
    tickTotals[i] = running;
  }

  return {
    dayIndex,
    target,
    minGapMs,
    maxGapMs,
    tickOffsets,
    tickTotals,
  };
}

function getDayData(dayIndex: number): DayData {
  const cached = dayCache.get(dayIndex);
  if (cached) {
    return cached;
  }

  const data = generateDay(dayIndex);
  if (dayCache.size >= 2) {
    const oldestKey = dayCache.keys().next().value;
    if (oldestKey !== undefined) {
      dayCache.delete(oldestKey);
    }
  }
  dayCache.set(dayIndex, data);
  return data;
}

/**
 * Returns the exact counter value for the given timestamp.
 * Resets to DAILY_START_VALUE (0) at 00:00:00.000 each day and increases
 * monotonically until 23:59:59.999.
 */
export function baseline(now: number | Date = Date.now()): number {
  const currentTime = typeof now === "number" ? now : now.getTime();
  if (Number.isNaN(currentTime)) {
    return DAILY_START_VALUE;
  }

  const dayIndex = getDayIndex(currentTime);
  const dayStartMs = getDayStartMs(dayIndex);
  const offsetInDay = currentTime - dayStartMs;

  const day = getDayData(dayIndex);
  const { tickOffsets, tickTotals } = day;

  if (tickOffsets.length === 0 || offsetInDay < tickOffsets[0]) {
    return DAILY_START_VALUE;
  }

  // Binary search for largest index with tickOffsets[idx] <= offsetInDay
  let lo = 0;
  let hi = tickOffsets.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >>> 1;
    if (tickOffsets[mid] <= offsetInDay) {
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }

  return tickTotals[lo];
}

/**
 * Returns the timestamp (ms) of the next tick strictly after `now`.
 * At exact midnight it returns that day's first tick; after the last tick
 * of a day it returns the first tick of the next day.
 */
export function nextTickAt(now: number | Date = Date.now()): number {
  const currentTime = typeof now === "number" ? now : now.getTime();
  const safeTime = Number.isNaN(currentTime) ? Date.now() : currentTime;

  const dayIndex = getDayIndex(safeTime);
  const dayStartMs = getDayStartMs(dayIndex);
  const offsetInDay = safeTime - dayStartMs;

  const day = getDayData(dayIndex);
  const { tickOffsets } = day;

  if (tickOffsets.length > 0 && offsetInDay < tickOffsets[tickOffsets.length - 1]) {
    // Binary search for smallest index with tickOffsets[idx] > offsetInDay
    let lo = 0;
    let hi = tickOffsets.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (tickOffsets[mid] > offsetInDay) {
        hi = mid;
      } else {
        lo = mid + 1;
      }
    }
    return dayStartMs + tickOffsets[lo];
  }

  // After the last tick of the day: return the first tick of the next day
  const nextDayIndex = dayIndex + 1;
  const nextDay = getDayData(nextDayIndex);
  const nextDayStartMs = getDayStartMs(nextDayIndex);
  return nextDayStartMs + (nextDay.tickOffsets[0] ?? 1);
}
