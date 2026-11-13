"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatShortMonthYear } from "@/lib/dates";

interface MonthItem {
  id: string; // "2026-10-01"
  label: string; // "October 2026"
  count: number;
}

interface MonthSelectorProps {
  months: MonthItem[];
  activeMonth?: string;
  baseUrl?: string;
}

export function MonthSelector({
  months,
  activeMonth,
  baseUrl,
}: MonthSelectorProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (months.length === 0) return null;

  const currentMonthId = activeMonth || months[0]?.id;
  const currentIndex = months.findIndex((m) => m.id === currentMonthId);

  const buildUrl = (monthId: string) => {
    if (baseUrl) {
      return `${baseUrl}/${monthId}`;
    }
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", monthId);
    params.delete("page");
    return `${pathname}?${params.toString()}`;
  };

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < months.length - 1;

  const prevUrl = hasPrev ? buildUrl(months[currentIndex - 1].id) : null;
  const nextUrl = hasNext ? buildUrl(months[currentIndex + 1].id) : null;

  return (
    <div className="w-full">
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Previous Month Arrow Button */}
        {prevUrl ? (
          <Link
            href={prevUrl}
            className="w-12 h-12 rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 flex items-center justify-center text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors shadow-2xs shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className="w-12 h-12 rounded-full border border-slate-200/60 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] flex items-center justify-center text-slate-300 dark:text-slate-600 cursor-not-allowed shrink-0"
            aria-label="Previous month (disabled)"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {/* Month Tabs List */}
        <div className="flex items-center gap-2.5 sm:gap-3 overflow-x-auto no-scrollbar py-0 flex-1">
          {months.map((m) => {
            const isActive = m.id === currentMonthId;
            const href = buildUrl(m.id);
            const shortLabel = formatShortMonthYear(m.id || m.label);

            return (
              <Link
                key={m.id}
                href={href}
                aria-label={m.label}
                className={`flex items-center justify-center h-[51px] px-3.5 sm:px-6 sm:min-w-[150px] rounded-2xl transition-all select-none text-center shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 active:scale-95 ${
                  isActive
                    ? "bg-brand-500 dark:bg-brand-600 text-white dark:text-[#0e0d0d] shadow-md shadow-brand-500/20 dark:shadow-none"
                    : "bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/[0.06] shadow-2xs dark:shadow-none"
                }`}
              >
                <span className="text-sm font-semibold tracking-tight whitespace-nowrap hidden sm:inline">
                  {m.label}
                </span>
                <span className="text-sm font-semibold tracking-tight whitespace-nowrap sm:hidden">
                  {shortLabel}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Next Month Arrow Button */}
        {nextUrl ? (
          <Link
            href={nextUrl}
            className="w-12 h-12 rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 flex items-center justify-center text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors shadow-2xs shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            aria-label="Next month"
          >
            <ChevronRight className="w-5 h-5" />
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className="w-12 h-12 rounded-full border border-slate-200/60 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] flex items-center justify-center text-slate-300 dark:text-slate-600 cursor-not-allowed shrink-0"
            aria-label="Next month (disabled)"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
