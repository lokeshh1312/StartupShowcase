import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Compass, ArrowLeft, ArrowRight } from "lucide-react";
import {
  listStartups,
  listCountries,
  listCategories,
} from "@/server/startups";
import { getCurrentUser } from "@/lib/supabase/server";
import { type SortOption } from "@/lib/validation";
import { FilterBar } from "@/components/discovery/filter-bar";
import { StartupCard } from "@/components/startup/startup-card";
import { createMetadata, buildItemListJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/common/json-ld";
import type { Metadata } from "next";

interface BrowsePageProps {
  searchParams?: Promise<{
    q?: string;
    category?: string;
    country?: string;
    stage?: string;
    month?: string;
    sort?: string;
    remoteFirst?: string;
    page?: string;
  }>;
}

export async function generateMetadata({
  searchParams,
}: BrowsePageProps): Promise<Metadata> {
  const params = searchParams ? await searchParams : {};
  const hasFilterOrPage = Boolean(
    params.q ||
      params.category ||
      params.country ||
      params.stage ||
      params.month ||
      params.remoteFirst ||
      params.sort ||
      params.page
  );

  return createMetadata({
    title: "Startup Directory | Browse Global Innovations",
    description:
      "Filter and explore early-stage tech startups, prototypes, and MVPs by category, country, stage, and launch month.",
    path: "/browse",
    robots: hasFilterOrPage
      ? { index: false, follow: true }
      : { index: true, follow: true },
  });
}

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const params = searchParams ? await searchParams : {};

  // Canonical rule: ?page=1 redirects to clean URL
  if (params.page === "1") {
    const nextParams = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (k !== "page" && typeof v === "string") {
        nextParams.set(k, v);
      }
    }
    const qs = nextParams.toString();
    redirect(qs ? `/browse?${qs}` : "/browse");
  }

  const user = await getCurrentUser();

  const page = Math.max(1, parseInt(params.page || "1", 10));
  const pageSize = 12;

  const [startupsData, countries, categoriesList] = await Promise.all([
    listStartups(
      {
        q: params.q,
        category: params.category,
        countryCode: params.country,
        stage: params.stage,
        month: params.month,
        remoteFirst: params.remoteFirst === "true",
        sort: (params.sort as SortOption) || "votes",
        page,
        pageSize,
      },
      user?.id
    ),
    listCountries(),
    listCategories(),
  ]);

  const categories = categoriesList.map((c) => c.name);
  const itemListJsonLd = buildItemListJsonLd(
    startupsData.items,
    "Startup Directory",
    "/browse"
  );

  // Pagination helper
  const createPageUrl = (targetPage: number) => {
    const urlParams = new URLSearchParams(params as Record<string, string>);
    urlParams.set("page", String(targetPage));
    return `/browse?${urlParams.toString()}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Structured Data */}
      <JsonLd data={itemListJsonLd} />

      {/* Header */}
      <div className="space-y-3 max-w-3xl">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-xs font-semibold">
          <Compass className="w-3.5 h-3.5" />
          <span>Global Startup Directory</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Startup Directory
        </h1>

        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          Browse verified early-stage projects across categories, stages, and
          countries. Filter, inspect features, and support founders.
        </p>
      </div>

      {/* Filter Bar with Search, Dropdowns, and Sort */}
      <FilterBar
        countries={countries}
        categories={categories}
        totalResults={startupsData.total}
      />

      {/* Startups Grid or Empty State */}
      {startupsData.items.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-16 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto text-2xl font-bold">
            🔍
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            No startups match your filters
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Try adjusting your search query, selecting different categories, or
            clearing filters to see more results.
          </p>
          <div className="pt-2">
            <Link
              href="/browse"
              className="inline-block px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            >
              Reset All Filters
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {startupsData.items.map((startup) => (
            <StartupCard key={startup.id} startup={startup} />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {startupsData.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-6">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Page {startupsData.page} of {startupsData.totalPages}
          </div>
          <div className="flex items-center gap-2">
            {startupsData.page > 1 ? (
              <Link
                href={createPageUrl(startupsData.page - 1)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Previous
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-300 dark:text-slate-600 opacity-50 cursor-not-allowed">
                <ArrowLeft className="w-3.5 h-3.5" />
                Previous
              </span>
            )}

            {startupsData.page < startupsData.totalPages ? (
              <Link
                href={createPageUrl(startupsData.page + 1)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Next
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-300 dark:text-slate-600 opacity-50 cursor-not-allowed">
                Next
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
