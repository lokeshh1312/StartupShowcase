import { NextRequest, NextResponse } from "next/server";
import { getCachedInvestorNetworkData } from "@/server/investor-network";
import { checkRateLimit, extractClientIp } from "@/server/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // Optional IP-based rate limiting (120 requests / minute)
    try {
      const clientIp = extractClientIp(req.headers);
      if (clientIp) {
        const rateLimitRes = await checkRateLimit(
          `investor-network:ip:${clientIp}`,
          120,
          60
        );
        if (!rateLimitRes.allowed) {
          return NextResponse.json(
            { error: "Too many requests. Please slow down." },
            {
              status: 429,
              headers: {
                "Retry-After": String(rateLimitRes.resetInSeconds),
              },
            }
          );
        }
      }
    } catch (rlErr) {
      // Degrade gracefully if rate_limits table is not available
      console.warn("Investor network rate limit check skipped:", rlErr);
    }

    const data = await getCachedInvestorNetworkData();

    return NextResponse.json(data, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    console.error("GET /api/investor-network error:", error);
    // Graceful fallback response: do not 500
    return NextResponse.json(
      {
        countries: [],
        investors: [],
        totals: {
          investors: 0,
          startups: 0,
        },
        asOf: null,
        degraded: true,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  }
}

