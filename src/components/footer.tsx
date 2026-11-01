import Link from "next/link";
import { ArrowUp } from "lucide-react";
import { Logo } from "@/components/logo";

const platformLinks = [
  { href: "/browse", label: "Directory" },
  { href: "/categories", label: "Categories" },
  { href: "/countries", label: "Countries" },
  { href: "/submit", label: "Submit Startup" },
] as const;

const resourceLinks = [
  { href: "/about", label: "About" },
  { href: "/pricing", label: "Pricing" },
  { href: "/contact", label: "Contact" },
  { href: "/faq", label: "FAQ" },
  { href: "/support", label: "Support" },
  { href: "/newsletter", label: "Newsletter" },
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
          <div className="md:col-span-2 space-y-3">
            <Logo size="md" />
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md leading-relaxed pt-1">
              A global startup discovery and monthly-leaderboard platform for
              early-stage startups, prototypes, and MVPs from any country.
            </p>
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
          <p>© {new Date().getFullYear()} Startup Showcase. Built for founders worldwide.</p>
          
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs">
            <Link href="/about" className="hover:text-brand-600 dark:hover:text-brand-400 hover:underline">
              About
            </Link>
            <Link href="/pricing" className="hover:text-brand-600 dark:hover:text-brand-400 hover:underline">
              Pricing
            </Link>
            <Link href="/contact" className="hover:text-brand-600 dark:hover:text-brand-400 hover:underline">
              Contact
            </Link>
            <Link href="/faq" className="hover:text-brand-600 dark:hover:text-brand-400 hover:underline">
              FAQ
            </Link>
            <Link href="/support" className="hover:text-brand-600 dark:hover:text-brand-400 hover:underline">
              Support
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
            className="w-10 h-10 rounded-full bg-brand-600 hover:bg-brand-700 text-white flex items-center justify-center transition-all duration-200 shadow-md hover:scale-105 active:scale-95 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <ArrowUp className="w-4 h-4" />
          </a>
        </div>
      </div>
    </footer>
  );
}
