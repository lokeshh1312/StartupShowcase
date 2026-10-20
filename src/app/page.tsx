import { Lightbulb, ArrowRight, TrendingUp, Users, Zap } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/80 to-transparent dark:from-blue-950/20 dark:to-transparent pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-100/80 dark:bg-blue-900/30 border border-blue-200/60 dark:border-blue-800/40 px-4 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 mb-6">
            <Zap className="w-3.5 h-3.5" />
            Global Startup Discovery Platform
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Discover the Next{" "}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Big Thing
            </span>
          </h1>

          <p className="mt-5 max-w-2xl mx-auto text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
            Explore, vote, and support early-stage startups from around the
            world. Monthly leaderboards highlight the most promising ideas.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/submit"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-600/20 transition-all duration-200 active:scale-95"
            >
              Submit Your Startup
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all duration-200 active:scale-95"
            >
              How It Works
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              icon: TrendingUp,
              label: "Monthly Leaderboard",
              value: "Top Startups",
              color: "text-blue-600 dark:text-blue-400",
              bg: "bg-blue-50 dark:bg-blue-950/40",
            },
            {
              icon: Users,
              label: "Global Community",
              value: "Founders & Voters",
              color: "text-emerald-600 dark:text-emerald-400",
              bg: "bg-emerald-50 dark:bg-emerald-950/40",
            },
            {
              icon: Lightbulb,
              label: "Early-Stage Ideas",
              value: "Discover & Support",
              color: "text-amber-600 dark:text-amber-400",
              bg: "bg-amber-50 dark:bg-amber-950/40",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm p-5 shadow-sm"
            >
              <div
                className={`flex items-center justify-center w-11 h-11 rounded-xl ${stat.bg}`}
              >
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {stat.value}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {stat.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Placeholder for leaderboard (coming in later phase) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white/60 dark:bg-slate-900/40 p-12">
          <Lightbulb className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300">
            Leaderboard Coming Soon
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            The monthly startup leaderboard will be powered by Supabase and
            displayed here once the database migration is complete.
          </p>
        </div>
      </section>
    </>
  );
}
