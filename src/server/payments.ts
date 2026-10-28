import "server-only";
import { eq, and, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  payments,
  paymentEvents,
  startups,
  auditLog,
} from "@/db/schema";
import {
  getSubmissionPriceCents,
  createRazorpayOrder,
  isPaymentRequired,
  getRazorpayCredentials,
} from "@/server/razorpay";
import { checkRateLimit, RATE_LIMIT_MESSAGE } from "@/server/rate-limit";
import {
  sendSubmissionReceivedEmail,
  fireAndForgetEmail,
} from "@/server/email";

export interface StartupOrderResult {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  paymentRequired: boolean;
}

/**
 * Gets an existing unpaid Razorpay order for a startup, or creates a new one.
 * Enforces:
 * - Startup must be in 'awaiting_payment'
 * - Startup must belong to the user
 * - Max 3 awaiting_payment startups per user
 * - Reuses existing unpaid order for the same startup
 * - Rate limit: max 10 order creations per hour per user
 */
export async function getOrCreateStartupOrder(
  startupId: string,
  userId: string
): Promise<StartupOrderResult> {
  const [startup] = await db
    .select({
      id: startups.id,
      name: startups.name,
      ownerId: startups.ownerId,
      status: startups.status,
    })
    .from(startups)
    .where(eq(startups.id, startupId))
    .limit(1);

  if (!startup) {
    throw new Error("Startup not found.");
  }

  if (startup.ownerId !== userId) {
    throw new Error("Forbidden: You do not own this startup.");
  }

  if (startup.status !== "awaiting_payment") {
    throw new Error("Startup is not awaiting payment.");
  }

  // If in dev and Razorpay credentials are not configured, payment can be skipped
  if (!isPaymentRequired()) {
    const mockOrderId = `mock_order_${startup.id.slice(0, 8)}`;
    const [existing] = await db
      .select()
      .from(payments)
      .where(eq(payments.razorpayOrderId, mockOrderId))
      .limit(1);

    if (!existing) {
      await db.insert(payments).values({
        startupId: startup.id,
        userId,
        razorpayOrderId: mockOrderId,
        amountCents: getSubmissionPriceCents(),
        currency: "USD",
        status: "created",
      });
    }

    return {
      orderId: mockOrderId,
      amount: getSubmissionPriceCents(),
      currency: "USD",
      keyId: "mock_key_id",
      paymentRequired: false,
    };
  }

  // 1. Check if an unpaid order already exists for this startup
  const [existingOrder] = await db
    .select()
    .from(payments)
    .where(
      and(
        eq(payments.startupId, startupId),
        eq(payments.status, "created")
      )
    )
    .limit(1);

  const { keyId } = getRazorpayCredentials();

  if (existingOrder) {
    return {
      orderId: existingOrder.razorpayOrderId,
      amount: existingOrder.amountCents,
      currency: existingOrder.currency,
      keyId,
      paymentRequired: true,
    };
  }

  // 2. Enforce limit of max 3 startups in awaiting_payment per user
  const awaitingCount = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(startups)
    .where(
      and(
        eq(startups.ownerId, userId),
        eq(startups.status, "awaiting_payment")
      )
    );

  if ((awaitingCount[0]?.count ?? 0) > 3) {
    throw new Error(
      "Limit reached: You have 3 submissions awaiting payment. Please complete or delete an existing unpaid submission before creating a new one."
    );
  }

  // 3. Enforce order creation rate limit (10 per hour per user)
  const orderLimit = await checkRateLimit(`order:user:${userId}`, 10, 3600);
  if (!orderLimit.allowed) {
    throw new Error(RATE_LIMIT_MESSAGE);
  }

  // 4. Create order via Razorpay Orders API
  const amountCents = getSubmissionPriceCents();
  const order = await createRazorpayOrder({
    amountCents,
    currency: "USD",
    receipt: startup.id,
    notes: {
      startup_id: startup.id,
      user_id: userId,
    },
  });

  // 5. Store payment record with status 'created'
  await db.insert(payments).values({
    startupId: startup.id,
    userId,
    razorpayOrderId: order.id,
    amountCents,
    currency: "USD",
    status: "created",
  });

  return {
    orderId: order.id,
    amount: amountCents,
    currency: "USD",
    keyId,
    paymentRequired: true,
  };
}

