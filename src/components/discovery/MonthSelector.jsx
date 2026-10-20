import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useStartups } from '../../context/StartupsContext';

export const MonthSelector = () => {
  const { availableMonths, activeMonth, setActiveMonth } = useStartups();

  const currentIndex = availableMonths.findIndex(m => m.id === activeMonth);
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < availableMonths.length - 1;

  const handlePrev = () => {
    if (canGoPrev) {
      setActiveMonth(availableMonths[currentIndex - 1].id);
    }
  };

  const handleNext = () => {
    if (canGoNext) {
      setActiveMonth(availableMonths[currentIndex + 1].id);
    }
  };

  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-start gap-3 sm:gap-4 overflow-x-auto no-scrollbar py-2">
        
        {/* Previous Month Button */}
        <button
          type="button"
          onClick={handlePrev}
          disabled={!canGoPrev}
          className={`flex items-center justify-center w-10 h-10 rounded-full border bg-white shadow-xs transition-all flex-shrink-0 ${
            canGoPrev
              ? 'text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50 active:scale-95 cursor-pointer'
              : 'text-slate-300 border-slate-100 cursor-not-allowed opacity-50'
          }`}
          aria-label="Previous month"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Month Cards */}
        <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
          {availableMonths.map((m) => {
            const isActive = m.id === activeMonth;
            return (
              <div key={m.id} className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => setActiveMonth(m.id)}
                  className={`flex flex-col items-center justify-center min-w-[130px] sm:min-w-[160px] md:min-w-[180px] px-5 py-2.5 rounded-xl transition-all cursor-pointer select-none text-center shadow-xs active:scale-[0.98] ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-blue-500/10'
                      : 'bg-white border border-slate-200 hover:border-slate-300 text-slate-800 hover:bg-slate-50/80'
                  }`}
                >
                  <span className={`text-xs sm:text-sm font-semibold tracking-tight ${isActive ? 'text-white' : 'text-slate-900'}`}>
                    {m.label}
                  </span>
                  <span className={`text-[11px] mt-0.5 font-normal ${isActive ? 'text-blue-100' : 'text-slate-500'}`}>
                    {m.ideasCount} ideas
                  </span>
                </button>

                {/* Active Indicator Bar beneath the card matching screenshot */}
                <div className="h-1.5 mt-1.5 flex items-center justify-center w-full">
                  {isActive && (
                    <span className="w-9 h-1 bg-blue-600 rounded-full animate-in fade-in zoom-in-75 duration-200" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Next Month Button */}
        <button
          type="button"
          onClick={handleNext}
          disabled={!canGoNext}
          className={`flex items-center justify-center w-10 h-10 rounded-full border bg-white shadow-xs transition-all flex-shrink-0 ${
            canGoNext
              ? 'text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50 active:scale-95 cursor-pointer'
              : 'text-slate-300 border-slate-100 cursor-not-allowed opacity-50'
          }`}
          aria-label="Next month"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
