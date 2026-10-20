import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Lightbulb } from 'lucide-react';

export const NotFoundPage = () => {
  return (
    <div className="max-w-md mx-auto px-4 py-24 text-center space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-xs border border-blue-100">
        <Lightbulb className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
          Error 404
        </span>
        <h1 className="text-2xl font-bold text-slate-900">
          Page Not Found
        </h1>
        <p className="text-xs text-slate-500 leading-relaxed">
          The startup idea, profile, or leaderboard page you requested does not exist or has been relocated.
        </p>
      </div>

      <div className="pt-2 flex items-center justify-center">
        <Link
          to="/"
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Leaderboard</span>
        </Link>
      </div>
    </div>
  );
};
