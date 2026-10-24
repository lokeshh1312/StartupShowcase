import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/db", () => ({
  db: {
    execute: vi.fn(),
  },
}));

vi.mock("drizzle-orm", () => ({
  sql: () => "SELECT 1",
}));

import { GET } from "@/app/api/health/route";
import { db } from "@/db";

describe("GET /api/health", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.DATABASE_URL = "postgres://mock:mock@localhost:5432/mock";
  });

  it("returns 503 when DATABASE_URL is not set", async () => {
    delete process.env.DATABASE_URL;
    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(503);
    expect(data.status).toBe("error");
    expect(data.db).toBe("unconfigured");
  });

  it("returns 200 with status ok when database is healthy", async () => {
    vi.mocked(db.execute).mockResolvedValueOnce([] as never);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.status).toBe("ok");
    expect(data.db).toBe("connected");
    expect(typeof data.timestamp).toBe("string");
    expect(typeof data.responseTimeMs).toBe("number");
    expect(res.headers.get("Cache-Control")).toContain("no-store");
  });

  it("returns 503 with error status when database fails", async () => {
    vi.mocked(db.execute).mockRejectedValueOnce(new Error("Connection refused"));

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(503);
    expect(data.status).toBe("error");
    expect(data.db).toBe("unreachable");
    expect(data.error).toBe("Connection refused");
  });
});
