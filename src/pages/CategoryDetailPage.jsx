import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CATEGORIES } from '../data/categories';
import { useStartups } from '../context/StartupsContext';
import { StartupCard } from '../components/startup/StartupCard';
import { StartupListRow } from '../components/startup/StartupListRow';
import { IconResolver } from '../components/common/IconResolver';
import { ArrowLeft, LayoutGrid, List, Sparkles, Filter, ChevronRight } from 'lucide-react';

export const CategoryDetailPage = () => {
  const { categorySlug } = useParams();
  const { startups } = useStartups();

  const [selectedSub, setSelectedSub] = useState('All');
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('upvotes');

  const category = useMemo(() => {
    return CATEGORIES.find(c => c.slug === categorySlug) || CATEGORIES[0];
  }, [categorySlug]);

  const categoryStartups = useMemo(() => {
    let list = startups.filter(s => s.category === category.id || s.category === categorySlug);
    
    if (selectedSub !== 'All') {
      list = list.filter(s => s.subcategory === selectedSub || s.tags?.includes(selectedSub));
    }

    if (sortBy === 'upvotes') {
      list.sort((a, b) => b.upvotes - a.upvotes);
    } else if (sortBy === 'newest') {
      list.sort((a, b) => new Date(b.launchDate) - new Date(a.launchDate));
    } else if (sortBy === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }

    return list;
  }, [startups, category, categorySlug, selectedSub, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Breadcrumb navigation */}
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Link to="/" className="hover:text-white transition-colors">Home</Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
        <Link to="/browse" className="hover:text-white transition-colors">Browse</Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
        <span className="text-teal-400 font-medium">{category.name}</span>
      </div>

      {/* Category Hero Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-[#101625] via-[#0E1320] to-[#0A0D15] border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-lg ${category.color}`}>
            <IconResolver name={category.iconName} className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Plus_Jakarta_Sans',sans-serif]">
              {category.name}
            </h1>
            <p className="text-xs font-mono text-slate-400 mt-0.5">
              Curated Index • {categoryStartups.length} products listed
            </p>
          </div>
        </div>

        <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
          {category.description}
        </p>

        {/* Subcategory filter pills */}
        <div className="pt-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSelectedSub('All')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium shrink-0 transition-colors ${
              selectedSub === 'All'
                ? 'bg-teal-500 text-slate-950 font-semibold'
                : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            All Subcategories
          </button>
          {category.subcategories.map((sub) => (
            <button
              key={sub}
              onClick={() => setSelectedSub(sub)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium shrink-0 transition-colors ${
                selectedSub === sub
                  ? 'bg-teal-500 text-slate-950 font-semibold'
                  : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="text-xs text-slate-400 font-mono">
          Showing <span className="text-white font-bold">{categoryStartups.length}</span> startups in {category.name}
        </div>

        <div className="flex items-center gap-3">
          {/* Sorting */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
          >
            <option value="upvotes">Most Upvoted</option>
            <option value="newest">Newest Launch</option>
            <option value="name">Alphabetical</option>
          </select>

          {/* View toggle */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs ${viewMode === 'grid' ? 'bg-slate-800 text-teal-400' : 'text-slate-500'}`}
              title="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs ${viewMode === 'list' ? 'bg-slate-800 text-teal-400' : 'text-slate-500'}`}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Startups List */}
      {categoryStartups.length === 0 ? (
        <div className="p-16 text-center rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3">
          <p className="text-sm text-slate-300">No startups currently listed under &quot;{selectedSub}&quot;.</p>
          <button
            onClick={() => setSelectedSub('All')}
            className="text-xs font-semibold px-4 py-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/25"
          >
            Reset to All {category.name}
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {categoryStartups.map((startup) => (
            <StartupCard key={startup.id} startup={startup} />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {categoryStartups.map((startup) => (
            <StartupListRow key={startup.id} startup={startup} />
          ))}
        </div>
      )}

    </div>
  );
};
