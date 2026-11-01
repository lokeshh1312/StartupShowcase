import React from "react";
import Link from "next/link";
import Image from "next/image";
import { StartupLogo } from "@/components/common/startup-logo";
import { Badge, StageBadge } from "@/components/common/badge";
import { VoteButton } from "@/components/startup/vote-button";
import { MapPin, Eye, ChevronRight, Image as ImageIcon } from "lucide-react";
import { getCountryName } from "@/lib/validation";
import { isAllowedImageUrl } from "@/lib/images";
import type { FormattedStartup } from "@/server/startups";

interface LeaderboardTableProps {
  startups: Array<FormattedStartup & { rank?: number; votesCount?: number }>;
  emptyMessage?: string;
  monthLabel?: string;
}

const fallbackGradients = [
  "from-brand-500 to-indigo-600",
  "from-emerald-500 to-teal-600",
  "from-rose-500 to-pink-600",
  "from-violet-500 to-purple-600",
  "from-amber-500 to-orange-600",
];

export function LeaderboardTable({
  startups,
  emptyMessage = "No startup ideas found for this selection.",
}: LeaderboardTableProps) {
  if (startups.length === 0) {
    return (
      <div className="w-full rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-12 text-center">
        <div className="max-w-md mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 border border-brand-100 dark:border-brand-900/40 flex items-center justify-center mx-auto text-2xl font-bold shadow-xs">
            🚀
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {emptyMessage}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Check back soon or submit your own startup to be featured this month!
          </p>
          <div className="pt-2">
            <Link
              href="/submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs transition-colors shadow-xs"
            >
              <span>Submit your startup</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-950/70 shadow-sm dark:shadow-none overflow-hidden backdrop-blur-sm">
      {/* Scrollable Container (overflow-x-auto scrolls inside the card on mobile; page never scrolls) */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-100 dark:border-white/5 bg-slate-50/70 dark:bg-white/[0.02] text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase">
              <th scope="col" className="py-4 pl-6 pr-2 w-14 text-center">
                #
              </th>
              <th scope="col" className="py-4 px-3 w-28 text-center">
                Logo
              </th>
              <th scope="col" className="py-4 px-3 w-24 text-center">
                Image
              </th>
              <th scope="col" className="py-4 px-4 min-w-[200px]">
                Startup Idea
              </th>
              <th scope="col" className="py-4 px-3 w-32">
                Category
              </th>
              <th scope="col" className="py-4 px-3 w-32">
                Location
              </th>
              <th scope="col" className="py-4 px-3 w-28">
                Stage
              </th>
              <th scope="col" className="py-4 px-3 w-24 text-center">
                Views
              </th>
              <th scope="col" className="py-4 pl-2 pr-6 w-28 text-right">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-sm">
            {startups.map((startup, index) => {
              const rank = startup.rank || index + 1;
              const country = getCountryName(startup.countryCode);
              const rawImage = startup.coverImage || startup.thumbnail;
              const hasImage = Boolean(rawImage && isAllowedImageUrl(rawImage));
              const gradientClass =
                fallbackGradients[index % fallbackGradients.length];

              return (
                <tr
                  key={startup.id}
                  className="group relative hover:bg-slate-50/70 dark:hover:bg-white/[0.03] transition-colors"
                >
                  {/* Rank Badge */}
                  <td className="py-4 pl-6 pr-2 text-center align-middle font-bold text-xs">
                    {rank === 1 ? (
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-400 text-amber-950 font-extrabold text-xs shadow-xs">
                        1
                      </span>
                    ) : rank === 2 ? (
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-300 dark:bg-slate-600 text-slate-800 dark:text-slate-100 font-extrabold text-xs shadow-xs">
                        2
                      </span>
                    ) : rank === 3 ? (
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-600 text-white font-extrabold text-xs shadow-xs">
                        3
                      </span>
                    ) : (
                      <span className="text-slate-500 dark:text-slate-400 font-semibold text-xs">
                        {rank}
                      </span>
                    )}
                  </td>

                  {/* Logo + Name underneath */}
                  <td className="py-3 px-3 text-center align-middle">
                    <Link
                      href={`/startup/${startup.slug}`}
                      className="inline-flex flex-col items-center gap-1 group/logo focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-lg p-1"
                    >
                      <StartupLogo
                        name={startup.name}
                        category={startup.category}
                        logoType={startup.logoType}
                        logoColor={startup.logoColor}
                        size="sm"
                      />
                      <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[84px] group-hover/logo:text-brand-600 dark:group-hover/logo:text-brand-400 transition-colors">
                        {startup.name}
                      </span>
                    </Link>
                  </td>

                  {/* Startup Image Thumbnail */}
                  <td className="py-3 px-3 text-center align-middle">
                    <Link
                      href={`/startup/${startup.slug}`}
                      className="inline-block relative w-16 h-12 rounded-xl overflow-hidden border border-slate-200/80 dark:border-white/10 shrink-0 shadow-2xs hover:scale-105 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                    >
                      {hasImage ? (
                        <Image
                          src={rawImage!}
                          alt={startup.name}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      ) : (
                        <div
                          className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${gradientClass} text-white`}
                        >
                          <ImageIcon className="w-5 h-5 opacity-90" />
                        </div>
                      )}
                    </Link>
                  </td>

                  {/* Startup Idea Title + Tagline/Description */}
                  <td className="py-4 px-4 align-middle">
                    <Link
                      href={`/startup/${startup.slug}`}
                      className="block group/idea focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-lg"
                    >
                      <h4 className="font-bold text-slate-900 dark:text-white group-hover/idea:text-brand-600 dark:group-hover/idea:text-brand-400 transition-colors text-sm line-clamp-1">
                        {startup.ideaTitle || startup.name}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                        {startup.tagline || startup.description}
                      </p>
                    </Link>
                  </td>

                  {/* Category Pill */}
                  <td className="py-4 px-3 align-middle">
                    <Badge variant="brand" size="sm">
                      {startup.category}
                    </Badge>
                  </td>

                  {/* Location with Pin Icon */}
                  <td className="py-4 px-3 align-middle text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                    <div className="flex items-center gap-1.5" title={country}>
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{country}</span>
                    </div>
                  </td>

                  {/* Stage Pill */}
                  <td className="py-4 px-3 align-middle">
                    <StageBadge stage={startup.stage} />
                  </td>

                  {/* Views Count with Eye Icon */}
                  <td className="py-4 px-3 text-center align-middle font-mono text-xs text-slate-500 dark:text-slate-400">
                    <div className="inline-flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-slate-400" />
                      <span>{startup.views}</span>
                    </div>
                  </td>

                  {/* Compact Vote Button + Chevron Right */}
                  <td className="py-4 pl-2 pr-6 text-right align-middle">
                    <div className="flex items-center justify-end gap-2 relative z-20">
                      <VoteButton
                        startupIdOrSlug={startup.slug}
                        initialLikes={startup.likes}
                        initialLiked={startup.isLiked}
                        startupName={startup.name}
                        size="sm"
                      />
                      <Link
                        href={`/startup/${startup.slug}`}
                        className="inline-flex p-1.5 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 rounded-lg transition-colors group-hover:translate-x-0.5"
                        aria-label={`View details for ${startup.name}`}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
