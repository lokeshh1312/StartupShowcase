import React from "react";
import Link from "next/link";

interface PillProps {
  children: React.ReactNode;
  active?: boolean;
  href?: string;
  onClick?: () => void;
  className?: string;
}

export function Pill({
  children,
  active = false,
  href,
  onClick,
  className = "",
}: PillProps) {
  const baseStyles =
    "inline-flex items-center justify-center font-medium transition-all duration-200 select-none text-xs rounded-full px-4 py-2 whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 active:scale-95";

  const stateStyles = active
    ? "bg-brand-600 text-white shadow-xs font-semibold"
    : "bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-brand-500/50 hover:bg-slate-50 dark:hover:bg-white/10 shadow-xs dark:shadow-none";

  if (href) {
    return (
      <Link href={href} className={`${baseStyles} ${stateStyles} ${className}`}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${baseStyles} ${stateStyles} ${className}`}
    >
      {children}
    </button>
  );
}

