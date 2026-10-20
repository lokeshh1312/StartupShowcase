import Link from "next/link";
import { Lightbulb } from "lucide-react";

type LogoSize = "sm" | "default" | "lg";

interface LogoProps {
  size?: LogoSize;
  className?: string;
}

const sizeMap: Record<LogoSize, { box: string; icon: string; text: string }> = {
  sm: { box: "w-8 h-8", icon: "w-4 h-4", text: "text-lg" },
  default: { box: "w-9 h-9", icon: "w-5 h-5", text: "text-xl" },
  lg: { box: "w-11 h-11", icon: "w-6 h-6", text: "text-2xl" },
};

export function Logo({ size = "default", className = "" }: LogoProps) {
  const s = sizeMap[size];

  return (
    <Link
      href="/"
      className={`group flex items-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg py-1 transition-transform duration-200 active:scale-95 ${className}`}
      aria-label="Startup Showcase Home"
    >
      {/* Lightbulb icon */}
      <div
        className={`relative flex items-center justify-center rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 group-hover:bg-blue-100/80 dark:group-hover:bg-blue-900/60 transition-colors ${s.box}`}
      >
        <Lightbulb
          className={`text-blue-600 dark:text-blue-400 transition-transform duration-300 group-hover:rotate-6 ${s.icon}`}
        />
      </div>

      {/* Brand name */}
      <div className="flex items-center tracking-tight font-bold">
        <span
          className={`text-slate-900 dark:text-white ${s.text}`}
        >
          Startup
        </span>
        <span
          className={`text-blue-600 dark:text-blue-400 ml-1.5 ${s.text}`}
        >
          Showcase
        </span>
      </div>
    </Link>
  );
}
