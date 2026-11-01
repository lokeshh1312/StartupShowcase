import React from "react";
import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import type { Metadata } from "next";
import { CloudBackground } from "@/components/ui/cloud-background";

export const metadata: Metadata = {
  title: "404 - Page Not Found | Startup Showcase",
  description: "The page you are looking for does not exist or has been moved.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <div className="relative isolate min-h-[75vh] flex items-center justify-center px-4 py-16">
      <CloudBackground height="h-[340px] sm:h-[400px]" />

      <div className="relative max-w-md w-full text-center space-y-6 p-8 rounded-3xl bg-white/90 dark:bg-white/[0.03] border border-slate-200/90 dark:border-white/10 shadow-xs backdrop-blur-md">
        <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200/80 dark:border-brand-800/60 text-brand-600 dark:text-brand-400 font-extrabold text-2xl flex items-center justify-center mx-auto">
          404
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Page Not{" "}
            <em className="font-serif-italic font-normal text-brand-600 dark:text-brand-400 not-italic-fallback">
              Found
            </em>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            The page you requested could not be located. It might have been moved, renamed, or is currently unavailable.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-colors shadow-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Discovery</span>
          </Link>
          <Link
            href="/search"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200/80 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search Startups</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
