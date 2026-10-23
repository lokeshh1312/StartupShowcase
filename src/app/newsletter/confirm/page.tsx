import React from "react";
import Link from "next/link";
import { AlertCircle, Mail, ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import { ConfirmButton } from "./confirm-button";

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

  if (!token || !token.trim()) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 sm:py-24 text-center">
        <div className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Invalid Confirmation Link
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              No confirmation token was provided. Please verify the link in your email.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-bold text-xs hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
            >
              <span>Return Home</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-16 sm:py-24 text-center">
      <div className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400">
          <Mail className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Confirm Your Subscription
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
            Click the button below to complete your double opt-in verification and join our global startup radar.
          </p>
        </div>

        <ConfirmButton token={token.trim()} />
      </div>
    </div>
  );
}
