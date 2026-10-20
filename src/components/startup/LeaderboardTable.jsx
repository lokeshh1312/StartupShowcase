import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Heart, Eye, ChevronRight } from 'lucide-react';
import { StartupLogo } from '../common/StartupLogo';
import { CategoryBadge, StageBadge } from '../common/Badges';
import { useStartups } from '../../context/StartupsContext';

export const formatMetric = (num) => {
  if (num === undefined || num === null) return '0';
  if (num >= 1000) {
    const k = (num / 1000).toFixed(1);
    return k.endsWith('.0') ? `${Math.floor(num / 1000)}K` : `${k}K`;
  }
  return num.toString();
};

export const LeaderboardTable = ({ startups = [], loading = false }) => {
  const navigate = useNavigate();
  const { toggleLike, isLiked } = useStartups();

  if (loading) {
    return (
      <div className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-xs p-8 text-center">
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading startup leaderboard...</p>
        </div>
      </div>
    );
  }

  if (!startups || startups.length === 0) {
    return (
      <div className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-xs p-12 text-center">
        <div className="max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto text-xl font-bold">
            💡
          </div>
          <h3 className="text-base font-semibold text-slate-900">No startup ideas found</h3>
          <p className="text-xs text-slate-500">
            No startups match your current search and filter criteria. Try adjusting your filters or search term.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* DESKTOP TABLE VIEW (Exact visual layout matching reference screenshot) */}
      <div className="hidden lg:block bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <table className="w-full border-collapse text-left">
          {/* Table Header */}
          <thead>
            <tr className="border-b border-slate-100 bg-[#FAFCFF] text-[11px] font-bold text-slate-700 tracking-wider">
              <th scope="col" className="py-4 pl-6 pr-2 w-12 text-center">#</th>
              <th scope="col" className="py-4 px-4 w-28 text-center">Logo</th>
              <th scope="col" className="py-4 px-4">Startup Idea</th>
              <th scope="col" className="py-4 px-4 w-32">Category</th>
              <th scope="col" className="py-4 px-4 w-36">Location</th>
              <th scope="col" className="py-4 px-4 w-28">Stage</th>
              <th scope="col" className="py-4 px-4 w-24 text-center">Likes</th>
              <th scope="col" className="py-4 px-4 w-24 text-center">Views</th>
              <th scope="col" className="py-4 pl-2 pr-6 w-12 text-center">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-100/90 text-sm">
            {startups.map((startup, index) => {
              const displayRank = startup.rank || index + 1;
              const liked = isLiked(startup.id);

              return (
                <tr
                  key={startup.id}
                  onClick={() => navigate(`/startup/${startup.slug}`)}
                  className="group hover:bg-slate-50/70 transition-colors cursor-pointer"
                >
                  {/* 1. Rank Column */}
                  <td className="py-4 pl-6 pr-2 text-center align-middle">
                    <div className="flex items-center justify-center">
                      {displayRank === 1 ? (
                        <span className="w-6 h-6 rounded-full bg-[#FFB800] text-white font-bold text-xs flex items-center justify-center shadow-xs">
                          1
                        </span>
                      ) : displayRank === 2 ? (
                        <span className="w-6 h-6 rounded-full bg-[#94A3B8] text-white font-bold text-xs flex items-center justify-center shadow-xs">
                          2
                        </span>
                      ) : displayRank === 3 ? (
                        <span className="w-6 h-6 rounded-full bg-[#E58A3C] text-white font-bold text-xs flex items-center justify-center shadow-xs">
                          3
                        </span>
                      ) : (
                        <span className="w-6 text-center font-bold text-slate-700 text-xs">
                          {displayRank}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* 2. Startup Logo Column */}
                  <td className="py-4 px-4 align-middle text-center">
                    <div className="flex items-center justify-center">
                      <StartupLogo startup={startup} size="md" showName={true} />
                    </div>
                  </td>

                  {/* 3. Startup Thumbnail & Idea Name/Description Column */}
                  <td className="py-4 px-4 align-middle">
                    <div className="flex items-center gap-3.5 max-w-xl">
                      {/* Image Thumbnail matching reference screenshot */}
                      <div className="w-20 h-13 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200/60 shadow-2xs">
                        <img
                          src={startup.thumbnail}
                          alt={startup.name}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>

                      {/* Text details */}
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-slate-900 text-sm tracking-tight group-hover:text-blue-600 transition-colors line-clamp-1">
                          {startup.ideaTitle || startup.name}
                        </span>
                        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5 font-normal">
                          {startup.description}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* 4. Category Column */}
                  <td className="py-4 px-4 align-middle">
                    <CategoryBadge category={startup.category} />
                  </td>

                  {/* 5. Location Column */}
                  <td className="py-4 px-4 align-middle">
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{startup.location}</span>
                    </div>
                  </td>

                  {/* 6. Development Stage Column */}
                  <td className="py-4 px-4 align-middle">
                    <StageBadge stage={startup.stage} />
                  </td>

                  {/* 7. Likes Column (Clickable interactive like toggle) */}
                  <td className="py-4 px-4 align-middle text-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => toggleLike(startup.id)}
                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-slate-100 active:scale-95 transition-all cursor-pointer group/like"
                      title={liked ? 'Unlike this startup' : 'Like this startup'}
                    >
                      <Heart
                        className={`w-4 h-4 transition-colors ${
                          liked
                            ? 'text-red-500 fill-red-500'
                            : 'text-red-500 group-hover/like:fill-red-500/20'
                        }`}
                      />
                      <span className="text-xs font-semibold text-slate-700">
                        {formatMetric(startup.likes)}
                      </span>
                    </button>
                  </td>

                  {/* 8. Views Column */}
                  <td className="py-4 px-4 align-middle text-center">
                    <div className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
                      <Eye className="w-4 h-4 text-slate-400" />
                      <span>{formatMetric(startup.views)}</span>
                    </div>
                  </td>

                  {/* 9. Details Navigation Arrow */}
                  <td className="py-4 pl-2 pr-6 text-center align-middle">
                    <Link
                      to={`/startup/${startup.slug}`}
                      className="inline-flex items-center justify-center w-7 h-7 rounded-full text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors"
                      aria-label={`View details for ${startup.name}`}
                    >
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MOBILE / TABLET RESPONSIVE CARDS VIEW */}
      <div className="lg:hidden space-y-3">
        {startups.map((startup, index) => {
          const displayRank = startup.rank || index + 1;
          const liked = isLiked(startup.id);

          return (
            <div
              key={startup.id}
              onClick={() => navigate(`/startup/${startup.slug}`)}
              className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs hover:border-blue-200 transition-all cursor-pointer space-y-3"
            >
              {/* Header with rank, logo, and title */}
              <div className="flex items-start gap-3">
                {/* Rank Badge */}
                <div className="flex-shrink-0 pt-0.5">
                  {displayRank === 1 ? (
                    <span className="w-6 h-6 rounded-full bg-[#FFB800] text-white font-bold text-xs flex items-center justify-center shadow-xs">
                      1
                    </span>
                  ) : displayRank === 2 ? (
                    <span className="w-6 h-6 rounded-full bg-[#94A3B8] text-white font-bold text-xs flex items-center justify-center shadow-xs">
                      2
                    </span>
                  ) : displayRank === 3 ? (
                    <span className="w-6 h-6 rounded-full bg-[#E58A3C] text-white font-bold text-xs flex items-center justify-center shadow-xs">
                      3
                    </span>
                  ) : (
                    <span className="w-6 text-center font-bold text-slate-700 text-xs block">
                      {displayRank}
                    </span>
                  )}
                </div>

                {/* Logo */}
                <div className="flex-shrink-0">
                  <StartupLogo startup={startup} size="sm" showName={false} />
                </div>

                {/* Name & Tagline */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-bold text-slate-900 truncate hover:text-blue-600">
                      {startup.ideaTitle || startup.name}
                    </h4>
                    <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                    {startup.description}
                  </p>
                </div>
              </div>

              {/* Thumbnail + Details */}
              <div className="flex items-center gap-3 pt-1">
                <div className="w-16 h-12 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-100">
                  <img
                    src={startup.thumbnail}
                    alt={startup.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 flex-1">
                  <CategoryBadge category={startup.category} />
                  <StageBadge stage={startup.stage} />
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium ml-auto sm:ml-0">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>{startup.location}</span>
                  </div>
                </div>
              </div>

              {/* Metrics footer */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLike(startup.id);
                    }}
                    className="flex items-center gap-1 text-slate-700 font-semibold"
                  >
                    <Heart
                      className={`w-3.5 h-3.5 ${
                        liked ? 'text-red-500 fill-red-500' : 'text-red-500'
                      }`}
                    />
                    <span>{formatMetric(startup.likes)}</span>
                  </button>

                  <div className="flex items-center gap-1 text-slate-500 font-medium">
                    <Eye className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formatMetric(startup.views)} views</span>
                  </div>
                </div>

                <span className="text-blue-600 font-semibold text-xs flex items-center gap-0.5">
                  Details <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
