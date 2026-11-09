import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { getCountryName } from "@/lib/validation";

export const INVESTOR_NETWORK_CACHE_TAG = "investor-network";

export interface CountryInvestorData {
  code: string;
  name: string;
  investors: number;
  startups: number;
}

export interface InvestorNetworkResponse {
  countries: CountryInvestorData[];
  investors: CountryInvestorData[]; // alias for compatibility
  totals: {
    investors: number;
    startups: number;
  };
  asOf: string | null;
  degraded: boolean;
}

/**
 * Pure aggregation helper: merges raw investor rows and raw startup counts into
 * sorted CountryInvestorData items, calculating totals strictly from the items.
 */
export function aggregateInvestorNetworkData(
  investorRows: Array<{ country_code: string; country_name: string; investors: number; updated_at?: string | Date | null }>,
  startupRows: Array<{ country_code: string; count: number }>,
  maxUpdatedAt: string | Date | null = null
): InvestorNetworkResponse {
  const map = new Map<string, CountryInvestorData>();

  let sumInvestors = 0;
  let totalStartups = 0;

  // 1. Process investor regions
  for (const inv of investorRows) {
    const rawCode = (inv.country_code || "").trim().toUpperCase();
    if (!rawCode) continue;

    const count = Number(inv.investors) || 0;
    sumInvestors += count;

    const name = inv.country_name || getCountryName(rawCode) || rawCode;
    map.set(rawCode, {
      code: rawCode,
      name,
      investors: count,
      startups: 0,
    });
  }

  // 2. Process public approved startups
  for (const st of startupRows) {
    const rawCode = (st.country_code || "").trim().toUpperCase();
    if (!rawCode) continue;

    const stCount = Number(st.count) || 0;
    totalStartups += stCount;

    const existing = map.get(rawCode);
    if (existing) {
      existing.startups = stCount;
    } else {
      const name = getCountryName(rawCode) || rawCode;
      map.set(rawCode, {
        code: rawCode,
        name,
        investors: 0,
        startups: stCount,
      });
    }
  }

  // 3. Sort countries by investors DESC, ties by startups DESC, then name ASC
  const countries = Array.from(map.values()).sort((a, b) => {
    if (b.investors !== a.investors) {
      return b.investors - a.investors;
    }
    if (b.startups !== a.startups) {
      return b.startups - a.startups;
    }
    return a.name.localeCompare(b.name);
  });

  let formattedAsOf: string | null = null;
  if (maxUpdatedAt) {
    try {
      const date = new Date(maxUpdatedAt);
      if (!isNaN(date.getTime())) {
        formattedAsOf = date.toISOString();
      }
    } catch {
      formattedAsOf = null;
    }
  }

  return {
    countries,
    investors: countries,
    totals: {
      investors: sumInvestors,
      startups: totalStartups,
    },
    asOf: formattedAsOf,
    degraded: false,
  };
}

/**
 * Fetch raw investor network data from DB with graceful degradation.
 * If the investor_regions table does not exist or querying fails, degrades gracefully
 * returning investors = [] with degraded: true instead of throwing 500.
 */
export async function fetchInvestorNetworkData(): Promise<InvestorNetworkResponse> {
  // Query 1: Approved public startups count per country
  let startupRows: Array<{ country_code: string; count: number }> = [];
  try {
    const rows = await db.execute<{
      country_code: string;
      count: string | number;
    }>(sql`
      SELECT
        UPPER(TRIM(country_code)) AS country_code,
        count(*)::int AS count
      FROM public.startups
      WHERE status = 'approved'
      GROUP BY UPPER(TRIM(country_code))
    `);
    startupRows = rows.map((r) => ({
      country_code: r.country_code,
      count: Number(r.count) || 0,
    }));
  } catch (err) {
    console.warn("fetchInvestorNetworkData: error querying startups count", err);
    startupRows = [];
  }

  // Query 2: Investor regions
  let investorRows: Array<{
    country_code: string;
    country_name: string;
    investors: number;
    updated_at: string | Date | null;
  }> = [];
  let maxUpdatedAt: string | Date | null = null;

  try {
    const rows = await db.execute<{
      country_code: string;
      country_name: string;
      investors: number;
      updated_at: string | Date;
    }>(sql`
      SELECT
        country_code,
        country_name,
        investors,
        updated_at
      FROM public.investor_regions
      ORDER BY investors DESC
    `);

    investorRows = rows.map((r) => ({
      country_code: r.country_code,
      country_name: r.country_name,
      investors: Number(r.investors) || 0,
      updated_at: r.updated_at,
    }));

    if (investorRows.length > 0) {
      const dates = investorRows
        .map((r) => (r.updated_at ? new Date(r.updated_at).getTime() : 0))
        .filter((t) => !isNaN(t) && t > 0);
      if (dates.length > 0) {
        maxUpdatedAt = new Date(Math.max(...dates)).toISOString();
      }
    }
  } catch (err) {
    console.warn(
      "fetchInvestorNetworkData: investor_regions table unavailable or query failed; degrading gracefully",
      err
    );
    const totalStartups = startupRows.reduce((acc, curr) => acc + curr.count, 0);
    return {
      countries: [],
      investors: [],
      totals: {
        investors: 0,
        startups: totalStartups,
      },
      asOf: null,
      degraded: true,
    };
  }

  return aggregateInvestorNetworkData(investorRows, startupRows, maxUpdatedAt);
}

