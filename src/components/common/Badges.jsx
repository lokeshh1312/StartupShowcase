import React from 'react';

export const CategoryBadge = ({ category, className = '' }) => {
  if (!category) return null;

  const getStyles = (cat) => {
    const c = cat.toLowerCase();
    if (c.includes('agri')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    }
    if (c.includes('health')) {
      return 'bg-sky-50 text-sky-700 border-sky-100';
    }
    if (c.includes('clean')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    }
    if (c.includes('ed')) {
      return 'bg-purple-50 text-purple-700 border-purple-100';
    }
    if (c.includes('food')) {
      return 'bg-orange-50 text-orange-700 border-orange-100';
    }
    if (c.includes('legal')) {
      return 'bg-violet-50 text-violet-700 border-violet-100';
    }
    if (c.includes('water')) {
      return 'bg-blue-50 text-blue-700 border-blue-100';
    }
    if (c.includes('skill')) {
      return 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100';
    }
    if (c.includes('fin')) {
      return 'bg-amber-50 text-amber-700 border-amber-100';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStyles(category)} ${className}`}>
      {category}
    </span>
  );
};

export const StageBadge = ({ stage, className = '' }) => {
  if (!stage) return null;

  const getStageStyles = (stg) => {
    const s = stg.toLowerCase();
    if (s.includes('mvp')) {
      return 'bg-blue-50 text-blue-600 border-blue-100';
    }
    if (s.includes('proto')) {
      return 'bg-slate-100 text-slate-600 border-slate-200';
    }
    if (s.includes('idea')) {
      return 'bg-slate-100 text-slate-600 border-slate-200';
    }
    if (s.includes('launch')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    }
    return 'bg-slate-100 text-slate-600 border-slate-200';
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStageStyles(stage)} ${className}`}>
      {stage}
    </span>
  );
};
