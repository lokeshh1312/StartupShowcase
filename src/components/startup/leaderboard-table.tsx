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
            <h3 className="text-[18px] font-semibold text-slate-900 dark:text-white">
              {emptyMessage}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Check back soon or submit your own startup to be featured this month!
            </p>
            <div className="pt-2">
              <Link
                href="/submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white dark:text-[#0e0d0d] font-medium text-xs transition-colors shadow-xs"
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
      {/* Mobile/Tablet Card List (< lg): BetaList-style edge-to-edge cards with whole-card click */}
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
              className="relative w-full py-2 px-3.5 border-y border-slate-200/90 dark:border-white/10 bg-white/90 dark:bg-white/[0.03] backdrop-blur-md transition-colors hover:bg-slate-50/70 dark:hover:bg-white/[0.05] cursor-pointer group"
            >
              {/* Stretched Link overlay */}
              <Link
                href={`/startup/${startup.slug}`}
                className="absolute inset-0 z-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                aria-label={`View ${startup.name}`}
              />

              <div className="grid grid-cols-[auto_1fr_auto] gap-x-2.5 gap-y-1 items-start">
                {/* LEFT: Startup Image (w-16 h-10) */}
                <div
                  className="col-start-1 row-start-1 relative w-16 h-10 rounded-lg overflow-hidden border border-slate-200/80 dark:border-white/10 shrink-0 shadow-2xs"
                  aria-label={`${startup.name} image`}
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
                      <ImageIcon className="w-4 h-4 opacity-90" />
                    </div>
                  )}
                </div>

                {/* MIDDLE, Row 1: Startup Name + Flag & Badges */}
                <div className="col-start-2 row-start-1 flex flex-col justify-center gap-0.5 min-w-0 self-stretch">
                  <div className="flex items-center min-w-0">
                    <span className="truncate min-w-0 text-sm font-semibold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                      {rank}. {startup.name}
                    </span>
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
                <div className="col-start-3 row-span-2 flex flex-col items-end gap-1 shrink-0">
                  <div className="p-0.5">
                    <StartupLogo
                      name={startup.name}
                      category={startup.category}
                      logoType={startup.logoType}
                      logoColor={startup.logoColor}
                      className="!w-9 !h-9 text-xs"
                      size="sm"
                    />
                  </div>
                  <div className="relative z-20">
                    <VoteButton
                      startupIdOrSlug={startup.slug}
                      initialLikes={startup.likes}
                      initialLiked={startup.isLiked}
                      startupName={startup.name}
                      size="sm"
                    />
                  </div>
                </div>

                {/* UNDER Row 1: Description spanning Image and Main columns (cols 1 & 2) */}
                <div className="col-start-1 col-span-2 block pr-2">
                  <p className="text-xs leading-tight text-slate-600 dark:text-slate-400 break-words [overflow-wrap:anywhere] line-clamp-2 mt-0.5">
                    {startup.description || startup.tagline}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Desktop Layout (>= lg): Individual rounded-3xl containers per startup */}
      <div className="hidden lg:flex lg:flex-col gap-2.5">
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
              className="relative w-[calc(100%-32px)] max-w-[1510px] mx-auto rounded-3xl bg-white dark:bg-[#161616] border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-[#1c1c1c] hover:border-slate-300 dark:hover:border-white/20 transition-colors duration-150 cursor-pointer group"
            >
              {/* Stretched Link overlay: Whole container clickable */}
              <Link
                href={`/startup/${startup.slug}`}
                className="absolute inset-0 z-10 rounded-3xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                aria-label={`View ${startup.name}`}
              />

              <div className="py-[16px] pl-6 pr-6 xl:pl-[56px] xl:pr-[61px] grid items-center grid-cols-[84px_90px_minmax(0,1fr)_100px_170px_96px_56px] xl:grid-cols-[100px_100px_minmax(0,1fr)_134px_295px_155px_60px] gap-4 xl:gap-6">
                {/* Col 1: Logo tile + name */}
                <div className="flex flex-col items-center justify-center gap-1 min-w-0 text-center">
                  <StartupLogo
                    name={startup.name}
                    category={startup.category}
                    logoType={startup.logoType}
                    logoColor={startup.logoColor}
                    className="!w-[44px] !h-[44px] p-1.5 rounded-xl text-sm"
                  />
                  <span
                    title={`${rank}. ${startup.name}`}
                    className="text-[11px] font-medium text-slate-700 dark:text-slate-300 line-clamp-1 break-words max-w-full text-center leading-tight group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors"
                  >
                    {rank}. {startup.name}
                  </span>
                </div>

                {/* Col 2: Startup Image Thumbnail (84x56 at lg, 92x62 at xl) */}
                <div className="flex justify-center min-w-0">
                  <div
                    className="relative w-[84px] h-[56px] xl:w-[92px] xl:h-[62px] rounded-lg overflow-hidden border border-slate-200/80 dark:border-white/10 shrink-0 shadow-2xs"
                    aria-label={`${startup.name} image`}
                  >
                    {hasImage ? (
                      <Image
                        src={rawImage!}
                        alt={startup.name}
                        fill
                        className="object-cover"
                        sizes="(min-width: 1280px) 92px, 84px"
                      />
                    ) : (
                      <div
                        className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${gradientClass} text-white`}
                      >
                        <ImageIcon className="w-4 h-4 opacity-90" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Col 3: Startup Idea Title + Description clamped to 2 lines */}
                <div className="min-w-0 pr-2">
                  <h4 className="font-semibold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors text-base line-clamp-1">
                    {startup.ideaTitle || startup.name}
                  </h4>
                  <p className="text-xs xl:text-sm leading-snug text-slate-600 dark:text-slate-400 break-words [overflow-wrap:anywhere] mt-0.5 line-clamp-2">
                    {startup.description || startup.tagline}
                  </p>
                </div>

                {/* Col 4: Category Pill */}
                <div className="min-w-0">
                  <Badge variant="brand" size="sm" className="max-w-full truncate">
                    {startup.category}
                  </Badge>
                </div>

                {/* Col 5: Country with Pin Icon, NO flag, no truncation, may wrap */}
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

                {/* Col 7: Like (heart + count) button right-aligned flush to right padding */}
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
          );
        })}
      </div>
    </>
  );
}
