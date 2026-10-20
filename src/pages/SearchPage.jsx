import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useStartups } from '../context/StartupsContext';
import { CATEGORIES } from '../data/categories';
import { StartupCard } from '../components/startup/StartupCard';
import { StartupListRow } from '../components/startup/StartupListRow';
import { Search, Filter, X, SlidersHorizontal, RotateCcw, LayoutGrid, List, Sparkles, Check, ChevronDown } from 'lucide-react';

export const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { startups } = useStartups();

  // Read URL query params
  const qParam = searchParams.get('q') || '';
  const catParam = searchParams.get('cat') || 'all';
  const stageParam = searchParams.get('stage') || 'all';
  const pricingParam = searchParams.get('pricing') || 'all';
  const sortParam = searchParams.get('sort') || 'trending';

  // Local state initialized from params
  const [query, setQuery] = useState(qParam);
  const [category, setCategory] = useState(catParam);
  const [stage, setStage] = useState(stageParam);
  const [pricing, setPricing] = useState(pricingParam);
  const [sortBy, setSortBy] = useState(sortParam);
  const [recency, setRecency] = useState('all'); // 'all' | 'today' | 'week'
  const [viewMode, setViewMode] = useState('grid');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Sync state when URL params change
  useEffect(() => {
    setQuery(qParam);
    setCategory(catParam);
    setStage(stageParam);
    setPricing(pricingParam);
    setSortBy(sortParam);
  }, [qParam, catParam, stageParam, pricingParam, sortParam]);

  // Update URL params
  const updateParams = (newParams) => {
    const updated = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([key, val]) => {
      if (!val || val === 'all') {
        updated.delete(key);
      } else {
        updated.set(key, val);
      }
    });
    setSearchParams(updated);
  };

  const handleQueryChange = (val) => {
    setQuery(val);
    updateParams({ q: val });
  };

  const handleCategoryChange = (val) => {
    setCategory(val);
    updateParams({ cat: val });
  };

  const handleStageChange = (val) => {
    setStage(val);
    updateParams({ stage: val });
  };

  const handlePricingChange = (val) => {
    setPricing(val);
    updateParams({ pricing: val });
  };

  const handleSortChange = (val) => {
    setSortBy(val);
    updateParams({ sort: val });
  };

  const clearAllFilters = () => {
    setQuery('');
    setCategory('all');
    setStage('all');
    setPricing('all');
    setSortBy('trending');
    setRecency('all');
    setSearchParams({});
  };

  // Active filters calculation
  const hasActiveFilters = query.trim() !== '' || category !== 'all' || stage !== 'all' || pricing !== 'all' || recency !== 'all';

  // Filter & Sort Logic
  const filteredResults = useMemo(() => {
    let results = startups.filter((item) => {
      // Query search
      if (query.trim()) {
        const q = query.toLowerCase().trim();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesTagline = item.tagline.toLowerCase().includes(q);
        const matchesDesc = item.description.toLowerCase().includes(q);
        const matchesCategory = item.categoryName?.toLowerCase().includes(q);
        const matchesTags = item.tags?.some(t => t.toLowerCase().includes(q));
        if (!matchesName && !matchesTagline && !matchesDesc && !matchesCategory && !matchesTags) {
          return false;
        }
      }

      // Category filter
      if (category !== 'all' && item.category !== category) {
        return false;
      }

      // Stage filter
      if (stage !== 'all') {
        const itemStage = item.stage.toLowerCase();
        if (stage === 'beta' && !itemStage.includes('beta')) return false;
        if (stage === 'alpha' && !itemStage.includes('alpha')) return false;
        if (stage === 'launched' && !itemStage.includes('launch')) return false;
        if (stage === 'waitlist' && !itemStage.includes('waitlist')) return false;
      }

      // Pricing filter
      if (pricing !== 'all') {
        const itemPricing = (item.pricing || '').toLowerCase();
        if (pricing === 'free' && !itemPricing.includes('free')) return false;
        if (pricing === 'subscription' && !itemPricing.includes('sub')) return false;
        if (pricing === 'opensource' && !itemPricing.includes('open')) return false;
      }

      // Recency filter
      if (recency === 'today' && !item.dateLabel?.includes('Today')) {
        return false;
      }
      if (recency === 'week') {
        // Mock filter for last 7 days
        const launchDate = new Date(item.launchDate);
        const daysDiff = (new Date() - launchDate) / (1000 * 60 * 60 * 24);
        if (daysDiff > 7) return false;
      }

      return true;
    });

    // Sort logic
    if (sortBy === 'trending') {
      results.sort((a, b) => b.upvotes - a.upvotes);
    } else if (sortBy === 'newest') {
      results.sort((a, b) => new Date(b.launchDate) - new Date(a.launchDate));
    } else if (sortBy === 'name') {
      results.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'views') {
      results.sort((a, b) => b.views - a.views);
    }

    return results;
  }, [startups, query, category, stage, pricing, recency, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header & Search Bar */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Plus_Jakarta_Sans',sans-serif]">
            Search & Filter Startups
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time filter engine across names, technical stacks, product tags, and launch stages.
          </p>
        </div>

        {/* Global Search Input */}
        <div className="relative">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Type startup name, 'autonomous agents', 'postgres', 'local LLM'..."
            className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-[#0F1524] border border-slate-800 focus:border-teal-500/70 focus:bg-slate-900 focus:outline-none text-sm text-slate-100 placeholder:text-slate-500 shadow-xl shadow-black/40"
          />
          {query && (
            <button
              onClick={() => handleQueryChange('')}
              className="absolute right-3.5 top-3.5 p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Filters Sidebar + Results */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* DESKTOP SIDEBAR FILTERS */}
        <div className="hidden lg:block space-y-6">
          <div className="p-5 rounded-2xl bg-[#0E1321] border border-slate-800/90 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-teal-400" />
                Refine Search
              </span>
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="text-[11px] text-teal-400 hover:text-teal-300 font-medium flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset all
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Category</label>
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:border-teal-500 focus:outline-none"
              >
                <option value="all">All Categories</option>
                {CATEGORIES.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Launch Stage Filter */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Product Stage</label>
              <div className="space-y-1 text-xs">
                {[
                  { id: 'all', label: 'All Stages' },
                  { id: 'beta', label: 'Public Beta' },
                  { id: 'alpha', label: 'Private Alpha' },
                  { id: 'launched', label: 'Launched (GA)' },
                  { id: 'waitlist', label: 'Waitlist' }
                ].map((s) => (
                  <label key={s.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-800/60 cursor-pointer">
                    <input
                      type="radio"
                      name="stage_filter"
                      checked={stage === s.id}
                      onChange={() => handleStageChange(s.id)}
                      className="accent-teal-500"
                    />
                    <span className="text-slate-300">{s.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Pricing Filter */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Pricing Model</label>
              <div className="space-y-1 text-xs">
                {[
                  { id: 'all', label: 'Any Pricing' },
                  { id: 'free', label: 'Free / Freemium' },
                  { id: 'subscription', label: 'Subscription / SaaS' },
                  { id: 'opensource', label: 'Open Source' }
                ].map((p) => (
                  <label key={p.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-800/60 cursor-pointer">
                    <input
                      type="radio"
                      name="pricing_filter"
                      checked={pricing === p.id}
                      onChange={() => handlePricingChange(p.id)}
                      className="accent-teal-500"
                    />
                    <span className="text-slate-300">{p.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Recency Filter */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Launch Recency</label>
              <div className="space-y-1 text-xs">
                {[
                  { id: 'all', label: 'All Time' },
                  { id: 'today', label: 'Today Only' },
                  { id: 'week', label: 'Past 7 Days' }
                ].map((r) => (
                  <label key={r.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-800/60 cursor-pointer">
                    <input
                      type="radio"
                      name="recency_filter"
                      checked={recency === r.id}
                      onChange={() => setRecency(r.id)}
                      className="accent-teal-500"
                    />
                    <span className="text-slate-300">{r.label}</span>
                  </label>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* RESULTS COLUMN */}
        <div className="lg:col-span-3 space-y-5">
          
          {/* Controls Bar: Active filters & sorting */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
            
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setMobileFilterOpen(true)}
                className="lg:hidden px-3 py-1.5 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700"
              >
                <Filter className="w-3.5 h-3.5 text-teal-400" />
                <span>Filters {hasActiveFilters && '•'}</span>
              </button>

              <div className="text-xs text-slate-300 font-mono">
                Showing <strong className="text-teal-400">{filteredResults.length}</strong> {filteredResults.length === 1 ? 'startup' : 'startups'}
              </div>

              {/* Active filter badges */}
              {query && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] bg-teal-500/10 text-teal-300 border border-teal-500/25">
                  &quot;{query}&quot;
                  <X className="w-3 h-3 cursor-pointer" onClick={() => handleQueryChange('')} />
                </span>
              )}
              {category !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] bg-teal-500/10 text-teal-300 border border-teal-500/25">
                  Cat: {category}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => handleCategoryChange('all')} />
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto">
              {/* Sort by */}
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span>Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                >
                  <option value="trending">Most Upvoted</option>
                  <option value="newest">Newest Launch</option>
                  <option value="views">Most Viewed</option>
                  <option value="name">Alphabetical</option>
                </select>
              </div>

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

          {/* Results Grid / List */}
          {filteredResults.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-[#0E1321] border border-slate-800 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400 mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">No startups found matching your filters</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Try searching for broader terms like &quot;AI&quot;, &quot;Database&quot;, &quot;Developer Tools&quot;, or clear active category filters.
              </p>
              <div className="pt-2">
                <button
                  onClick={clearAllFilters}
                  className="px-4 py-2 rounded-xl bg-teal-500 text-slate-950 text-xs font-bold hover:bg-teal-400 transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredResults.map((startup) => (
                <StartupCard key={startup.id} startup={startup} />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredResults.map((startup) => (
                <StartupListRow key={startup.id} startup={startup} />
              ))}
            </div>
          )}

        </div>

      </div>

      {/* MOBILE FILTER MODAL DRAWER */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-t-3xl sm:rounded-2xl bg-[#0E1321] border border-slate-800 p-6 space-y-5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">Filter Startups</h3>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">Category</label>
                <select
                  value={category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200"
                >
                  <option value="all">All Categories</option>
                  {CATEGORIES.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">Stage</label>
                <select
                  value={stage}
                  onChange={(e) => handleStageChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200"
                >
                  <option value="all">All Stages</option>
                  <option value="beta">Public Beta</option>
                  <option value="alpha">Private Alpha</option>
                  <option value="launched">Launched</option>
                  <option value="waitlist">Waitlist</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">Pricing</label>
                <select
                  value={pricing}
                  onChange={(e) => handlePricingChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200"
                >
                  <option value="all">Any Pricing</option>
                  <option value="free">Free / Freemium</option>
                  <option value="subscription">Subscription</option>
                  <option value="opensource">Open Source</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
              <button
                onClick={clearAllFilters}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Reset All
              </button>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="px-6 py-2 rounded-xl bg-teal-500 text-slate-950 font-bold text-xs"
              >
                Apply Filters ({filteredResults.length})
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
