import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { captureException } from "@/lib/error-tracking";

export const dynamic = "force-dynamic";

export async function GET() {
  const timestamp = new Date().toISOString();

  if (!process.env.DATABASE_URL) {
    captureException(new Error("DATABASE_URL is not configured"), {
      componentName: "HealthCheck",
    });

    return NextResponse.json(
      {
        status: "error",
        timestamp,
        db: "unconfigured",
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

    return NextResponse.json(
      {
        status: "ok",
        timestamp,
        db: "connected",
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    captureException(error, { componentName: "HealthCheck" });

    return NextResponse.json(
      {
        status: "error",
        timestamp,
        db: "unreachable",
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
