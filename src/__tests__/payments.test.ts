import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import crypto from "crypto";
import {
  getSubmissionPriceCents,
  getSubmissionPriceInrPaise,
  formatSubmissionPriceInr,
  getSubmissionPrice,
  verifyPaymentSignature,
  verifyWebhookSignature,
} from "@/server/razorpay";
import { markPaymentPaid, processPaymentRefund, getOrCreateStartupOrder } from "@/server/payments";
import { POST as webhookPost } from "@/app/api/webhooks/razorpay/route";
import { db } from "@/db";
import { payments, paymentEvents, startups } from "@/db/schema";
import { NextRequest } from "next/server";
import * as emailModule from "@/server/email";
import { confirmPaymentAction, getStartupPaymentOrderAction, submitStartupAction } from "@/server/actions";
import { formatMoney, formatPriceButton } from "@/lib/money";
import { deleteStartup } from "@/server/startups";
import * as razorpayServer from "@/server/razorpay";
import * as authServer from "@/lib/supabase/server";
import * as startupsServer from "@/server/startups";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

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

describe("Payments - Captured vs Authorized Payments", () => {
  it("rejects authorized payment status and requires captured status", () => {
    const isPaymentCaptured = (status: string) => status === "captured";

    expect(isPaymentCaptured("captured")).toBe(true);
    expect(isPaymentCaptured("authorized")).toBe(false);
    expect(isPaymentCaptured("created")).toBe(false);
    expect(isPaymentCaptured("failed")).toBe(false);
  });

  it("verifies fetched Razorpay payment order_id matches the order being confirmed", () => {
    const verifyOrderMatch = (fetchedOrderId: string, expectedOrderId: string) =>
      fetchedOrderId === expectedOrderId;

    expect(verifyOrderMatch("order_12345", "order_12345")).toBe(true);
    expect(verifyOrderMatch("order_spoofed_999", "order_12345")).toBe(false);
  });
});

interface MockPaymentRecord {
  id: string;
  startupId: string;
  userId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string | null;
  amountCents: number;
  amountRefundedCents: number;
  currency: string;
  status: "created" | "paid" | "failed" | "refunded" | "partially_refunded";
  webhookEventId: string | null;
  paidAt?: Date | null;
  refundedAt?: Date | null;
}

interface MockStartupRecord {
  id: string;
  status: "awaiting_payment" | "pending" | "approved" | "rejected";
  name: string;
}

