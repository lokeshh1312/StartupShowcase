import React from 'react';
import { Bookmark } from 'lucide-react';
import { useStartups } from '../../context/StartupsContext';

export const SaveButton = ({ startup, size = 'default', className = '' }) => {
  const { toggleSave, isSaved } = useStartups();
  const saved = isSaved(startup.id);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleSave(startup.id);
  };

  const isSmall = size === 'sm';

  return (
    <button
      onClick={handleClick}
      type="button"
      className={`relative inline-flex items-center justify-center rounded-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 active:scale-90 ${
        isSmall ? 'p-1.5' : 'p-2'
      } ${
        saved
          ? 'text-teal-400 bg-teal-500/15 border border-teal-500/30'
          : 'text-slate-400 hover:text-white bg-slate-800/40 hover:bg-slate-800 border border-transparent hover:border-slate-700/60'
      } ${className}`}
      title={saved ? 'Remove from Saved' : 'Save / Bookmark startup'}
      aria-label={saved ? `Unsave ${startup.name}` : `Save ${startup.name}`}
    >
      <Bookmark
        className={`${isSmall ? 'w-3.5 h-3.5' : 'w-4 h-4'} transition-all ${
          saved ? 'fill-teal-400 stroke-teal-400' : 'stroke-[1.8]'
        }`}
      />
    </button>
  );
};
