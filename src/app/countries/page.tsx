import React from "react";
import Link from "next/link";
import { Globe, ArrowRight } from "lucide-react";
import { listCountries } from "@/server/startups";
import { createMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = createMetadata({
  title: "Startup Showcase by Country | Global Innovation Map",
  description:
    "Explore early-stage startups and innovations emerging from countries across the world.",
  path: "/countries",
});

export default async function CountriesPage() {
  const countries = await listCountries();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="space-y-3 max-w-3xl">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-xs font-semibold">
          <Globe className="w-3.5 h-3.5" />
          <span>Global Geography</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Startups by Country
        </h1>

        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          Discover local innovations, grassroots technology, and venture-backed
          prototypes organized by geographic hub.
        </p>
      </div>

      {/* Countries Grid */}
      {countries.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-500">
          No countries with approved startups yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {countries.map((c) => (
            <Link
              key={c.code}
              href={`/countries/${c.code.toLowerCase()}`}
              className="group flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 hover:shadow-xs transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 font-mono font-bold text-xs flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0">
                  {c.code}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                    {c.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {c.count} {c.count === 1 ? "startup" : "startups"}
                  </p>
                </div>
              </div>

              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
