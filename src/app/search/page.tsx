import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Search as SearchIcon, X } from "lucide-react";
import { listStartups, listCategories, listCountries } from "@/server/startups";
import { getCurrentUser } from "@/lib/supabase/server";
import { StartupCard } from "@/components/startup/startup-card";
import { FilterBar } from "@/components/discovery/filter-bar";
import { CloudBackground } from "@/components/ui/cloud-background";
import { type Category, type Stage, type SortOption } from "@/lib/validation";
import { absoluteUrl } from "@/lib/urls";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search Startups | Startup Showcase",
  description: "Find innovative early-stage startups using full-text search, categories, and countries.",
  alternates: {
    canonical: absoluteUrl("/search"),
  },
  robots: {
    index: false,
    follow: true,
  },
};

interface SearchPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolvedParams = await searchParams;

  // Canonical rule: ?page=1 redirects to the clean URL
  if (resolvedParams.page === "1") {
    const nextParams = new URLSearchParams();
    for (const [k, v] of Object.entries(resolvedParams)) {
      if (k !== "page" && typeof v === "string") {
        nextParams.set(k, v);
      }
    }
    const qs = nextParams.toString();
    redirect(qs ? `/search?${qs}` : "/search");
  }
  const q = typeof resolvedParams.q === "string" ? resolvedParams.q.trim() : "";
  const category = typeof resolvedParams.category === "string" ? resolvedParams.category : undefined;
  const stage = typeof resolvedParams.stage === "string" ? resolvedParams.stage : undefined;
  const countryCode = typeof resolvedParams.countryCode === "string" ? resolvedParams.countryCode : undefined;
  const sort = typeof resolvedParams.sort === "string" ? (resolvedParams.sort as SortOption) : "trending";
  const page = typeof resolvedParams.page === "string" ? parseInt(resolvedParams.page, 10) || 1 : 1;

  const user = await getCurrentUser();
  const [startupsResult, categories, countries] = await Promise.all([
    listStartups(
      {
        q: q || undefined,
        category: category as Category | undefined,
        stage: stage as Stage | undefined,
        countryCode,
        sort,
        page,
        pageSize: 18,
      },
      user?.id
    ),
    listCategories(),
    listCountries(),
  ]);

  return (
    <div className="relative isolate min-h-screen">
      <CloudBackground height="h-[340px] sm:h-[400px]" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        {/* Search Header */}
        <div className="max-w-3xl space-y-4 pt-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-semibold tracking-widest uppercase border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-white/5 text-slate-700 dark:text-slate-300 shadow-2xs dark:shadow-none">
            <SearchIcon className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
            <span>Full-Text Search Engine</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Search{" "}
            <em className="font-serif-italic font-normal text-brand-600 dark:text-brand-400 not-italic-fallback">
              Startups
            </em>
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Find innovative early-stage startups across global markets using keywords, categories, and stages.
          </p>

          {/* Global Search Input Form */}
          <form action="/search" method="GET" className="relative flex items-center pt-2">
            <SearchIcon className="absolute left-4 w-5 h-5 text-slate-400 dark:text-slate-500 pointer-events-none" />
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Search by name, tagline, problem, tech stack, or founder..."
              className="w-full pl-12 pr-28 py-3.5 rounded-2xl bg-white/90 dark:bg-slate-950/70 border border-slate-200/90 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-brand-500 shadow-xs text-sm backdrop-blur-md transition-colors"
            />
            <button
              type="submit"
              className="absolute right-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold transition-colors shadow-xs"
            >
              Search
            </button>
          </form>
        </div>

        {/* Filter Bar */}
        <FilterBar
          categories={categories.map((c) => c.name)}
          countries={countries}
          activeFilters={{
            category,
            stage,
            countryCode,
            sort,
          }}
        />

        {/* Search Query Indicators */}
        {q && (
          <div className="flex items-center flex-wrap gap-2 text-xs text-slate-600 dark:text-slate-400">
            <span>Search results for:</span>
            <span className="font-semibold text-slate-900 dark:text-white bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 px-2 py-0.5 rounded-md">
              &ldquo;{q}&rdquo;
            </span>
            <span>({startupsResult.total} found)</span>
            <Link
              href="/search"
              className="inline-flex items-center gap-1 text-brand-600 dark:text-brand-400 hover:underline ml-2"
            >
              <X className="w-3 h-3" /> Clear query
            </Link>
          </div>
        )}

        {/* Results Grid */}
        {startupsResult.items.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white/90 dark:bg-white/[0.03] p-16 text-center space-y-4 shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 border border-brand-100 dark:border-brand-900/40 flex items-center justify-center mx-auto text-2xl font-bold shadow-xs">
              🔍
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              No startups matched your search criteria
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Try broadening your search terms or clearing some filters to explore our directory.
            </p>
            <div className="pt-2">
              <Link
                href="/search"
                className="inline-block px-5 py-2.5 text-xs font-semibold rounded-xl bg-brand-600 hover:bg-brand-700 text-white transition-colors shadow-xs"
              >
                Reset Filters
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {startupsResult.items.map((startup) => (
              <StartupCard key={startup.id} startup={startup} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
