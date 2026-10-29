"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Edit2, Trash2, CreditCard, Sparkles } from "lucide-react";
import { deleteStartupAction, getStartupPaymentOrderAction, confirmPaymentAction } from "@/server/actions";
import { openRazorpayCheckout } from "@/lib/razorpay-client";

interface SubmissionActionsProps {
  startupId: string;
  startupName: string;
  slug: string;
  status: string;
}

export function SubmissionActions({ startupId, startupName, slug, status }: SubmissionActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

  const handleResumePayment = async () => {
    setError("");
    setPaying(true);
    try {
      const res = await getStartupPaymentOrderAction(startupId);
      if (!res || "error" in res) {
        setError(res?.error || "Failed to initiate payment.");
        setPaying(false);
        return;
      }

      if (!res.paymentRequired) {
        router.refresh();
        setPaying(false);
        return;
      }

      await openRazorpayCheckout({
        keyId: res.keyId,
        orderId: res.orderId,
        amount: res.amount,
        currency: res.currency,
        startupName,
        onSuccess: async (rzpRes) => {
          const confirmRes = await confirmPaymentAction({
            startupId,
            razorpayOrderId: rzpRes.razorpay_order_id,
            razorpayPaymentId: rzpRes.razorpay_payment_id,
            razorpaySignature: rzpRes.razorpay_signature,
          });
          setPaying(false);
          if (confirmRes?.success) {
            router.refresh();
          } else {
            setError(confirmRes?.error || "Payment verification failed.");
          }
        },
        onDismiss: () => {
          setPaying(false);
        },
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to open checkout.");
      setPaying(false);
    }
  };

  const handleDelete = () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }

    startTransition(async () => {
      const res = await deleteStartupAction(startupId);
      if (res?.error) {
        setError(res.error);
        setConfirming(false);
      } else {
        router.refresh();
      }
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {error && <span className="text-xs text-red-500 font-medium">{error}</span>}

      {status === "awaiting_payment" && (
        <button
          type="button"
          onClick={handleResumePayment}
          disabled={paying}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
        >
          {paying ? <Sparkles className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5" />}
          <span>{paying ? "Opening Checkout..." : "Resume Payment ($10)"}</span>
        </button>
      )}

      {(status === "pending" || status === "awaiting_payment") && (
        <Link
          href={`/submit?edit=${slug}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors shadow-xs"
        >
          <Edit2 className="w-3.5 h-3.5" />
          <span>Edit</span>
        </Link>
      )}

      {status === "awaiting_payment" && (
        <>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors shadow-xs cursor-pointer ${
              confirming
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100"
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isPending ? "Deleting..." : confirming ? "Confirm Delete?" : "Delete"}</span>
          </button>

          {confirming && !isPending && (
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="px-2 py-1 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
            >
              Cancel
            </button>
          )}
        </>
      )}
    </div>
  );
}
