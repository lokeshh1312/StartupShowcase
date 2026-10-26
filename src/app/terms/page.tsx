import type { Metadata } from "next";
import Link from "next/link";
import { FileText, ArrowLeft } from "lucide-react";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Terms of Service",
  description:
    "Plain-language terms of service governing platform access, startup listings, voting, and community guidelines.",
  path: "/terms",
});

export default function TermsPage() {
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
          <FileText className="w-4 h-4" />
          <span>Platform Terms</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Terms of Service
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Last updated: October 2026 • Effective Date: October 24, 2026
        </p>
      </div>

      {/* Content */}
      <div className="space-y-8 text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xs">
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            1. Acceptance of Terms
          </h2>
          <p>
            By accessing or using {companyName} (&ldquo;the Platform&rdquo;), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the website or submit content.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            2. User Accounts & Responsibilities
          </h2>
          <p>
            To submit startups, leave comments, upvote, or save favorites, you must create an account. You are responsible for:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-300">
            <li>Providing accurate, current contact and identity details.</li>
            <li>Maintaining the confidentiality of your account credentials.</li>
            <li>All activities that occur under your account.</li>
            <li>Promptly notifying us if you suspect unauthorized access.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            3. Founder Submissions & Content Guidelines
          </h2>
          <p>
            {companyName} exists to celebrate early-stage startups and prototypes worldwide. When submitting a startup:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-300">
            <li>
              <strong>Authorization:</strong> You must be a founder, co-founder, or designated representative authorized to list the startup.
            </li>
            <li>
              <strong>Truthfulness:</strong> All descriptions, metrics, categories, countries of origin, and links must be accurate and not misleading.
            </li>
            <li>
              <strong>Prohibited Content:</strong> You may not submit products that facilitate illegal activity, malware, phishing, hate speech, unauthorized cryptocurrency schemes, or explicit material.
            </li>
            <li>
              <strong>Editorial Review:</strong> We review all submissions prior to publication. We reserve the right to approve, reject, categorize, or remove any startup at our discretion to maintain directory quality.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            4. Voting & Monthly Leaderboard Integrity
          </h2>
          <p>
            Our monthly cohort leaderboards reward genuine community engagement and product discovery:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-300">
            <li>
              <strong>One Vote per Startup:</strong> Registered users may cast one vote per startup.
            </li>
            <li>
              <strong>No Manipulation:</strong> Automated scripts, bot farms, paid upvote services, or coordinated fake account rings are strictly prohibited.
            </li>
            <li>
              <strong>Disqualification:</strong> Any startup found engaging in artificial vote manipulation may have votes purged or be disqualified and delisted from the leaderboard.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            5. Community Conduct & Comments
          </h2>
          <p>
            Constructive founder feedback is the foundation of our community. Comments containing harassment, spam, defamatory remarks, affiliate link stuffing, or personal attacks will be removed, and repeat offenders may be banned.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            6. Fees, Payments &amp; Payment Processing
          </h2>
          <p>
            Startup submissions require a one-time review and listing fee of $10.00 USD. All payments are
            processed by our third-party payment partner, <strong>Razorpay</strong>.
          </p>
          <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-300">
            <li>
              <strong>No Card Data Storage:</strong> Startup Showcase <strong>never receives, handles, or stores your credit or debit card numbers, CVVs, or sensitive payment credentials</strong> on our systems. All card processing is conducted securely by Razorpay.
            </li>
            <li>
              <strong>Currency:</strong> All fees are billed strictly in USD ($10.00 USD).
            </li>
            <li>
              <strong>Refunds &amp; Cancellations:</strong> Submission fees are governed by our plain-language{" "}
              <Link href="/refunds" className="text-blue-600 dark:text-blue-400 font-semibold underline">
                Refund &amp; Cancellation Policy
              </Link>
              . Unpaid draft submissions may be deleted at any time from your dashboard without charge.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            7. Intellectual Property &amp; License
          </h2>
          <p>
            Founders retain full ownership of their trademarks, logos, and submitted copy. By submitting a startup, you grant {companyName} a non-exclusive, worldwide, royalty-free license to display, promote, index, and feature your product information across the Platform and our monthly newsletters.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            8. Disclaimers &amp; Limitation of Liability
          </h2>
          <p>
            {companyName} is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis. We do not provide investment, financial, legal, or business advice. We do not endorse any submitted product or guarantee the accuracy of claims made by founders.
          </p>
          <p>
            To the maximum extent permitted by applicable law, {companyName} shall not be liable for any indirect, incidental, or consequential damages resulting from your use of the platform.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            9. Termination &amp; Changes
          </h2>
          <p>
            We may suspend or terminate your account or access at any time for violations of these Terms. We reserve the right to modify these terms with reasonable notice posted on the platform.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            10. Contact
          </h2>
          <p>
            Questions regarding these Terms of Service should be directed to our{" "}
            <Link
              href="/support"
              className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
            >
              Support Center
            </Link>{" "}
            or emailed to{" "}
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
