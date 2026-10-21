import Link from "next/link";
import {
  ArrowRight,
  TrendingUp,
  Zap,
  Sparkles,
} from "lucide-react";
import {
  getLeaderboard,
  listMonths,
  listCategories,
  listStartups,
} from "@/server/startups";
import { getCurrentUser } from "@/lib/supabase/server";
import { MonthSelector } from "@/components/discovery/month-selector";
import { LeaderboardTable } from "@/components/startup/leaderboard-table";
import { StartupCard } from "@/components/startup/startup-card";
import { CategoryCard } from "@/components/discovery/category-card";

interface HomePageProps {
  searchParams?: Promise<{
    month?: string;
  }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const resolvedParams = searchParams ? await searchParams : {};
  const user = await getCurrentUser();

  const months = await listMonths();
  const activeMonth = resolvedParams.month || months[0]?.id || "2026-10-01";

  // Fetch leaderboard for active month
  const leaderboardData = await getLeaderboard(activeMonth, 1, 10);

  // Fetch top featured/trending startups
  const featuredData = await listStartups(
    { sort: "views", pageSize: 4 },
    user?.id
  );

  // Fetch categories with counts
  const categories = await listCategories();
  const topCategories = categories
    .filter((c) => c.count > 0)
    .slice(0, 6);

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/70 via-white to-transparent dark:from-blue-950/20 dark:via-slate-950 dark:to-transparent pt-20 pb-12 border-b border-slate-200/60 dark:border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-100/80 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-800 px-4 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300">
            <Zap className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            Global Early-Stage Discovery Platform
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-tight">
            Discover & Support The Next{" "}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Breakthrough Startups
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
            Spotlight high-impact prototypes, MVPs, and early-stage innovations
            from makers worldwide. Vote, bookmark, and engage with founders.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
            <Link
              href="/browse"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-2xl shadow-lg shadow-blue-600/20 transition-all duration-200 active:scale-95"
            >
              <span>Explore Directory</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/submit"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-all duration-200 active:scale-95"
            >
              Submit Your Startup
            </Link>
          </div>
        </div>
      </section>

      {/* Main Leaderboard Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Monthly Leaderboard
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Top early-stage startups launched in {leaderboardData.monthLabel},
              ranked by community votes.
            </p>
          </div>

          <Link
            href={`/months/${activeMonth}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
          >
            <span>View Full Month</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Month Selector Carousel / Tabs */}
        <MonthSelector months={months} activeMonth={activeMonth} />

        {/* Leaderboard Table */}
        <LeaderboardTable
          startups={leaderboardData.items}
          emptyMessage={`No approved startups found for ${leaderboardData.monthLabel}.`}
        />
      </section>

      {/* Trending / Featured Startups Grid */}
      {featuredData.items.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Trending Innovations
              </h2>
            </div>
            <Link
              href="/browse?sort=trending"
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
            >
              <span>Browse All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featuredData.items.map((startup) => (
              <StartupCard key={startup.id} startup={startup} />
            ))}
          </div>
        </section>
      )}

      {/* Categories Section */}
      {topCategories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Explore by Category
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Browse innovative products grouped by industry domain.
              </p>
            </div>
            <Link
              href="/categories"
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
            >
              <span>All Categories</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {topCategories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        </section>
      )}

      {/* Community Callout */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 p-8 sm:p-12 text-white overflow-hidden shadow-xl">
          <div className="relative z-10 max-w-2xl space-y-4">
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Are you building an early-stage startup?
            </h3>
            <p className="text-sm text-blue-100 leading-relaxed">
              Showcase your project to early adopters, investors, and fellow
              founders worldwide. 100% free discovery listings.
            </p>
            <div className="pt-2">
              <Link
                href="/submit"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white text-blue-700 hover:bg-blue-50 font-bold text-xs transition-colors shadow-md"
              >
                <span>Submit Your Startup Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
