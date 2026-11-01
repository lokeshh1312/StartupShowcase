import "server-only";
import crypto from "node:crypto";
export { formatMoney, formatPriceButton, type PaymentCurrency } from "@/lib/money";

/**
 * Returns the configured submission price in USD cents.
 * Authoritative on the server: defaults to 1000 ($10.00 USD).
 * The client never supplies an amount.
 */
export function getSubmissionPriceCents(): number {
  const envVal = process.env.SUBMISSION_PRICE_USD_CENTS?.trim();
  if (envVal) {
    const parsed = parseInt(envVal, 10);
    if (!Number.isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return 1000;
}

/**
 * Returns formatted submission price string (e.g. "$10.00 USD").
 */
export function formatSubmissionPriceUsd(cents: number = getSubmissionPriceCents()): string {
  return `$${(cents / 100).toFixed(2)} USD`;
}

/**
 * Returns the configured submission price in INR paise.
 * Authoritative on the server: defaults to 99900 (₹999.00).
 * The client never supplies an amount.
 */
export function getSubmissionPriceInrPaise(): number {
  const envVal = process.env.SUBMISSION_PRICE_INR_PAISE?.trim();
  if (envVal) {
    const parsed = parseInt(envVal, 10);
    if (!Number.isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return 99900;
}

/**
 * Returns formatted submission price string in INR (e.g. "₹999.00" using the rupee sign).
 */
export function formatSubmissionPriceInr(paise: number = getSubmissionPriceInrPaise()): string {
  return `₹${(paise / 100).toFixed(2)}`;
}

/**
 * Server-authoritative helper returning amount in minor units and validated currency.
 * Currency is strictly "INR" | "USD", defaulting to "USD".
 */
export function getSubmissionPrice(currency?: string): {
  amountMinor: number;
  currency: "INR" | "USD";
} {
  const norm = currency?.toUpperCase();
  if (norm === "INR") {
    return {
      amountMinor: getSubmissionPriceInrPaise(),
      currency: "INR",
    };
  }
  return {
    amountMinor: getSubmissionPriceCents(),
    currency: "USD",
  };
}

/**
 * Returns whether Razorpay server credentials are configured.
 */
export function isRazorpayConfigured(): boolean {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  return Boolean(keyId && keySecret);
}

/**
 * Returns whether payment is required for submission.
 * In production: ALWAYS true (mandatory).
 * In development / test: true if Razorpay is configured, otherwise false with a loud warning.
 */
export function isPaymentRequired(): boolean {
  if (process.env.NODE_ENV === "production") {
    return true;
  }
  const configured = isRazorpayConfigured();
  if (!configured) {
    console.warn(
      "[Razorpay Warning]: RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is unset in development. Payment step will be skipped for local testing."
    );
  }
  return configured;
}

/**
 * Get credentials, verifying production test-key safety rules.
 */
export function getRazorpayCredentials(): { keyId: string; keySecret: string } {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim() || "";
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim() || "";

  if (process.env.NODE_ENV === "production") {
    if (!keyId || !keySecret) {
      throw new Error("Missing required production Razorpay credentials: RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET");
    }
    const allowTest = process.env.ALLOW_RAZORPAY_TEST_IN_PRODUCTION === "true";
    if (keyId.startsWith("rzp_test_") && !allowTest) {
      throw new Error(
        "CRITICAL SECURITY ERROR: RAZORPAY_KEY_ID is a test key (starts with 'rzp_test_') in production. Launching in test mode is prohibited unless ALLOW_RAZORPAY_TEST_IN_PRODUCTION=true."
      );
    }
  }

  return { keyId, keySecret };
}

/**
 * Verifies Razorpay checkout HMAC-SHA256 signature using timingSafeEqual.
 * Signature payload: `${orderId}|${paymentId}` signed with RAZORPAY_KEY_SECRET.
 */
export function verifyPaymentSignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
  secret?: string;
}): boolean {
  const { orderId, paymentId, signature, secret } = params;
  if (!orderId || !paymentId || !signature) {
    return false;
  }

  const keySecret = secret || process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!keySecret) {
    return false;
  }

  try {
    const payload = `${orderId}|${paymentId}`;
    const expected = crypto.createHmac("sha256", keySecret).update(payload).digest("hex");

    const expectedBuf = Buffer.from(expected, "utf-8");
    const sigBuf = Buffer.from(signature, "utf-8");

    if (expectedBuf.length !== sigBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuf, sigBuf);
  } catch {
    return false;
  }
}

/**
 * Verifies Razorpay Webhook HMAC-SHA256 signature using timingSafeEqual.
 * Signature payload: raw webhook body signed with RAZORPAY_WEBHOOK_SECRET.
 */
export function verifyWebhookSignature(params: {
  rawBody: string;
  signature: string;
  secret?: string;
}): boolean {
  const { rawBody, signature, secret } = params;
  if (!rawBody || !signature) {
    return false;
  }

  const webhookSecret = secret || process.env.RAZORPAY_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) {
    return false;
  }

  try {
    const expected = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex");

    const expectedBuf = Buffer.from(expected, "utf-8");
    const sigBuf = Buffer.from(signature, "utf-8");

    if (expectedBuf.length !== sigBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuf, sigBuf);
  } catch {
    return false;
  }
}

