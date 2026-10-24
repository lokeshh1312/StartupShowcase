import type { Metadata } from "next";
import Link from "next/link";
import { Cookie, AlertTriangle, ArrowLeft } from "lucide-react";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Cookie Policy",
  description:
    "Plain-language cookie policy for Startup Showcase detailing essential session cookies, preferences, and privacy protections.",
  path: "/cookies",
});

export default function CookiesPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Back button */}
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Discovery</span>
        </Link>
      </div>

      {/* Header */}
      <div className="space-y-4 mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs font-medium">
          <Cookie className="w-4 h-4" />
          <span>Cookie & Storage Information</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Cookie Policy
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Last updated: October 2026 • Effective Date: October 24, 2026
        </p>
      </div>

      {/* Mandatory Legal Disclaimer Notice */}
      <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3.5">
        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 dark:text-amber-200 space-y-1">
          <p className="font-bold">Important Notice & Disclaimer:</p>
          <p className="leading-relaxed">
            This plain-language cookie policy outlines how cookies and browser storage are utilized on Startup Showcase. It does not constitute formal legal counsel and should be verified by a qualified attorney in your jurisdiction prior to production launch.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-8 text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xs">
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            1. What Are Cookies?
          </h2>
          <p>
            Cookies are small text files stored on your computer or mobile device when you browse websites. They enable the website to recognize your session, remember your interface settings (such as dark mode), and protect against unauthorized access.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            2. Cookies We Use
          </h2>
          <p>
            We believe in data minimization. We only store cookies and browser storage tokens that are strictly necessary for platform operation or privacy-respecting telemetry:
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">Cookie / Identifier</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Duration</th>
                  <th className="p-3">Purpose</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-600 dark:text-slate-300">
                <tr>
                  <td className="p-3 font-mono">sb-*-auth-token</td>
                  <td className="p-3">Strictly Necessary</td>
                  <td className="p-3">Session / 1 Year</td>
                  <td className="p-3">Secure authentication session token managed by Supabase Auth.</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono">theme</td>
                  <td className="p-3">Preference</td>
                  <td className="p-3">1 Year</td>
                  <td className="p-3">Remembers your display theme (light, dark, or system preference) without layout shift.</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono">cf_clearance / Turnstile</td>
                  <td className="p-3">Security & Anti-Abuse</td>
                  <td className="p-3">Session</td>
                  <td className="p-3">Used by Cloudflare Turnstile to verify human visitors and stop bot attacks.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            3. Third-Party Tracking & Advertising
          </h2>
          <p>
            Startup Showcase does <strong>NOT</strong> use third-party advertising cookies, ad re-targeting pixels, or cross-site tracking scripts.
          </p>
          <p>
            If privacy analytics are enabled, we use lightweight, privacy-focused analytics (such as Plausible Analytics) which does not use cookies, does not collect personal identifiers, and respects visitor privacy by design.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            4. Managing Your Cookie Preferences
          </h2>
          <p>
            Most modern web browsers allow you to manage cookie settings in their security preferences:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-300">
            <li>You can configure your browser to block all cookies or alert you when a cookie is placed.</li>
            <li>You can clear existing cookies from your browser history at any time.</li>
          </ul>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Note: Disabling strictly necessary authentication cookies will prevent you from signing in or managing your submitted startups.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            5. Contact
          </h2>
          <p>
            If you have questions about our use of cookies or browser storage, please contact us via our{" "}
            <Link
              href="/support"
              className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
            >
              Support Center
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
