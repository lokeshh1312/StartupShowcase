import type { Metadata } from "next";
import Link from "next/link";
import { Shield, ArrowLeft } from "lucide-react";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Privacy Policy",
  description:
    "Plain-language privacy policy explaining how we collect, use, and protect your information.",
  path: "/privacy",
});

export default function PrivacyPage() {
  const companyName =
    process.env.NEXT_PUBLIC_COMPANY_NAME?.trim() || "Startup Showcase";
  const contactEmail =
    process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || "contact@startupshowcase.com";

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
          <Shield className="w-4 h-4" />
          <span>Legal & Transparency</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Privacy Policy
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Last updated: October 2026 • Effective Date: October 24, 2026
        </p>
      </div>

      {/* Content */}
      <div className="space-y-8 text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xs">
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            1. Overview & Scope
          </h2>
          <p>
            {companyName} (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) is an open, global discovery and monthly leaderboard platform for early-stage startups, prototypes, and MVPs. We operate internationally and respect your privacy rights regardless of your geographic location.
          </p>
          <p>
            This Privacy Policy explains what personal information we collect, why we collect it, how it is handled, and your choices regarding your data.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            2. Information We Collect
          </h2>
          <p>We collect information in the following categories:</p>
          <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-300">
            <li>
              <strong>Account Information:</strong> When you sign up, we collect your email address, chosen password (cryptographically hashed by Supabase Auth), username, avatar, and optional profile bio. If you sign in via Google OAuth, we receive your email and basic profile details from Google.
            </li>
            <li>
              <strong>Startup Submissions:</strong> When you submit a product, we collect the product name, tagline, description, category, country of origin, website URL, social links, logo, and product screenshots.
            </li>
            <li>
              <strong>Community Activity:</strong> We record your upvotes, bookmarks, and comments submitted on startup profiles to maintain leaderboard integrity and display community discussions.
            </li>
            <li>
              <strong>Newsletter Subscriptions:</strong> If you opt in to our monthly newsletter, we store your email address and subscription timestamp.
            </li>
            <li>
              <strong>Technical & Security Telemetry:</strong> To prevent fraud, vote manipulation, and automated attacks, we process client IP addresses (evaluated through rate-limiting middleware), anonymized view-hash salts for startup view counts, and Cloudflare Turnstile verification tokens.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            3. How We Use Your Information
          </h2>
          <p>We use collected data solely for legitimate platform purposes:</p>
          <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-300">
            <li>To publish and index startup discovery listings and monthly leaderboards.</li>
            <li>To manage your account, authenticate sessions, and deliver email confirmations.</li>
            <li>To enforce rate limits, prevent duplicate voting rings, and detect abusive behavior.</li>
            <li>To send service-critical notifications (password resets, submission approval/rejection notices).</li>
            <li>To send optional monthly digests when you have explicitly subscribed.</li>
          </ul>
          <p className="font-semibold text-slate-900 dark:text-white">
            We do NOT sell, rent, or trade your personal information to third-party data brokers or advertisers.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            4. Service Providers & Subprocessors
          </h2>
          <p>
            We partner with trusted, secure infrastructure providers who process data on our behalf in compliance with industry security standards:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-300">
            <li>
              <strong>Supabase (PostgreSQL Database & Auth):</strong> Hosts our relational database, storage buckets (for logos and screenshots), and user authentication sessions with strict Row Level Security (RLS).
            </li>
            <li>
              <strong>Cloudflare Turnstile:</strong> Provides privacy-conscious CAPTCHA bot protection during account registration and startup submission without tracking users across websites.
            </li>
            <li>
              <strong>Resend:</strong> Delivers transactional authentication emails and monthly digest newsletters.
            </li>
            <li>
              <strong>Privacy Analytics:</strong> When enabled, privacy-friendly analytics (e.g. Plausible) operate without persistent cross-site cookies or fingerprinting.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            5. Your Data Rights (GDPR & Global Standards)
          </h2>
          <p>
            Under GDPR, CCPA, and global privacy frameworks, you hold full control over your personal data:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-300">
            <li>
              <strong>Right of Access & Portability:</strong> You may request a copy of the personal information associated with your account.
            </li>
            <li>
              <strong>Right to Rectification:</strong> You can edit your profile, startup submissions, and comments at any time directly through the platform.
            </li>
            <li>
              <strong>Right to Erasure (&ldquo;Right to be Forgotten&rdquo;):</strong> You may request complete deletion of your account, startups, and comments by contacting support.
            </li>
            <li>
              <strong>Right to Unsubscribe:</strong> Every newsletter email contains a 1-click unsubscribe link that permanently removes your address from the mailing list.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            6. Data Retention & Security
          </h2>
          <p>
            We retain account data for as long as your account remains active. If you delete your account or request data removal, we purge personal records and associated assets, retaining only anonymized platform aggregates required for system integrity.
          </p>
          <p>
            All network communication is encrypted in transit using modern TLS (HTTPS). Database storage is protected by PostgreSQL Row Level Security (RLS) policies, preventing unauthorized cross-tenant data access.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            7. Contact Us
          </h2>
          <p>
            For privacy inquiries, data subject access requests, or deletion notices, please visit our{" "}
            <Link
              href="/support"
              className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
            >
              Support Center
            </Link>{" "}
            or email us at{" "}
            <a
              href={`mailto:${contactEmail}`}
              className="font-mono text-xs text-blue-600 dark:text-blue-400 hover:underline bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded"
            >
              {contactEmail}
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
