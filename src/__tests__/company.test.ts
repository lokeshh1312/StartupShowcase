import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { legalName, gstin, address, phone, website, getContactEmail } from "@/lib/company";
import { getSubmissionPriceCents } from "@/server/razorpay";

describe("Company Details and Pricing Consistency", () => {
  const originalEnv = process.env.SUBMISSION_PRICE_USD_CENTS;
  const originalEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

  beforeEach(() => {
    delete process.env.SUBMISSION_PRICE_USD_CENTS;
    delete process.env.NEXT_PUBLIC_CONTACT_EMAIL;
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.SUBMISSION_PRICE_USD_CENTS = originalEnv;
    } else {
      delete process.env.SUBMISSION_PRICE_USD_CENTS;
    }
    if (originalEmail !== undefined) {
      process.env.NEXT_PUBLIC_CONTACT_EMAIL = originalEmail;
    } else {
      delete process.env.NEXT_PUBLIC_CONTACT_EMAIL;
    }
  });

  it("exports exact legal company metadata", () => {
    expect(legalName).toBe("WAVERISE CONSULTANCY PRIVATE LIMITED");
    expect(gstin).toBe("23AADCW8958R1ZB");
    expect(address).toBe(
      "House No. 5, Gali No. 1, Dwarka Nagar, Nishatpura, Bhopal, Madhya Pradesh – 462010, India."
    );
    expect(phone).toBe("+91 97247 19086");
    expect(website).toBe("https://startupshowcaseglobal.com/");
  });

  it("falls back to contact@startupshowcaseglobal.com when NEXT_PUBLIC_CONTACT_EMAIL is unset", () => {
    expect(getContactEmail()).toBe("contact@startupshowcaseglobal.com");
  });

  it("respects NEXT_PUBLIC_CONTACT_EMAIL environment setting", () => {
    process.env.NEXT_PUBLIC_CONTACT_EMAIL = "custom@example.com";
    expect(getContactEmail()).toBe("custom@example.com");
  });

  it("ensures default SUBMISSION_PRICE_USD_CENTS is exactly 1000 cents (US$10) to match legal text", () => {
    delete process.env.SUBMISSION_PRICE_USD_CENTS;
    const priceCents = getSubmissionPriceCents();
    // Must be exactly 1000 cents ($10.00 USD / US$10)
    expect(priceCents).toBe(1000);
  });
});

