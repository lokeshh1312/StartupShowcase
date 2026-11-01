"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { CheckCircle2, AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import { unsubscribeNewsletterAction } from "@/server/actions";

export function UnsubscribeButton({
  email,
  token,
}: {
  email: string;
  token: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUnsubscribe = () => {
    setError(null);
    startTransition(async () => {
      const res = await unsubscribeNewsletterAction(email, token);
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
        <div className="p-4 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200/90 dark:border-white/10 text-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h2 className="font-bold text-sm text-slate-900 dark:text-white">
            Unsubscribed Successfully
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            You will no longer receive newsletter dispatches from Startup Showcase.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white/10 dark:hover:bg-white/15 text-white font-bold text-xs transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <span>Return Home</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-2">
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60 text-xs text-rose-600 dark:text-rose-400 font-medium text-left flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <button
        onClick={handleUnsubscribe}
        disabled={isPending}
        className="w-full py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-rose-500"
      >
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Processing...</span>
          </>
        ) : (
          <>
            <span>Confirm Unsubscribe</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </div>
  );
}
