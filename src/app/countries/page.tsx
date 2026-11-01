import React from "react";
import Link from "next/link";
import { Globe, ArrowRight } from "lucide-react";
import { listCountries } from "@/server/startups";
import { CloudBackground } from "@/components/ui/cloud-background";
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
    <div className="relative isolate min-h-screen">
      {/* Decorative Cloud Background */}
      <CloudBackground height="h-[340px] sm:h-[400px]" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        {/* Header */}
        <div className="space-y-3 max-w-3xl pt-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-semibold tracking-widest uppercase border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-white/5 text-slate-700 dark:text-slate-300 shadow-2xs dark:shadow-none">
            <Globe className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
            <span>Global Geography</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Startups by{" "}
            <em className="font-serif-italic font-normal text-brand-600 dark:text-brand-400 not-italic-fallback">
              Country
            </em>
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Discover local innovations, grassroots technology, and venture-backed
            prototypes organized by geographic hub.
          </p>
        </div>

        {/* Countries Grid */}
        {countries.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white/90 dark:bg-white/[0.03] p-12 text-center text-xs text-slate-500 dark:text-slate-400">
            No countries with approved startups yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {countries.map((c) => (
              <Link
                key={c.code}
                href={`/countries/${c.code.toLowerCase()}`}
                className="group flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200/90 dark:border-white/10 hover:border-brand-500/50 dark:hover:border-white/20 shadow-xs dark:shadow-none hover:shadow-md transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 font-mono font-bold text-xs flex items-center justify-center text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-white/10 shrink-0">
                    {c.code}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors truncate">
                      {c.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {c.count} {c.count === 1 ? "startup" : "startups"}
                    </p>
                  </div>
                </div>

                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-600 dark:group-hover:text-brand-400 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
