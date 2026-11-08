import React from "react";
import Link from "next/link";
import Image from "next/image";
import { StartupLogo } from "@/components/common/startup-logo";
import { Badge, StageBadge } from "@/components/common/badge";
import { VoteButton } from "@/components/startup/vote-button";
import { CountryFlag } from "@/components/common/country-flag";
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
    );
  }

  return (
    <>
      {/* Mobile Layout (< lg): BetaList-style edge-to-edge cards */}
      <ul className="lg:hidden -mx-4 sm:-mx-6 flex flex-col gap-2">
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

      {/* Desktop Layout (>= lg): Preserved <table> wrapped in About-style translucent card */}
      <div className="hidden lg:block w-full rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white/90 dark:bg-white/[0.03] shadow-xs backdrop-blur-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] border-collapse text-left">
            <thead>
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
                    className="group relative transition-colors hover:bg-slate-50/70 dark:hover:bg-white/[0.03]"
                  >
                    {/* Logo + Name underneath ("<rank>. <name>") */}
                    <td className="py-4 px-2 w-24 text-center align-top">
                      <Link
                        href={`/startup/${startup.slug}`}
                        className="inline-flex flex-col items-center gap-1.5 group/logo focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-lg p-0.5 max-w-full"
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
                          className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 line-clamp-2 break-words max-w-[96px] group-hover/logo:text-brand-600 dark:group-hover/logo:text-brand-400 transition-colors text-center"
                        >
                          {rank}. {startup.name}
                        </span>
                      </Link>
                    </td>

                    {/* Startup Image Thumbnail (w-20 h-14, sizes="80px") */}
                    <td className="py-4 px-2 w-24 text-center align-top">
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
                    <td className="py-4 px-3 align-top">
                      <Link
                        href={`/startup/${startup.slug}`}
                        className="block group/idea focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-lg"
                      >
                        <h4 className="font-bold text-slate-900 dark:text-white group-hover/idea:text-brand-600 dark:group-hover/idea:text-brand-400 transition-colors text-sm line-clamp-1">
                          {startup.ideaTitle || startup.name}
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-line break-words [overflow-wrap:anywhere] mt-1.5 leading-relaxed">
                          {startup.description || startup.tagline}
                        </p>
                      </Link>
                    </td>

                    {/* Category Pill */}
                    <td className="py-4 px-2.5 w-32 align-top">
                      <Badge variant="brand" size="sm">
                        {startup.category}
                      </Badge>
                    </td>

                    {/* Country with Pin Icon */}
                    <td className="py-4 px-2.5 w-32 align-top text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      <div
                        className="inline-flex items-center gap-1.5"
                        title={country}
                      >
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">
                          {country}
                        </span>
                      </div>
                    </td>

                    {/* Stage Pill */}
                    <td className="py-4 px-2.5 w-28 align-top">
                      <StageBadge stage={startup.stage} />
                    </td>

                    {/* Like Button + Chevron Link */}
                    <td className="py-4 pl-2 pr-6 w-28 text-right align-top">
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
    </>
  );
}
