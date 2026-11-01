"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RotateCcw, ArrowLeft } from "lucide-react";
import { captureException } from "@/lib/error-tracking";
import { CloudBackground } from "@/components/ui/cloud-background";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Report unexpected client error via error tracking
    captureException(error, {
      componentName: "RootErrorBoundary",
      extra: { digest: error.digest },
    });
    console.error("Runtime error caught in boundary:", error);
  }, [error]);

  return (
    <div className="relative isolate min-h-[75vh] flex items-center justify-center px-4 py-16">
      <CloudBackground height="h-[340px] sm:h-[400px]" />

      <div className="relative max-w-md w-full text-center space-y-6 p-8 rounded-3xl bg-white/90 dark:bg-white/[0.03] border border-slate-200/90 dark:border-white/10 shadow-xs backdrop-blur-md">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Something went{" "}
            <em className="font-serif-italic font-normal text-rose-600 dark:text-rose-400 not-italic-fallback">
              wrong
            </em>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            An unexpected error occurred while loading this view. You can attempt to refresh the component or return to discovery.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200/80 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Go Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
