import React from 'react';
import { Link } from 'react-router-dom';
import { VoteButton } from './VoteButton';
import { SaveButton } from './SaveButton';
import { StageBadge, SpecialBadge } from '../common/Badge';
import { IconResolver } from '../common/IconResolver';
import { ArrowUpRight, MessageSquare } from 'lucide-react';
import { useStartups } from '../../context/StartupsContext';

export const StartupListRow = ({ startup }) => {
  const { commentsMap } = useStartups();
  const comments = commentsMap[startup.slug] || [];

  if (!startup) return null;

  return (
    <div className="group relative flex items-center justify-between gap-4 p-4 rounded-2xl bg-[#0E1321] hover:bg-[#12192B] border border-slate-800/80 hover:border-teal-500/30 transition-all duration-200">
      
      {/* Left: Logo, Details */}
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        <Link to={`/startup/${startup.slug}`} className="shrink-0">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shadow-xs transition-transform duration-200 group-hover:scale-105 ${
            startup.logoBg || 'bg-teal-500/15 text-teal-400 border-teal-500/30'
          }`}>
            <IconResolver name={startup.iconName} className="w-5 h-5" />
          </div>
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Link 
              to={`/startup/${startup.slug}`}
              className="font-semibold text-sm text-white group-hover:text-teal-300 transition-colors truncate"
            >
              {startup.name}
            </Link>
            <StageBadge stage={startup.stage} />
            {startup.isFeatured && <SpecialBadge type="featured" />}
            {startup.isEditorsPick && <SpecialBadge type="editors-pick" />}
          </div>

          <p className="text-xs text-slate-300 line-clamp-1 leading-snug">
            {startup.tagline}
          </p>

          <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-400 flex-wrap">
            <span className="font-medium text-teal-400/90">{startup.categoryName}</span>
            <span>•</span>
            <span>{startup.pricing}</span>
            {comments.length > 0 && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1 text-slate-400">
                  <MessageSquare className="w-3 h-3" />
                  {comments.length}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <SaveButton startup={startup} size="sm" />
        <VoteButton startup={startup} size="default" />
      </div>
    </div>
  );
};
