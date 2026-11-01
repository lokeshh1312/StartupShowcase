import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Bookmark, ArrowRight } from "lucide-react";
import { getCurrentUser } from "@/lib/supabase/server";
import { getSaved } from "@/server/startups";
import { StartupCard } from "@/components/startup/startup-card";
import { CloudBackground } from "@/components/ui/cloud-background";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Saved Startups | Startup Showcase",
  description: "View and manage your bookmarked early-stage startups.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function SavedStartupsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?redirect=/saved");
  }

  const savedResult = await getSaved(user.id, 1, 50);

  return (
    <div className="relative isolate min-h-screen">
      <CloudBackground height="h-[340px] sm:h-[400px]" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        {/* Header */}
        <div className="space-y-3 max-w-3xl pt-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-semibold tracking-widest uppercase border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-white/5 text-slate-700 dark:text-slate-300 shadow-2xs dark:shadow-none">
            <Bookmark className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
            <span>Personal Library</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Saved{" "}
            <em className="font-serif-italic font-normal text-brand-600 dark:text-brand-400 not-italic-fallback">
              Startups
            </em>
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Startups you have bookmarked for tracking, updates, and community activity.
          </p>
        </div>

        {/* Content */}
        {savedResult.items.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white/90 dark:bg-white/[0.03] p-16 text-center space-y-4 shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 border border-brand-100 dark:border-brand-900/40 flex items-center justify-center mx-auto text-2xl font-bold shadow-xs">
              <Bookmark className="w-6 h-6 text-brand-600 dark:text-brand-400" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              No saved startups yet
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Browse our global directory or monthly leaderboard and bookmark the most promising ventures to follow them here.
            </p>
            <div className="pt-2">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold rounded-xl bg-brand-600 hover:bg-brand-700 text-white transition-colors shadow-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                <span>Explore Startups</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedResult.items.map((startup) => (
              <StartupCard key={startup.id} startup={startup} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
