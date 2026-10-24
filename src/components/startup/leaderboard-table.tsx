import React from "react";
import Link from "next/link";
import { StartupLogo } from "@/components/common/startup-logo";
import { Badge, StageBadge } from "@/components/common/badge";
import { VoteButton } from "@/components/startup/vote-button";
import { MapPin, ChevronRight } from "lucide-react";
import { getCountryName } from "@/lib/validation";
import type { FormattedStartup } from "@/server/startups";

interface LeaderboardTableProps {
  startups: Array<FormattedStartup & { rank?: number; votesCount?: number }>;
  emptyMessage?: string;
  monthLabel?: string;
}

export function LeaderboardTable({
  startups,
  emptyMessage = "No startup ideas found for this selection.",
}: LeaderboardTableProps) {
  if (startups.length === 0) {
    return (
      <div className="w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
        <div className="max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto text-xl font-bold">
            💡
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {emptyMessage}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Check back soon or explore other months and categories in the directory.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Desktop Table View */}
      <div className="hidden md:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-950/60 text-[11px] font-bold text-slate-600 dark:text-slate-400 tracking-wider uppercase">
                <th scope="col" className="py-4 pl-6 pr-2 w-12 text-center">
                  #
                </th>
                <th scope="col" className="py-4 px-4 w-20 text-center">
                  Logo
                </th>
                <th scope="col" className="py-4 px-4">
                  Startup Idea
                </th>
                <th scope="col" className="py-4 px-4 w-32">
                  Category
                </th>
                <th scope="col" className="py-4 px-4 w-36">
                  Location
                </th>
                <th scope="col" className="py-4 px-4 w-28">
                  Stage
                </th>
                <th scope="col" className="py-4 px-4 w-24 text-center">
                  Votes
                </th>
                <th scope="col" className="py-4 px-4 w-20 text-center">
                  Views
                </th>
                <th scope="col" className="py-4 pl-2 pr-6 w-16 text-right">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {startups.map((startup, index) => {
                const rank = startup.rank || index + 1;
                const country = getCountryName(startup.countryCode);

                return (
                  <tr
                    key={startup.id}
                    className="group hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    {/* Rank */}
                    <td className="py-4 pl-6 pr-2 text-center align-middle font-bold text-xs">
                      {rank === 1 ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-400 text-amber-950 font-extrabold text-xs shadow-xs">
                          1
                        </span>
                      ) : rank === 2 ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-extrabold text-xs shadow-xs">
                          2
                        </span>
                      ) : rank === 3 ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-600 text-white font-extrabold text-xs shadow-xs">
                          3
                        </span>
                      ) : (
                        <span className="text-slate-500 dark:text-slate-400 font-semibold">
                          {rank}
                        </span>
                      )}
                    </td>

                    {/* Logo */}
                    <td className="py-4 px-4 text-center align-middle">
                      <Link href={`/startup/${startup.slug}`}>
                        <StartupLogo
                          name={startup.name}
                          category={startup.category}
                          logoType={startup.logoType}
                          logoColor={startup.logoColor}
                          size="sm"
                          className="mx-auto"
                        />
                      </Link>
                    </td>

                    {/* Name & Tagline */}
                    <td className="py-4 px-4 align-middle">
                      <Link
                        href={`/startup/${startup.slug}`}
                        className="group/name block"
                      >
                        <h4 className="font-bold text-slate-900 dark:text-white group-hover/name:text-blue-600 dark:group-hover/name:text-blue-400 transition-colors text-sm">
                          {startup.name}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                          {startup.tagline || startup.ideaTitle}
                        </p>
                      </Link>
                    </td>

                    {/* Category */}
                    <td className="py-4 px-4 align-middle">
                      <Badge variant="default" size="sm">
                        {startup.category}
                      </Badge>
                    </td>

                    {/* Location */}
                    <td className="py-4 px-4 align-middle text-xs text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-1.5" title={country}>
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{country}</span>
                      </div>
                    </td>

                    {/* Stage */}
                    <td className="py-4 px-4 align-middle">
                      <StageBadge stage={startup.stage} />
                    </td>

                    {/* Votes */}
                    <td className="py-4 px-4 text-center align-middle">
                      <VoteButton
                        startupIdOrSlug={startup.slug}
                        initialLikes={startup.likes}
                        initialLiked={startup.isLiked}
                        startupName={startup.name}
                        size="sm"
                      />
                    </td>

                    {/* Views */}
                    <td className="py-4 px-4 text-center align-middle font-mono text-xs text-slate-500 dark:text-slate-400">
                      {startup.views}
                    </td>

                    {/* Action */}
                    <td className="py-4 pl-2 pr-6 text-right align-middle">
                      <Link
                        href={`/startup/${startup.slug}`}
                        className="inline-flex p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        aria-label={`View details for ${startup.name}`}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View (360px+) */}
      <div className="md:hidden space-y-3">
        {startups.map((startup, index) => {
          const rank = startup.rank || index + 1;
          const country = getCountryName(startup.countryCode);

          return (
            <div
              key={startup.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-bold text-slate-500 w-5 text-center">
                    #{rank}
                  </span>
                  <Link href={`/startup/${startup.slug}`}>
                    <StartupLogo
                      name={startup.name}
                      category={startup.category}
                      logoType={startup.logoType}
                      logoColor={startup.logoColor}
                      size="sm"
                    />
                  </Link>
                  <div className="min-w-0">
                    <Link href={`/startup/${startup.slug}`}>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                        {startup.name}
                      </h4>
                    </Link>
                    <p className="text-xs text-slate-500 truncate">
                      {startup.ideaTitle || startup.category}
                    </p>
                  </div>
                </div>

                <VoteButton
                  startupIdOrSlug={startup.slug}
                  initialLikes={startup.likes}
                  initialLiked={startup.isLiked}
                  startupName={startup.name}
                  size="sm"
                />
              </div>

              <div className="flex items-center justify-between gap-2 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Badge variant="default" size="sm">
                    {startup.category}
                  </Badge>
                  <span className="text-slate-500 text-[11px]">{country}</span>
                </div>
                <Link
                  href={`/startup/${startup.slug}`}
                  className="font-semibold text-blue-600 dark:text-blue-400 text-xs"
                >
                  View Details →
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
