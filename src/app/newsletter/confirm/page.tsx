import React from "react";
import Link from "next/link";
import { CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { confirmNewsletter } from "@/server/newsletter";
import { checkRateLimit, getRequestIp, RATE_LIMIT_MESSAGE } from "@/server/rate-limit";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Confirm Newsletter Subscription | Startup Showcase",
  description: "Confirm your email address for the Startup Showcase weekly digest.",
  robots: {
    index: false,
    follow: false,
  },
};

interface ConfirmPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function NewsletterConfirmPage({ searchParams }: ConfirmPageProps) {
  const { token } = await searchParams;

  let isSuccess = false;
  let errorMessage = "";

  if (!token) {
    errorMessage = "No confirmation token provided. Please check your email link.";
  } else {
    // Rate limit token confirmations
    const ip = await getRequestIp();
    const rateLimitKey = ip ? `newsletter:confirm:ip:${ip}` : "newsletter:confirm:global";
    const limit = await checkRateLimit(rateLimitKey, 20, 3600);

    if (!limit.allowed) {
      errorMessage = RATE_LIMIT_MESSAGE;
    } else {
      const result = await confirmNewsletter(token);
      if (result.success) {
        isSuccess = true;
      } else {
        errorMessage = result.error || "Invalid or expired confirmation link.";
      }
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-16 sm:py-24 text-center">
      <div className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center">
          {isSuccess ? (
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 flex items-center justify-center">
              <AlertCircle className="w-8 h-8" />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {isSuccess ? "Subscription Confirmed!" : "Confirmation Failed"}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {isSuccess
              ? "You are now confirmed and will receive the Startup Showcase weekly digest featuring curated early-stage startups and monthly leaderboards."
              : errorMessage}
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors"
          >
            <span>Explore Startups</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
