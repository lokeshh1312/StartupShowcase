import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Layers, Sparkles } from "lucide-react";
import { listStartups, getApprovedNonSampleStats } from "@/server/startups";
import { CATEGORIES, type Category } from "@/lib/validation";
import { getCurrentUser } from "@/lib/supabase/server";
import { StartupCard } from "@/components/startup/startup-card";
import { CloudBackground } from "@/components/ui/cloud-background";
import {
  createMetadata,
  buildItemListJsonLd,
  buildBreadcrumbJsonLd,
} from "@/lib/seo";
import { JsonLd } from "@/components/common/json-ld";
import type { Metadata } from "next";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

function findCategoryBySlug(slug: string): Category | undefined {
  const normalized = slug.toLowerCase().replace(/[^a-z0-9]+/g, "");
  return CATEGORIES.find(
    (c) => c.toLowerCase().replace(/[^a-z0-9]+/g, "") === normalized
  );
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = findCategoryBySlug(slug);
  const name = category || slug;
  const stats = category
    ? await getApprovedNonSampleStats({ category })
    : { count: 0, lastModified: null };

  const isIndexable = stats.count > 0;

  return createMetadata({
    title: `Best new ${name} startups | Startup Showcase`,
    description: `Discover top innovations, rising products, and community favorites in ${name}.`,
    path: `/categories/${slug.toLowerCase()}`,
    robots: {
      index: isIndexable,
      follow: true,
    },
  });
}

export default async function CategoryDetailPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = findCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const user = await getCurrentUser();
  const startupsResult = await listStartups(
    { category, pageSize: 50 },
    user?.id
  );

  // JSON-LD Structured Data: ItemList (excluding sample startups) & BreadcrumbList
  const itemListJsonLd = buildItemListJsonLd(
    startupsResult.items,
    `${category} Startups`,
    `/categories/${slug}`
  );
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Categories", path: "/categories" },
    { name: category, path: `/categories/${slug}` },
  ]);

  return (
    <div className="relative isolate min-h-screen">
      {/* Decorative Cloud Background */}
      <CloudBackground height="h-[340px] sm:h-[400px]" />

      {/* Structured Data: ItemList & BreadcrumbList */}
      <JsonLd data={itemListJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        {/* Back link */}
        <div>
          <Link
            href="/categories"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-md"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>All Categories</span>
          </Link>
        </div>

        {/* Hero Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-6 sm:p-8 rounded-3xl bg-white/90 dark:bg-slate-950/70 border border-slate-200/90 dark:border-white/10 backdrop-blur-md shadow-xs">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-950/40 border border-brand-100 dark:border-brand-900/40 flex items-center justify-center text-brand-600 dark:text-brand-400 shrink-0">
              <Layers className="w-8 h-8" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Category Focus</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                {category}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {startupsResult.total} {startupsResult.total === 1 ? "startup" : "startups"} curated in this sector
              </p>
            </div>
          </div>

          <Link
            href={`/browse?category=${encodeURIComponent(category)}`}
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 text-xs font-bold transition-all shadow-xs shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            Open in Directory
          </Link>
        </div>

        {/* Startups grid */}
        {startupsResult.items.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white/90 dark:bg-white/[0.03] p-12 text-center text-xs text-slate-500 dark:text-slate-400">
            No approved startups in {category} yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {startupsResult.items.map((startup) => (
              <StartupCard key={startup.id} startup={startup} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
