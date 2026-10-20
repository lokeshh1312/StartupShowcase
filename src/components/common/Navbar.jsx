import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Search, Menu, X } from 'lucide-react';
import { Logo } from './Logo';
import { useAuth } from '../../context/AuthContext';

export const Navbar = ({ onSearchQueryChange, globalSearch = '' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoggedIn, logout, openAuthModal } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(globalSearch || '');

  // Keep local search in sync if global query changes
  useEffect(() => {
    if (globalSearch !== undefined) {
      setSearchInput(globalSearch);
    }
  }, [globalSearch]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearchQueryChange) {
      onSearchQueryChange(searchInput);
    }
    if (location.pathname !== '/' && location.pathname !== '/search') {
      navigate(`/?q=${encodeURIComponent(searchInput.trim())}`);
    }
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchInput(val);
    if (onSearchQueryChange) {
      onSearchQueryChange(val);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 gap-4">
          
          {/* Left: Brand Logo */}
          <div className="flex items-center gap-8">
            <Logo />
          </div>

          {/* Center Navigation: Home and About with active indicator matching reference */}
          <nav className="hidden md:flex items-center gap-8">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `relative py-2 text-sm font-semibold transition-colors ${
                  isActive ? 'text-blue-600' : 'text-slate-600 hover:text-slate-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  Home
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                  )}
                </>
              )}
            </NavLink>

            <NavLink
              to="/about"
              className={({ isActive }) =>
                `relative py-2 text-sm font-semibold transition-colors ${
                  isActive ? 'text-blue-600' : 'text-slate-600 hover:text-slate-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  About
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                  )}
                </>
              )}
            </NavLink>

            <NavLink
              to="/submit"
              className={({ isActive }) =>
                `relative py-2 text-sm font-medium transition-colors ${
                  isActive ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  Submit Idea
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                  )}
                </>
              )}
            </NavLink>
          </nav>

          {/* Search and account actions */}
          <div className="flex items-center gap-3">
            {/* Search Input matching reference screenshot */}
            <form onSubmit={handleSearchSubmit} className="relative hidden sm:block w-48 md:w-60 lg:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                id="header-search-input"
                type="text"
                placeholder="Search startup ideas..."
                value={searchInput}
                onChange={handleSearchChange}
                className="w-full pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </form>

            {isLoggedIn ? (
              <div className="hidden sm:flex items-center gap-2">
                <span className="max-w-28 truncate text-xs font-medium text-slate-600">{user.name}</span>
                <Link to="/saved" className="text-xs font-semibold text-slate-600 hover:text-blue-600">Saved</Link>
                <Link to="/me/submissions" className="text-xs font-semibold text-slate-600 hover:text-blue-600">My listings</Link>
                {user.role === 'admin' && <Link to="/admin" className="text-xs font-semibold text-blue-600">Admin</Link>}
                <button type="button" onClick={() => logout()} className="text-xs font-semibold text-slate-600 hover:text-slate-900">Sign out</button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <button type="button" onClick={() => openAuthModal('login')} className="px-3 py-1.5 text-xs font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50">Sign in</button>
                <button type="button" onClick={() => openAuthModal('signup')} className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg">Create account</button>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg focus:outline-none"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-3">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search startup ideas..."
              value={searchInput}
              onChange={handleSearchChange}
              className="w-full pl-9 pr-3 py-2 text-sm text-slate-800 placeholder-slate-400 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </form>

          <div className="flex flex-col gap-1 pt-2">
            <Link
              to="/"
              className={`px-3 py-2 rounded-lg text-sm font-semibold ${
                location.pathname === '/' ? 'text-blue-600 bg-blue-50' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              Home (Leaderboard)
            </Link>
            <Link
              to="/about"
              className={`px-3 py-2 rounded-lg text-sm font-semibold ${
                location.pathname === '/about' ? 'text-blue-600 bg-blue-50' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              About
            </Link>
            <Link
              to="/submit"
              className={`px-3 py-2 rounded-lg text-sm font-semibold ${
                location.pathname === '/submit' ? 'text-blue-600 bg-blue-50' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              Submit Startup Idea
            </Link>
            {isLoggedIn && <>
              <Link to="/saved" className="px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50">Saved startups</Link>
              <Link to="/me/submissions" className="px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50">My submissions</Link>
              {user.role === 'admin' && <Link to="/admin" className="px-3 py-2 rounded-lg text-sm font-semibold text-blue-600 hover:bg-blue-50">Review queue</Link>}
            </>}
          </div>

          <div className="flex items-center gap-2 border-t border-slate-100 pt-3">
            {isLoggedIn ? (
              <>
                <span className="flex-1 truncate text-xs text-slate-600">{user.name}</span>
                <button type="button" onClick={() => logout()} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">Sign out</button>
              </>
            ) : (
              <>
                <button type="button" onClick={() => openAuthModal('login')} className="flex-1 rounded-lg border border-slate-300 py-2 text-xs font-semibold text-slate-700">Sign in</button>
                <button type="button" onClick={() => openAuthModal('signup')} className="flex-1 rounded-lg bg-blue-600 py-2 text-xs font-semibold text-white">Create account</button>
              </>
            )}
          </div>

        </div>
      )}
    </header>
  );
};
