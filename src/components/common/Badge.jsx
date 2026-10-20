import React from 'react';
import { Sparkles, Star, Flame, CheckCircle2, Clock, ShieldCheck } from 'lucide-react';

export const StageBadge = ({ stage }) => {
  const normalized = (stage || '').toLowerCase();

  if (normalized.includes('beta')) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/25">
        <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
        Public Beta
      </span>
    );
  }

  if (normalized.includes('alpha')) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/25">
        <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
        Private Alpha
      </span>
    );
  }

  if (normalized.includes('launch')) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
        Launched
      </span>
    );
  }

  if (normalized.includes('waitlist')) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/25">
        <Clock className="w-3 h-3 text-amber-400" />
        Waitlist
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-full bg-slate-800 text-slate-300 border border-slate-700">
      {stage}
    </span>
  );
};

export const SpecialBadge = ({ type }) => {
  if (type === 'featured') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded-full bg-gradient-to-r from-teal-500/15 to-cyan-500/15 text-teal-300 border border-teal-500/30 shadow-xs shadow-teal-500/20">
        <Sparkles className="w-2.5 h-2.5 text-teal-300" />
        Featured
      </span>
    );
  }

  if (type === 'editors-pick') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded-full bg-gradient-to-r from-amber-500/15 to-orange-500/15 text-amber-300 border border-amber-500/30">
        <Star className="w-2.5 h-2.5 text-amber-300 fill-amber-300/30" />
        Editor’s Pick
      </span>
    );
  }

  if (type === 'trending') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded-full bg-gradient-to-r from-rose-500/15 to-orange-500/15 text-rose-300 border border-rose-500/30">
        <Flame className="w-2.5 h-2.5 text-rose-400" />
        Trending
      </span>
    );
  }

  if (type === 'submitted') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30">
        <ShieldCheck className="w-2.5 h-2.5 text-blue-400" />
        Just Submitted
      </span>
    );
  }

  return null;
};
