import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  hashNewsletterToken,
  confirmNewsletter,
  generateNewsletterUnsubscribeToken,
  verifyNewsletterUnsubscribeToken,
  unsubscribeNewsletter,
} from "@/server/newsletter";
import { db } from "@/db";

describe("Newsletter Security & Double Opt-in", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("hashNewsletterToken", () => {
    it("produces deterministic 64-character SHA-256 hex string", () => {
      const rawToken = "super-secret-random-token-12345";
      const hash1 = hashNewsletterToken(rawToken);
      const hash2 = hashNewsletterToken(rawToken);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64);
      expect(hash1).toMatch(/^[a-f0-9]{64}$/);
      expect(hash1).not.toBe(rawToken);
    });

    it("produces different hashes for different tokens", () => {
      const hashA = hashNewsletterToken("token-a");
      const hashB = hashNewsletterToken("token-b");
      expect(hashA).not.toBe(hashB);
    });
  });

  describe("confirmNewsletter", () => {
    it("rejects empty or whitespace-only tokens", async () => {
      const res = await confirmNewsletter("");
      expect(res.success).toBe(false);
      expect(res.error).toContain("Missing or invalid confirmation token");
    });

    it("rejects non-existent or already used tokens", async () => {
      // Mock db.select().from().where().limit() returning []
      const mockLimit = vi.fn().mockResolvedValue([]);
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Drizzle query builder chain mock in unit test
      vi.spyOn(db, "select").mockReturnValue({ from: mockFrom } as any);

      const res = await confirmNewsletter("already-used-or-unknown-token");
      expect(res.success).toBe(false);
      expect(res.error).toContain("invalid or has already been used");
    });

    it("rejects expired confirmation tokens", async () => {
      const expiredDate = new Date(Date.now() - 1000 * 60 * 60); // 1 hour ago
      const mockLimit = vi.fn().mockResolvedValue([
        {
          id: "sub-123",
          confirmed: false,
          tokenExpiresAt: expiredDate,
        },
      ]);
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Drizzle query builder chain mock in unit test
      vi.spyOn(db, "select").mockReturnValue({ from: mockFrom } as any);

      const res = await confirmNewsletter("valid-looking-but-expired-token");
      expect(res.success).toBe(false);
      expect(res.error).toContain("expired");
    });

    it("confirms successfully for valid active token and clears token for one-time use", async () => {
      const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hours from now
      const mockLimit = vi.fn().mockResolvedValue([
        {
          id: "sub-123",
          confirmed: false,
          tokenExpiresAt: futureDate,
        },
      ]);
      const mockWhereSelect = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhereSelect });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Drizzle query builder chain mock in unit test
      vi.spyOn(db, "select").mockReturnValue({ from: mockFrom } as any);

      const mockWhereUpdate = vi.fn().mockResolvedValue(undefined);
      const mockSet = vi.fn().mockReturnValue({ where: mockWhereUpdate });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Drizzle query builder chain mock in unit test
      vi.spyOn(db, "update").mockReturnValue({ set: mockSet } as any);

      const res = await confirmNewsletter("fresh-valid-token-xyz");
      expect(res.success).toBe(true);

      // Verify update set confirmed = true and invalidated token to empty string
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          confirmed: true,
          token: "",
        })
      );
    });
  });

  describe("Stateless Signed Unsubscribe Token (HMAC-SHA256)", () => {
    const testEmail = "subscriber@example.com";

    it("generates deterministic base64url signed token for lowercase email", () => {
      const token1 = generateNewsletterUnsubscribeToken(testEmail);
      const token2 = generateNewsletterUnsubscribeToken(testEmail);
      expect(token1).toBe(token2);
      expect(typeof token1).toBe("string");
      expect(token1.length).toBeGreaterThan(20);
      // Base64url safe chars only
      expect(token1).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it("normalizes mixed-case and whitespace in email before generating token", () => {
      const tokenLower = generateNewsletterUnsubscribeToken("alice@startup.io");
      const tokenMixed = generateNewsletterUnsubscribeToken("  Alice@Startup.IO  ");
      expect(tokenLower).toBe(tokenMixed);
    });

    it("produces different tokens for different emails", () => {
      const tokenA = generateNewsletterUnsubscribeToken("userA@example.com");
      const tokenB = generateNewsletterUnsubscribeToken("userB@example.com");
      expect(tokenA).not.toBe(tokenB);
    });

    it("verifies matching email and token successfully", () => {
      const token = generateNewsletterUnsubscribeToken(testEmail);
      expect(verifyNewsletterUnsubscribeToken(testEmail, token)).toBe(true);
      expect(verifyNewsletterUnsubscribeToken("SUBSCRIBER@EXAMPLE.COM", token)).toBe(true);
    });

    it("rejects invalid, tampered, or mismatched tokens", () => {
      const validToken = generateNewsletterUnsubscribeToken(testEmail);
      const tamperedToken = validToken.slice(0, -2) + "xx";

      expect(verifyNewsletterUnsubscribeToken(testEmail, tamperedToken)).toBe(false);
      expect(verifyNewsletterUnsubscribeToken("attacker@example.com", validToken)).toBe(false);
      expect(verifyNewsletterUnsubscribeToken("", validToken)).toBe(false);
      expect(verifyNewsletterUnsubscribeToken(testEmail, "")).toBe(false);
      expect(verifyNewsletterUnsubscribeToken(testEmail, "short")).toBe(false);
    });

    it("unsubscribeNewsletter deletes subscription upon valid stateless token", async () => {
      const token = generateNewsletterUnsubscribeToken(testEmail);

      const mockWhereDelete = vi.fn().mockResolvedValue(undefined);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Drizzle query builder chain mock in unit test
      vi.spyOn(db, "delete").mockReturnValue({ where: mockWhereDelete } as any);

      const res = await unsubscribeNewsletter(testEmail, token);
      expect(res.success).toBe(true);
      expect(mockWhereDelete).toHaveBeenCalled();
    });

    it("unsubscribeNewsletter rejects tampered token without calling db.delete", async () => {
      const mockWhereDelete = vi.fn().mockResolvedValue(undefined);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Drizzle query builder chain mock in unit test
      const deleteSpy = vi.spyOn(db, "delete").mockReturnValue({ where: mockWhereDelete } as any);

      const res = await unsubscribeNewsletter(testEmail, "tampered-unsub-token");
      expect(res.success).toBe(false);
      expect(res.error).toContain("Invalid or expired unsubscribe link");
      expect(deleteSpy).not.toHaveBeenCalled();
    });
  });
});
