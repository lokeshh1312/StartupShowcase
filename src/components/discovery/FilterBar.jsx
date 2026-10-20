import React, { useState } from 'react';
import { Search, X, Filter, ArrowUpDown, ChevronDown, RotateCcw } from 'lucide-react';
import { CATEGORIES_LIST, STAGES_LIST, INDIAN_STATES } from '../../data/startups';

export const FilterBar = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedLocation,
  onLocationChange,
  selectedStage,
  onStageChange,
  sortBy,
  onSortChange,
  totalResults,
  onResetFilters
}) => {
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);

  const hasActiveFilters = 
    Boolean(searchQuery.trim()) || 
    selectedCategory !== 'All' || 
    selectedLocation !== 'All' || 
    selectedStage !== 'All Stages' || 
    sortBy !== 'rank';

  return (
    <div className="w-full space-y-3 mb-4">
      {/* Search and Quick Filter Control Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200/90 shadow-xs">
        
        {/* Left: Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Filter startups by idea, category, state, or keywords..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 bg-slate-50/70 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/50"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Right: Category, Location, Stage & Sort dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Dropdown */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="appearance-none pl-3 pr-7 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer shadow-2xs"
            >
              <option value="All">All Categories</option>
              {CATEGORIES_LIST.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Location Dropdown */}
          <div className="relative">
            <select
              value={selectedLocation}
              onChange={(e) => onLocationChange(e.target.value)}
              className="appearance-none pl-3 pr-7 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer shadow-2xs"
            >
              <option value="All">All Locations</option>
              {INDIAN_STATES.map((state) => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Stage Dropdown */}
          <div className="relative">
            <select
              value={selectedStage}
              onChange={(e) => onStageChange(e.target.value)}
              className="appearance-none pl-3 pr-7 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer shadow-2xs"
            >
              {STAGES_LIST.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="appearance-none pl-3 pr-7 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer shadow-2xs"
            >
              <option value="rank">Highest Ranked</option>
              <option value="likes">Most Liked</option>
              <option value="views">Most Viewed</option>
              <option value="alphabetical">Alphabetical (A-Z)</option>
            </select>
            <ArrowUpDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="flex items-center gap-1 px-2.5 py-2 text-xs font-medium text-slate-600 hover:text-red-600 bg-slate-100 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Results summary bar */}
      <div className="flex items-center justify-between px-1 text-xs text-slate-500">
        <span>
          Showing <strong className="text-slate-800 font-semibold">{totalResults}</strong> {totalResults === 1 ? 'startup' : 'startups'}
        </span>
        {hasActiveFilters && (
          <span className="text-blue-600 font-medium">
            Active filters applied
          </span>
        )}
      </div>
    </div>
  );
};
