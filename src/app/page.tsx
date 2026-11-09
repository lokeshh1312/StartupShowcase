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
import { InvestorNetworkBubble } from "@/components/investor-network/investor-network-bubble";
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
      {/* Structured Data */}
      <JsonLd data={orgJsonLd} />
      <JsonLd data={siteJsonLd} />
      <JsonLd data={leaderboardJsonLd} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-16 sm:pb-20">
        {/* Main Flow: Heading -> Month Tabs -> Category Chips -> Ranked List */}
        <div className="space-y-3 sm:space-y-4">
          {/* Section Header */}
          <section
            aria-label="Page introduction"
            className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
          >
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15] md:whitespace-nowrap min-w-0">
              Showcase Your Startup to a Global{" "}
              <em className="font-serif-italic font-normal text-brand-600 dark:text-brand-400 not-italic-fallback">
                Audience
              </em>
            </h1>
            <InvestorNetworkBubble />
          </section>

          {/* Month Selector Carousel / Tabs */}
          <section aria-label="Month selection">
            <MonthSelector months={months} activeMonth={activeMonth} />
          </section>

          {/* Category Chips Section */}
          <section aria-label="Categories" className="space-y-1.5 sm:space-y-0">
            {/* View all categories link on mobile (< 640px) */}
            <div className="sm:hidden">
              <Link
                href="/categories"
                className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 hover:underline inline-flex items-center gap-1"
              >
                <span>View all categories</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Category Chips Row */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              <Link
                href="/categories"
                className="bg-brand-500 hover:bg-brand-600 dark:bg-brand-600 dark:hover:bg-brand-700 text-white dark:text-[#0e0d0d] rounded-full px-4 py-2 text-xs font-semibold shadow-xs whitespace-nowrap shrink-0 transition-colors"
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
              {/* View all categories link on sm and wider at the right end */}
              <Link
                href="/categories"
                className="hidden sm:inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 hover:underline whitespace-nowrap shrink-0 ml-auto pl-2"
              >
                <span>View all categories</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </section>

          {/* Ranked Leaderboard List */}
          <section aria-label="Monthly ranked startups">
            <LeaderboardTable
              startups={leaderboardData.items}
              emptyMessage={`No approved startups found for ${leaderboardData.monthLabel}.`}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
