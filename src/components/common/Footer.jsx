import React from 'react';
import { Link } from 'react-router-dom';
import { Logo } from './Logo';

export const Footer = () => {
  return (
    <footer className="w-full bg-white border-t border-slate-200/80 py-10 mt-auto transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Brand & mission */}
          <div className="flex flex-col items-center md:items-start space-y-1 text-center md:text-left">
            <Logo size="sm" />
            <p className="text-xs text-slate-500 max-w-sm pt-1">
              Discover, explore, and support the next generation of early-stage startups and innovations across India.
            </p>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-slate-600">
            <Link to="/" className="hover:text-blue-600 transition-colors">
              Leaderboard
            </Link>
            <Link to="/about" className="hover:text-blue-600 transition-colors">
              About Platform
            </Link>
            <Link to="/submit" className="hover:text-blue-600 transition-colors">
              Submit Startup
            </Link>
          </div>

          {/* Copyright & product note */}
          <div className="text-center md:text-right space-y-1">
            <p className="text-xs text-slate-500">
              © {new Date().getFullYear()} Startup Showcase.
            </p>
            <p className="text-[11px] text-slate-400">
              Accounts, submissions, votes, saves, and comments are shared across visitors.
            </p>
          </div>

        </div>
      </div>
    </footer>
  );
};
