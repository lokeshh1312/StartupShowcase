import React from "react";
import { Layers } from "lucide-react";
import { listCategories } from "@/server/startups";
import { CategoryCard } from "@/components/discovery/category-card";
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="space-y-3 max-w-3xl">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-xs font-semibold">
          <Layers className="w-3.5 h-3.5" />
          <span>Industry Taxonomy</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Startup Categories
        </h1>

        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
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
  );
}
