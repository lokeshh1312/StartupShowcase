/**
 * Formats the investor network subtitle based on the total number of investors:
 * - >= 10,000: round DOWN to nearest 10,000 shown as "{n}k+" (e.g. 54,128 -> "50k+")
 * - 1,000 - 9,999: round down to nearest 1,000 as "{n}k+" (e.g. 4,850 -> "4k+")
 * - under 1,000: exact number + "+" (e.g. 500 -> "500+", 1 -> "1+")
 * - If there is no data (0, null, undefined, <= 0, NaN):
 *   "Our Network Spans Active Angel Investors Across the Globe"
 * - No trailing full stop.
 */
export function formatInvestorSubtitle(totalInvestors?: number | null): string {
  if (
    totalInvestors === null ||
    totalInvestors === undefined ||
    isNaN(totalInvestors) ||
    totalInvestors <= 0
  ) {
    return "Our Network Spans Active Angel Investors Across the Globe";
  }

  let countStr: string;
  if (totalInvestors >= 10000) {
    const rounded = Math.floor(totalInvestors / 10000) * 10;
    countStr = `${rounded}k+`;
  } else if (totalInvestors >= 1000) {
    const rounded = Math.floor(totalInvestors / 1000);
    countStr = `${rounded}k+`;
  } else {
    countStr = `${Math.floor(totalInvestors)}+`;
  }

  return `Our Network Spans ${countStr} Active Angel Investors Across the Globe`;
}

