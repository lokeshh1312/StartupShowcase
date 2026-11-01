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
import { CloudBackground } from "@/components/ui/cloud-background";
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
    <div className="relative isolate min-h-screen">
      {/* Decorative Cloud Background */}
      <CloudBackground height="h-[340px] sm:h-[400px]" />

      {/* Structured Data */}
      <JsonLd data={itemListJsonLd} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        {/* Header */}
        <div className="space-y-3 max-w-3xl pt-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-semibold tracking-widest uppercase border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-white/5 text-slate-700 dark:text-slate-300 shadow-2xs dark:shadow-none">
            <Compass className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
            <span>Global Startup Directory</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Startup{" "}
            <em className="font-serif-italic font-normal text-brand-600 dark:text-brand-400 not-italic-fallback">
              Directory
            </em>
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
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
          <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white/90 dark:bg-white/[0.03] p-16 text-center space-y-4 shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 border border-brand-100 dark:border-brand-900/40 flex items-center justify-center mx-auto text-2xl font-bold shadow-xs">
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
                className="inline-block px-5 py-2.5 text-xs font-semibold rounded-xl bg-brand-600 hover:bg-brand-700 text-white transition-colors shadow-xs"
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
          <div className="flex items-center justify-between border-t border-slate-200 dark:border-white/10 pt-6">
            <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
              Page {startupsData.page} of {startupsData.totalPages}
            </div>
            <div className="flex items-center gap-2">
              {startupsData.page > 1 ? (
                <Link
                  href={createPageUrl(startupsData.page - 1)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 shadow-2xs"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200/60 dark:border-white/5 text-xs font-semibold text-slate-300 dark:text-slate-600 opacity-50 cursor-not-allowed">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </span>
              )}

              {startupsData.page < startupsData.totalPages ? (
                <Link
                  href={createPageUrl(startupsData.page + 1)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 shadow-2xs"
                >
                  <span>Next</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200/60 dark:border-white/5 text-xs font-semibold text-slate-300 dark:text-slate-600 opacity-50 cursor-not-allowed">
                  <span>Next</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