export interface RazorpayOrderResult {
  id: string;
  amount: number;
  currency: string;
  receipt?: string;
  status: string;
  notes?: Record<string, string>;
  amount_paid?: number;
  amount_due?: number;
  attempts?: number;
}

/**
 * Creates a Razorpay Order via the REST API.
 * Currency is strictly "USD" | "INR". Amount is server-set.
 */
export async function createRazorpayOrder(options: {
  amountCents: number;
  receipt: string;
  notes: { startup_id: string; user_id: string };
  currency?: "INR" | "USD" | string;
}): Promise<RazorpayOrderResult> {
  const { keyId, keySecret } = getRazorpayCredentials();
  const currency: "INR" | "USD" =
    options.currency?.toUpperCase() === "INR" ? "INR" : "USD";

  const basicAuth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${basicAuth}`,
    },
    body: JSON.stringify({
      amount: options.amountCents,
      currency,
      receipt: options.receipt,
      notes: options.notes,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(`Razorpay order creation failed: ${response.status} ${errorBody}`);
  }

  const data = (await response.json()) as RazorpayOrderResult;
  return data;
}

export interface RazorpayPaymentResult {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: string;
  method?: string;
  notes?: Record<string, string>;
}

/**
 * Fetches a Razorpay payment details from the REST API.
 */
export async function fetchRazorpayPayment(paymentId: string): Promise<RazorpayPaymentResult> {
  const { keyId, keySecret } = getRazorpayCredentials();
  const basicAuth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

  const response = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`, {
    method: "GET",
    headers: {
      Authorization: `Basic ${basicAuth}`,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(`Razorpay fetch payment failed: ${response.status} ${errorBody}`);
  }

  const data = (await response.json()) as RazorpayPaymentResult;
  return data;
}

/**
 * Fetches an order from Razorpay by ID using the CURRENT credentials.
 * - Returns order details if found.
 * - Returns null if Razorpay says the order does not exist or belongs to another mode (HTTP 400 / 404).
 * - Throws a friendly error if Razorpay is unreachable (network error or HTTP 5xx).
 */
export async function fetchRazorpayOrder(orderId: string): Promise<RazorpayOrderResult | null> {
  const { keyId, keySecret } = getRazorpayCredentials();
  const basicAuth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

  let response: Response;
  try {
    response = await fetch(`https://api.razorpay.com/v1/orders/${encodeURIComponent(orderId)}`, {
      method: "GET",
      headers: {
        Authorization: `Basic ${basicAuth}`,
      },
    });
  } catch {
    throw new Error("Payment gateway is currently unreachable. Please try again shortly.");
  }

  if (response.status >= 500) {
    throw new Error("Payment gateway is currently unreachable. Please try again shortly.");
  }

  if (response.status === 400 || response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(`Razorpay fetch order failed: ${response.status} ${errorBody}`);
  }

  const data = (await response.json()) as RazorpayOrderResult;
  return data;
}

/**
 * Fetches payments associated with a Razorpay order from the REST API.
 */
export async function fetchRazorpayOrderPayments(orderId: string): Promise<RazorpayPaymentResult[]> {
  const { keyId, keySecret } = getRazorpayCredentials();
  const basicAuth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

  let response: Response;
  try {
    response = await fetch(`https://api.razorpay.com/v1/orders/${encodeURIComponent(orderId)}/payments`, {
      method: "GET",
      headers: {
        Authorization: `Basic ${basicAuth}`,
      },
    });
  } catch {
    throw new Error("Payment gateway is currently unreachable. Please try again shortly.");
  }

  if (response.status >= 500) {
    throw new Error("Payment gateway is currently unreachable. Please try again shortly.");
  }

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(`Razorpay fetch order payments failed: ${response.status} ${errorBody}`);
  }

  const data = (await response.json()) as { items?: RazorpayPaymentResult[] };
  return data.items || [];
}
