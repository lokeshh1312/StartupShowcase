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
  const slug = encodeURIComponent(
    category.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")
  );

  return (
    <Link
      href={`/categories/${slug}`}
      className="group relative flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200/90 dark:border-white/10 hover:border-brand-500/50 dark:hover:border-white/20 shadow-xs dark:shadow-none hover:shadow-md transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
    >
      <div className="space-y-3">
        <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/40 border border-brand-100 dark:border-brand-900/40 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold">
          <Layers className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
            {category.name}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {category.count} {category.count === 1 ? "startup" : "startups"}
          </p>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs font-semibold text-brand-600 dark:text-brand-400">
        <span>Explore Category</span>
        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}
