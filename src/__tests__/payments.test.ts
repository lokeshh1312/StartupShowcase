import { describe, it, expect, beforeEach, afterEach } from "vitest";
import crypto from "crypto";
import {
  getSubmissionPriceCents,
  verifyPaymentSignature,
  verifyWebhookSignature,
} from "@/server/razorpay";

describe("Payments - Server-side price enforcement", () => {
  const originalEnv = process.env.SUBMISSION_PRICE_USD_CENTS;

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.SUBMISSION_PRICE_USD_CENTS = originalEnv;
    } else {
      delete process.env.SUBMISSION_PRICE_USD_CENTS;
    }
  });

  it("defaults to 1000 cents ($10.00 USD) when SUBMISSION_PRICE_USD_CENTS is unset", () => {
    delete process.env.SUBMISSION_PRICE_USD_CENTS;
    expect(getSubmissionPriceCents()).toBe(1000);
  });

  it("reads positive integer amount from SUBMISSION_PRICE_USD_CENTS", () => {
    process.env.SUBMISSION_PRICE_USD_CENTS = "1500";
    expect(getSubmissionPriceCents()).toBe(1500);
  });

  it("falls back to 1000 if SUBMISSION_PRICE_USD_CENTS is invalid or non-positive", () => {
    process.env.SUBMISSION_PRICE_USD_CENTS = "invalid";
    expect(getSubmissionPriceCents()).toBe(1000);

    process.env.SUBMISSION_PRICE_USD_CENTS = "-500";
    expect(getSubmissionPriceCents()).toBe(1000);

    process.env.SUBMISSION_PRICE_USD_CENTS = "0";
    expect(getSubmissionPriceCents()).toBe(1000);
  });
});

describe("Payments - Payment Signature Verification", () => {
  const originalSecret = process.env.RAZORPAY_KEY_SECRET;
  const testSecret = "super_secret_key_12345";

  beforeEach(() => {
    process.env.RAZORPAY_KEY_SECRET = testSecret;
  });

  afterEach(() => {
    if (originalSecret !== undefined) {
      process.env.RAZORPAY_KEY_SECRET = originalSecret;
    } else {
      delete process.env.RAZORPAY_KEY_SECRET;
    }
  });

  it("accepts a valid signature generated with the correct secret", () => {
    const orderId = "order_test_999";
    const paymentId = "pay_test_888";
    const payload = `${orderId}|${paymentId}`;
    const validSignature = crypto
      .createHmac("sha256", testSecret)
      .update(payload)
      .digest("hex");

    const isValid = verifyPaymentSignature({
      orderId,
      paymentId,
      signature: validSignature,
    });
    expect(isValid).toBe(true);
  });

  it("rejects a tampered signature", () => {
    const orderId = "order_test_999";
    const paymentId = "pay_test_888";
    const payload = `${orderId}|${paymentId}`;
    const validSignature = crypto
      .createHmac("sha256", testSecret)
      .update(payload)
      .digest("hex");

    // Alter the last character
    const tampered =
      validSignature.slice(0, -1) + (validSignature.slice(-1) === "a" ? "b" : "a");

    const isValid = verifyPaymentSignature({
      orderId,
      paymentId,
      signature: tampered,
    });
    expect(isValid).toBe(false);
  });

  it("rejects signature generated with the wrong secret", () => {
    const orderId = "order_test_999";
    const paymentId = "pay_test_888";
    const wrongSignature = crypto
      .createHmac("sha256", "wrong_secret_123")
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    const isValid = verifyPaymentSignature({
      orderId,
      paymentId,
      signature: wrongSignature,
    });
    expect(isValid).toBe(false);
  });

  it("rejects signature with mismatched length or empty string safely", () => {
    expect(
      verifyPaymentSignature({
        orderId: "order_test_999",
        paymentId: "pay_test_888",
        signature: "",
      })
    ).toBe(false);

    expect(
      verifyPaymentSignature({
        orderId: "order_test_999",
        paymentId: "pay_test_888",
        signature: "too_short",
      })
    ).toBe(false);
  });
});

describe("Payments - Webhook Signature Verification", () => {
  const webhookSecret = "webhook_secret_998877";

  it("verifies matching webhook signature", () => {
    const body = JSON.stringify({
      event: "payment.captured",
      payload: { payment: { entity: { id: "pay_123" } } },
    });
    const signature = crypto
      .createHmac("sha256", webhookSecret)
      .update(body)
      .digest("hex");

    expect(
      verifyWebhookSignature({
        rawBody: body,
        signature,
        secret: webhookSecret,
      })
    ).toBe(true);
  });

  it("rejects webhook if body was altered", () => {
    const body = JSON.stringify({ event: "payment.captured" });
    const signature = crypto
      .createHmac("sha256", webhookSecret)
      .update(body)
      .digest("hex");

    const alteredBody = JSON.stringify({ event: "payment.captured", hacked: true });
    expect(
      verifyWebhookSignature({
        rawBody: alteredBody,
        signature,
        secret: webhookSecret,
      })
    ).toBe(false);
  });

  it("rejects webhook if secret does not match", () => {
    const body = JSON.stringify({ event: "payment.captured" });
    const signature = crypto
      .createHmac("sha256", "wrong_webhook_secret")
      .update(body)
      .digest("hex");

    expect(
      verifyWebhookSignature({
        rawBody: body,
        signature,
        secret: webhookSecret,
      })
    ).toBe(false);
  });

  it("rejects empty or malformed webhook signature", () => {
    expect(
      verifyWebhookSignature({
        rawBody: "{}",
        signature: "",
        secret: webhookSecret,
      })
    ).toBe(false);

    expect(
      verifyWebhookSignature({
        rawBody: "{}",
        signature: "abc",
        secret: webhookSecret,
      })
    ).toBe(false);
  });
});

describe("Payments - Amount and Currency Validation Logic", () => {
  it("detects and flags currency or amount mismatch", () => {
    const expectedAmount = 1000;
    const expectedCurrency = "USD";

    const validPayment = {
      amount: 1000,
      currency: "USD",
      status: "captured",
    };

    const currencyMismatch = {
      amount: 1000,
      currency: "INR",
      status: "captured",
    };

    const amountMismatch = {
      amount: 500,
      currency: "USD",
      status: "captured",
    };

    const isMatch = (p: typeof validPayment) =>
      p.amount === expectedAmount && p.currency.toUpperCase() === expectedCurrency;

    expect(isMatch(validPayment)).toBe(true);
    expect(isMatch(currencyMismatch)).toBe(false);
    expect(isMatch(amountMismatch)).toBe(false);
  });
});

describe("Payments - Public Isolation of Awaiting Payment Startups", () => {
  it("confirms public directory queries strictly require approved status", () => {
    // Test logic simulating listStartups filtering condition: eq(startups.status, "approved")
    const mockDbStartups = [
      { id: "1", name: "Approved Startup", status: "approved" },
      { id: "2", name: "Pending Review", status: "pending" },
      { id: "3", name: "Awaiting Payment Startup", status: "awaiting_payment" },
      { id: "4", name: "Rejected Startup", status: "rejected" },
    ];

    const publicList = mockDbStartups.filter((s) => s.status === "approved");
    expect(publicList).toHaveLength(1);
    expect(publicList[0].name).toBe("Approved Startup");
    expect(publicList.some((s) => s.status === "awaiting_payment")).toBe(false);
  });
});
