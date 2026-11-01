"use client";

import React, { useState } from "react";
import { AlertCircle, Send, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface UnverifiedBannerProps {
  email: string;
}

export function UnverifiedBanner({ email }: UnverifiedBannerProps) {
  const [isPending, setIsPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleResend = async () => {
    setIsPending(true);
    setError("");

    try {
      const supabase = createClient();
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email,
      });

      if (resendError) {
        setError(resendError.message);
      } else {
        setSent(true);
      }
    } catch {
      setError("Unable to resend verification email. Please try again later.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div
      role="alert"
      className="w-full bg-amber-500/15 border-b border-amber-500/30 px-4 py-2.5 text-xs text-amber-950 dark:text-amber-200"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>
            <strong>Email verification required:</strong> Please confirm your email ({email}) to vote, save startups, comment, or submit.
          </span>
        </div>

        <div>
          {sent ? (
            <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Verification email sent! Check your inbox.</span>
            </span>
          ) : (
            <button
              onClick={handleResend}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold transition-colors shadow-xs cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              <Send className="w-3 h-3" />
              <span>{isPending ? "Sending…" : "Resend verification email"}</span>
            </button>
          )}
          {error && <span className="ml-2 text-rose-600 dark:text-rose-400 font-medium">{error}</span>}
        </div>
      </div>
    </div>
  );
}
