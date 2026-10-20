"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

/**
 * Theme toggle button.
 *
 * Renders BOTH icons at all times and uses Tailwind `dark:` utilities
 * to show/hide the correct one.  This guarantees the server and first
 * client render produce identical HTML — no hydration mismatch.
 *
 * Title and aria-label are static strings that don't depend on
 * client-only state.
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const { toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={`relative p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-transparent hover:border-slate-200 dark:hover:border-slate-700/60 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${className}`}
      title="Toggle theme"
      aria-label="Toggle theme"
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        {/* Moon — visible in light mode, hidden in dark mode */}
        <Moon className="absolute inset-0 m-auto w-4 h-4 text-cyan-600 transition-transform duration-300 hover:-rotate-12 dark:hidden" />
        {/* Sun — hidden in light mode, visible in dark mode */}
        <Sun className="absolute inset-0 m-auto w-4 h-4 text-amber-300 transition-transform duration-300 hover:rotate-45 hidden dark:block" />
      </div>
    </button>
  );
}
