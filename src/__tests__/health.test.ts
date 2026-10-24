import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/db", () => ({
  db: {
    execute: vi.fn(),
  },
}));

vi.mock("drizzle-orm", () => ({
  sql: () => "SELECT 1",
}));

vi.mock("@/lib/error-tracking", () => ({
  captureException: vi.fn(),
}));

import { GET } from "@/app/api/health/route";
import { db } from "@/db";
import { captureException } from "@/lib/error-tracking";

describe("GET /api/health", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.DATABASE_URL = "postgres://mock:mock@localhost:5432/mock";
  });

  it("returns 503 without leaking details when DATABASE_URL is not set", async () => {
    delete process.env.DATABASE_URL;
    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(503);
    expect(data).toEqual({
      status: "error",
      timestamp: expect.any(String),
      db: "unconfigured",
    });
    expect(data.error).toBeUndefined();
    expect(captureException).toHaveBeenCalledTimes(1);
  });

  it("returns 200 with status ok when database is healthy", async () => {
    vi.mocked(db.execute).mockResolvedValueOnce([] as never);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual({
      status: "ok",
      timestamp: expect.any(String),
      db: "connected",
    });
    expect(res.headers.get("Cache-Control")).toContain("no-store");
  });

  it("returns 503 without leaking details when database connection fails", async () => {
    vi.mocked(db.execute).mockRejectedValueOnce(new Error("Connection refused: internal password failure"));

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(503);
    expect(data).toEqual({
      status: "error",
      timestamp: expect.any(String),
      db: "unreachable",
    });
    // Internal exception must NEVER be leaked to HTTP caller
    expect(data.error).toBeUndefined();
    expect(JSON.stringify(data)).not.toContain("password");
    expect(captureException).toHaveBeenCalledTimes(1);
  });
});
