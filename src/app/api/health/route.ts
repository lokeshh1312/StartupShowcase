import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();

  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        db: "unconfigured",
        responseTimeMs: Date.now() - startTime,
        error: "DATABASE_URL is not set in environment",
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  }

  try {
    // Lightweight database connectivity check
    await db.execute(sql`SELECT 1`);
    const durationMs = Date.now() - startTime;

    return NextResponse.json(
      {
        status: "ok",
        timestamp: new Date().toISOString(),
        db: "connected",
        responseTimeMs: durationMs,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const errorMessage =
      error instanceof Error ? error.message : "Database connection failed";

    console.error("[HealthCheck Error]: Database connectivity failed", error);

    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        db: "unreachable",
        responseTimeMs: durationMs,
        error: errorMessage,
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  }
}
