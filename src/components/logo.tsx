import React from "react";
import Link from "next/link";
import { LogoMark } from "@/components/logo-mark";

type LogoSize = "sm" | "default" | "md" | "lg";

interface LogoProps {
  size?: LogoSize;
  className?: string;
}

const sizeMap: Record<LogoSize, { image: string; text: string }> = {
  sm: { image: "h-8 w-auto", text: "text-sm min-[360px]:text-base" },
  default: {
    image: "h-9 w-auto",
    text: "text-sm min-[360px]:text-base sm:text-xl",
  },
  md: { image: "h-10 w-auto", text: "text-base min-[360px]:text-lg sm:text-xl" },
  lg: { image: "h-12 w-auto", text: "text-lg min-[360px]:text-xl sm:text-2xl" },
};

export function Logo({ size = "default", className = "" }: LogoProps) {
  const s = sizeMap[size];

  return (
    <Link
      href="/"
      className={`group inline-flex items-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-lg py-1 transition-transform duration-200 active:scale-95 ${className}`}
      aria-label="Startup Showcase Global Home"
    >
      <LogoMark className={`${s.image} text-brand-500 shrink-0`} />

      {/* Brand name */}
      <div className="flex flex-wrap items-baseline tracking-tight font-bold">
        <span className={`text-slate-900 dark:text-white ${s.text}`}>
          Startup
        </span>
        <span className={`text-brand-600 dark:text-brand-400 ml-1.5 ${s.text}`}>
          Showcase Global
        </span>
      </div>
    </Link>
  );
}
