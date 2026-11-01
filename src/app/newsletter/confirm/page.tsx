import React from "react";
import Link from "next/link";
import { AlertCircle, Mail, ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import { ConfirmButton } from "./confirm-button";
import { CloudBackground } from "@/components/ui/cloud-background";

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
      <div className="relative isolate min-h-[85vh] flex items-center justify-center px-4 py-12 text-center">
        <CloudBackground height="h-[340px] sm:h-[400px]" />

        <div className="relative w-full max-w-lg p-8 sm:p-10 rounded-3xl bg-white/90 dark:bg-white/[0.03] border border-slate-200/90 dark:border-white/10 shadow-xs space-y-6 backdrop-blur-md">
          <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400">
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
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white/10 dark:hover:bg-white/15 text-white font-bold text-xs transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500"
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
    <div className="relative isolate min-h-[85vh] flex items-center justify-center px-4 py-12 text-center">
      <CloudBackground height="h-[340px] sm:h-[400px]" />

      <div className="relative w-full max-w-lg p-8 sm:p-10 rounded-3xl bg-white/90 dark:bg-white/[0.03] border border-slate-200/90 dark:border-white/10 shadow-xs space-y-6 backdrop-blur-md">
        <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800 text-brand-600 dark:text-brand-400">
          <Mail className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Confirm Your{" "}
            <em className="font-serif-italic font-normal text-brand-600 dark:text-brand-400 not-italic-fallback">
              Subscription
            </em>
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
