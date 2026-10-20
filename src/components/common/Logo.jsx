import React from 'react';
import { Link } from 'react-router-dom';
import { Lightbulb } from 'lucide-react';

export const Logo = ({ size = 'default', className = '' }) => {
  const isSmall = size === 'sm';
  const isLarge = size === 'lg';

  return (
    <Link 
      to="/" 
      className={`group flex items-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg py-1 transition-transform duration-200 active:scale-95 ${className}`}
      aria-label="Startup Showcase Home"
    >
      {/* Lightbulb Icon with subtle styling matching screenshot */}
      <div className={`relative flex items-center justify-center rounded-xl bg-blue-50/80 border border-blue-100 group-hover:bg-blue-100/80 transition-colors ${
        isSmall ? 'w-8 h-8' : isLarge ? 'w-11 h-11' : 'w-9 h-9'
      }`}>
        <Lightbulb 
          className={`text-blue-600 transition-transform duration-300 group-hover:rotate-6 ${
            isSmall ? 'w-4 h-4' : isLarge ? 'w-6 h-6' : 'w-5 h-5'
          }`} 
        />
      </div>

      {/* Brand Name */}
      <div className="flex items-center tracking-tight font-bold">
        <span className={`text-slate-900 ${isSmall ? 'text-lg' : isLarge ? 'text-2xl' : 'text-xl'}`}>
          Startup
        </span>
        <span className={`text-blue-600 ml-1.5 ${isSmall ? 'text-lg' : isLarge ? 'text-2xl' : 'text-xl'}`}>
          Showcase
        </span>
      </div>
    </Link>
  );
};
