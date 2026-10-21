import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Trophy } from "lucide-react";
import { getLeaderboard, listMonths } from "@/server/startups";
import { normalizeMonthToDate, formatMonthLabel } from "@/lib/validation";
import { LeaderboardTable } from "@/components/startup/leaderboard-table";
import { MonthSelector } from "@/components/discovery/month-selector";
import {
  createMetadata,
  buildItemListJsonLd,
  buildBreadcrumbJsonLd,
} from "@/lib/seo";
import type { Metadata } from "next";

interface MonthPageProps {
  params: Promise<{ month: string }>;
}

export async function generateMetadata({
  params,
}: MonthPageProps): Promise<Metadata> {
  const { month } = await params;
  try {
    const monthDate = normalizeMonthToDate(month);
    const label = formatMonthLabel(monthDate);
    return createMetadata({
      title: `Top startups launched in ${label} | Startup Showcase`,
      description: `Rankings, verified votes, and top early-stage startups launched in ${label}.`,
      path: `/months/${month}`,
      robots: {
        index: true,
        follow: true,
      },
    });
  } catch {
    return createMetadata({
      title: "Monthly Leaderboard | Startup Showcase",
      description: "Rankings and top voted early-stage startups.",
      path: "/months",
    });
  }
}

export default async function MonthLeaderboardPage({ params }: MonthPageProps) {
  const { month } = await params;

  let monthDate: string;
  let monthLabel: string;
  try {
    monthDate = normalizeMonthToDate(month);
    monthLabel = formatMonthLabel(monthDate);
  } catch {
    notFound();
  }

  const [leaderboardResult, months] = await Promise.all([
    getLeaderboard(monthDate, 1, 50),
    listMonths(),
  ]);

  // JSON-LD Structured Data: ItemList (excluding sample startups) & BreadcrumbList
  const itemListJsonLd = buildItemListJsonLd(
    leaderboardResult.items,
    `${monthLabel} Leaderboard`,
    `/months/${month}`
  );
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Leaderboard", path: "/" },
    { name: monthLabel, path: `/months/${month}` },
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Structured Data: ItemList & BreadcrumbList */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {/* Back link */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
      </div>

      {/* Hero */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <Trophy className="w-8 h-8" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Official Cohort Rankings</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {monthLabel} Leaderboard
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Ranked by community votes with tie-breaks by earliest approval
            </p>
          </div>
        </div>

        {/* Month Selector dropdown */}
        <div className="w-full sm:w-64">
          <MonthSelector months={months} activeMonth={monthDate} />
        </div>
      </div>

      {/* Leaderboard Table */}
      <LeaderboardTable
        startups={leaderboardResult.items}
        monthLabel={monthLabel}
      />
    </div>
  );
}
