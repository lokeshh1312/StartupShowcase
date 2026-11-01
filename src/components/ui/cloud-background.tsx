import React from "react";

/**
 * CloudBackground: Decorative cloud layer for the top of the page.
 * Pure inline SVGs with feGaussianBlur and slow CSS drift animation.
 * Adheres strictly to the light/dark theme specifications and zero-JS motion requirements.
 */
export function CloudBackground() {
  return (
    <div
      aria-hidden="true"
      className="absolute top-0 inset-x-0 h-[760px] overflow-hidden pointer-events-none -z-10 select-none"
    >
      {/* Light Theme: Sky-blue vertical gradient fading to transparent by ~68% */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#8ec9ff]/40 via-[#c6e5ff]/30 via-[#eaf5ff]/20 to-transparent dark:hidden" />

      {/* Dark Theme: Indigo radial glow at top center */}
      <div className="hidden dark:block absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(99,102,241,0.22)_0%,rgba(79,70,229,0.08)_45%,transparent_75%)]" />

      {/* Cloud Shapes SVG Layer */}
      <svg
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="cloud-blur-1" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="15" />
          </filter>
          <filter id="cloud-blur-2" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="16" />
          </filter>
        </defs>

        {/* Cloud 1: Left */}
        <g
          className="animate-cloud-left"
          filter="url(#cloud-blur-1)"
        >
          <ellipse cx="12%" cy="110" rx="140" ry="60" className="fill-white/85 dark:fill-indigo-500/30" />
          <circle cx="18%" cy="95" r="75" className="fill-white/90 dark:fill-indigo-400/35" />
          <circle cx="9%" cy="115" r="55" className="fill-white/80 dark:fill-indigo-600/30" />
          <ellipse cx="23%" cy="130" rx="90" ry="50" className="fill-white/85 dark:fill-indigo-500/25" />
        </g>

        {/* Cloud 2: Top-right */}
        <g
          className="animate-cloud-right"
          filter="url(#cloud-blur-2)"
        >
          <ellipse cx="86%" cy="130" rx="160" ry="65" className="fill-white/85 dark:fill-indigo-500/30" />
          <circle cx="82%" cy="105" r="80" className="fill-white/90 dark:fill-indigo-400/35" />
          <circle cx="91%" cy="120" r="65" className="fill-white/85 dark:fill-indigo-600/30" />
          <ellipse cx="75%" cy="145" rx="100" ry="50" className="fill-white/80 dark:fill-indigo-500/25" />
        </g>

        {/* Cloud 3: Centre-lower */}
        <g
          className="animate-cloud-left"
          filter="url(#cloud-blur-1)"
        >
          <ellipse cx="50%" cy="320" rx="180" ry="70" className="fill-white/80 dark:fill-indigo-500/25" />
          <circle cx="45%" cy="300" r="75" className="fill-white/85 dark:fill-indigo-400/30" />
          <circle cx="56%" cy="310" r="80" className="fill-white/85 dark:fill-indigo-600/25" />
          <ellipse cx="52%" cy="335" rx="130" ry="55" className="fill-white/80 dark:fill-indigo-500/20" />
        </g>

        {/* Cloud 4: Far-left-lower */}
        <g
          className="animate-cloud-right"
          filter="url(#cloud-blur-2)"
        >
          <ellipse cx="4%" cy="430" rx="150" ry="65" className="fill-white/80 dark:fill-indigo-500/25" />
          <circle cx="7%" cy="410" r="70" className="fill-white/85 dark:fill-indigo-400/30" />
          <circle cx="1%" cy="435" r="60" className="fill-white/80 dark:fill-indigo-600/25" />
          <ellipse cx="12%" cy="450" rx="90" ry="50" className="fill-white/75 dark:fill-indigo-500/20" />
        </g>
      </svg>
    </div>
  );
}

