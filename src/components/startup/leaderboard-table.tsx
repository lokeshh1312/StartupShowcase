import React from "react";
import Link from "next/link";
import Image from "next/image";
import { StartupLogo } from "@/components/common/startup-logo";
import { Badge, StageBadge } from "@/components/common/badge";
import { VoteButton } from "@/components/startup/vote-button";
import { CountryFlag } from "@/components/common/country-flag";
import { MapPin, Image as ImageIcon } from "lucide-react";
import { getCountryName } from "@/lib/validation";
import { isAllowedImageUrl } from "@/lib/images";
import type { FormattedStartup } from "@/server/startups";

interface LeaderboardTableProps {
  startups: Array<FormattedStartup & { rank?: number; votesCount?: number }>;
  emptyMessage?: string;
  monthLabel?: string;
}

const fallbackGradients = [
  "from-brand-400 to-brand-500",
  "from-slate-700 to-slate-800",
  "from-rose-500 to-pink-600",
  "from-brand-500 to-brand-600",
  "from-amber-500 to-orange-600",
];

export function LeaderboardTable({
  startups,
  emptyMessage = "No startup ideas found for this selection.",
}: LeaderboardTableProps) {
  if (startups.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
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
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white dark:text-[#0e0d0d] font-semibold text-xs transition-colors shadow-xs"
              >
                <span>Submit your startup</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Mobile/Tablet Card List (< lg): BetaList-style edge-to-edge cards */}
      <ul className="lg:hidden flex flex-col gap-2">
        {startups.map((startup, index) => {
          const rank = startup.rank || index + 1;
          const rawImage = startup.coverImage || startup.thumbnail;
          const hasImage = Boolean(rawImage && isAllowedImageUrl(rawImage));
          const gradientClass =
            fallbackGradients[index % fallbackGradients.length];

          return (
            <li
              key={`m-${startup.id}`}
              className="w-full py-3 px-4 border-y border-slate-200/90 dark:border-white/10 bg-white/90 dark:bg-white/[0.03] backdrop-blur-md transition-colors hover:bg-slate-50/70 dark:hover:bg-white/[0.05]"
            >
              <div className="grid grid-cols-[auto_1fr_auto] gap-x-3 gap-y-2 items-start">
                {/* LEFT: Startup Image (w-20 h-12) */}
                <Link
                  href={`/startup/${startup.slug}`}
                  className="col-start-1 row-start-1 relative w-20 h-12 rounded-lg overflow-hidden border border-slate-200/80 dark:border-white/10 shrink-0 shadow-2xs focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                  aria-label={`${startup.name} image`}
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

                {/* MIDDLE, Row 1: Startup Name + Flag & Badges */}
                <div className="col-start-2 row-start-1 flex flex-col justify-center gap-1 min-w-0 self-stretch">
                  <div className="flex items-center min-w-0">
                    <Link
                      href={`/startup/${startup.slug}`}
                      className="truncate min-w-0 text-sm font-semibold text-slate-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
                    >
                      {rank}. {startup.name}
                    </Link>
                    <CountryFlag
                      code={startup.countryCode}
                      className="ml-1.5 shrink-0"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 min-w-0 overflow-hidden flex-nowrap">
                    <Badge
                      variant="brand"
                      size="sm"
                      className="max-w-[120px] truncate shrink-0"
                    >
                      {startup.category}
                    </Badge>
                    <span className="inline-flex shrink-0 whitespace-nowrap">
                      <StageBadge stage={startup.stage} />
                    </span>
                  </div>
                </div>

                {/* RIGHT COLUMN: Logo on top, VoteButton directly below, spanning both rows */}
                <div className="col-start-3 row-span-2 flex flex-col items-end gap-1.5 shrink-0">
                  <Link
                    href={`/startup/${startup.slug}`}
                    className="focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-lg p-0.5"
                    aria-label={`${startup.name} logo`}
                  >
                    <StartupLogo
                      name={startup.name}
                      category={startup.category}
                      logoType={startup.logoType}
                      logoColor={startup.logoColor}
                      size="md"
                    />
                  </Link>
                  <VoteButton
                    startupIdOrSlug={startup.slug}
                    initialLikes={startup.likes}
                    initialLiked={startup.isLiked}
                    startupName={startup.name}
                    size="sm"
                  />
                </div>

                {/* UNDER Row 1: Description spanning Image and Main columns (cols 1 & 2) */}
                <Link
                  href={`/startup/${startup.slug}`}
                  className="col-start-1 col-span-2 block pr-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
                >
                  <p className="text-xs leading-snug text-slate-600 dark:text-slate-400 whitespace-pre-line break-words [overflow-wrap:anywhere]">
                    {startup.description || startup.tagline}
                  </p>
                </Link>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Desktop Layout (>= lg): Full-width bands per startup */}
      <div className="hidden lg:flex lg:flex-col">
        {/* Full-width Column Header Row */}
        <div className="w-full h-[55px] border-y border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] mb-[2px] flex items-center">
          <div className="w-full max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-[80px_100px_minmax(0,1fr)_100px_190px_100px_64px] xl:grid-cols-[88px_108px_minmax(0,1fr)_110px_240px_110px_64px] gap-3 xl:gap-4 items-center text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase">
              <div className="text-center">Logo</div>
              <div className="text-center">Image</div>
              <div>Startup Idea</div>
              <div>Category</div>
              <div>Country</div>
              <div>Stage</div>
              <div className="text-right sr-only">Vote</div>
            </div>
          </div>
        </div>

        {/* Startup Rows: Each startup is its own full-width band */}
        <div className="flex flex-col">
          {startups.map((startup, index) => {
            const rank = startup.rank || index + 1;
            const country = getCountryName(startup.countryCode);
            const rawImage = startup.coverImage || startup.thumbnail;
            const hasImage = Boolean(rawImage && isAllowedImageUrl(rawImage));
            const gradientClass =
              fallbackGradients[index % fallbackGradients.length];

            return (
              <div
                key={startup.id}
                className="w-full bg-white dark:bg-[#161616] border-y border-slate-200/80 dark:border-white/10 mb-2 transition-colors hover:bg-slate-50/70 dark:hover:bg-[#1a1a1a] group"
              >
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5">
                  <div className="grid grid-cols-[80px_100px_minmax(0,1fr)_100px_190px_100px_64px] xl:grid-cols-[88px_108px_minmax(0,1fr)_110px_240px_110px_64px] gap-3 xl:gap-4 items-center">
                    {/* Col 1: Logo + Name under logo */}
                    <div className="flex justify-center min-w-0">
                      <Link
                        href={`/startup/${startup.slug}`}
                        className="inline-flex flex-col items-center gap-1 group/logo focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-lg p-0.5 max-w-full text-center"
                      >
                        <StartupLogo
                          name={startup.name}
                          category={startup.category}
                          logoType={startup.logoType}
                          logoColor={startup.logoColor}
                          size="md"
                        />
                        <span
                          title={`${rank}. ${startup.name}`}
                          className="text-[11px] font-bold text-slate-700 dark:text-slate-300 line-clamp-2 break-words max-w-[80px] xl:max-w-[88px] group-hover/logo:text-brand-600 dark:group-hover/logo:text-brand-400 transition-colors text-center leading-tight"
                        >
                          {rank}. {startup.name}
                        </span>
                      </Link>
                    </div>

                    {/* Col 2: Startup Image Thumbnail (98x68) */}
                    <div className="flex justify-center min-w-0">
                      <Link
                        href={`/startup/${startup.slug}`}
                        className="inline-block relative w-[98px] h-[68px] rounded-xl overflow-hidden border border-slate-200/80 dark:border-white/10 shrink-0 shadow-2xs hover:scale-105 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                        aria-label={`${startup.name} image`}
                      >
                        {hasImage ? (
                          <Image
                            src={rawImage!}
                            alt={startup.name}
                            fill
                            className="object-cover"
                            sizes="98px"
                          />
                        ) : (
                          <div
                            className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${gradientClass} text-white`}
                          >
                            <ImageIcon className="w-5 h-5 opacity-90" />
                          </div>
                        )}
                      </Link>
                    </div>

                    {/* Col 3: Startup Idea Title + Full Description */}
                    <div className="min-w-0 pr-2">
                      <Link
                        href={`/startup/${startup.slug}`}
                        className="block group/idea focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-lg min-w-0"
                      >
                        <h4 className="font-bold text-slate-900 dark:text-white group-hover/idea:text-brand-600 dark:group-hover/idea:text-brand-400 transition-colors text-sm line-clamp-1">
                          {startup.ideaTitle || startup.name}
                        </h4>
                        <p className="text-xs leading-snug text-slate-600 dark:text-slate-400 whitespace-pre-line break-words [overflow-wrap:anywhere] mt-0.5">
                          {startup.description || startup.tagline}
                        </p>
                      </Link>
                    </div>

                    {/* Col 4: Category Pill */}
                    <div className="min-w-0">
                      <Badge variant="brand" size="sm" className="max-w-full truncate">
                        {startup.category}
                      </Badge>
                    </div>

                    {/* Col 5: Country with Pin Icon, NO flag, no truncation */}
                    <div className="min-w-0">
                      <div
                        className="inline-flex items-start gap-1.5 min-w-0 max-w-full text-xs text-slate-600 dark:text-slate-300"
                        title={country}
                      >
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="leading-snug whitespace-normal break-words">
                          {country}
                        </span>
                      </div>
                    </div>

                    {/* Col 6: Stage Pill */}
                    <div className="min-w-0">
                      <StageBadge stage={startup.stage} />
                    </div>

                    {/* Col 7: Like Button Only (right-aligned flush) */}
                    <div className="flex items-center justify-end relative z-20">
                      <VoteButton
                        startupIdOrSlug={startup.slug}
                        initialLikes={startup.likes}
                        initialLiked={startup.isLiked}
                        startupName={startup.name}
                        size="sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
