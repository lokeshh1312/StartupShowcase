"use client";

import React, { useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, X, RotateCcw, ChevronDown } from "lucide-react";
import { CATEGORIES, STAGES } from "@/lib/validation";

interface CountryOption {
  code: string;
  name: string;
}

interface FilterBarProps {
  countries?: CountryOption[];
  categories?: string[];
  totalResults?: number;
  showSearch?: boolean;
  activeFilters?: {
    category?: string;
    stage?: string;
    countryCode?: string;
    sort?: string;
  };
}

export function FilterBar({
  countries = [],
  categories = CATEGORIES as unknown as string[],
  totalResults,
  showSearch = true,
  activeFilters,
}: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentSearch = searchParams.get("q") || "";
  const currentCategory = activeFilters?.category || searchParams.get("category") || "All";
  const currentCountry = activeFilters?.countryCode || searchParams.get("country") || "ALL";
  const currentStage = activeFilters?.stage || searchParams.get("stage") || "All";
  const currentSort = activeFilters?.sort || searchParams.get("sort") || "votes";
  const currentRemoteFirst = searchParams.get("remoteFirst") === "true";

  const updateParam = (key: string, value: string | boolean) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "All" || value === "ALL" || value === "" || value === false) {
      params.delete(key);
    } else {
      params.set(key, String(value));
    }
    params.delete("page"); // Reset to page 1 on filter change

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const resetAll = () => {
    startTransition(() => {
      router.push(pathname);
    });
  };

  const hasActiveFilters =
    Boolean(currentSearch) ||
    currentCategory !== "All" ||
    currentCountry !== "ALL" ||
    currentStage !== "All" ||
    currentSort !== "votes" ||
    currentRemoteFirst;

  return (
    <div className="w-full space-y-3 mb-6">
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        {/* Search input */}
        {showSearch && (
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, idea, problem, or keywords..."
              defaultValue={currentSearch}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  updateParam("q", (e.target as HTMLInputElement).value.trim());
                }
              }}
              onBlur={(e) => {
                if (e.target.value.trim() !== currentSearch) {
                  updateParam("q", e.target.value.trim());
                }
              }}
              className="w-full pl-10 pr-8 py-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            />
            {currentSearch && (
              <button
                type="button"
                onClick={() => updateParam("q", "")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category */}
          <div className="relative">
            <select
              value={currentCategory}
              onChange={(e) => updateParam("category", e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-slate-300 dark:hover:border-slate-600 focus:outline-none cursor-pointer"
            >
              <option value="All">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Country */}
          {countries.length > 0 && (
            <div className="relative">
              <select
                value={currentCountry}
                onChange={(e) => updateParam("country", e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-slate-300 dark:hover:border-slate-600 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Countries</option>
                {countries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>
          )}

          {/* Stage */}
          <div className="relative">
            <select
              value={currentStage}
              onChange={(e) => updateParam("stage", e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-slate-300 dark:hover:border-slate-600 focus:outline-none cursor-pointer"
            >
              <option value="All">All Stages</option>
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Sort */}
          <div className="relative">
            <select
              value={currentSort}
              onChange={(e) => updateParam("sort", e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-slate-300 dark:hover:border-slate-600 focus:outline-none cursor-pointer"
            >
              <option value="votes">Most Votes</option>
              <option value="views">Most Views</option>
              <option value="recent">Newest First</option>
              <option value="trending">Trending</option>
              <option value="alphabetical">Alphabetical</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Remote First checkbox */}
          <label className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer select-none">
            <input
              type="checkbox"
              checked={currentRemoteFirst}
              onChange={(e) => updateParam("remoteFirst", e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span>Remote-First</span>
          </label>

          {/* Reset Filters Button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetAll}
              className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl hover:bg-rose-100 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {totalResults !== undefined && (
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
          <span>
            Showing <strong className="text-slate-800 dark:text-slate-200">{totalResults}</strong>{" "}
            {totalResults === 1 ? "startup" : "startups"}
          </span>
          {isPending && <span className="text-blue-600 dark:text-blue-400">Updating…</span>}
        </div>
      )}
    </div>
  );
}
