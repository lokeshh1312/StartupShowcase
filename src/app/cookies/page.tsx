import type { Metadata } from "next";
import Link from "next/link";
import { Cookie, ArrowLeft } from "lucide-react";
import { createMetadata } from "@/lib/seo";
import { CloudBackground } from "@/components/ui/cloud-background";

export const metadata: Metadata = createMetadata({
  title: "Cookie Policy",
  description:
    "Plain-language cookie policy detailing essential session cookies, preferences, and privacy protections.",
  path: "/cookies",
});

export default function CookiesPage() {
  const companyName =
    process.env.NEXT_PUBLIC_COMPANY_NAME?.trim() || "Startup Showcase";
  const contactEmail =
    process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || "contact@startupshowcase.com";

  return (
    <div className="relative isolate min-h-screen">
      <CloudBackground height="h-[340px] sm:h-[400px]" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Back button */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500 rounded-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Discovery</span>
          </Link>
        </div>

        {/* Header */}
        <div className="space-y-3 pt-2">
          <div className="flex justify-start">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-semibold tracking-widest uppercase border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-white/5 text-slate-700 dark:text-slate-300 shadow-2xs dark:shadow-none">
              <Cookie className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              <span>Cookie & Storage Information</span>
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Cookie{" "}
            <em className="font-serif-italic font-normal text-brand-600 dark:text-brand-400 not-italic-fallback">
              Policy
            </em>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Last updated: October 2026 • Effective Date: October 24, 2026
          </p>
        </div>

        {/* Content */}
        <div className="relative bg-white/90 dark:bg-white/[0.03] border border-slate-200/90 dark:border-white/10 rounded-3xl p-6 sm:p-10 shadow-xs backdrop-blur-md space-y-8 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              1. What Are Cookies?
            </h2>
            <p>
              Cookies are small text files stored on your computer or mobile device when you browse websites. They enable the website to recognize your session, remember your interface settings (such as dark mode), and protect against unauthorized access.
            </p>
          </section>

          <section className="space-y-3 border-t border-slate-100 dark:border-white/5 pt-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              2. Cookies We Use
            </h2>
            <p>
              We believe in data minimization. We only store cookies and browser storage tokens that are strictly necessary for platform operation or privacy-respecting telemetry:
            </p>

            <div className="overflow-x-auto rounded-2xl border border-slate-200/90 dark:border-white/10">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/70 dark:bg-white/5 text-slate-900 dark:text-white font-bold border-b border-slate-200/90 dark:border-white/10">
                  <tr>
                    <th className="p-3">Cookie / Identifier</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Duration</th>
                    <th className="p-3">Purpose</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-600 dark:text-slate-300">
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

          <section className="space-y-3 border-t border-slate-100 dark:border-white/5 pt-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              3. Third-Party Tracking & Advertising
            </h2>
            <p>
              {companyName} does <strong>NOT</strong> use third-party advertising cookies, ad re-targeting pixels, or cross-site tracking scripts.
            </p>
            <p>
              If privacy analytics are enabled, we use lightweight, privacy-focused analytics (such as Plausible Analytics) which does not use cookies, does not collect personal identifiers, and respects visitor privacy by design.
            </p>
          </section>

          <section className="space-y-3 border-t border-slate-100 dark:border-white/5 pt-6">
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

          <section className="space-y-3 border-t border-slate-100 dark:border-white/5 pt-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              5. Contact
            </h2>
            <p>
              If you have questions about our use of cookies or browser storage, please contact us via our{" "}
              <Link
                href="/support"
                className="text-brand-600 dark:text-brand-400 hover:underline font-semibold focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500 rounded-sm"
              >
                Support Center
              </Link>{" "}
              or email us at{" "}
              <a
                href={`mailto:${contactEmail}`}
                className="font-mono text-xs text-brand-600 dark:text-brand-400 hover:underline bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 px-2 py-1 rounded-md focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                {contactEmail}
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
