"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

interface MonthItem {
  id: string; // "2026-10-01"
  label: string; // "October 2026"
  count: number;
}

interface MonthSelectorProps {
  months: MonthItem[];
  activeMonth?: string;
  baseUrl?: string; // defaults to updating current URL query param or navigating
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

  const buildUrl = (monthId: string) => {
    if (baseUrl) {
      return `${baseUrl}/${monthId}`;
    }
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", monthId);
    params.delete("page");
    return `${pathname}?${params.toString()}`;
  };

  return (
    <div className="w-full py-2">
      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-2">
        {months.map((m) => {
          const isActive = m.id === currentMonthId;
          const href = buildUrl(m.id);

          return (
            <div key={m.id} className="flex flex-col items-center shrink-0">
              <Link
                href={href}
                className={`flex flex-col items-center justify-center min-w-[140px] sm:min-w-[160px] px-5 py-2.5 rounded-2xl transition-all select-none text-center shadow-xs active:scale-95 ${
                  isActive
                    ? "bg-blue-600 text-white shadow-blue-500/20"
                    : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <span className="text-xs sm:text-sm font-bold tracking-tight">
                  {m.label}
                </span>
                <span
                  className={`text-[11px] mt-0.5 font-medium ${
                    isActive
                      ? "text-blue-100"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {m.count} {m.count === 1 ? "startup" : "startups"}
                </span>
              </Link>
              <div className="h-1 mt-1.5 flex items-center justify-center w-full">
                {isActive && (
                  <span className="w-8 h-1 bg-blue-600 rounded-full" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
