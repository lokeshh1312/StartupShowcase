import { describe, it, expect } from "vitest";
import { isLocalDatabaseUrl } from "../../scripts/seed";
import { execSync } from "child_process";

describe("seed script database protection", () => {
  describe("isLocalDatabaseUrl helper", () => {
    it("recognizes localhost URLs", () => {
      expect(isLocalDatabaseUrl("postgres://localhost/postgres")).toBe(true);
      expect(isLocalDatabaseUrl("postgresql://postgres:postgres@localhost:5432/postgres")).toBe(true);
      expect(isLocalDatabaseUrl("postgres://user:pass@localhost:54322/db?sslmode=disable")).toBe(true);
    });

    it("recognizes 127.0.0.1 URLs", () => {
      expect(isLocalDatabaseUrl("postgres://127.0.0.1/postgres")).toBe(true);
      expect(isLocalDatabaseUrl("postgresql://postgres:postgres@127.0.0.1:5432/postgres")).toBe(true);
      expect(isLocalDatabaseUrl("postgres://user:pass@127.0.0.1:6543/db?sslmode=disable")).toBe(true);
    });

    it("rejects remote database URLs", () => {
      expect(isLocalDatabaseUrl("postgresql://postgres:pass@db.xyz.supabase.co:5432/postgres")).toBe(false);
      expect(isLocalDatabaseUrl("postgres://postgres:pass@aws-0-us-east-1.pooler.supabase.com:6543/postgres")).toBe(false);
      expect(isLocalDatabaseUrl("postgres://user:pass@192.168.1.100:5432/postgres")).toBe(false);
      expect(isLocalDatabaseUrl("postgres://user:pass@prod-db.example.com/postgres")).toBe(false);
    });

    it("rejects empty or missing URLs", () => {
      expect(isLocalDatabaseUrl("")).toBe(false);
      expect(isLocalDatabaseUrl(undefined)).toBe(false);
    });
  });

  describe("CLI execution guard", () => {
    it("refuses to seed if ALLOW_SEED is not set", () => {
      const env = { ...process.env };
      delete env.ALLOW_SEED;
      env.DATABASE_URL = "postgres://postgres:postgres@localhost:5432/postgres";

      try {
        execSync("npx tsx scripts/seed.ts", { env, stdio: "pipe" });
        expect.unreachable("Seed script should have exited with code 1");
      } catch (err: unknown) {
        const error = err as { status: number; stderr?: Buffer; stdout?: Buffer };
        expect(error.status).toBe(1);
        const output = (error.stderr?.toString() || "") + (error.stdout?.toString() || "");
        expect(output).toContain("Refusing to seed: not a local database");
      }
    }, 30000);

    it("refuses to seed if DATABASE_URL points to a remote database even if ALLOW_SEED=true", () => {
      const env = {
        ...process.env,
        ALLOW_SEED: "true",
        DATABASE_URL: "postgres://postgres:secret@db.xyz.supabase.co:5432/postgres",
      };

      try {
        execSync("npx tsx scripts/seed.ts", { env, stdio: "pipe" });
        expect.unreachable("Seed script should have exited with code 1");
      } catch (err: unknown) {
        const error = err as { status: number; stderr?: Buffer; stdout?: Buffer };
        expect(error.status).toBe(1);
        const output = (error.stderr?.toString() || "") + (error.stdout?.toString() || "");
        expect(output).toContain("Refusing to seed: not a local database");
      }
    }, 30000);
  });
});
