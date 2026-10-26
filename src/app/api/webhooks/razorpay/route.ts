import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/server/razorpay";
import { markPaymentPaid, markPaymentFailed, processPaymentRefund } from "@/server/payments";
import { db } from "@/db";
import { payments } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ error: "Unable to read request payload" }, { status: 400 });
  }

  const signature = request.headers.get("x-razorpay-signature") || "";
  const eventId = request.headers.get("x-razorpay-event-id") || undefined;

  // 1. Verify HMAC-SHA256 signature using timingSafeEqual
  const isValid = verifyWebhookSignature({ rawBody, signature });
  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // 2. Parse event payload
  let event: {
    event: string;
    payload?: {
      payment?: {
        entity?: {
          id: string;
          order_id: string;
          amount: number;
          currency: string;
          status: string;
        };
      };
      refund?: {
        entity?: {
          id: string;
          payment_id: string;
          amount: number;
          currency: string;
          status: string;
        };
      };
    };
  };

  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  // 3. Idempotency check via X-Razorpay-Event-Id header
  if (eventId) {
    const existing = await db
      .select({ id: payments.id })
      .from(payments)
      .where(eq(payments.webhookEventId, eventId))
      .limit(1);

    if (existing.length > 0) {
      // Event already processed
      return NextResponse.json({ received: true, idempotent: true });
    }
  }

  try {
    switch (event.event) {
      case "payment.captured": {
        const paymentEntity = event.payload?.payment?.entity;
        if (!paymentEntity || !paymentEntity.order_id || !paymentEntity.id) {
          return NextResponse.json({ received: true });
        }

        // Verify currency is USD
        if (paymentEntity.currency !== "USD") {
          console.error("[Webhook Error]: Rejected non-USD payment:", paymentEntity.currency);
          return NextResponse.json({ received: true });
        }

        // Verify against stored payment record
        const [storedPayment] = await db
          .select({ amountCents: payments.amountCents, currency: payments.currency })
          .from(payments)
          .where(eq(payments.razorpayOrderId, paymentEntity.order_id))
          .limit(1);

        if (storedPayment && storedPayment.amountCents !== paymentEntity.amount) {
          console.error(
            `[Webhook Error]: Payment amount mismatch. Stored: ${storedPayment.amountCents}, received: ${paymentEntity.amount}`
          );
          return NextResponse.json({ received: true });
        }

        await markPaymentPaid({
          razorpayOrderId: paymentEntity.order_id,
          razorpayPaymentId: paymentEntity.id,
          webhookEventId: eventId,
        });
        break;
      }

      case "payment.failed": {
        const paymentEntity = event.payload?.payment?.entity;
        if (paymentEntity) {
          await markPaymentFailed({
            razorpayOrderId: paymentEntity.order_id,
            razorpayPaymentId: paymentEntity.id,
            webhookEventId: eventId,
          });
        }
        break;
      }

      case "refund.processed": {
        const refundEntity = event.payload?.refund?.entity;
        const paymentId = refundEntity?.payment_id || event.payload?.payment?.entity?.id;
        if (paymentId) {
          await processPaymentRefund({
            razorpayPaymentId: paymentId,
            webhookEventId: eventId,
            reason: "Refund processed via Razorpay Dashboard",
          });
        }
        break;
      }

      default:
        // Ignore unhandled events and return 200 quickly
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    // Log internally but never reveal sensitive error details to external caller
    console.error("[Razorpay Webhook Error]:", err);
    return NextResponse.json({ error: "Internal processing error" }, { status: 500 });
  }
}