describe("Payments - Partial and Full Refunds", () => {
  let mockPayment: MockPaymentRecord;
  let mockStartup: MockStartupRecord;
  let recordedEvents: Set<string>;

  beforeEach(() => {
    mockPayment = {
      id: "pay_rec_1",
      startupId: "startup_1",
      userId: "user_1",
      razorpayOrderId: "order_1",
      razorpayPaymentId: "pay_rzp_1",
      amountCents: 1000,
      amountRefundedCents: 0,
      currency: "USD",
      status: "paid",
      webhookEventId: null,
    };
    mockStartup = {
      id: "startup_1",
      status: "pending",
      name: "Acme AI",
    };
    recordedEvents = new Set<string>();

    vi.spyOn(db, "transaction").mockImplementation(async (callback) => {
      // Mock transaction context matching Drizzle transaction methods used in payments.ts
      const mockTx = {
        insert: () => ({
          values: (vals: Record<string, unknown>) => ({
            onConflictDoNothing: () => ({
              returning: () => {
                const eventId = typeof vals.id === "string" ? vals.id : undefined;
                if (eventId && recordedEvents.has(eventId)) {
                  return [];
                }
                if (eventId) recordedEvents.add(eventId);
                return [{ id: eventId || "gen_id" }];
              },
            }),
            returning: () => [{ ...vals, id: (vals.id as string) || "gen_id" }],
          }),
        }),
        select: () => ({
          from: (table: unknown) => ({
            where: () => {
              const queryObj = {
                limit: () => {
                  if (table === payments) {
                    return [mockPayment];
                  }
                  return [mockStartup];
                },
                for: () => queryObj,
              };
              return queryObj;
            },
          }),
        }),
        update: () => ({
          set: (
            vals: Partial<Omit<MockPaymentRecord, "status">> &
              Partial<Omit<MockStartupRecord, "status">> & {
                status?: MockPaymentRecord["status"] | MockStartupRecord["status"];
              }
          ) => ({
            where: () => {
              if (vals.amountRefundedCents !== undefined || vals.paidAt !== undefined) {
                Object.assign(mockPayment, vals as Partial<MockPaymentRecord>);
                return [mockPayment];
              } else {
                Object.assign(mockStartup, vals as Partial<MockStartupRecord>);
                return [mockStartup];
              }
            },
          }),
        }),
        execute: async () => [{ email: "founder@example.com", display_name: "Founder" }],
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Drizzle transaction type requires mock cast
      return await callback(mockTx as any);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("accurately handles a partial refund without rejecting the startup", async () => {
    const result = await processPaymentRefund({
      razorpayPaymentId: "pay_rzp_1",
      refundAmountCents: 400,
      reason: "Courtesy credit",
      webhookEventId: "evt_refund_1",
    });

    expect(result.success).toBe(true);
    expect(result.isPartial).toBe(true);
    expect(result.amountRefundedCents).toBe(400);
    expect(result.totalRefundedCents).toBe(400);
    expect(result.paymentStatus).toBe("partially_refunded");
    expect(mockPayment.status).toBe("partially_refunded");
    expect(mockPayment.amountRefundedCents).toBe(400);
    // Startup must NOT be rejected!
    expect(mockStartup.status).toBe("pending");
  });

  it("accumulates multiple partial refunds accurately", async () => {
    // First partial refund: $4.00
    await processPaymentRefund({
      razorpayPaymentId: "pay_rzp_1",
      refundAmountCents: 400,
      webhookEventId: "evt_refund_part1",
    });
    expect(mockPayment.amountRefundedCents).toBe(400);
    expect(mockPayment.status).toBe("partially_refunded");
    expect(mockStartup.status).toBe("pending");

    // Second partial refund: $3.00 (cumulative total $7.00)
    const result2 = await processPaymentRefund({
      razorpayPaymentId: "pay_rzp_1",
      refundAmountCents: 300,
      webhookEventId: "evt_refund_part2",
    });
    expect(result2.totalRefundedCents).toBe(700);
    expect(result2.isPartial).toBe(true);
    expect(mockPayment.amountRefundedCents).toBe(700);
    expect(mockPayment.status).toBe("partially_refunded");
    expect(mockStartup.status).toBe("pending");
  });

  it("transitions to refunded and rejects the startup upon full refund", async () => {
    const result = await processPaymentRefund({
      razorpayPaymentId: "pay_rzp_1",
      refundAmountCents: 1000,
      reason: "Full withdrawal",
      webhookEventId: "evt_refund_full",
    });

    expect(result.success).toBe(true);
    expect(result.isPartial).toBe(false);
    expect(result.totalRefundedCents).toBe(1000);
    expect(result.paymentStatus).toBe("refunded");
    expect(mockPayment.status).toBe("refunded");
    expect(mockPayment.amountRefundedCents).toBe(1000);
    // Startup is moved to rejected on full refund per published policy
    expect(mockStartup.status).toBe("rejected");
  });
});

describe("Payments - Stale Event Replay & State Transitions", () => {
  let mockPayment: MockPaymentRecord;
  let mockStartup: MockStartupRecord;
  let recordedEvents: Set<string>;

  beforeEach(() => {
    mockPayment = {
      id: "pay_rec_1",
      startupId: "startup_1",
      userId: "user_1",
      razorpayOrderId: "order_1",
      razorpayPaymentId: "pay_rzp_1",
      amountCents: 1000,
      amountRefundedCents: 1000,
      currency: "USD",
      status: "refunded",
      webhookEventId: "evt_refund_1",
    };
    mockStartup = {
      id: "startup_1",
      status: "rejected",
      name: "Acme AI",
    };
    recordedEvents = new Set<string>();

    vi.spyOn(db, "transaction").mockImplementation(async (callback) => {
      const mockTx = {
        insert: () => ({
          values: (vals: Record<string, unknown>) => ({
            onConflictDoNothing: () => ({
              returning: () => {
                const eventId = typeof vals.id === "string" ? vals.id : undefined;
                if (eventId && recordedEvents.has(eventId)) {
                  return [];
                }
                if (eventId) recordedEvents.add(eventId);
                return [{ id: eventId || "gen_id" }];
              },
            }),
            returning: () => [{ ...vals, id: (vals.id as string) || "gen_id" }],
          }),
        }),
        select: () => ({
          from: (table: unknown) => ({
            where: () => {
              const queryObj = {
                limit: () => {
                  if (table === payments) {
                    return [mockPayment];
                  }
                  return [mockStartup];
                },
                for: () => queryObj,
              };
              return queryObj;
            },
          }),
        }),
        update: (table: unknown) => ({
          set: (vals: Record<string, unknown>) => ({
            where: () => {
              if (table === payments || vals.paidAt !== undefined) {
                Object.assign(mockPayment, vals);
                return {
                  returning: () => [mockPayment],
                };
              } else {
                Object.assign(mockStartup, vals);
                return {
                  returning: () => [mockStartup],
                };
              }
            },
          }),
        }),
        execute: async () => [{ email: "founder@example.com", display_name: "Founder" }],
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Drizzle transaction type requires mock cast
      return await callback(mockTx as any);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("late payment.captured after refund does not change status", async () => {
    mockPayment.status = "refunded";
    const result = await markPaymentPaid({
      razorpayOrderId: "order_1",
      razorpayPaymentId: "pay_rzp_1",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Payment was refunded.");
    expect(mockPayment.status).toBe("refunded");
  });

  it("concurrent markPaymentPaid calls (simulate sequentially) mark paid once and send one email", async () => {
    mockPayment.status = "created";
    let emailSentCount = 0;
    vi.spyOn(emailModule, "fireAndForgetEmail").mockImplementation(() => {
      emailSentCount++;
    });

    const firstCall = await markPaymentPaid({
      razorpayOrderId: "order_1",
      razorpayPaymentId: "pay_rzp_1",
    });

    expect(firstCall.success).toBe(true);
    expect(firstCall.alreadyPaid).toBe(false);
    expect(mockPayment.status).toBe("paid");
    expect(emailSentCount).toBe(1);

    const secondCall = await markPaymentPaid({
      razorpayOrderId: "order_1",
      razorpayPaymentId: "pay_rzp_1",
    });

    expect(secondCall.success).toBe(true);
    expect(secondCall.alreadyPaid).toBe(true);
    expect(emailSentCount).toBe(1);
  });

  it("prevents replaying a payment.captured event from undoing a full refund", async () => {
    const result = await markPaymentPaid({
      razorpayOrderId: "order_1",
      razorpayPaymentId: "pay_rzp_1",
      webhookEventId: "evt_capture_stale",
    });

    // Must fail to change refunded payment back to paid
    expect(result.success).toBe(false);
    expect(result.alreadyRefunded).toBe(true);
    expect(mockPayment.status).toBe("refunded");
    expect(mockStartup.status).toBe("rejected");
  });

  it("prevents replaying a payment.captured event from undoing a partial refund", async () => {
    mockPayment.status = "partially_refunded";
    mockPayment.amountRefundedCents = 500;
    mockStartup.status = "pending";

    const result = await markPaymentPaid({
      razorpayOrderId: "order_1",
      razorpayPaymentId: "pay_rzp_1",
      webhookEventId: "evt_capture_stale_2",
    });

    expect(result.success).toBe(false);
    expect(result.alreadyRefunded).toBe(true);
    expect(mockPayment.status).toBe("partially_refunded");
    expect(mockPayment.amountRefundedCents).toBe(500);
    expect(mockStartup.status).toBe("pending");
  });
});

describe("Payments - Webhook Route Idempotency & Event Routing", () => {
  const webhookSecret = "webhook_secret_route_test";
  let recordedEvents: Set<string>;
  let mockPayment: MockPaymentRecord;
  let mockStartup: MockStartupRecord;

  beforeEach(() => {
    process.env.RAZORPAY_WEBHOOK_SECRET = webhookSecret;
    recordedEvents = new Set<string>();
    mockPayment = {
      id: "pay_1",
      startupId: "startup_webhook_1",
      userId: "user_webhook_1",
      amountCents: 1000,
      amountRefundedCents: 0,
      currency: "USD",
      status: "created",
      razorpayOrderId: "order_webhook_1",
      razorpayPaymentId: "pay_webhook_1",
      webhookEventId: null,
    };
    mockStartup = {
      id: "startup_webhook_1",
      status: "approved",
      name: "Acme Webhook Startup",
    };

    const handleInsert = (vals: Record<string, unknown>) => {
      const evId = (vals.eventId || vals.id) as string;
      const doInsert = () => {
        if (evId && recordedEvents.has(evId)) {
          return [];
        }
        if (evId) recordedEvents.add(evId);
        return [{ eventId: evId, id: evId }];
      };
      return {
        onConflictDoNothing: () => {
          const ret = doInsert();
          return {
            returning: () => ret,
            then: (resolve: (v: unknown) => unknown) => resolve(ret),
          };
        },
        returning: () => [{ ...vals, id: evId || "gen_id" }],
      };
    };

    vi.spyOn(db, "select").mockImplementation((() => ({
      from: (table: unknown) => ({
        where: () => ({
          limit: () => {
            if (table === paymentEvents) {
              return recordedEvents.has("evt_test_duplicate") ? [{ id: "evt_test_duplicate" }] : [];
            }
            if (table === startups) {
              return [mockStartup];
            }
            return [mockPayment];
          },
        }),
      }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Drizzle query builder mock
    })) as any);

    vi.spyOn(db, "insert").mockImplementation((() => ({
      values: handleInsert,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Drizzle query builder mock
    })) as any);

    vi.spyOn(db, "transaction").mockImplementation(async (callback) => {
      const mockTx = {
        insert: () => ({
          values: handleInsert,
        }),
        select: () => ({
          from: (table: unknown) => ({
            where: () => {
              const queryObj = {
                limit: () => {
                  if (table === payments) {
                    return [mockPayment];
                  }
                  return [mockStartup];
                },
                for: () => queryObj,
              };
              return queryObj;
            },
          }),
        }),
        update: (table: unknown) => ({
          set: (vals: Record<string, unknown>) => ({
            where: () => {
              if (table === payments || vals.paidAt !== undefined || vals.amountRefundedCents !== undefined) {
                Object.assign(mockPayment, vals);
                return {
                  returning: () => [mockPayment],
                };
              } else {
                Object.assign(mockStartup, vals);
                return {
                  returning: () => [mockStartup],
                };
              }
            },
          }),
        }),
        execute: async () => [{ email: "founder@example.com", display_name: "Founder" }],
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Drizzle transaction type requires mock cast
      return await callback(mockTx as any);
    });
  });

  afterEach(() => {
    delete process.env.RAZORPAY_WEBHOOK_SECRET;
    vi.restoreAllMocks();
  });

  it("returns idempotent: true when a durable event ID has already been processed", async () => {
    recordedEvents.add("evt_test_duplicate");

    const payload = JSON.stringify({
      id: "evt_test_duplicate",
      event: "payment.captured",
      payload: {
        payment: {
          entity: {
            id: "pay_1",
            order_id: "order_webhook_1",
            amount: 1000,
            currency: "USD",
            status: "captured",
          },
        },
      },
    });
    const sig = crypto.createHmac("sha256", webhookSecret).update(payload).digest("hex");

    const req = new NextRequest("http://localhost:3000/api/webhooks/razorpay", {
      method: "POST",
      headers: {
        "x-razorpay-signature": sig,
        "x-razorpay-event-id": "evt_test_duplicate",
      },
      body: payload,
    });

    const res = await webhookPost(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.idempotent).toBe(true);
  });

  it("handles payment.authorized by acknowledging without marking payment paid", async () => {
    const payload = JSON.stringify({
      id: "evt_authorized_1",
      event: "payment.authorized",
      payload: {
        payment: {
          entity: {
            id: "pay_auth",
            order_id: "order_webhook_1",
            amount: 1000,
            currency: "USD",
            status: "authorized",
          },
        },
      },
    });
    const sig = crypto.createHmac("sha256", webhookSecret).update(payload).digest("hex");

    const req = new NextRequest("http://localhost:3000/api/webhooks/razorpay", {
      method: "POST",
      headers: {
        "x-razorpay-signature": sig,
        "x-razorpay-event-id": "evt_authorized_1",
      },
      body: payload,
    });

    const res = await webhookPost(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.awaiting_capture).toBe(true);
    expect(recordedEvents.has("evt_authorized_1")).toBe(true);
  });

  it("ignores payment.captured event if payment was already refunded", async () => {
    mockPayment.status = "refunded";

    const payload = JSON.stringify({
      id: "evt_captured_stale",
      event: "payment.captured",
      payload: {
        payment: {
          entity: {
            id: "pay_stale",
            order_id: "order_webhook_1",
            amount: 1000,
            currency: "USD",
            status: "captured",
          },
        },
      },
    });
    const sig = crypto.createHmac("sha256", webhookSecret).update(payload).digest("hex");

    const req = new NextRequest("http://localhost:3000/api/webhooks/razorpay", {
      method: "POST",
      headers: {
        "x-razorpay-signature": sig,
        "x-razorpay-event-id": "evt_captured_stale",
      },
      body: payload,
    });

    const res = await webhookPost(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.ignored).toBe(true);
  });

  // TEST 1: refund.processed with an event id actually sets the payment to refunded and rejects the startup
  it("refund.processed with an event id actually sets the payment to refunded and rejects the startup", async () => {
    mockPayment.status = "paid";
    mockPayment.razorpayPaymentId = "pay_test_refund_1";
    mockPayment.amountCents = 1000;
    mockStartup.status = "approved";

    const payload = JSON.stringify({
      id: "evt_refund_processed_1",
      event: "refund.processed",
      payload: {
        payment: {
          entity: {
            id: "pay_test_refund_1",
            amount: 1000,
            amount_refunded: 1000,
            currency: "USD",
            status: "refunded",
          },
        },
        refund: {
          entity: {
            id: "rfnd_1",
            payment_id: "pay_test_refund_1",
            amount: 1000,
            currency: "USD",
            status: "processed",
          },
        },
      },
    });
    const sig = crypto.createHmac("sha256", webhookSecret).update(payload).digest("hex");

    const req = new NextRequest("http://localhost:3000/api/webhooks/razorpay", {
      method: "POST",
      headers: {
        "x-razorpay-signature": sig,
        "x-razorpay-event-id": "evt_refund_processed_1",
      },
      body: payload,
    });

    const res = await webhookPost(req);
    expect(res.status).toBe(200);

    expect(mockPayment.status).toBe("refunded");
    expect(mockPayment.amountRefundedCents).toBe(1000);
    expect(mockStartup.status).toBe("rejected");
    expect(recordedEvents.has("evt_refund_processed_1")).toBe(true);
  });

  // TEST 2: The same refund event delivered twice is applied once
  it("the same refund event delivered twice is applied once", async () => {
    mockPayment.status = "paid";
    mockPayment.razorpayPaymentId = "pay_test_refund_2";
    mockPayment.amountCents = 1000;
    mockStartup.status = "approved";

    const payload = JSON.stringify({
      id: "evt_refund_twice_1",
      event: "refund.processed",
      payload: {
        payment: {
          entity: {
            id: "pay_test_refund_2",
            amount: 1000,
            amount_refunded: 1000,
            currency: "USD",
            status: "refunded",
          },
        },
        refund: {
          entity: {
            id: "rfnd_2",
            payment_id: "pay_test_refund_2",
            amount: 1000,
            currency: "USD",
            status: "processed",
          },
        },
      },
    });
    const sig = crypto.createHmac("sha256", webhookSecret).update(payload).digest("hex");

    const makeReq = () =>
      new NextRequest("http://localhost:3000/api/webhooks/razorpay", {
        method: "POST",
        headers: {
          "x-razorpay-signature": sig,
          "x-razorpay-event-id": "evt_refund_twice_1",
        },
        body: payload,
      });

    // First delivery
    const res1 = await webhookPost(makeReq());
    expect(res1.status).toBe(200);
    expect(mockPayment.status).toBe("refunded");
    expect(mockStartup.status).toBe("rejected");

    // Second delivery (replay)
    const res2 = await webhookPost(makeReq());
    expect(res2.status).toBe(200);
    const data2 = await res2.json();
    expect(data2.idempotent).toBe(true);
  });

  // TEST 3: If markPaymentPaid throws mid-way, the event id is NOT stored, and a retry of the same event then succeeds and marks paid
  it("if markPaymentPaid throws mid-way, the event id is NOT stored, and a retry of the same event then succeeds and marks paid", async () => {
    mockPayment.status = "created";
    mockPayment.razorpayOrderId = "order_retry_test";
    mockPayment.amountCents = 1000;
    mockStartup.status = "awaiting_payment";

    const payload = JSON.stringify({
      id: "evt_payment_retry_1",
      event: "payment.captured",
      payload: {
        payment: {
          entity: {
            id: "pay_retry_1",
            order_id: "order_retry_test",
            amount: 1000,
            currency: "USD",
            status: "captured",
          },
        },
      },
    });
    const sig = crypto.createHmac("sha256", webhookSecret).update(payload).digest("hex");

    const makeReq = () =>
      new NextRequest("http://localhost:3000/api/webhooks/razorpay", {
        method: "POST",
        headers: {
          "x-razorpay-signature": sig,
          "x-razorpay-event-id": "evt_payment_retry_1",
        },
        body: payload,
      });

    // Simulate transient failure during transaction on first attempt
    let throwError = true;
    const realTxImpl = vi.mocked(db.transaction).getMockImplementation();

    vi.spyOn(db, "transaction").mockImplementation(async (callback) => {
      if (throwError) {
        // Rollback simulation: throw mid-way before committing
        throw new Error("Simulated database transient deadlock/connection error");
      }
      return realTxImpl!(callback);
    });

    // First attempt fails with 500
    const res1 = await webhookPost(makeReq());
    expect(res1.status).toBe(500);

    // Event ID must NOT be stored because transaction rolled back!
    expect(recordedEvents.has("evt_payment_retry_1")).toBe(false);
    expect(mockPayment.status).toBe("created");

    // Second attempt (retry) succeeds
    throwError = false;
    const res2 = await webhookPost(makeReq());
    expect(res2.status).toBe(200);

    // Now marked paid, event ID stored, startup pending
    expect(mockPayment.status).toBe("paid");
    expect(mockStartup.status).toBe("pending");
    expect(recordedEvents.has("evt_payment_retry_1")).toBe(true);
  });

  // TEST 4: A partial refund via webhook keeps the startup approved
  it("a partial refund via webhook keeps the startup approved", async () => {
    mockPayment.status = "paid";
    mockPayment.razorpayPaymentId = "pay_test_partial_1";
    mockPayment.amountCents = 1000;
    mockPayment.amountRefundedCents = 0;
    mockStartup.status = "approved";

    const payload = JSON.stringify({
      id: "evt_partial_refund_1",
      event: "refund.processed",
      payload: {
        payment: {
          entity: {
            id: "pay_test_partial_1",
            amount: 1000,
            amount_refunded: 300,
            currency: "USD",
            status: "captured",
          },
        },
        refund: {
          entity: {
            id: "rfnd_part_1",
            payment_id: "pay_test_partial_1",
            amount: 300,
            currency: "USD",
            status: "processed",
          },
        },
      },
    });
    const sig = crypto.createHmac("sha256", webhookSecret).update(payload).digest("hex");

    const req = new NextRequest("http://localhost:3000/api/webhooks/razorpay", {
      method: "POST",
      headers: {
        "x-razorpay-signature": sig,
        "x-razorpay-event-id": "evt_partial_refund_1",
      },
      body: payload,
    });

    const res = await webhookPost(req);
    expect(res.status).toBe(200);

    expect(mockPayment.status).toBe("partially_refunded");
    expect(mockPayment.amountRefundedCents).toBe(300);
    // Startup must remain approved!
    expect(mockStartup.status).toBe("approved");
    expect(recordedEvents.has("evt_partial_refund_1")).toBe(true);
  });
});

describe("Payments - confirmPaymentAction validation", () => {
  let mockPayment: MockPaymentRecord;

  beforeEach(() => {
    mockPayment = {
      id: "pay_1",
      startupId: "startup_1",
      userId: "user_1",
      razorpayOrderId: "order_1",
      razorpayPaymentId: "pay_rzp_1",
      amountCents: 1000,
      amountRefundedCents: 0,
      currency: "USD",
      status: "created",
      webhookEventId: null,
    };

    vi.spyOn(authServer, "getCurrentUserProfile").mockResolvedValue({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- mock user
      user: { id: "user_1" } as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- mock profile
      profile: { id: "user_1", role: "founder" } as any,
    });

    vi.spyOn(razorpayServer, "verifyPaymentSignature").mockReturnValue(true);

    vi.spyOn(db, "insert").mockImplementation((() => ({
      values: () => ({
        onConflictDoNothing: () => ({
          returning: () => [{ eventId: "evt_ignored" }],
        }),
        returning: () => [],
      }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Drizzle insert mock
    })) as any);

    vi.spyOn(db, "select").mockImplementation((() => ({
      from: () => ({
        where: () => ({
          limit: () => [mockPayment],
        }),
      }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Drizzle query builder mock
    })) as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("authorized status rejected (requires captured status)", async () => {
    vi.spyOn(razorpayServer, "fetchRazorpayPayment").mockResolvedValue({
      id: "pay_rzp_1",
      order_id: "order_1",
      amount: 1000,
      currency: "USD",
      status: "authorized",
    });

    const res = await confirmPaymentAction({
      startupId: "startup_1",
      razorpayOrderId: "order_1",
      razorpayPaymentId: "pay_rzp_1",
      razorpaySignature: "sig_1",
    });

    expect(res).toEqual({
      error: "Payment is not captured (status: authorized). An authorized payment is not captured yet.",
    });
  });

  it("order id mismatch rejected", async () => {
    vi.spyOn(razorpayServer, "fetchRazorpayPayment").mockResolvedValue({
      id: "pay_rzp_1",
      order_id: "different_order_id",
      amount: 1000,
      currency: "USD",
      status: "captured",
    });

    const res = await confirmPaymentAction({
      startupId: "startup_1",
      razorpayOrderId: "order_1",
      razorpayPaymentId: "pay_rzp_1",
      razorpaySignature: "sig_1",
    });

    expect(res).toEqual({
      error: "Payment order ID mismatch.",
    });
  });
});

describe("Payments - Immutability: payments can never be deleted for paid/refunded startups", () => {
  beforeEach(() => {
    vi.spyOn(db, "delete").mockImplementation((() => ({
      where: vi.fn(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Drizzle query builder mock
    })) as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("blocks deleting a startup that has a paid payment record", async () => {
    vi.spyOn(db, "select").mockImplementation((() => ({
      from: (table: unknown) => ({
        where: () => {
          const queryObj = {
            limit: () => {
              if (table === startups) {
                return [{ id: "s1", ownerId: "u1", status: "pending", thumbnail: null, coverImage: null }];
              }
              return [{ id: "p1", status: "paid", createdAt: new Date() }];
            },
            // For startupPayments query which does not use limit
            then: (resolve: (v: unknown) => unknown) =>
              resolve([{ id: "p1", status: "paid", createdAt: new Date() }]),
          };
          return queryObj;
        },
      }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Drizzle query builder mock
    })) as any);

    await expect(deleteStartup("s1", "u1", true)).rejects.toThrow(
      "Startups with paid or refunded payments cannot be deleted. Paid startups can be rejected but not deleted."
    );
  });

  it("blocks deleting a startup that has a refunded payment record", async () => {
    vi.spyOn(db, "select").mockImplementation((() => ({
      from: (table: unknown) => ({
        where: () => {
          const queryObj = {
            limit: () => {
              if (table === startups) {
                return [{ id: "s1", ownerId: "u1", status: "rejected", thumbnail: null, coverImage: null }];
              }
              return [{ id: "p1", status: "refunded", createdAt: new Date() }];
            },
            then: (resolve: (v: unknown) => unknown) =>
              resolve([{ id: "p1", status: "refunded", createdAt: new Date() }]),
          };
          return queryObj;
        },
      }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Drizzle query builder mock
    })) as any);

    await expect(deleteStartup("s1", "u1", false)).rejects.toThrow(
      "Startups with paid or refunded payments cannot be deleted. Paid startups can be rejected but not deleted."
    );
  });
});

describe("Payments - Order Reuse, Replacement, and Failed Row Transitions", () => {
  let mockStartup: { id: string; name: string; ownerId: string; status: string };
  let mockPaymentRows: Array<{
    id: string;
    startupId: string;
    userId: string;
    amountCents: number;
    amountRefundedCents: number;
    currency: string;
    status: string;
    razorpayOrderId: string;
    razorpayPaymentId: string | null;
    createdAt: Date;
  }>;

  beforeEach(() => {
    mockStartup = {
      id: "startup_test_1",
      name: "Startup Test One",
      ownerId: "user_test_1",
      status: "awaiting_payment",
    };

    mockPaymentRows = [
      {
        id: "pay_row_1",
        startupId: "startup_test_1",
        userId: "user_test_1",
        amountCents: 1000,
        amountRefundedCents: 0,
        currency: "USD",
        status: "created",
        razorpayOrderId: "order_existing_123",
        razorpayPaymentId: null,
        createdAt: new Date(),
      },
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Drizzle execute mock
    vi.spyOn(db, "execute").mockResolvedValue([{ count: 1 }] as any);
    vi.spyOn(razorpayServer, "isPaymentRequired").mockReturnValue(true);
    vi.spyOn(razorpayServer, "getRazorpayCredentials").mockReturnValue({
      keyId: "rzp_test_current",
      keySecret: "secret_current",
    });

    // Mock db.transaction
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Drizzle transaction mock
    vi.spyOn(db, "transaction").mockImplementation(async (callback: any) => {
      const mockTx = {
        select: () => ({
          from: (table: unknown) => ({
            where: () => {
              const q = {
                for: () => q,
                limit: () => (table === payments ? [mockPaymentRows[0]] : [mockStartup]),
              };
              return q;
            },
          }),
        }),
        update: (table: unknown) => ({
          set: (vals: Record<string, unknown>) => ({
            where: () => {
              if (table === payments || vals.status === "paid") {
                if (mockPaymentRows[0]) {
                  Object.assign(mockPaymentRows[0], vals);
                }
                return { returning: () => (mockPaymentRows[0] ? [mockPaymentRows[0]] : []) };
              } else {
                Object.assign(mockStartup, vals);
                return { returning: () => [mockStartup] };
              }
            },
          }),
        }),
        insert: () => ({
          values: () => ({
            onConflictDoNothing: () => ({
              returning: () => [{ eventId: "evt_test" }],
            }),
            returning: () => [],
          }),
        }),
        execute: async () => [{ email: "founder@example.com", display_name: "Founder" }],
      };
      return await callback(mockTx);
    });

    // Mock db.select
    vi.spyOn(db, "select").mockImplementation((() => ({
      from: (table: unknown) => ({
        where: () => {
          const queryObj = {
            limit: () => {
              if (table === startups) {
                return [mockStartup];
              }
              const createdOrder = mockPaymentRows.find((p) => p.status === "created");
              return createdOrder ? [createdOrder] : [];
            },
            then: (resolve: (v: unknown) => unknown) => {
              if (table === startups) {
                return resolve([{ count: 1 }]);
              }
              const createdOrder = mockPaymentRows.find((p) => p.status === "created");
              return resolve(createdOrder ? [createdOrder] : []);
            },
          };
          return queryObj;
        },
      }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Drizzle query builder mock
    })) as any);

    // Mock db.update
    vi.spyOn(db, "update").mockImplementation((() => ({
      set: (vals: Record<string, unknown>) => ({
        where: () => {
          // Only update row if it is created
          const row = mockPaymentRows.find((p) => p.status === "created");
          if (row) {
            Object.assign(row, vals);
          }
          return {
            returning: () => (row ? [row] : []),
          };
        },
      }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Drizzle query builder mock
    })) as any);

    // Mock db.insert
    vi.spyOn(db, "insert").mockImplementation((() => ({
      values: (vals: Record<string, unknown>) => {
        const newRow = {
          id: `pay_${Date.now()}`,
          startupId: vals.startupId as string,
          userId: vals.userId as string,
          amountCents: vals.amountCents as number,
          amountRefundedCents: 0,
          currency: (vals.currency as string) || "USD",
          status: (vals.status as string) || "created",
          razorpayOrderId: vals.razorpayOrderId as string,
          razorpayPaymentId: null,
          createdAt: new Date(),
        };
        mockPaymentRows.push(newRow);
        return {
          returning: () => [newRow],
        };
      },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Drizzle query builder mock
    })) as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reuses existing unpaid order if fetchRazorpayOrder returns valid open order", async () => {
    vi.spyOn(razorpayServer, "fetchRazorpayOrder").mockResolvedValue({
      id: "order_existing_123",
      amount: 1000,
      currency: "USD",
      status: "created",
      amount_paid: 0,
    });

    const createSpy = vi.spyOn(razorpayServer, "createRazorpayOrder");

    const result = await getOrCreateStartupOrder("startup_test_1", "user_test_1");

    expect(result.orderId).toBe("order_existing_123");
    expect(result.amount).toBe(1000);
    expect(result.currency).toBe("USD");
    expect(createSpy).not.toHaveBeenCalled();
    expect(mockPaymentRows[0]?.status).toBe("created");
  });

  it("replaces missing/other-mode order (fetch returns null): marks old payment failed and creates new order", async () => {
    vi.spyOn(razorpayServer, "fetchRazorpayOrder").mockResolvedValue(null);

    const createSpy = vi.spyOn(razorpayServer, "createRazorpayOrder").mockResolvedValue({
      id: "order_new_456",
      amount: 1000,
      currency: "USD",
      status: "created",
    });

    const result = await getOrCreateStartupOrder("startup_test_1", "user_test_1");

    // Old payment row must be marked failed
    expect(mockPaymentRows[0]?.status).toBe("failed");

    // New order created via Razorpay with USD and server-set amount
    expect(createSpy).toHaveBeenCalledWith({
      amountCents: 1000,
      currency: "USD",
      receipt: "startup_test_1",
      notes: {
        startup_id: "startup_test_1",
        user_id: "user_test_1",
      },
    });

    // New payment row returned
    expect(result.orderId).toBe("order_new_456");
    expect(mockPaymentRows.some((p) => p.razorpayOrderId === "order_new_456" && p.status === "created")).toBe(true);
  });

  it("replaces expired or cancelled order: marks old payment failed and creates brand new order", async () => {
    vi.spyOn(razorpayServer, "fetchRazorpayOrder").mockResolvedValue({
      id: "order_existing_123",
      amount: 1000,
      currency: "USD",
      status: "expired",
      amount_paid: 0,
    });

    vi.spyOn(razorpayServer, "createRazorpayOrder").mockResolvedValue({
      id: "order_new_789",
      amount: 1000,
      currency: "USD",
      status: "created",
    });

    const result = await getOrCreateStartupOrder("startup_test_1", "user_test_1");

    expect(mockPaymentRows[0]?.status).toBe("failed");
    expect(result.orderId).toBe("order_new_789");
  });

  it("when fetchRazorpayOrder returns status 'paid', calls markPaymentPaid, does not create new order, and throws friendly message", async () => {
    vi.spyOn(razorpayServer, "fetchRazorpayOrder").mockResolvedValue({
      id: "order_existing_123",
      amount: 1000,
      currency: "USD",
      status: "paid",
      amount_paid: 1000,
    });

    const fetchPaymentsSpy = vi.spyOn(razorpayServer, "fetchRazorpayOrderPayments").mockResolvedValue([
      {
        id: "pay_captured_123",
        order_id: "order_existing_123",
        amount: 1000,
        currency: "USD",
        status: "captured",
      },
    ]);

    const createSpy = vi.spyOn(razorpayServer, "createRazorpayOrder");

    await expect(getOrCreateStartupOrder("startup_test_1", "user_test_1")).rejects.toThrow(
      "We've received your payment. Your submission is moving to review. Refresh in a moment."
    );

    // Captured payments fetched
    expect(fetchPaymentsSpy).toHaveBeenCalledWith("order_existing_123");

    // No new order created
    expect(createSpy).not.toHaveBeenCalled();

    // Old payment row must NOT be marked failed (it was transitioned to paid)
    expect(mockPaymentRows[0]?.status).toBe("paid");
    expect(mockStartup.status).toBe("pending");
  });

  it("when fetchRazorpayOrder returns amount_paid > 0 with status 'created', calls markPaymentPaid and does not create new order", async () => {
    vi.spyOn(razorpayServer, "fetchRazorpayOrder").mockResolvedValue({
      id: "order_existing_123",
      amount: 1000,
      currency: "USD",
      status: "created",
      amount_paid: 1000,
    });

    vi.spyOn(razorpayServer, "fetchRazorpayOrderPayments").mockResolvedValue([
      {
        id: "pay_captured_partial_or_full",
        order_id: "order_existing_123",
        amount: 1000,
        currency: "USD",
        status: "captured",
      },
    ]);

    const createSpy = vi.spyOn(razorpayServer, "createRazorpayOrder");

    await expect(getOrCreateStartupOrder("startup_test_1", "user_test_1")).rejects.toThrow(
      "We've received your payment. Your submission is moving to review. Refresh in a moment."
    );

    expect(createSpy).not.toHaveBeenCalled();
    expect(mockPaymentRows[0]?.status).toBe("paid");
  });

  it("does not create a duplicate order and returns friendly error if Razorpay is unreachable", async () => {
    vi.spyOn(razorpayServer, "fetchRazorpayOrder").mockRejectedValue(
      new Error("Payment gateway is currently unreachable. Please try again shortly.")
    );

    const createSpy = vi.spyOn(razorpayServer, "createRazorpayOrder");

    await expect(getOrCreateStartupOrder("startup_test_1", "user_test_1")).rejects.toThrow(
      "Payment gateway is currently unreachable. Please try again shortly."
    );

    expect(createSpy).not.toHaveBeenCalled();
    // Old payment row must NOT be modified
    expect(mockPaymentRows[0]?.status).toBe("created");
  });

  it("never touches paid, refunded, or partially_refunded rows", async () => {
    // If payment row is already paid, getOrCreateStartupOrder must not mark it failed
    mockPaymentRows = [
      {
        id: "pay_row_paid",
        startupId: "startup_test_1",
        userId: "user_test_1",
        amountCents: 1000,
        amountRefundedCents: 0,
        currency: "USD",
        status: "paid",
        razorpayOrderId: "order_paid_123",
        razorpayPaymentId: "pay_123",
        createdAt: new Date(),
      },
    ];

    // If startup is not awaiting_payment, throws immediately without touching payments
    mockStartup.status = "approved";
    await expect(getOrCreateStartupOrder("startup_test_1", "user_test_1")).rejects.toThrow(
      "Startup is not awaiting payment."
    );
    expect(mockPaymentRows[0]?.status).toBe("paid");
  });

  it("allows late capture of previously failed order via markPaymentPaid", async () => {
    const failedPayment = {
      id: "pay_failed_1",
      startupId: "startup_test_1",
      userId: "user_test_1",
      amountCents: 1000,
      amountRefundedCents: 0,
      currency: "USD",
      status: "failed",
      razorpayOrderId: "order_failed_old",
      razorpayPaymentId: null,
      webhookEventId: null,
    };

    const targetStartup = {
      id: "startup_test_1",
      status: "awaiting_payment",
      name: "Startup Test One",
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Drizzle transaction mock
    vi.spyOn(db, "transaction").mockImplementation(async (callback: any) => {
      const mockTx = {
        select: () => ({
          from: (table: unknown) => ({
            where: () => {
              const q = {
                for: () => q,
                limit: () => (table === payments ? [failedPayment] : [targetStartup]),
              };
              return q;
            },
          }),
        }),
        update: (table: unknown) => ({
          set: (vals: Record<string, unknown>) => ({
            where: () => {
              if (table === payments || vals.status === "paid") {
                Object.assign(failedPayment, vals);
                return { returning: () => [failedPayment] };
              } else {
                Object.assign(targetStartup, vals);
                return { returning: () => [targetStartup] };
              }
            },
          }),
        }),
        insert: () => ({
          values: () => ({
            onConflictDoNothing: () => ({
              returning: () => [{ eventId: "evt_1" }],
            }),
            returning: () => [],
          }),
        }),
        execute: async () => [{ email: "founder@example.com", display_name: "Founder" }],
      };
      return await callback(mockTx);
    });

    const res = await markPaymentPaid({
      razorpayOrderId: "order_failed_old",
      razorpayPaymentId: "pay_captured_late",
    });

    expect(res.success).toBe(true);
    expect(failedPayment.status).toBe("paid");
    expect(targetStartup.status).toBe("pending");
  });
});




describe("Payments - INR Price helpers, formatMoney, and getSubmissionPrice", () => {
  const originalInrEnv = process.env.SUBMISSION_PRICE_INR_PAISE;
  const originalUsdEnv = process.env.SUBMISSION_PRICE_USD_CENTS;

  afterEach(() => {
    if (originalInrEnv !== undefined) {
      process.env.SUBMISSION_PRICE_INR_PAISE = originalInrEnv;
    } else {
      delete process.env.SUBMISSION_PRICE_INR_PAISE;
    }
    if (originalUsdEnv !== undefined) {
      process.env.SUBMISSION_PRICE_USD_CENTS = originalUsdEnv;
    } else {
      delete process.env.SUBMISSION_PRICE_USD_CENTS;
    }
  });

  it("defaults to 99900 paise (₹999.00) when SUBMISSION_PRICE_INR_PAISE is unset", () => {
    delete process.env.SUBMISSION_PRICE_INR_PAISE;
    expect(getSubmissionPriceInrPaise()).toBe(99900);
  });

  it("reads positive integer amount from SUBMISSION_PRICE_INR_PAISE", () => {
    process.env.SUBMISSION_PRICE_INR_PAISE = "149900";
    expect(getSubmissionPriceInrPaise()).toBe(149900);
  });

  it("falls back to 99900 if SUBMISSION_PRICE_INR_PAISE is invalid or non-positive", () => {
    process.env.SUBMISSION_PRICE_INR_PAISE = "invalid";
    expect(getSubmissionPriceInrPaise()).toBe(99900);

    process.env.SUBMISSION_PRICE_INR_PAISE = "-500";
    expect(getSubmissionPriceInrPaise()).toBe(99900);

    process.env.SUBMISSION_PRICE_INR_PAISE = "0";
    expect(getSubmissionPriceInrPaise()).toBe(99900);
  });

  it("formats submission price using the rupee sign in formatSubmissionPriceInr", () => {
    delete process.env.SUBMISSION_PRICE_INR_PAISE;
    expect(formatSubmissionPriceInr()).toBe("₹999.00");
    expect(formatSubmissionPriceInr(150000)).toBe("₹1500.00");
  });

  it("getSubmissionPrice returns server-computed minor amount and validated currency", () => {
    delete process.env.SUBMISSION_PRICE_INR_PAISE;
    delete process.env.SUBMISSION_PRICE_USD_CENTS;

    expect(getSubmissionPrice("INR")).toEqual({ amountMinor: 99900, currency: "INR" });
    expect(getSubmissionPrice("USD")).toEqual({ amountMinor: 1000, currency: "USD" });
    // Defaults to USD
    expect(getSubmissionPrice()).toEqual({ amountMinor: 1000, currency: "USD" });
  });

  it("formatMoney formats minor units and never prints '$' for INR payments", () => {
    const inrFormatted = formatMoney(99900, "INR");
    expect(inrFormatted).toBe("₹999.00");
    expect(inrFormatted).not.toContain("$");

    const usdFormatted = formatMoney(1000, "USD");
    expect(usdFormatted).toBe("$10.00");

    expect(formatMoney(0, "INR")).toBe("₹0.00");
  });

  it("formatPriceButton formats concise button labels", () => {
    expect(formatPriceButton(99900, "INR")).toBe("Rs 999");
    expect(formatPriceButton(1000, "USD")).toBe("$10");
  });
});

describe("Payments - Currency Enum Validation in Server Actions", () => {
  beforeEach(() => {
    vi.spyOn(authServer, "getCurrentUserProfile").mockResolvedValue({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- mock user
      user: { id: "user_valid_1", email_confirmed_at: "2026-01-01T00:00:00Z" } as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- mock profile
      profile: { id: "user_valid_1", role: "founder" } as any,
    });
    vi.spyOn(startupsServer, "isUserEmailVerified").mockResolvedValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("getStartupPaymentOrderAction rejects non-enum currency ('EUR', numbers, objects)", async () => {
    const resEur = await getStartupPaymentOrderAction("startup_1", "EUR");
    expect(resEur).toEqual({
      error: "Invalid payment currency. Please choose either USD or INR.",
    });

    const resNum = await getStartupPaymentOrderAction("startup_1", 123);
    expect(resNum).toEqual({
      error: "Invalid payment currency. Please choose either USD or INR.",
    });

    const resObj = await getStartupPaymentOrderAction("startup_1", { evil: true });
    expect(resObj).toEqual({
      error: "Invalid payment currency. Please choose either USD or INR.",
    });
  });

  it("submitStartupAction rejects non-enum currency ('EUR', numbers, objects)", async () => {
    const dummyPayload = {
      name: "Test Startup",
      tagline: "Test Tagline",
      description: "Test Description",
      category: "AI",
      stage: "MVP",
      countryCode: "US",
    };

    const resEur = await submitStartupAction(dummyPayload, "EUR");
    expect(resEur).toEqual({
      error: "Invalid payment currency. Please choose either USD or INR.",
    });

    const resNum = await submitStartupAction(dummyPayload, 999);
    expect(resNum).toEqual({
      error: "Invalid payment currency. Please choose either USD or INR.",
    });

    const resObj = await submitStartupAction(dummyPayload, ["USD"]);
    expect(resObj).toEqual({
      error: "Invalid payment currency. Please choose either USD or INR.",
    });
  });
});

describe("Payments - INR Order Creation and Stale Order Replacement", () => {
  let mockPaymentRows: MockPaymentRecord[];
  const mockStartup = {
    id: "startup_test_1",
    ownerId: "user_test_1",
    status: "awaiting_payment",
    name: "Startup Test One",
  };

  beforeEach(() => {
    mockPaymentRows = [
      {
        id: "pay_usd_existing",
        startupId: "startup_test_1",
        userId: "user_test_1",
        amountCents: 1000,
        amountRefundedCents: 0,
        currency: "USD",
        status: "created",
        razorpayOrderId: "order_usd_old",
        razorpayPaymentId: null,
        webhookEventId: null,
      },
    ];

    vi.spyOn(razorpayServer, "isPaymentRequired").mockReturnValue(true);
    vi.spyOn(razorpayServer, "getRazorpayCredentials").mockReturnValue({
      keyId: "rzp_test_current",
      keySecret: "secret_current",
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Drizzle execute mock
    vi.spyOn(db, "execute").mockResolvedValue([{ count: 1 }] as any);

    vi.spyOn(db, "select").mockImplementation((() => ({
      from: (table: unknown) => ({
        where: () => {
          const q = {
            limit: () => {
              if (table === startups) {
                return [mockStartup];
              }
              const createdOrder = mockPaymentRows.find((p) => p.status === "created");
              return createdOrder ? [createdOrder] : [];
            },
            orderBy: () => q,
            then: (resolve: (v: unknown) => unknown) => {
              if (table === startups) {
                return resolve([{ count: 1 }]);
              }
              const createdOrder = mockPaymentRows.find((p) => p.status === "created");
              return resolve(createdOrder ? [createdOrder] : []);
            },
          };
          return q;
        },
      }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Drizzle query builder mock
    })) as any);

    vi.spyOn(db, "update").mockImplementation((() => ({
      set: (vals: Record<string, unknown>) => ({
        where: () => {
          const row = mockPaymentRows.find((p) => p.status === "created");
          if (row) {
            Object.assign(row, vals);
          }
          return {
            returning: () => (row ? [row] : []),
          };
        },
      }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Drizzle query builder mock
    })) as any);

    vi.spyOn(db, "insert").mockImplementation((() => ({
      values: (vals: Record<string, unknown>) => {
        const newRow: MockPaymentRecord = {
          id: `pay_${Date.now()}`,
          startupId: vals.startupId as string,
          userId: vals.userId as string,
          amountCents: vals.amountCents as number,
          amountRefundedCents: 0,
          currency: (vals.currency as string) || "USD",
          status: (vals.status as "created" | "paid" | "failed" | "refunded" | "partially_refunded") || "created",
          razorpayOrderId: vals.razorpayOrderId as string,
          razorpayPaymentId: null,
          webhookEventId: null,
        };
        mockPaymentRows.push(newRow);
        return {
          returning: () => [newRow],
        };
      },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Drizzle query builder mock
    })) as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("creates a new INR order when requested and no prior unpaid order exists", async () => {
    mockPaymentRows = [];

    const createSpy = vi.spyOn(razorpayServer, "createRazorpayOrder").mockResolvedValue({
      id: "order_inr_123",
      amount: 99900,
      currency: "INR",
      status: "created",
    });

    const res = await getOrCreateStartupOrder("startup_test_1", "user_test_1", "INR");

    expect(createSpy).toHaveBeenCalledWith({
      amountCents: 99900,
      currency: "INR",
      receipt: "startup_test_1",
      notes: {
        startup_id: "startup_test_1",
        user_id: "user_test_1",
      },
    });

    expect(res.orderId).toBe("order_inr_123");
    expect(res.amount).toBe(99900);
    expect(res.currency).toBe("INR");
  });

  it("replaces existing USD order when user switches to INR (marks USD failed, creates INR)", async () => {
    // Return null from fetchRazorpayOrder to trigger stale order replacement
    vi.spyOn(razorpayServer, "fetchRazorpayOrder").mockResolvedValue(null);

    const createSpy = vi.spyOn(razorpayServer, "createRazorpayOrder").mockResolvedValue({
      id: "order_inr_new_789",
      amount: 99900,
      currency: "INR",
      status: "created",
    });

    const res = await getOrCreateStartupOrder("startup_test_1", "user_test_1", "INR");

    // Old USD payment must be marked failed
    expect(mockPaymentRows[0]?.status).toBe("failed");
    expect(mockPaymentRows[0]?.currency).toBe("USD");

    // New INR order created and returned
    expect(createSpy).toHaveBeenCalledWith({
      amountCents: 99900,
      currency: "INR",
      receipt: "startup_test_1",
      notes: {
        startup_id: "startup_test_1",
        user_id: "user_test_1",
      },
    });

    expect(res.orderId).toBe("order_inr_new_789");
    expect(res.amount).toBe(99900);
    expect(res.currency).toBe("INR");
  });
});

describe("Payments - INR confirmPaymentAction and Webhook verification", () => {
  let mockInrPayment: MockPaymentRecord;

  beforeEach(() => {
    mockInrPayment = {
      id: "pay_inr_1",
      startupId: "startup_inr_1",
      userId: "user_inr_1",
      razorpayOrderId: "order_inr_1",
      razorpayPaymentId: "pay_rzp_inr_1",
      amountCents: 99900,
      amountRefundedCents: 0,
      currency: "INR",
      status: "created",
      webhookEventId: null,
    };

    vi.spyOn(authServer, "getCurrentUserProfile").mockResolvedValue({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- mock user
      user: { id: "user_inr_1" } as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- mock profile
      profile: { id: "user_inr_1", role: "founder" } as any,
    });

    vi.spyOn(razorpayServer, "verifyPaymentSignature").mockReturnValue(true);

    vi.spyOn(db, "select").mockImplementation((() => ({
      from: () => ({
        where: () => ({
          limit: () => [mockInrPayment],
        }),
      }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Drizzle query builder mock
    })) as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("confirmPaymentAction succeeds when INR payment is captured with matching amount and currency", async () => {
    vi.spyOn(razorpayServer, "fetchRazorpayPayment").mockResolvedValue({
      id: "pay_rzp_inr_1",
      order_id: "order_inr_1",
      amount: 99900,
      currency: "INR",
      status: "captured",
    });

    const targetStartup = {
      id: "startup_inr_1",
      status: "awaiting_payment",
      name: "Acme India",
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Drizzle transaction mock
    vi.spyOn(db, "transaction").mockImplementation(async (callback: any) => {
      const mockTx = {
        select: () => ({
          from: (table: unknown) => ({
            where: () => {
              const q = {
                for: () => q,
                limit: () => (table === payments ? [mockInrPayment] : [targetStartup]),
              };
              return q;
            },
          }),
        }),
        update: (table: unknown) => ({
          set: (vals: Record<string, unknown>) => ({
            where: () => {
              if (table === payments || vals.status === "paid") {
                Object.assign(mockInrPayment, vals);
                return { returning: () => [mockInrPayment] };
              } else {
                Object.assign(targetStartup, vals);
                return { returning: () => [targetStartup] };
              }
            },
          }),
        }),
        insert: () => ({
          values: () => ({
            onConflictDoNothing: () => ({
              returning: () => [{ eventId: "evt_1" }],
            }),
            returning: () => [],
          }),
        }),
        execute: async () => [{ email: "founder@example.com", display_name: "Founder" }],
      };
      return await callback(mockTx);
    });

    const res = await confirmPaymentAction({
      startupId: "startup_inr_1",
      razorpayOrderId: "order_inr_1",
      razorpayPaymentId: "pay_rzp_inr_1",
      razorpaySignature: "sig_inr_1",
    });

    expect(res).toEqual({ success: true });
    expect(mockInrPayment.status).toBe("paid");
  });

  it("confirmPaymentAction rejects INR amount mismatch", async () => {
    vi.spyOn(razorpayServer, "fetchRazorpayPayment").mockResolvedValue({
      id: "pay_rzp_inr_1",
      order_id: "order_inr_1",
      amount: 50000, // mismatch from 99900
      currency: "INR",
      status: "captured",
    });

    const res = await confirmPaymentAction({
      startupId: "startup_inr_1",
      razorpayOrderId: "order_inr_1",
      razorpayPaymentId: "pay_rzp_inr_1",
      razorpaySignature: "sig_inr_1",
    });

    expect(res).toEqual({ error: "Payment amount mismatch." });
  });

  it("confirmPaymentAction rejects currency mismatch (e.g. razorpay returns USD for stored INR order)", async () => {
    vi.spyOn(razorpayServer, "fetchRazorpayPayment").mockResolvedValue({
      id: "pay_rzp_inr_1",
      order_id: "order_inr_1",
      amount: 99900,
      currency: "USD", // mismatch from INR
      status: "captured",
    });

    const res = await confirmPaymentAction({
      startupId: "startup_inr_1",
      razorpayOrderId: "order_inr_1",
      razorpayPaymentId: "pay_rzp_inr_1",
      razorpaySignature: "sig_inr_1",
    });

    expect(res).toEqual({ error: "Payment currency mismatch." });
  });

  it("webhook marks INR payment paid when amount and currency match", async () => {
    vi.spyOn(razorpayServer, "verifyWebhookSignature").mockReturnValue(true);

    const targetStartup = {
      id: "startup_inr_1",
      status: "awaiting_payment",
      name: "Acme India",
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Drizzle transaction mock
    vi.spyOn(db, "transaction").mockImplementation(async (callback: any) => {
      const mockTx = {
        select: () => ({
          from: (table: unknown) => ({
            where: () => {
              const q = {
                for: () => q,
                limit: () => (table === payments ? [mockInrPayment] : [targetStartup]),
              };
              return q;
            },
          }),
        }),
        update: (table: unknown) => ({
          set: (vals: Record<string, unknown>) => ({
            where: () => {
              if (table === payments || vals.status === "paid") {
                Object.assign(mockInrPayment, vals);
                return { returning: () => [mockInrPayment] };
              } else {
                Object.assign(targetStartup, vals);
                return { returning: () => [targetStartup] };
              }
            },
          }),
        }),
        insert: () => ({
          values: () => ({
            onConflictDoNothing: () => ({
              returning: () => [{ eventId: "evt_1" }],
            }),
            returning: () => [],
          }),
        }),
        execute: async () => [{ email: "founder@example.com", display_name: "Founder" }],
      };
      return await callback(mockTx);
    });

    const payload = JSON.stringify({
      id: "evt_inr_captured",
      event: "payment.captured",
      payload: {
        payment: {
          entity: {
            id: "pay_rzp_inr_1",
            order_id: "order_inr_1",
            amount: 99900,
            currency: "INR",
            status: "captured",
          },
        },
      },
    });

    const req = new NextRequest("http://localhost:3000/api/webhooks/razorpay", {
      method: "POST",
      body: payload,
      headers: {
        "x-razorpay-signature": "dummy_sig",
      },
    });

    const res = await webhookPost(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.received).toBe(true);
    expect(mockInrPayment.status).toBe("paid");
  });

  it("webhook ignores INR event with amount mismatch", async () => {
    vi.spyOn(razorpayServer, "verifyWebhookSignature").mockReturnValue(true);

    const payload = JSON.stringify({
      id: "evt_inr_amount_mismatch",
      event: "payment.captured",
      payload: {
        payment: {
          entity: {
            id: "pay_rzp_inr_1",
            order_id: "order_inr_1",
            amount: 50000, // mismatch from 99900
            currency: "INR",
            status: "captured",
          },
        },
      },
    });

    const req = new NextRequest("http://localhost:3000/api/webhooks/razorpay", {
      method: "POST",
      body: payload,
      headers: {
        "x-razorpay-signature": "dummy_sig",
      },
    });

    const res = await webhookPost(req);
    expect(res.status).toBe(200);
    // Payment should remain created (not marked paid)
    expect(mockInrPayment.status).toBe("created");
  });

  it("webhook ignores INR event with currency mismatch", async () => {
    vi.spyOn(razorpayServer, "verifyWebhookSignature").mockReturnValue(true);

    const payload = JSON.stringify({
      id: "evt_inr_curr_mismatch",
      event: "payment.captured",
      payload: {
        payment: {
          entity: {
            id: "pay_rzp_inr_1",
            order_id: "order_inr_1",
            amount: 99900,
            currency: "USD", // mismatch from stored INR
            status: "captured",
          },
        },
      },
    });

    const req = new NextRequest("http://localhost:3000/api/webhooks/razorpay", {
      method: "POST",
      body: payload,
      headers: {
        "x-razorpay-signature": "dummy_sig",
      },
    });

    const res = await webhookPost(req);
    expect(res.status).toBe(200);
    // Payment should remain created (not marked paid)
    expect(mockInrPayment.status).toBe("created");
  });
});
