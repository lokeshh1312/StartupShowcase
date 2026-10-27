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

  // 3. Durable Idempotency check via payment_events table
  if (eventId) {
    const [existingEvent] = await db
      .select({ id: paymentEvents.id })
      .from(paymentEvents)
      .where(eq(paymentEvents.id, eventId))
      .limit(1);

    if (existingEvent) {
      // Event already processed durably; return early without re-executing
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

        // Only mark payment paid after Razorpay confirms payment is captured
        if (paymentEntity.status && paymentEntity.status !== "captured") {
          console.warn(
            `[Webhook Warning]: payment.captured event has non-captured status: ${paymentEntity.status}`
          );
          return NextResponse.json({ received: true, ignored: true });
        }

        // Verify currency is USD
        if (paymentEntity.currency !== "USD") {
          console.error("[Webhook Error]: Rejected non-USD payment:", paymentEntity.currency);
          return NextResponse.json({ received: true });
        }

        // Verify against stored payment record
        const [storedPayment] = await db
          .select({
            amountCents: payments.amountCents,
            currency: payments.currency,
            status: payments.status,
          })
          .from(payments)
          .where(eq(payments.razorpayOrderId, paymentEntity.order_id))
          .limit(1);

        if (!storedPayment) {
          console.error(
            `[Webhook Error]: Payment record not found for order ${paymentEntity.order_id}`
          );
          return NextResponse.json({ received: true });
        }

        // PREVENT STALE EVENTS FROM UNDOING A LATER REFUND OR PARTIAL REFUND
        if (
          storedPayment.status === "refunded" ||
          storedPayment.status === "partially_refunded"
        ) {
          console.warn(
            `[Webhook Warning]: Ignoring replayed payment.captured for order ${paymentEntity.order_id} because payment is already '${storedPayment.status}'.`
          );
          if (eventId) {
            await db
              .insert(paymentEvents)
              .values({
                id: eventId,
                eventType: event.event,
                paymentId: paymentEntity.id,
                orderId: paymentEntity.order_id,
                payload: (event as unknown as Record<string, unknown>) || {},
              })
              .onConflictDoNothing();
          }
          return NextResponse.json({ received: true, ignored: true });
        }

        if (storedPayment.amountCents !== paymentEntity.amount) {
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

      case "payment.authorized": {
        // An authorized payment is not captured yet.
        // Record event and return 200 without marking payment paid or moving startup.
        console.info(
          `[Webhook Info]: Payment ${event.payload?.payment?.entity?.id} is authorized, awaiting capture.`
        );
        if (eventId) {
          await db
            .insert(paymentEvents)
            .values({
              id: eventId,
              eventType: event.event,
              paymentId: event.payload?.payment?.entity?.id || null,
              orderId: event.payload?.payment?.entity?.order_id || null,
              payload: (event as unknown as Record<string, unknown>) || {},
            })
            .onConflictDoNothing();
        }
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
        // Record and ignore unhandled events
        if (eventId) {
          await db
            .insert(paymentEvents)
            .values({
              id: eventId,
              eventType: event.event,
              paymentId: null,
              orderId: null,
              payload: (event as unknown as Record<string, unknown>) || {},
            })
            .onConflictDoNothing();
        }
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    // Log internally but never reveal sensitive error details to external caller
    console.error("[Razorpay Webhook Error]:", err);
    return NextResponse.json({ error: "Internal processing error" }, { status: 500 });
  }
}
