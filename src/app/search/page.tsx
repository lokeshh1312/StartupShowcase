import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Search as SearchIcon, X } from "lucide-react";
import { listStartups, listCategories, listCountries } from "@/server/startups";
import { getCurrentUser } from "@/lib/supabase/server";
import { StartupCard } from "@/components/startup/startup-card";
import { FilterBar } from "@/components/discovery/filter-bar";
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Search Header */}
      <div className="max-w-3xl space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-xs font-semibold">
          <SearchIcon className="w-3.5 h-3.5" />
          <span>Full-Text Search Engine</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Search Startups
        </h1>

        {/* Global Search Input Form */}
        <form action="/search" method="GET" className="relative flex items-center">
          <SearchIcon className="absolute left-4 w-5 h-5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search by name, tagline, problem, tech stack, or founder..."
            className="w-full pl-12 pr-28 py-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-xs text-sm"
          />
          <button
            type="submit"
            className="absolute right-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors shadow-xs"
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
        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
          <span>Search results for:</span>
          <span className="font-semibold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
            &ldquo;{q}&rdquo;
          </span>
          <span>({startupsResult.total} found)</span>
          <Link
            href="/search"
            className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline ml-2"
          >
            <X className="w-3 h-3" /> Clear query
          </Link>
        </div>
      )}

      {/* Results Grid */}
      {startupsResult.items.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3">
          <p className="text-base font-semibold text-slate-700 dark:text-slate-300">
            No startups matched your search criteria.
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Try broadening your search terms or clearing some filters to explore our directory.
          </p>
          <Link
            href="/search"
            className="inline-block mt-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            Reset Filters
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {startupsResult.items.map((startup) => (
            <StartupCard key={startup.id} startup={startup} />
          ))}
        </div>
      )}
    </div>
  );
}
