"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Edit2, Trash2, CreditCard, Sparkles } from "lucide-react";
import { deleteStartupAction, getStartupPaymentOrderAction, confirmPaymentAction } from "@/server/actions";
import { openRazorpayCheckout } from "@/lib/razorpay-client";
import { Modal } from "@/components/ui/modal";

interface SubmissionActionsProps {
  startupId: string;
  startupName: string;
  slug: string;
  status: string;
  priceInr?: string;
  priceUsd?: string;
}

export function SubmissionActions({
  startupId,
  startupName,
  slug,
  status,
  priceInr = "Rs 999",
  priceUsd = "$10",
}: SubmissionActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [paying, setPaying] = useState(false);
  const [errorModal, setErrorModal] = useState<{ title: string; message: string } | null>(null);

  const handleResumePayment = async (currency: "INR" | "USD" = "USD") => {
    setErrorModal(null);
    setPaying(true);
    try {
      const res = await getStartupPaymentOrderAction(startupId, currency);
      if (!res || "error" in res) {
        setErrorModal({
          title: "Payment couldn't start",
          message: res?.error || "Failed to initiate payment.",
        });
        setPaying(false);
        return;
      }

      if (!res.paymentRequired) {
        router.refresh();
        setPaying(false);
        return;
      }

      const opened = await openRazorpayCheckout({
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
            setErrorModal({
              title: "Payment couldn't start",
              message: confirmRes?.error || "Payment verification failed.",
            });
          }
        },
        onDismiss: () => {
          setPaying(false);
        },
      });

      if (!opened) {
        setErrorModal({
          title: "Payment couldn't start",
          message: "Failed to open checkout.",
        });
        setPaying(false);
      }
    } catch (err: unknown) {
      const friendlyMessage =
        err instanceof Error && err.message
          ? err.message
          : typeof err === "string" && err
          ? err
          : typeof err === "object" && err && "message" in err && typeof (err as { message: unknown }).message === "string" && (err as { message: string }).message
          ? (err as { message: string }).message
          : "";
      setErrorModal({
        title: "Payment couldn't start",
        message: friendlyMessage || "Failed to initiate payment.",
      });
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
        setErrorModal({
          title: "Can't delete this draft",
          message: res.error,
        });
        setConfirming(false);
      } else {
        router.refresh();
      }
    });
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {status === "awaiting_payment" && (
          <>
            <button
              type="button"
              onClick={() => handleResumePayment("INR")}
              disabled={paying}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer disabled:opacity-50 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              {paying ? <Sparkles className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5" />}
              <span>{paying ? "Opening Checkout..." : `Pay ${priceInr} (UPI / QR / cards)`}</span>
            </button>
            <button
              type="button"
              onClick={() => handleResumePayment("USD")}
              disabled={paying}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer disabled:opacity-50 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              {paying ? <Sparkles className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5" />}
              <span>{paying ? "Opening Checkout..." : `Pay ${priceUsd} (international card)`}</span>
            </button>
          </>
        )}

        {(status === "pending" || status === "awaiting_payment") && (
          <Link
            href={`/submit?edit=${slug}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200/90 dark:border-white/10 bg-white/90 dark:bg-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.08] text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors shadow-2xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500"
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
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors shadow-xs cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-red-500 ${
                confirming
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "border border-red-200 dark:border-red-900/60 bg-red-50/70 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/50"
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isPending ? "Deleting..." : confirming ? "Confirm Delete?" : "Delete"}</span>
            </button>

            {confirming && !isPending && (
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="px-2 py-1 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500 rounded-lg"
              >
                Cancel
              </button>
            )}
          </>
        )}
      </div>

      {errorModal && (
        <Modal
          isOpen={Boolean(errorModal)}
          onClose={() => setErrorModal(null)}
          title={errorModal.title}
        >
          <p>{errorModal.message}</p>
        </Modal>
      )}
    </>
  );
}
