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

    const result = validateProductionEnv(partialEnv);
    expect(result.valid).toBe(false);
    expect(result.missing).toContain("DATABASE_URL");
    expect(result.missing).toContain("NEXT_PUBLIC_CONTACT_EMAIL");

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

  it("verifies all expected variables are listed in REQUIRED_PRODUCTION_ENV_VARS", () => {
    expect(REQUIRED_PRODUCTION_ENV_VARS).toContain("TRUSTED_PROXY_COUNT");
    expect(REQUIRED_PRODUCTION_ENV_VARS).toContain("NEXT_PUBLIC_CONTACT_EMAIL");
    expect(REQUIRED_PRODUCTION_ENV_VARS.length).toBe(14);
  });
});
