import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import {
  getLeaderboard,
  listMonths,
  listCategories,
} from "@/server/startups";
import { MonthSelector } from "@/components/discovery/month-selector";
import { LeaderboardTable } from "@/components/startup/leaderboard-table";
import { CloudBackground } from "@/components/ui/cloud-background";
import {
  createMetadata,
  buildOrganizationJsonLd,
  buildWebSiteJsonLd,
  buildItemListJsonLd,
  DEFAULT_SITE_TITLE,
  DEFAULT_SITE_DESCRIPTION,
} from "@/lib/seo";
import { JsonLd } from "@/components/common/json-ld";
import type { Metadata } from "next";

interface HomePageProps {
  searchParams?: Promise<{
    month?: string;
    page?: string;
  }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return createMetadata({
    title: DEFAULT_SITE_TITLE,
    description: DEFAULT_SITE_DESCRIPTION,
    path: "/",
    robots: {
      index: true,
      follow: true,
    },
  });
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const resolvedParams = searchParams ? await searchParams : {};

  // Canonical rule: ?page=1 redirects to clean URL
  if (resolvedParams.page === "1") {
    redirect(resolvedParams.month ? `/?month=${resolvedParams.month}` : "/");
  }

  const months = await listMonths();
  const activeMonth = resolvedParams.month || months[0]?.id || "2026-10-01";

  // Fetch leaderboard for active month
  const leaderboardData = await getLeaderboard(activeMonth, 1, 10);

  // Fetch categories with counts
  const categories = await listCategories();
  const topCategories = categories
    .filter((c) => c.count > 0)
    .slice(0, 8);

  // JSON-LD Structured Data
  const orgJsonLd = buildOrganizationJsonLd();
  const siteJsonLd = buildWebSiteJsonLd();
  const leaderboardJsonLd = buildItemListJsonLd(
    leaderboardData.items,
    `${leaderboardData.monthLabel} Leaderboard`,
    `/?month=${activeMonth}`
  );

  return (
    <div className="relative isolate min-h-screen">
      {/* Decorative Cloud Background Layer */}
      <CloudBackground />

      {/* Structured Data */}
      <JsonLd data={orgJsonLd} />
      <JsonLd data={siteJsonLd} />
      <JsonLd data={leaderboardJsonLd} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-24 space-y-10 sm:space-y-12">
        {/* Section Header */}
        <section className="space-y-4 pt-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-3 max-w-2xl">
              {/* Eyebrow Label */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-semibold tracking-widest uppercase border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-white/5 text-slate-700 dark:text-slate-300 shadow-2xs dark:shadow-none">
                Browse by category
              </div>

              {/* Major Headline with italic serif accent word */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
                Find your corner of the{" "}
                <em className="font-serif-italic font-normal text-brand-600 dark:text-brand-400 not-italic-fallback">
                  ecosystem
                </em>
              </h1>
            </div>

            {/* View all categories link */}
            <Link
              href="/categories"
              className="text-xs sm:text-sm font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 hover:underline inline-flex items-center gap-1 shrink-0 pb-1"
            >
              <span>View all categories</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Category Chips Row */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            <Link
              href="/categories"
              className="bg-brand-600 text-white rounded-full px-4 py-2 text-xs font-semibold shadow-xs whitespace-nowrap shrink-0 hover:bg-brand-700 transition-colors"
            >
              All
            </Link>
            {topCategories.map((cat) => {
              const slug = encodeURIComponent(
                cat.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")
              );
              return (
                <Link
                  key={cat.id}
                  href={`/categories/${slug}`}
                  className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-brand-500/50 hover:bg-slate-50 dark:hover:bg-white/10 rounded-full px-4 py-2 text-xs font-medium transition-all shadow-2xs dark:shadow-none whitespace-nowrap shrink-0"
                >
                  {cat.name}
                </Link>
              );
            })}
          </div>
        </section>

        {/* Month Selector Carousel / Tabs */}
        <section aria-label="Month selection">
          <MonthSelector months={months} activeMonth={activeMonth} />
        </section>

        {/* Ranked Leaderboard List */}
        <section aria-label="Monthly ranked startups">
          <LeaderboardTable
            startups={leaderboardData.items}
            emptyMessage={`No approved startups found for ${leaderboardData.monthLabel}.`}
          />
        </section>

        {/* Closing Call-to-Action Band */}
        <section aria-label="Call to action" className="pt-4">
          <div className="relative rounded-3xl bg-brand-600 dark:bg-gradient-to-r dark:from-brand-900 dark:via-indigo-950 dark:to-slate-950 border border-brand-500/20 dark:border-white/10 p-8 sm:p-12 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 overflow-hidden">
            <div className="space-y-3 max-w-2xl">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Building something? Put it in front of the community.
              </h2>
              <p className="text-xs sm:text-sm text-brand-100 dark:text-slate-300 leading-relaxed">
                One-time listing fee, reviewed by our team, published for everyone to discover and vote on.
              </p>
            </div>
            <Link
              href="/submit"
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-white text-slate-950 hover:bg-slate-100 font-bold text-xs sm:text-sm transition-all shadow-md active:scale-95 shrink-0"
            >
              <span>Submit your startup</span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