/**
 * Authoritative, idempotent function to mark a payment as 'paid'.
 * Used by both client confirmPaymentAction and server webhook.
 * In one transaction:
 * 1. Sets payments.status = 'paid', paid_at = now()
 * 2. Moves startup status awaiting_payment -> pending
 * 3. Writes audit_log row
 * 4. Outside transaction: sends the existing "submission received" email.
 */
export interface MarkPaymentPaidResult {
  success: boolean;
  startupId?: string;
  alreadyPaid?: boolean;
  alreadyRefunded?: boolean;
  error?: string;
}

export async function markPaymentPaid(params: {
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  webhookEventId?: string;
}): Promise<MarkPaymentPaidResult> {
  const { razorpayOrderId, razorpayPaymentId, webhookEventId } = params;

  let targetStartupId: string | null = null;
  let alreadyPaid = false;

  const result = await db.transaction(async (tx) => {
    // 1. Lock payment row via SELECT ... FOR UPDATE
    const [payment] = await tx
      .select()
      .from(payments)
      .where(eq(payments.razorpayOrderId, razorpayOrderId))
      .for("update")
      .limit(1);

    if (!payment) {
      return { success: false, error: "Payment order record not found." };
    }

    targetStartupId = payment.startupId;

    // Idempotent: if already marked paid, return early
    if (payment.status === "paid") {
      alreadyPaid = true;
      return { success: true, startupId: payment.startupId, alreadyPaid: true };
    }

    // Never revive a refunded payment
    if (payment.status === "refunded" || payment.status === "partially_refunded") {
      return {
        success: false,
        error: "Payment was refunded.",
        startupId: payment.startupId,
        alreadyRefunded: true,
      };
    }

    // Only transition to 'paid' from status 'created' or 'failed'
    if (payment.status !== "created" && payment.status !== "failed") {
      return {
        success: false,
        error: `Cannot transition payment from status '${payment.status}' to 'paid'.`,
        startupId: payment.startupId,
      };
    }

    // 2. Update payment record to paid
    const [updatedPayment] = await tx
      .update(payments)
      .set({
        status: "paid",
        paidAt: new Date(),
        razorpayPaymentId: razorpayPaymentId || payment.razorpayPaymentId,
        webhookEventId: webhookEventId || payment.webhookEventId,
      })
      .where(eq(payments.id, payment.id))
      .returning();

    // 3. Move startup from awaiting_payment -> pending
    const [updatedStartup] = await tx
      .update(startups)
      .set({
        status: "pending",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(startups.id, payment.startupId),
          eq(startups.status, "awaiting_payment")
        )
      )
      .returning();

    // 4. Write audit_log row
    await tx.insert(auditLog).values({
      actorId: payment.userId,
      action: "payment.paid",
      targetType: "startup",
      targetId: payment.startupId,
      metadata: {
        payment_id: updatedPayment.id,
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId || payment.razorpayPaymentId,
        amount_cents: payment.amountCents,
        currency: payment.currency,
        webhook_event_id: webhookEventId,
      },
    });

    // 5. Gather email data
    const startupName = updatedStartup?.name || "your startup";
    const userRows = await tx.execute<{ email: string; display_name: string }>(sql`
      SELECT u.email, coalesce(p.display_name, 'Founder') as display_name
      FROM auth.users u
      LEFT JOIN public.profiles p ON p.id = u.id
      WHERE u.id = ${payment.userId}::uuid
    `);

    const userRow = userRows[0];
    let emailInfo: { to: string; founderName: string; startupName: string } | null = null;
    if (userRow?.email) {
      emailInfo = {
        to: userRow.email,
        founderName: userRow.display_name || "Founder",
        startupName,
      };
    }

    return { success: true, startupId: payment.startupId, emailData: emailInfo };
  });

  if (!result.success) {
    return result;
  }

  // Outside transaction: send the submission received email (only if not already paid previously)
  if (!alreadyPaid && result.emailData) {
    fireAndForgetEmail(
      sendSubmissionReceivedEmail({
        to: result.emailData.to,
        founderName: result.emailData.founderName,
        startupName: result.emailData.startupName,
      })
    );
  }

  return {
    success: true,
    startupId: targetStartupId || undefined,
    alreadyPaid,
    alreadyRefunded: result.alreadyRefunded,
  };
}

