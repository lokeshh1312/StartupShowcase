import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Globe } from "lucide-react";
import { listStartups } from "@/server/startups";
import { getCountryName } from "@/lib/validation";
import { getCurrentUser } from "@/lib/supabase/server";
import { StartupCard } from "@/components/startup/startup-card";
import type { Metadata } from "next";

interface CountryPageProps {
  params: Promise<{ code: string }>;
}

export async function generateMetadata({
  params,
}: CountryPageProps): Promise<Metadata> {
  const { code } = await params;
  const name = getCountryName(code.toUpperCase());
  return {
    title: `Startups from ${name} (${code.toUpperCase()}) | Startup Showcase`,
    description: `Discover early-stage startups and cutting-edge innovations originating from ${name}.`,
  };
}

export default async function CountryDetailPage({ params }: CountryPageProps) {
  const { code } = await params;
  const upperCode = code.toUpperCase();
  const countryName = getCountryName(upperCode);

  if (!countryName || countryName === upperCode && upperCode.length !== 2) {
    notFound();
  }

  const user = await getCurrentUser();
  const startupsResult = await listStartups(
    { countryCode: upperCode, pageSize: 50 },
    user?.id
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back link */}
      <div>
        <Link
          href="/countries"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All Countries</span>
        </Link>
      </div>

      {/* Hero */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 font-mono font-extrabold text-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            {upperCode}
          </div>
          <div>
            <div className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              <Globe className="w-3.5 h-3.5" />
              <span>Country Showcase</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {countryName}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {startupsResult.total} {startupsResult.total === 1 ? "startup" : "startups"} featured from this region
            </p>
          </div>
        </div>

        <Link
          href={`/browse?countryCode=${upperCode}`}
          className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors"
        >
          Filter in Directory
        </Link>
      </div>

      {/* Startups list */}
      {startupsResult.items.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-500">
          No approved startups found for {countryName} yet.
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
