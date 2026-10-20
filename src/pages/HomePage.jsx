import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStartups } from '../context/StartupsContext';
import { MonthSelector } from '../components/discovery/MonthSelector';
import { FilterBar } from '../components/discovery/FilterBar';
import { LeaderboardTable } from '../components/startup/LeaderboardTable';

export const HomePage = ({ headerSearchQuery = '' }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { startups, activeMonth, loading } = useStartups();

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || headerSearchQuery || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('cat') || 'All');
  const [selectedLocation, setSelectedLocation] = useState(searchParams.get('loc') || 'All');
  const [selectedStage, setSelectedStage] = useState(searchParams.get('stage') || 'All Stages');
  const [sortBy, setSortBy] = useState('rank'); // 'rank' | 'likes' | 'views' | 'alphabetical'

  // Sync when header search changes
  useEffect(() => {
    if (headerSearchQuery !== undefined) {
      setSearchQuery(headerSearchQuery);
    }
  }, [headerSearchQuery]);

  // Sync URL query params if any
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) setSearchQuery(q);
  }, [searchParams]);

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedLocation('All');
    setSelectedStage('All Stages');
    setSortBy('rank');
    setSearchParams({});
  };

  // Filtered and sorted startups for current month
  const filteredStartups = useMemo(() => {
    let result = startups.filter(s => s.month === activeMonth);

    // 1. Text Search across name, ideaTitle, description, category, location
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(s =>
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.ideaTitle && s.ideaTitle.toLowerCase().includes(q)) ||
        (s.description && s.description.toLowerCase().includes(q)) ||
        (s.category && s.category.toLowerCase().includes(q)) ||
        (s.location && s.location.toLowerCase().includes(q))
      );
    }

    // 2. Category Filter
    if (selectedCategory !== 'All') {
      result = result.filter(s => s.category?.toLowerCase() === selectedCategory.toLowerCase());
    }

    // 3. Location Filter
    if (selectedLocation !== 'All') {
      result = result.filter(s => s.location?.toLowerCase() === selectedLocation.toLowerCase());
    }

    // 4. Stage Filter
    if (selectedStage !== 'All Stages') {
      result = result.filter(s => s.stage?.toLowerCase() === selectedStage.toLowerCase());
    }

    // 5. Sorting
    const sorted = [...result];
    if (sortBy === 'likes') {
      sorted.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    } else if (sortBy === 'views') {
      sorted.sort((a, b) => (b.views || 0) - (a.views || 0));
    } else if (sortBy === 'alphabetical') {
      sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else {
      // Default: By rank
      sorted.sort((a, b) => (a.rank || 99) - (b.rank || 99));
    }

    return sorted;
  }, [startups, activeMonth, searchQuery, selectedCategory, selectedLocation, selectedStage, sortBy]);

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 space-y-4">

        {startups.some((startup) => startup.isSample) && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900" role="status">
            <strong>Development preview:</strong> These sample listings appear only in local development. Production starts with an empty directory until real startups are approved.
          </div>
        )}
        
        {/* Month Selector Bar matching reference screenshot layout */}
        <section aria-label="Monthly Leaderboard Navigation">
          <MonthSelector />
        </section>

        {/* Filter and Discovery Toolbar */}
        <section aria-label="Filters and search">
          <FilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            selectedLocation={selectedLocation}
            onLocationChange={setSelectedLocation}
            selectedStage={selectedStage}
            onStageChange={setSelectedStage}
            sortBy={sortBy}
            onSortChange={setSortBy}
            totalResults={filteredStartups.length}
            onResetFilters={handleResetFilters}
          />
        </section>

        {/* Startup Leaderboard Table matching reference screenshot */}
        <section aria-label="Startup Leaderboard Table">
          <LeaderboardTable startups={filteredStartups} loading={loading} />
        </section>

      </div>
    </div>
  );
};