/**
 * Marks a payment as failed (idempotent, never overwrites paid or refunded).
 */
export async function markPaymentFailed(params: {
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  webhookEventId?: string;
}): Promise<void> {
  const { razorpayOrderId, razorpayPaymentId, webhookEventId } = params;

  if (!razorpayOrderId && !razorpayPaymentId) return;

  await db.transaction(async (tx) => {
    const condition = razorpayOrderId
      ? eq(payments.razorpayOrderId, razorpayOrderId)
      : eq(payments.razorpayPaymentId, razorpayPaymentId!);

    const [payment] = await tx
      .select()
      .from(payments)
      .where(condition)
      .for("update")
      .limit(1);

    if (
      !payment ||
      payment.status === "paid" ||
      payment.status === "refunded"
    ) {
      return; // Never overwrite a paid or refunded payment with failed
    }

    if (payment.status !== "created") {
      return;
    }

    await tx
      .update(payments)
      .set({
        status: "failed",
        webhookEventId: webhookEventId || payment.webhookEventId,
      })
      .where(eq(payments.id, payment.id));

    await tx.insert(auditLog).values({
      actorId: payment.userId,
      action: "payment.failed",
      targetType: "startup",
      targetId: payment.startupId,
      metadata: {
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId,
        webhook_event_id: webhookEventId,
      },
    });
  });
}

export interface ProcessRefundResult {
  success: boolean;
  isPartial: boolean;
  amountRefundedCents: number;
  totalRefundedCents: number;
  paymentStatus: "refunded" | "partially_refunded";
  alreadyProcessed?: boolean;
  startupId?: string;
  startupRejected?: boolean;
  error?: string;
}

/**
 * Handles refund processing (partial or full):
 * - Records the refunded amount in `amount_refunded_cents`
 * - If partial: sets status='partially_refunded' and DOES NOT reject the startup
 * - If full: sets status='refunded' and moves startup to 'rejected' with reason 'Payment refunded'
 * - Records durable webhookEventId in payment_events table
 */
