import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Layers, Sparkles } from "lucide-react";
import { listStartups } from "@/server/startups";
import { CATEGORIES, type Category } from "@/lib/validation";
import { getCurrentUser } from "@/lib/supabase/server";
import { StartupCard } from "@/components/startup/startup-card";
import {
  createMetadata,
  buildItemListJsonLd,
  buildBreadcrumbJsonLd,
} from "@/lib/seo";
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
  return createMetadata({
    title: `Best new ${name} startups | Startup Showcase`,
    description: `Discover top innovations, rising products, and community favorites in ${name}.`,
    path: `/categories/${slug.toLowerCase()}`,
    robots: {
      index: true,
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
          href="/categories"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All Categories</span>
        </Link>
      </div>

      {/* Hero Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <Layers className="w-8 h-8" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
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
          className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors"
        >
          Open in Directory
        </Link>
      </div>

      {/* Startups grid */}
      {startupsResult.items.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-500">
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
  );
}
