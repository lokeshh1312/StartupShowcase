import React from "react";
import Link from "next/link";
import Image from "next/image";
import { StartupLogo } from "@/components/common/startup-logo";
import { Badge, StageBadge } from "@/components/common/badge";
import { VoteButton } from "@/components/startup/vote-button";
import { MapPin, ChevronRight, Image as ImageIcon } from "lucide-react";
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
    <div className="w-full lg:rounded-3xl lg:border lg:border-slate-200/90 lg:dark:border-white/10 lg:bg-white lg:dark:bg-slate-950/70 lg:shadow-sm lg:dark:shadow-none overflow-hidden lg:backdrop-blur-sm">
      {/* Scrollable Container (harmless fallback wrapper; mobile renders stacked cards) */}
      <div className="overflow-x-auto">
        <table className="max-lg:block w-full max-lg:min-w-0 lg:min-w-[880px] border-collapse text-left">
          <thead className="max-lg:sr-only">
            <tr className="border-b border-slate-100 dark:border-white/5 bg-slate-50/70 dark:bg-white/[0.02] text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase">
              <th scope="col" className="py-3.5 px-2 w-24 text-center">
                Logo
              </th>
              <th scope="col" className="py-3.5 px-2 w-24 text-center">
                Image
              </th>
              <th scope="col" className="py-3.5 px-3 min-w-[200px]">
                Startup Idea
              </th>
              <th scope="col" className="py-3.5 px-2.5 w-32">
                Category
              </th>
              <th scope="col" className="py-3.5 px-2.5 w-32">
                Country
              </th>
              <th scope="col" className="py-3.5 px-2.5 w-28">
                Stage
              </th>
              <th scope="col" className="py-3.5 pl-2 pr-6 w-28 text-right">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="max-lg:flex max-lg:flex-col max-lg:gap-3.5 sm:max-lg:gap-4 max-lg:p-0 divide-y-0 lg:divide-y divide-slate-100 dark:divide-white/5 text-sm">
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
                  className="group relative transition-colors max-lg:flex max-lg:flex-wrap max-lg:items-start max-lg:p-4 sm:max-lg:p-5 max-lg:rounded-2xl sm:max-lg:rounded-3xl max-lg:border max-lg:border-slate-200/90 max-lg:dark:border-white/10 max-lg:bg-white max-lg:dark:bg-slate-950/70 max-lg:shadow-sm max-lg:dark:shadow-none hover:bg-slate-50/70 dark:hover:bg-white/[0.03]"
                >
                  {/* Logo + Name underneath ("<rank>. <name>") */}
                  <td className="py-4 px-2 w-24 text-center align-top max-lg:order-1 max-lg:flex max-lg:items-center max-lg:flex-1 max-lg:p-0 max-lg:min-w-0 max-lg:border-0">
                    <Link
                      href={`/startup/${startup.slug}`}
                      className="inline-flex max-lg:flex-row max-lg:items-center max-lg:gap-2.5 lg:flex-col lg:items-center lg:gap-1.5 group/logo focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-lg p-0.5 max-w-full"
                    >
                      <StartupLogo
                        name={startup.name}
                        category={startup.category}
                        logoType={startup.logoType}
                        logoColor={startup.logoColor}
                        size="sm"
                      />
                      <span
                        title={`${rank}. ${startup.name}`}
                        className="text-xs sm:text-sm lg:text-[11px] font-bold lg:font-semibold text-slate-900 dark:text-white lg:text-slate-700 lg:dark:text-slate-300 line-clamp-2 break-words max-w-[180px] sm:max-w-[260px] lg:max-w-[96px] group-hover/logo:text-brand-600 dark:group-hover/logo:text-brand-400 transition-colors text-left lg:text-center"
                      >
                        {rank}. {startup.name}
                      </span>
                    </Link>
                  </td>

                  {/* Startup Image Thumbnail (w-20 h-14, sizes="80px") */}
                  <td className="py-4 px-2 w-24 text-center align-top max-lg:order-2 max-lg:p-0 max-lg:shrink-0 max-lg:ml-auto max-lg:border-0">
                    <Link
                      href={`/startup/${startup.slug}`}
                      className="inline-block relative w-20 h-14 rounded-xl overflow-hidden border border-slate-200/80 dark:border-white/10 shrink-0 shadow-2xs hover:scale-105 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                    >
                      {hasImage ? (
                        <Image
                          src={rawImage!}
                          alt={startup.name}
                          fill
                          className="object-cover"
                          sizes="80px"
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

                  {/* Startup Idea Title + Full Description */}
                  <td className="py-4 px-3 align-top max-lg:order-3 max-lg:w-full max-lg:p-0 max-lg:mt-3 max-lg:border-0">
                    <Link
                      href={`/startup/${startup.slug}`}
                      className="block group/idea focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-lg"
                    >
                      <h4 className="font-bold text-slate-900 dark:text-white group-hover/idea:text-brand-600 dark:group-hover/idea:text-brand-400 transition-colors text-sm sm:text-base lg:text-sm line-clamp-1">
                        {startup.ideaTitle || startup.name}
                      </h4>
                      <p className="text-xs sm:text-sm lg:text-xs text-slate-600 dark:text-slate-400 whitespace-pre-line break-words [overflow-wrap:anywhere] mt-1 sm:mt-1.5 leading-relaxed">
                        {startup.description || startup.tagline}
                      </p>
                    </Link>
                  </td>

                  {/* Category Pill */}
                  <td className="py-4 px-2.5 w-32 align-top max-lg:order-4 max-lg:p-0 max-lg:w-auto max-lg:mt-3 max-lg:mr-2 max-lg:border-0">
                    <Badge variant="brand" size="sm">
                      {startup.category}
                    </Badge>
                  </td>

                  {/* Country with Pin Icon */}
                  <td className="py-4 px-2.5 w-32 align-top text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap max-lg:order-5 max-lg:p-0 max-lg:w-auto max-lg:mt-3 max-lg:mr-2 max-lg:border-0">
                    <div
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 lg:bg-transparent lg:border-0 lg:p-0"
                      title={country}
                    >
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate max-w-[140px] sm:max-w-none">
                        {country}
                      </span>
                    </div>
                  </td>

                  {/* Stage Pill */}
                  <td className="py-4 px-2.5 w-28 align-top max-lg:order-6 max-lg:p-0 max-lg:w-auto max-lg:mt-3 max-lg:border-0">
                    <StageBadge stage={startup.stage} />
                  </td>

                  {/* Like Button + Chevron Link */}
                  <td className="py-4 pl-2 pr-6 w-28 text-right align-top max-lg:order-7 max-lg:w-full max-lg:p-0 max-lg:pt-3 max-lg:mt-3.5 max-lg:border-t max-lg:border-slate-100 max-lg:dark:border-white/5 max-lg:border-x-0 max-lg:border-b-0">
                    <div className="flex items-center justify-between lg:justify-end gap-2 relative z-20 w-full">
                      <VoteButton
                        startupIdOrSlug={startup.slug}
                        initialLikes={startup.likes}
                        initialLiked={startup.isLiked}
                        startupName={startup.name}
                        size="sm"
                      />
                      <Link
                        href={`/startup/${startup.slug}`}
                        className="inline-flex items-center justify-center min-w-[36px] min-h-[36px] p-2 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 rounded-lg transition-colors group-hover:translate-x-0.5"
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