export async function processPaymentRefund(params: {
  razorpayPaymentId: string;
  refundAmountCents?: number;
  totalRefundedCents?: number;
  webhookEventId?: string;
  reason?: string;
}): Promise<ProcessRefundResult> {
  const {
    razorpayPaymentId,
    refundAmountCents,
    totalRefundedCents,
    webhookEventId,
    reason = "Refunded",
  } = params;

  return await db.transaction(async (tx) => {
    // 1. Durably record webhook event ID in payment_events table
    if (webhookEventId) {
      const inserted = await tx
        .insert(paymentEvents)
        .values({
          eventId: webhookEventId,
          eventType: "refund.processed",
          razorpayPaymentId,
        })
        .onConflictDoNothing()
        .returning({ eventId: paymentEvents.eventId });

      if (inserted.length === 0) {
        // Event already processed durably!
        const [existingPayment] = await tx
          .select()
          .from(payments)
          .where(eq(payments.razorpayPaymentId, razorpayPaymentId))
          .for("update")
          .limit(1);

        return {
          success: true,
          isPartial: existingPayment?.status === "partially_refunded",
          amountRefundedCents: existingPayment?.amountRefundedCents ?? 0,
          totalRefundedCents: existingPayment?.amountRefundedCents ?? 0,
          paymentStatus:
            existingPayment?.status === "partially_refunded"
              ? "partially_refunded"
              : "refunded",
          alreadyProcessed: true,
          startupId: existingPayment?.startupId,
        };
      }
    }

    // 2. Fetch payment record with row lock
    const [payment] = await tx
      .select()
      .from(payments)
      .where(eq(payments.razorpayPaymentId, razorpayPaymentId))
      .for("update")
      .limit(1);

    if (!payment) {
      return {
        success: false,
        isPartial: false,
        amountRefundedCents: 0,
        totalRefundedCents: 0,
        paymentStatus: "refunded",
        error: "Payment record not found for refund.",
      };
    }

    const previousRefundedCents = payment.amountRefundedCents || 0;

    // Calculate new total refunded amount
    let newTotalRefundedCents: number;
    let thisRefundCents: number;

    if (typeof totalRefundedCents === "number" && totalRefundedCents > 0) {
      newTotalRefundedCents = totalRefundedCents;
      thisRefundCents =
        refundAmountCents ?? Math.max(0, newTotalRefundedCents - previousRefundedCents);
    } else if (typeof refundAmountCents === "number" && refundAmountCents > 0) {
      thisRefundCents = refundAmountCents;
      newTotalRefundedCents = previousRefundedCents + refundAmountCents;
    } else {
      // Default: full refund
      thisRefundCents = payment.amountCents - previousRefundedCents;
      newTotalRefundedCents = payment.amountCents;
    }

    // Cap at total payment amount
    if (newTotalRefundedCents > payment.amountCents) {
      newTotalRefundedCents = payment.amountCents;
    }

    // Determine if full or partial refund
    const isFullRefund = newTotalRefundedCents >= payment.amountCents;
    const nextStatus = isFullRefund ? "refunded" : "partially_refunded";

    // Idempotency: if already at full refund and marked refunded
    if (payment.status === "refunded" && isFullRefund) {
      return {
        success: true,
        isPartial: false,
        amountRefundedCents: thisRefundCents,
        totalRefundedCents: payment.amountRefundedCents,
        paymentStatus: "refunded",
        alreadyProcessed: true,
        startupId: payment.startupId,
      };
    }

    // 3. Update payment record
    await tx
      .update(payments)
      .set({
        status: nextStatus,
        amountRefundedCents: newTotalRefundedCents,
        refundedAt: new Date(),
        webhookEventId: webhookEventId || payment.webhookEventId,
      })
      .where(eq(payments.id, payment.id));

    // 4. Audit log for refund
    await tx.insert(auditLog).values({
      actorId: payment.userId,
      action: "payment.refunded",
      targetType: "startup",
      targetId: payment.startupId,
      metadata: {
        razorpay_payment_id: razorpayPaymentId,
        webhook_event_id: webhookEventId,
        refund_amount_cents: thisRefundCents,
        total_refunded_cents: newTotalRefundedCents,
        amount_cents: payment.amountCents,
        is_partial: !isFullRefund,
        status: nextStatus,
        reason,
      },
    });

    let startupRejected = false;

    // 5. ONLY automatically reject the startup if it is a FULL refund!
    // Never reject solely because a partial refund occurred.
    if (isFullRefund) {
      const [startup] = await tx
        .select({ id: startups.id, status: startups.status })
        .from(startups)
        .where(eq(startups.id, payment.startupId))
        .limit(1);

      if (startup && (startup.status === "pending" || startup.status === "approved")) {
        await tx
          .update(startups)
          .set({
            status: "rejected",
            updatedAt: new Date(),
          })
          .where(eq(startups.id, startup.id));

        await tx.insert(auditLog).values({
          actorId: null,
          action: "startup.status_change:rejected",
          targetType: "startup",
          targetId: startup.id,
          metadata: {
            previous_status: startup.status,
            new_status: "rejected",
            reason: "Payment refunded",
          },
        });

        startupRejected = true;
      }
    }

    return {
      success: true,
      isPartial: !isFullRefund,
      amountRefundedCents: thisRefundCents,
      totalRefundedCents: newTotalRefundedCents,
      paymentStatus: nextStatus,
      startupId: payment.startupId,
      startupRejected,
    };
  });
}
