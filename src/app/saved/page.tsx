import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Bookmark, ArrowRight } from "lucide-react";
import { getCurrentUser } from "@/lib/supabase/server";
import { getSaved } from "@/server/startups";
import { StartupCard } from "@/components/startup/startup-card";
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
          <Bookmark className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Saved Startups
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Startups you have bookmarked for tracking and updates.
          </p>
        </div>
      </div>

      {/* Content */}
      {savedResult.items.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            No saved startups yet
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Browse our global directory or monthly leaderboard and bookmark the most promising ventures to follow them here.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors"
            >
              <span>Explore Startups</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedResult.items.map((startup) => (
            <StartupCard key={startup.id} startup={startup} />
          ))}
        </div>
      )}
    </div>
  );
}