let cachedFn: (() => Promise<InvestorNetworkResponse>) | null = null;

/**
 * Cached public query for investor network data.
 * Revalidated every 300s or on-demand via INVESTOR_NETWORK_CACHE_TAG.
 */
export async function getCachedInvestorNetworkData(): Promise<InvestorNetworkResponse> {
  if (!cachedFn) {
    try {
      const nextCache = await import("next/cache");
      if (typeof nextCache.unstable_cache === "function") {
        cachedFn = nextCache.unstable_cache(
          async () => fetchInvestorNetworkData(),
          ["investor-network-data"],
          {
            revalidate: 300,
            tags: [INVESTOR_NETWORK_CACHE_TAG],
          }
        );
      }
    } catch {
      // In test environments where unstable_cache is not mocked
    }
    if (!cachedFn) {
      cachedFn = async () => fetchInvestorNetworkData();
    }
  }
  return cachedFn();
}

/**
 * Revalidates the investor network cache tag.
 */
export async function revalidateInvestorNetworkCache() {
  try {
    const nextCache = await import("next/cache");
    if (typeof nextCache.revalidateTag === "function") {
      nextCache.revalidateTag(INVESTOR_NETWORK_CACHE_TAG);
    }
  } catch (err) {
    console.warn("revalidateInvestorNetworkCache error", err);
  }
}

/**
 * Admin: List all investor regions sorted by investors desc.
 */
export async function getAdminInvestorRegions(): Promise<
  Array<{
    countryCode: string;
    countryName: string;
    investors: number;
    updatedAt: string;
  }>
> {
  try {
    const rows = await db.execute<{
      country_code: string;
      country_name: string;
      investors: number;
      updated_at: string | Date;
    }>(sql`
      SELECT
        country_code,
        country_name,
        investors,
        updated_at
      FROM public.investor_regions
      ORDER BY investors DESC, country_name ASC
    `);

    return rows.map((r) => ({
      countryCode: r.country_code.trim().toUpperCase(),
      countryName: r.country_name,
      investors: Number(r.investors) || 0,
      updatedAt: new Date(r.updated_at).toISOString(),
    }));
  } catch (err) {
    console.warn("getAdminInvestorRegions: investor_regions table may not exist yet", err);
    return [];
  }
}

/**
 * Admin: Upsert/update an investor region.
 */
export async function upsertInvestorRegion(
  countryCode: string,
  investors: number,
  countryName?: string
) {
  const upperCode = countryCode.trim().toUpperCase();
  const name = (countryName && countryName.trim()) || getCountryName(upperCode) || upperCode;

  await db.execute(sql`
    INSERT INTO public.investor_regions (country_code, country_name, investors, updated_at)
    VALUES (${upperCode}, ${name}, ${investors}, now())
    ON CONFLICT (country_code) DO UPDATE
    SET
      country_name = EXCLUDED.country_name,
      investors = EXCLUDED.investors,
      updated_at = now()
  `);

  revalidateInvestorNetworkCache();
}

/**
 * Admin: Delete an investor region.
 */
export async function deleteInvestorRegion(countryCode: string) {
  const upperCode = countryCode.trim().toUpperCase();

  await db.execute(sql`
    DELETE FROM public.investor_regions
    WHERE country_code = ${upperCode}
  `);

  revalidateInvestorNetworkCache();
}

