import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/server/razorpay";
import { markPaymentPaid, markPaymentFailed, processPaymentRefund } from "@/server/payments";
import { db } from "@/db";
import { payments, paymentEvents } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * For events the route ignores (payment.authorized, unknown events, mismatch/ignored cases),
 * record the event id in a separate insert AFTER deciding to ignore, so it cannot block a later valid event.
 */
async function recordIgnoredEvent(
  eventId: string | undefined,
  eventType: string,
  razorpayPaymentId?: string | null
) {
  if (!eventId) return;
  try {
    await db
      .insert(paymentEvents)
      .values({
        eventId,
        eventType,
        razorpayPaymentId: razorpayPaymentId || null,
      })
      .onConflictDoNothing();
  } catch (err) {
    console.warn("[Webhook Warning]: Failed to record ignored event:", err);
  }
}

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

  try {
    switch (event.event) {
      case "payment.captured": {
        const paymentEntity = event.payload?.payment?.entity;
        if (!paymentEntity || !paymentEntity.order_id || !paymentEntity.id) {
          console.warn("[Webhook Warning]: payment.captured missing entity/order_id/id");
          await recordIgnoredEvent(eventId, event.event, paymentEntity?.id);
          return NextResponse.json({ received: true });
        }

        // Accept only Razorpay payment status "captured" (not "authorized")
        if (paymentEntity.status !== "captured") {
          console.warn(
            `[Webhook Warning]: payment.captured event has non-captured status: ${paymentEntity.status}`
          );
          await recordIgnoredEvent(eventId, event.event, paymentEntity.id);
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
          await recordIgnoredEvent(eventId, event.event, paymentEntity.id);
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
          await recordIgnoredEvent(eventId, event.event, paymentEntity.id);
          return NextResponse.json({ received: true });
        }

        // If stored payment is already refunded, do not revive it
        if (storedPayment.status === "refunded") {
          console.warn(
            `[Webhook Warning]: Stored payment for order ${paymentEntity.order_id} is refunded.`
          );
          await recordIgnoredEvent(eventId, event.event, paymentEntity.id);
          return NextResponse.json({ received: true, ignored: true });
        }

        const paidResult = await markPaymentPaid({
          razorpayOrderId: paymentEntity.order_id,
          razorpayPaymentId: paymentEntity.id,
          webhookEventId: eventId,
          eventType: event.event,
        });

        if (paidResult.alreadyProcessed || paidResult.alreadyPaid) {
          return NextResponse.json({ received: true, idempotent: true });
        }
        break;
      }

      case "payment.authorized": {
        // An authorized payment is not captured yet.
        // Record event id after deciding to ignore; return 200 without marking payment paid.
        console.info(
          `[Webhook Info]: Payment ${event.payload?.payment?.entity?.id} is authorized, awaiting capture.`
        );
        await recordIgnoredEvent(eventId, event.event, event.payload?.payment?.entity?.id);
        return NextResponse.json({ received: true, awaiting_capture: true });
      }

      case "payment.failed": {
        const paymentEntity = event.payload?.payment?.entity;
        if (paymentEntity) {
          const failedResult = await markPaymentFailed({
            razorpayOrderId: paymentEntity.order_id,
            razorpayPaymentId: paymentEntity.id,
            webhookEventId: eventId,
            eventType: event.event,
          });
          if (failedResult?.alreadyProcessed) {
            return NextResponse.json({ received: true, idempotent: true });
          }
        }
        break;
      }

      case "refund.processed": {
        const refundEntity = event.payload?.refund?.entity;
        const paymentEntity = event.payload?.payment?.entity;
        const paymentId = refundEntity?.payment_id || paymentEntity?.id;
        if (paymentId) {
          const refundResult = await processPaymentRefund({
            razorpayPaymentId: paymentId,
            refundAmountCents: refundEntity?.amount,
            totalRefundedCents: paymentEntity?.amount_refunded,
            webhookEventId: eventId,
            eventType: event.event,
            reason: "Refund processed via Razorpay Dashboard",
          });
          if (refundResult?.alreadyProcessed) {
            return NextResponse.json({ received: true, idempotent: true });
          }
        }
        break;
      }

      default:
        // Other events acknowledged; record event id after deciding to ignore
        await recordIgnoredEvent(
          eventId,
          event.event,
          event.payload?.payment?.entity?.id || event.payload?.refund?.entity?.payment_id
        );
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    // Log internally but never reveal sensitive error details to external caller
    console.error("[Razorpay Webhook Error]:", err);
    return NextResponse.json({ error: "Internal processing error" }, { status: 500 });
  }
}
