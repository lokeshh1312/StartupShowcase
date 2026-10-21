import React from "react";
import Link from "next/link";
import { ArrowRight, Layers } from "lucide-react";

interface CategoryCardProps {
  category: {
    id: string;
    name: string;
    count: number;
  };
}

export function CategoryCard({ category }: CategoryCardProps) {
  const slug = encodeURIComponent(category.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"));

  return (
    <Link
      href={`/categories/${slug}`}
      className="group relative flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 shadow-xs hover:shadow-md transition-all duration-300"
    >
      <div className="space-y-3">
        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
          <Layers className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {category.name}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {category.count} {category.count === 1 ? "startup" : "startups"}
          </p>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-blue-600 dark:text-blue-400">
        <span>Explore Category</span>
        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}
