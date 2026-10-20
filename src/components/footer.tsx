import Link from "next/link";
import { Logo } from "@/components/logo";

const footerLinks = [
  { href: "/", label: "Leaderboard" },
  { href: "/about", label: "About Platform" },
  { href: "/submit", label: "Submit Startup" },
] as const;

export function Footer() {
  return (
    <footer className="w-full bg-white dark:bg-slate-950 border-t border-slate-200/80 dark:border-slate-800/80 py-10 mt-auto transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand & mission */}
          <div className="flex flex-col items-center md:items-start space-y-1 text-center md:text-left">
            <Logo size="sm" />
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm pt-1">
              Discover, explore, and support the next generation of early-stage
              startups and innovations from around the world.
            </p>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-slate-600 dark:text-slate-400">
            {footerLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Copyright */}
          <div className="text-center md:text-right space-y-1">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              © {new Date().getFullYear()} Startup Showcase.
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Accounts, submissions, votes, saves, and comments are shared
              across visitors.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
