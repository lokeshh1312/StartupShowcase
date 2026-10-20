import React from 'react';
import { Link } from 'react-router-dom';
import { IconResolver } from '../common/IconResolver';
import { ArrowRight, Flame } from 'lucide-react';

export const CategoryCard = ({ category }) => {
  return (
    <Link
      to={`/browse/${category.slug}`}
      className="group relative flex flex-col justify-between p-5 rounded-2xl bg-gradient-to-b from-[#101524] to-[#0C101C] border border-slate-800/80 hover:border-teal-500/40 shadow-lg shadow-black/20 hover:shadow-teal-500/5 transition-all duration-300"
    >
      <div>
        <div className="flex items-start justify-between mb-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-transform duration-200 group-hover:scale-105 ${category.color}`}>
            <IconResolver name={category.iconName} className="w-5 h-5" />
          </div>

          <div className="flex items-center gap-1.5">
            {category.trending && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/25">
                <Flame className="w-2.5 h-2.5" />
                Hot
              </span>
            )}
            <span className="text-xs font-mono font-medium text-slate-400 px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800">
              {category.count} startups
            </span>
          </div>
        </div>

        <h3 className="font-semibold text-base text-white group-hover:text-teal-300 transition-colors mb-1.5">
          {category.name}
        </h3>

        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
          {category.description}
        </p>

        {/* Subcategories tags */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {category.subcategories.slice(0, 3).map((sub) => (
            <span
              key={sub}
              className="text-[10px] px-2 py-0.5 rounded-md bg-slate-900/80 text-slate-300 border border-slate-800"
            >
              {sub}
            </span>
          ))}
          {category.subcategories.length > 3 && (
            <span className="text-[10px] text-slate-500 font-mono">
              +{category.subcategories.length - 3} more
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs font-medium text-slate-400 group-hover:text-teal-400 transition-colors">
        <span>Explore Directory</span>
        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
};
