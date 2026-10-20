import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Compass, Sparkles, Filter, ChevronRight, Layers, Flame } from 'lucide-react';
import { CATEGORIES } from '../data/categories';
import { CategoryCard } from '../components/discovery/CategoryCard';
import { useStartups } from '../context/StartupsContext';

export const BrowsePage = () => {
  const { startups } = useStartups();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'trending' | 'high_count'

  // Filter categories
  const filteredCategories = useMemo(() => {
    return CATEGORIES.filter(cat => {
      const matchesSearch = cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cat.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cat.subcategories.some(sub => sub.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchesSearch) return false;
      if (filterType === 'trending') return cat.trending;
      if (filterType === 'high_count') return cat.count > 60;
      return true;
    });
  }, [searchTerm, filterType]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Header */}
      <div className="space-y-4 max-w-3xl">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/25 text-teal-400 text-xs font-semibold">
          <Compass className="w-3.5 h-3.5" />
          <span>LaunchSpace Category Explorer</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-['Plus_Jakarta_Sans',sans-serif]">
          Browse Startups by Technical Domain
        </h1>

        <p className="text-sm text-slate-300 leading-relaxed">
          Navigate deep taxonomies of cutting-edge software. Every category contains verified early-stage betas, founder interviews, and community benchmarks.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search categories (e.g., 'Autonomous Agents', 'Databases')..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 focus:border-teal-500/70 focus:outline-none text-xs text-slate-100 placeholder:text-slate-500"
          />
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: 'All Categories' },
            { id: 'trending', label: 'Trending Only', icon: Flame },
            { id: 'high_count', label: 'Largest Directories' }
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => setFilterType(btn.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium shrink-0 transition-colors ${
                filterType === btn.id
                  ? 'bg-teal-500 text-slate-950 font-semibold'
                  : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {filteredCategories.map((category) => (
          <CategoryCard key={category.id} category={category} />
        ))}
      </div>

      {filteredCategories.length === 0 && (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-400 space-y-2">
          <p className="text-sm">No categories matched &quot;{searchTerm}&quot;.</p>
          <button
            onClick={() => { setSearchTerm(''); setFilterType('all'); }}
            className="text-xs text-teal-400 hover:underline"
          >
            Clear category filters
          </button>
        </div>
      )}

      {/* Directory Quick Jump */}
      <div className="p-6 rounded-2xl bg-[#0D121F] border border-slate-800 space-y-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Layers className="w-4 h-4 text-teal-400" />
          <span>All Sub-Taxonomies at a Glance</span>
        </h3>

        <div className="flex flex-wrap gap-2">
          {CATEGORIES.flatMap(c => c.subcategories).map((sub) => (
            <Link
              key={sub}
              to={`/search?q=${encodeURIComponent(sub)}`}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-teal-300 transition-colors"
            >
              #{sub}
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
};
