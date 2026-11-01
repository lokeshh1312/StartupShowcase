import React from "react";
import { Layers } from "lucide-react";
import { listCategories } from "@/server/startups";
import { CategoryCard } from "@/components/discovery/category-card";
import { CloudBackground } from "@/components/ui/cloud-background";
import { createMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = createMetadata({
  title: "Startup Categories & Industries | Startup Showcase",
  description:
    "Explore startups across emerging tech verticals: AgriTech, CleanTech, DeepTech, FinTech, HealthTech, and more.",
  path: "/categories",
});

export default async function CategoriesPage() {
  const categories = await listCategories();

  return (
    <div className="relative isolate min-h-screen">
      {/* Decorative Cloud Background */}
      <CloudBackground height="h-[340px] sm:h-[400px]" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        {/* Header */}
        <div className="space-y-3 max-w-3xl pt-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-semibold tracking-widest uppercase border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-white/5 text-slate-700 dark:text-slate-300 shadow-2xs dark:shadow-none">
            <Layers className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
            <span>Industry Taxonomy</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Startup{" "}
            <em className="font-serif-italic font-normal text-brand-600 dark:text-brand-400 not-italic-fallback">
              Categories
            </em>
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Browse vetted early-stage technology companies, prototypes, and digital products categorized by domain.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <CategoryCard key={cat.id} category={cat} />
          ))}
        </div>
      </div>
    </div>
  );
}
