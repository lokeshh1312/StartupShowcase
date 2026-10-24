"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { CheckCircle2, AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import { confirmNewsletterSubscriptionAction } from "@/server/actions";

export function ConfirmButton({ token }: { token: string }) {
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = () => {
    setError(null);
    startTransition(async () => {
      const res = await confirmNewsletterSubscriptionAction(token);
      if (res?.error) {
        setError(res.error);
      } else {
        setSuccess(true);
      }
    });
  };

  if (success) {
    return (
      <div className="space-y-4 pt-2">
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h2 className="font-bold text-sm text-slate-900 dark:text-white">
            Subscription Confirmed!
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            You&apos;re now subscribed to the Startup Showcase weekly dispatch.
          </p>
        </div>
        <Link
          href="/browse"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors shadow-xs"
        >
          <span>Explore Startups</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-2">
      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-600 dark:text-red-400 font-medium text-left flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <button
        onClick={handleConfirm}
        disabled={isPending}
        className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
      >
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Confirming...</span>
          </>
        ) : (
          <>
            <span>Confirm Subscription</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </div>
  );
}
