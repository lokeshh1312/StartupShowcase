import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const ThemeToggle = ({ className = '' }) => {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={`relative p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 dark:hover:bg-slate-800/80 border border-transparent hover:border-slate-700/60 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 ${className}`}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label="Toggle theme"
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        {isDark ? (
          <Sun className="w-4 h-4 text-amber-300 transition-transform duration-300 rotate-0 hover:rotate-45" />
        ) : (
          <Moon className="w-4 h-4 text-cyan-600 transition-transform duration-300 rotate-0 hover:-rotate-12" />
        )}
      </div>
    </button>
  );
};
