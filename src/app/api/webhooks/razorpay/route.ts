import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/server/razorpay";
import { markPaymentPaid, markPaymentFailed, processPaymentRefund } from "@/server/payments";
import { db } from "@/db";
import { payments, paymentEvents } from "@/db/schema";
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

  // 1. Verify HMAC-SHA256 signature using timingSafeEqual
  const isValid = verifyWebhookSignature({ rawBody, signature });
  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // 2. Parse event payload
  let event: {
    id?: string;
    event: string;
    payload?: {
      payment?: {
        entity?: {
          id: string;
          order_id: string;
          amount: number;
          amount_refunded?: number;
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

  // Durable event ID from X-Razorpay-Event-Id header or payload event.id
  const eventId = request.headers.get("x-razorpay-event-id") || event.id || undefined;

  // 3. Durable Idempotency: insert event id first (ON CONFLICT DO NOTHING)
  if (eventId) {
    const inserted = await db
      .insert(paymentEvents)
      .values({
        eventId,
        eventType: event.event,
        razorpayPaymentId:
          event.payload?.payment?.entity?.id ||
          event.payload?.refund?.entity?.payment_id ||
          null,
      })
      .onConflictDoNothing()
      .returning({ eventId: paymentEvents.eventId });

    if (inserted.length === 0) {
      return NextResponse.json({ received: true, idempotent: true });
    }
  }

  try {
    switch (event.event) {
      case "payment.captured": {
        const paymentEntity = event.payload?.payment?.entity;
        if (!paymentEntity || !paymentEntity.order_id || !paymentEntity.id) {
          console.warn("[Webhook Warning]: payment.captured missing entity/order_id/id");
          return NextResponse.json({ received: true });
        }

        // Accept only Razorpay payment status "captured" (not "authorized")
        if (paymentEntity.status !== "captured") {
          console.warn(
            `[Webhook Warning]: payment.captured event has non-captured status: ${paymentEntity.status}`
          );
          return NextResponse.json({ received: true, ignored: true });
        }

        // Verify against stored payment record
        const [storedPayment] = await db
          .select({
            id: payments.id,
            razorpayOrderId: payments.razorpayOrderId,
            amountCents: payments.amountCents,
            currency: payments.currency,
            status: payments.status,
          })
          .from(payments)
          .where(eq(payments.razorpayOrderId, paymentEntity.order_id))
          .limit(1);

        // If the stored row is missing or mismatched, log and return 200 without marking paid
        if (!storedPayment) {
          console.error(
            `[Webhook Error]: Payment record not found for order ${paymentEntity.order_id}`
          );
          return NextResponse.json({ received: true });
        }

        if (
          paymentEntity.order_id !== storedPayment.razorpayOrderId ||
          paymentEntity.amount !== storedPayment.amountCents ||
          paymentEntity.currency !== storedPayment.currency
        ) {
          console.error(
            `[Webhook Error]: Payment mismatch for order ${paymentEntity.order_id}: ` +
              `order_id (${paymentEntity.order_id} vs ${storedPayment.razorpayOrderId}), ` +
              `amount (${paymentEntity.amount} vs ${storedPayment.amountCents}), ` +
              `currency (${paymentEntity.currency} vs ${storedPayment.currency})`
          );
          return NextResponse.json({ received: true });
        }

        // If stored payment is already refunded, do not revive it
        if (storedPayment.status === "refunded") {
          console.warn(
            `[Webhook Warning]: Stored payment for order ${paymentEntity.order_id} is refunded.`
          );
          return NextResponse.json({ received: true, ignored: true });
        }

        await markPaymentPaid({
          razorpayOrderId: paymentEntity.order_id,
          razorpayPaymentId: paymentEntity.id,
          webhookEventId: eventId,
        });
        break;
      }

      case "payment.authorized": {
        // An authorized payment is not captured yet.
        // Event was recorded above; return 200 without marking payment paid or moving startup.
        console.info(
          `[Webhook Info]: Payment ${event.payload?.payment?.entity?.id} is authorized, awaiting capture.`
        );
        return NextResponse.json({ received: true, awaiting_capture: true });
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
        const paymentEntity = event.payload?.payment?.entity;
        const paymentId = refundEntity?.payment_id || paymentEntity?.id;
        if (paymentId) {
          await processPaymentRefund({
            razorpayPaymentId: paymentId,
            refundAmountCents: refundEntity?.amount,
            totalRefundedCents: paymentEntity?.amount_refunded,
            webhookEventId: eventId,
            reason: "Refund processed via Razorpay Dashboard",
          });
        }
        break;
      }

      default:
        // Other events acknowledged
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    // Log internally but never reveal sensitive error details to external caller
    console.error("[Razorpay Webhook Error]:", err);
    return NextResponse.json({ error: "Internal processing error" }, { status: 500 });
  }
}
