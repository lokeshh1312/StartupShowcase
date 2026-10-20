import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Flame } from 'lucide-react';
import { TRENDING_TAGS } from '../../data/categories';

export const TrendingChips = ({ selectedTag = 'All', onSelectTag }) => {
  const scrollContainerRef = useRef(null);

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const offset = direction === 'left' ? -220 : 220;
      scrollContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative flex items-center gap-1.5 w-full py-1">
      {/* Scroll Left Button */}
      <button
        onClick={() => scroll('left')}
        type="button"
        className="hidden md:flex shrink-0 p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
        aria-label="Scroll topics left"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Chips Container */}
      <div
        ref={scrollContainerRef}
        className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-1 px-0.5"
      >
        {TRENDING_TAGS.map((tag) => {
          const isSelected = selectedTag === tag;
          return (
            <button
              key={tag}
              onClick={() => onSelectTag(tag)}
              type="button"
              className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 select-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 ${
                isSelected
                  ? 'bg-teal-500 text-slate-950 font-semibold shadow-md shadow-teal-500/20'
                  : 'bg-slate-900/90 hover:bg-slate-800/90 text-slate-300 hover:text-white border border-slate-800/80 hover:border-slate-700'
              }`}
            >
              {tag === 'All' && <Flame className={`w-3.5 h-3.5 ${isSelected ? 'text-slate-950' : 'text-teal-400'}`} />}
              <span>{tag}</span>
            </button>
          );
        })}
      </div>

      {/* Scroll Right Button */}
      <button
        onClick={() => scroll('right')}
        type="button"
        className="hidden md:flex shrink-0 p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
        aria-label="Scroll topics right"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};
