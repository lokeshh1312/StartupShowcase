import { describe, it, expect } from "vitest";
import {
  validateProductionEnv,
  assertProductionEnv,
  REQUIRED_PRODUCTION_ENV_VARS,
} from "@/lib/env-validator";

describe("Production Environment Validator", () => {
  const completeEnv: Record<string, string> = {
    NEXT_PUBLIC_SITE_URL: "https://startupshowcase.com",
    NEXT_PUBLIC_SUPABASE_URL: "https://mock.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
    SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
    DATABASE_URL: "postgres://user:pass@localhost:5432/db",
    TRUSTED_PROXY_COUNT: "1",
    VIEW_HASH_SECRET: "0123456789abcdef0123456789abcdef",
    NEWSLETTER_SECRET: "0123456789abcdef0123456789abcdef",
    RESEND_API_KEY: "re_123456789",
    EMAIL_FROM: "Startup Showcase <updates@startupshowcase.com>",
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: "turnstile-site-key",
    TURNSTILE_SECRET_KEY: "turnstile-secret-key",
    NEXT_PUBLIC_GOOGLE_AUTH_ENABLED: "false",
    NEXT_PUBLIC_CONTACT_EMAIL: "contact@startupshowcase.com",
    RAZORPAY_KEY_ID: "rzp_live_1234567890abcd",
    RAZORPAY_KEY_SECRET: "secret1234567890abcdef",
    RAZORPAY_WEBHOOK_SECRET: "webhooksecret1234567890",
    NEXT_PUBLIC_RAZORPAY_KEY_ID: "rzp_live_1234567890abcd",
    SUBMISSION_PRICE_USD_CENTS: "1000",
  };

  it("passes when all required variables are present", () => {
    const result = validateProductionEnv(completeEnv);
    expect(result.valid).toBe(true);
    expect(result.missing).toEqual([]);
    expect(() => assertProductionEnv(completeEnv)).not.toThrow();
  });

  it("identifies each missing required variable", () => {
    const partialEnv = { ...completeEnv };
    delete partialEnv.DATABASE_URL;
    delete partialEnv.NEXT_PUBLIC_CONTACT_EMAIL;
    delete partialEnv.RAZORPAY_KEY_ID;

    const result = validateProductionEnv(partialEnv);
    expect(result.valid).toBe(false);
    expect(result.missing).toContain("DATABASE_URL");
    expect(result.missing).toContain("NEXT_PUBLIC_CONTACT_EMAIL");
    expect(result.missing).toContain("RAZORPAY_KEY_ID");

    expect(() => assertProductionEnv(partialEnv)).toThrowError(
      /DATABASE_URL/
    );
  });

  it("treats empty or whitespace-only variables as missing", () => {
    const emptyVarEnv = {
      ...completeEnv,
      VIEW_HASH_SECRET: "   ",
    };

    const result = validateProductionEnv(emptyVarEnv);
    expect(result.valid).toBe(false);
    expect(result.missing).toContain("VIEW_HASH_SECRET");
  });

  it("rejects invalid SUBMISSION_PRICE_USD_CENTS", () => {
    const invalidPriceEnv = {
      ...completeEnv,
      SUBMISSION_PRICE_USD_CENTS: "invalid",
    };

    const result = validateProductionEnv(invalidPriceEnv);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      "SUBMISSION_PRICE_USD_CENTS must be a positive integer (e.g. 1000 for $10.00)"
    );
  });

  it("validates optional SUBMISSION_PRICE_INR_PAISE", () => {
    // Valid positive integer
    const validInrEnv = {
      ...completeEnv,
      SUBMISSION_PRICE_INR_PAISE: "99900",
    };
    const validResult = validateProductionEnv(validInrEnv);
    expect(validResult.valid).toBe(true);

    // Invalid string
    const invalidInrEnv = {
      ...completeEnv,
      SUBMISSION_PRICE_INR_PAISE: "abc",
    };
    const invalidResult = validateProductionEnv(invalidInrEnv);
    expect(invalidResult.valid).toBe(false);
    expect(invalidResult.errors).toContain(
      "SUBMISSION_PRICE_INR_PAISE must be a positive integer (e.g. 99900 for ₹999.00)"
    );

    // Non-positive
    const negativeInrEnv = {
      ...completeEnv,
      SUBMISSION_PRICE_INR_PAISE: "0",
    };
    const negResult = validateProductionEnv(negativeInrEnv);
    expect(negResult.valid).toBe(false);
    expect(negResult.errors).toContain(
      "SUBMISSION_PRICE_INR_PAISE must be a positive integer (e.g. 99900 for ₹999.00)"
    );
  });

  it("refuses test keys in production mode unless ALLOW_RAZORPAY_TEST_IN_PRODUCTION is true", () => {
    const prodWithTestKey = {
      ...completeEnv,
      NODE_ENV: "production",
      RAZORPAY_KEY_ID: "rzp_test_1234567890",
      NEXT_PUBLIC_RAZORPAY_KEY_ID: "rzp_test_1234567890",
    };

    const result = validateProductionEnv(prodWithTestKey);
    expect(result.valid).toBe(false);
    expect(result.errors?.[0]).toContain("Razorpay key is a test key");
    expect(() => assertProductionEnv(prodWithTestKey)).toThrowError(/test key/);

    // When ALLOW_RAZORPAY_TEST_IN_PRODUCTION is true, it passes
    const allowedTestKey = {
      ...prodWithTestKey,
      ALLOW_RAZORPAY_TEST_IN_PRODUCTION: "true",
    };
    const allowedResult = validateProductionEnv(allowedTestKey);
    expect(allowedResult.valid).toBe(true);
  });

  it("verifies all expected variables are listed in REQUIRED_PRODUCTION_ENV_VARS", () => {
    expect(REQUIRED_PRODUCTION_ENV_VARS).toContain("TRUSTED_PROXY_COUNT");
    expect(REQUIRED_PRODUCTION_ENV_VARS).toContain("NEXT_PUBLIC_CONTACT_EMAIL");
    expect(REQUIRED_PRODUCTION_ENV_VARS).toContain("RAZORPAY_KEY_ID");
    expect(REQUIRED_PRODUCTION_ENV_VARS).toContain("RAZORPAY_KEY_SECRET");
    expect(REQUIRED_PRODUCTION_ENV_VARS).toContain("RAZORPAY_WEBHOOK_SECRET");
    expect(REQUIRED_PRODUCTION_ENV_VARS).toContain("NEXT_PUBLIC_RAZORPAY_KEY_ID");
    expect(REQUIRED_PRODUCTION_ENV_VARS).toContain("SUBMISSION_PRICE_USD_CENTS");
    expect(REQUIRED_PRODUCTION_ENV_VARS.length).toBe(19);
  });
});
