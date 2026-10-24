import React from "react";
import Link from "next/link";
import { AlertCircle, Mail, ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import { UnsubscribeButton } from "./unsubscribe-button";

export const metadata: Metadata = {
  title: "Unsubscribe from Newsletter | Startup Showcase",
  description: "Unsubscribe from the Startup Showcase weekly digest.",
  robots: {
    index: false,
    follow: false,
  },
};

interface UnsubscribePageProps {
  searchParams: Promise<{ email?: string; token?: string }>;
}

export default async function NewsletterUnsubscribePage({ searchParams }: UnsubscribePageProps) {
  const { email, token } = await searchParams;

  if (!email || !token || !token.trim()) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 sm:py-24 text-center">
        <div className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Invalid Unsubscribe Link
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              The unsubscribe link is missing required verification parameters.
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
        <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400">
          <Mail className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Unsubscribe from Newsletter
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
            Are you sure you want to unsubscribe <span className="font-semibold text-slate-900 dark:text-white">{email}</span> from the Startup Showcase weekly dispatch?
          </p>
        </div>

        <UnsubscribeButton email={email.trim()} token={token.trim()} />
      </div>
    </div>
  );
}
