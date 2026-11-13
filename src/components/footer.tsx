import Link from "next/link";
import { ArrowUp } from "lucide-react";
import { Logo } from "@/components/logo";
import { SOCIAL_LINKS } from "@/lib/seo";

const platformLinks = [
  { href: "/browse", label: "Directory" },
  { href: "/categories", label: "Categories" },
  { href: "/countries", label: "Countries" },
  { href: "/submit", label: "Submit Startup" },
] as const;

const resourceLinks = [
  { href: "/about", label: "About" },
  { href: "/pricing", label: "Pricing" },
  { href: "/faq", label: "FAQ" },
  { href: "/support", label: "Contact Us" },
  { href: "/refunds", label: "Refund Policy" },
  { href: "/delivery", label: "Delivery Policy" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/cookies", label: "Cookie Policy" },
] as const;

export function Footer() {
  return (
    <footer className="w-full bg-white dark:bg-slate-950/80 border-t border-slate-200/80 dark:border-white/10 py-12 mt-auto transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-slate-100 dark:border-white/5">
          {/* Brand & Mission */}
          <div className="md:col-span-2 space-y-4">
            <Logo size="md" />
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md leading-relaxed pt-1">
              A global startup discovery and monthly-leaderboard platform for
              early-stage startups, prototypes, and MVPs from any country.
            </p>
            {/* Social Links */}
            <div className="flex items-center gap-2 pt-1">
              <a
                href={SOCIAL_LINKS.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow Startup Showcase Global on Instagram"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-brand-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-brand-400 dark:hover:bg-white/5 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
              <a
                href={SOCIAL_LINKS.x}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow Startup Showcase Global on X"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-brand-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-brand-400 dark:hover:bg-white/5 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href={SOCIAL_LINKS.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow Startup Showcase Global on LinkedIn"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-brand-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-brand-400 dark:hover:bg-white/5 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.25c-.9 0-1.63.73-1.63 1.63s.73 1.63 1.63 1.63 1.63-.73 1.63-1.63-.73-1.63-1.63-1.63z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Directory Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
              Explore
            </h4>
            <ul className="space-y-2 text-xs">
              {platformLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Platform & Support */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
              Platform & Legal
            </h4>
            <ul className="space-y-2 text-xs">
              {resourceLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright + Links + Back to top */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <p>© {new Date().getFullYear()} Startup Showcase Global. Built for founders worldwide.</p>
          
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs">
            <Link href="/about" className="hover:text-brand-600 dark:hover:text-brand-400 hover:underline">
              About
            </Link>
            <Link href="/pricing" className="hover:text-brand-600 dark:hover:text-brand-400 hover:underline">
              Pricing
            </Link>
            <Link href="/faq" className="hover:text-brand-600 dark:hover:text-brand-400 hover:underline">
              FAQ
            </Link>
            <Link href="/support" className="hover:text-brand-600 dark:hover:text-brand-400 hover:underline">
              Contact Us
            </Link>
            <Link href="/refunds" className="hover:text-brand-600 dark:hover:text-brand-400 hover:underline">
              Refunds
            </Link>
            <Link href="/delivery" className="hover:text-brand-600 dark:hover:text-brand-400 hover:underline">
              Delivery
            </Link>
            <Link href="/privacy" className="hover:text-brand-600 dark:hover:text-brand-400 hover:underline">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-brand-600 dark:hover:text-brand-400 hover:underline">
              Terms
            </Link>
            <Link href="/cookies" className="hover:text-brand-600 dark:hover:text-brand-400 hover:underline">
              Cookies
            </Link>
          </div>

          {/* Big circular indigo Back to top button */}
          <a
            href="#top"
            aria-label="Back to top"
            className="w-10 h-10 rounded-full bg-brand-600 hover:bg-brand-700 text-white dark:text-[#0e0d0d] flex items-center justify-center transition-all duration-200 shadow-md hover:scale-105 active:scale-95 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <ArrowUp className="w-4 h-4" />
          </a>
        </div>
      </div>
    </footer>
  );
}
