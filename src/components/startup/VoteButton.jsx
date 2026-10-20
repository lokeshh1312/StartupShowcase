import React from 'react';
import { ChevronUp } from 'lucide-react';
import { useStartups } from '../../context/StartupsContext';

export const VoteButton = ({ startup, size = 'default', className = '' }) => {
  const { toggleUpvote, isUpvoted } = useStartups();
  const upvoted = isUpvoted(startup.id);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleUpvote(startup.id);
  };

  const isSmall = size === 'sm';
  const isLarge = size === 'lg';

  return (
    <button
      onClick={handleClick}
      type="button"
      className={`group/vote flex items-center justify-center transition-all duration-200 select-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 active:scale-95 ${
        isLarge
          ? 'flex-col gap-1 px-4 py-2.5 rounded-xl min-w-[70px]'
          : isSmall
          ? 'gap-1 px-2 py-1 rounded-lg text-xs'
          : 'flex-col gap-0.5 px-3 py-2 rounded-xl min-w-[56px] text-xs'
      } ${
        upvoted
          ? 'bg-gradient-to-b from-teal-500/25 to-teal-500/10 text-teal-300 border border-teal-500/50 shadow-sm shadow-teal-500/20'
          : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/70 hover:border-slate-600'
      } ${className}`}
      title={upvoted ? 'Upvoted! Click to undo' : 'Upvote this startup'}
      aria-label={`Upvote ${startup.name}, currently ${startup.upvotes} upvotes`}
    >
      <ChevronUp
        className={`transition-transform duration-200 group-hover/vote:-translate-y-0.5 ${
          isLarge ? 'w-5 h-5' : isSmall ? 'w-3.5 h-3.5' : 'w-4 h-4'
        } ${upvoted ? 'text-teal-400 fill-teal-400/20 stroke-[2.5]' : 'text-slate-400 group-hover/vote:text-white'}`}
      />
      <span
        className={`font-semibold font-mono tracking-tight ${
          isLarge ? 'text-base font-bold' : isSmall ? 'text-[11px]' : 'text-xs'
        } ${upvoted ? 'text-teal-300' : 'text-slate-300 group-hover/vote:text-white'}`}
      >
        {startup.upvotes}
      </span>
    </button>
  );
};
