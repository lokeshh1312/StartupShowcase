import React from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, ShieldCheck, RefreshCw, Mail } from "lucide-react";
import { getSubmissionPriceCents, formatSubmissionPriceUsd } from "@/server/razorpay";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy | Startup Showcase",
  description:
    "Plain-language refund and cancellation policy for Startup Showcase submission listing fees.",
  openGraph: {
    title: "Refund & Cancellation Policy | Startup Showcase",
    description:
      "Plain-language refund and cancellation policy for Startup Showcase submission listing fees.",
  },
};

export default function RefundsPage() {
  const formattedPrice = formatSubmissionPriceUsd(getSubmissionPriceCents());
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* Back button */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Home</span>
      </Link>

      {/* Header */}
      <div className="space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Refund &amp; Cancellation Policy
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Last updated: October 2026 &bull; Plain-language guidelines for submission fees
        </p>
      </div>

      {/* Draft Notice Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs leading-relaxed">
          <p className="font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
            Draft Policy — Subject to Legal Review
          </p>
          <p>
            This document outlines our operational refund and cancellation procedures in plain
            language. It is currently a draft pending final counsel review and is published for
            transparency with founders and visitors.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="prose prose-slate dark:prose-invert max-w-none space-y-8 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>1. What the Listing Fee Covers</span>
          </h2>
          <p>
            Startup Showcase charges a one-time listing fee of exactly <strong>{formattedPrice}</strong> for
            each submitted startup. This fee supports:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs">
            <li>Editorial and compliance review by human moderators</li>
            <li>Anti-spam, malware, and authenticity checks</li>
            <li>Permanent public directory listing upon approval</li>
            <li>Eligibility for the monthly global leaderboard and community voting</li>
          </ul>
          <p>
            Prices are authoritative on our server in USD. We do not charge recurring subscriptions or
            hidden renewal fees.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>2. Refund Terms and Eligibility</span>
          </h2>
          <p>
            We strive to be transparent and fair with every founder:
          </p>
          <div className="space-y-3 pl-2 border-l-2 border-slate-200 dark:border-slate-700">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-xs">A. Moderation Rejections</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                If your submission is reviewed and rejected by our team for reasons other than bad-faith abuse
                or illegal content, a full refund ({formattedPrice}) may be requested or issued at our discretion.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-xs">B. Voluntary Withdrawal Prior to Review</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                If you have submitted payment and wish to withdraw your startup before our moderators have
                begun review, you can contact us to request a full refund.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-xs">C. Post-Approval Edits</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Once a startup is approved and live on the public directory, future profile updates and edits
                are always free of charge. Approved submissions cannot be self-deleted, but founders can
                contact support to request delisting.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            3. How Refunds Are Processed
          </h2>
          <p>
            All refunds are issued directly through our payment processor, <strong>Razorpay</strong>, back to
            the original payment method (credit/debit card, bank transfer, or supported wallet).
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs">
            <li><strong>Processing Timeline:</strong> Once processed by our team, refunds typically appear in your account within 5 to 10 business days, depending on your bank or card issuer.</li>
            <li><strong>Directory Status:</strong> When a refund is processed, the associated startup submission is automatically withdrawn with the status marked as &ldquo;Rejected&rdquo; and reason &ldquo;Refunded&rdquo;.</li>
            <li><strong>Audit Logging:</strong> Every refund is recorded in our system audit log with the corresponding Razorpay payment and event identifiers.</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            4. Cancellation of Unpaid Drafts
          </h2>
          <p>
            If you start a submission and do not complete payment, your project remains in the
            &ldquo;Awaiting Payment&rdquo; state. You can freely delete unpaid drafts at any time directly
            from your <Link href="/me/submissions" className="text-blue-600 dark:text-blue-400 underline">My Submissions</Link> dashboard without incurring any charge.
          </p>
          <p className="text-xs text-slate-500">
            Unpaid drafts older than 7 days may be periodically cleaned up by automated system maintenance.
          </p>
        </section>

        {/* Section 5 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            5. Payment Processing &amp; Card Security
          </h2>
          <p>
            All payments are securely handled by our third-party payment partner, <strong>Razorpay</strong>.
            Startup Showcase <strong>never receives, processes, or stores your credit card numbers, CVVs, or sensitive banking details</strong> on our servers. All transactions are encrypted with bank-level TLS encryption.
          </p>
        </section>

        {/* Section 6 */}
        <section className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Have Questions or Need a Refund?</span>
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            If you have questions about a payment, want to request a refund, or need assistance with your submission, please contact us at:
          </p>
          <p className="text-xs font-mono font-semibold text-blue-600 dark:text-blue-400">
            support@startupshowcase.org
          </p>
          <p className="text-[11px] text-slate-400">
            Please include your registered email address and startup name in your message so we can look up your record quickly.
          </p>
        </section>
      </div>
    </div>
  );
}
