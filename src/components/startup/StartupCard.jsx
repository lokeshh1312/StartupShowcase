import React from 'react';
import { Link } from 'react-router-dom';
import { VoteButton } from './VoteButton';
import { SaveButton } from './SaveButton';
import { StageBadge, SpecialBadge } from '../common/Badge';
import { IconResolver } from '../common/IconResolver';
import { ExternalLink, ArrowRight } from 'lucide-react';

export const StartupCard = ({ startup, layout = 'grid' }) => {
  if (!startup) return null;

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl bg-gradient-to-b from-[#101625] to-[#0D121F] border border-slate-800/80 hover:border-teal-500/40 shadow-lg shadow-black/20 hover:shadow-teal-500/5 transition-all duration-300 p-5 overflow-hidden">
      
      {/* Top subtle glow on hover */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-teal-500/0 to-transparent group-hover:via-teal-500/50 transition-all duration-500" />

      {/* Card Header */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3.5">
          {/* Logo & Info */}
          <Link to={`/startup/${startup.slug}`} className="flex items-center gap-3 group/link">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center border shadow-xs transition-transform duration-200 group-hover/link:scale-105 ${
              startup.logoBg || 'bg-teal-500/15 text-teal-400 border-teal-500/30'
            }`}>
              <IconResolver name={startup.iconName} className="w-5 h-5" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm text-white group-hover/link:text-teal-300 transition-colors">
                  {startup.name}
                </h3>
                {startup.isFeatured && <SpecialBadge type="featured" />}
                {startup.isEditorsPick && <SpecialBadge type="editors-pick" />}
                {startup.isUserSubmitted && <SpecialBadge type="submitted" />}
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                {startup.categoryName || startup.category}
              </p>
            </div>
          </Link>

          {/* Action buttons (Bookmark & Upvote) */}
          <div className="flex items-center gap-1.5 shrink-0">
            <SaveButton startup={startup} size="sm" />
            <VoteButton startup={startup} size="default" />
          </div>
        </div>

        {/* Tagline / Description */}
        <Link to={`/startup/${startup.slug}`} className="block">
          <p className="text-xs font-medium text-slate-200 line-clamp-2 leading-relaxed mb-1.5 group-hover:text-slate-100 transition-colors">
            {startup.tagline}
          </p>
          <p className="text-[11px] text-slate-400 line-clamp-2 leading-normal">
            {startup.description}
          </p>
        </Link>
      </div>

      {/* Card Footer: Badges & Details link */}
      <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <StageBadge stage={startup.stage} />
          {startup.pricing && (
            <span className="text-[10px] text-slate-400 px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800">
              {startup.pricing}
            </span>
          )}
        </div>

        <Link
          to={`/startup/${startup.slug}`}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 group-hover:text-teal-400 transition-colors"
        >
          <span>Explore</span>
          <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
};
