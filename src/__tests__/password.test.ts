import { describe, it, expect } from "vitest";
import { passwordSchema } from "@/lib/validation";

describe("Password 10 Character Minimum Requirement", () => {
  it("rejects passwords under 10 characters", () => {
    const invalidPasswords = [
      "",
      "12345",
      "123456",
      "shortpw",
      "123456789", // 9 characters
    ];

    for (const pw of invalidPasswords) {
      const result = passwordSchema.safeParse(pw);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          "Password must be at least 10 characters long."
        );
      }
    }
  });

  it("accepts passwords with 10 or more characters", () => {
    const validPasswords = [
      "1234567890", // exactly 10
      "SuperSecretP@ss!",
      "a-very-long-and-secure-passphrase-2026",
    ];

    for (const pw of validPasswords) {
      const result = passwordSchema.safeParse(pw);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(pw);
      }
    }
  });
});
