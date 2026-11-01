import React from "react";
import Link from "next/link";
import { ArrowRight, MapPin, Eye } from "lucide-react";
import { StartupLogo } from "@/components/common/startup-logo";
import { Badge, StageBadge } from "@/components/common/badge";
import { VoteButton } from "@/components/startup/vote-button";
import { SaveButton } from "@/components/startup/save-button";
import { getCountryName } from "@/lib/validation";
import type { FormattedStartup } from "@/server/startups";

interface StartupCardProps {
  startup: FormattedStartup;
  priority?: boolean;
}

export function StartupCard({ startup }: StartupCardProps) {
  const countryName = getCountryName(startup.countryCode);

  return (
    <article className="group relative flex flex-col justify-between rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200/90 dark:border-white/10 hover:border-brand-500/50 dark:hover:border-white/20 shadow-xs dark:shadow-none hover:shadow-md transition-all duration-300 p-5 overflow-hidden">
      {/* Top subtle highlight */}
      <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-brand-500/0 to-transparent group-hover:via-brand-500 transition-all duration-500" />

      {/* Main Content */}
      <div className="space-y-3.5">
        <div className="flex items-start justify-between gap-3">
          {/* Logo & Title */}
          <Link
            href={`/startup/${startup.slug}`}
            className="flex items-center gap-3.5 group/link min-w-0"
          >
            <StartupLogo
              name={startup.name}
              category={startup.category}
              logoType={startup.logoType}
              logoColor={startup.logoColor}
              logoUrl={startup.thumbnail || undefined}
              size="md"
            />
            <div className="min-w-0">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover/link:text-brand-600 dark:group-hover/link:text-brand-400 transition-colors truncate">
                {startup.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                {startup.ideaTitle || startup.category}
              </p>
            </div>
          </Link>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <SaveButton
              startupIdOrSlug={startup.slug}
              initialSaved={startup.isSaved}
              startupName={startup.name}
              size="sm"
            />
            <VoteButton
              startupIdOrSlug={startup.slug}
              initialLikes={startup.likes}
              initialLiked={startup.isLiked}
              startupName={startup.name}
              size="default"
            />
          </div>
        </div>

        {/* Tagline & Description */}
        <Link href={`/startup/${startup.slug}`} className="block group/desc">
          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-1 mb-1 group-hover/desc:text-brand-600 dark:group-hover/desc:text-brand-400 transition-colors">
            {startup.tagline || startup.ideaTitle}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {startup.description}
          </p>
        </Link>
      </div>

      {/* Footer Badges & Metadata */}
      <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge variant="brand" size="sm">
            {startup.category}
          </Badge>
          <StageBadge stage={startup.stage} />
          <span
            className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400"
            title={`Based in ${countryName}`}
          >
            <MapPin className="w-3 h-3 text-slate-400" />
            <span>{startup.countryCode}</span>
          </span>
          <span
            className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-mono"
            title="Total Views"
          >
            <Eye className="w-3 h-3 text-slate-400" />
            <span>{startup.views}</span>
          </span>
        </div>

        <Link
          href={`/startup/${startup.slug}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors shrink-0"
        >
          <span>Explore</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </article>
  );
}
