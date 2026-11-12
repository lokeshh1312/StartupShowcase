import React from "react";
import Link from "next/link";
import { ArrowLeft, Tag } from "lucide-react";
import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";
import { legalName } from "@/lib/company";
import { PlanCards } from "@/components/plans/plan-cards";

export const metadata: Metadata = createMetadata({
  title: "Pricing & Plans | Startup Showcase",
  description:
    "Transparent, founder-friendly listing plans for early-stage startups worldwide. Startup Listing, Investor Connect, and Investor Ready+Connect.",
  path: "/pricing",
});

export default function PricingPage() {
  return (
    <div className="relative isolate min-h-screen">

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* Back button */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500 rounded-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>
        </div>

        {/* Header */}
        <div className="space-y-3 pt-2 text-center max-w-2xl mx-auto">
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-semibold tracking-widest uppercase border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-white/5 text-slate-700 dark:text-slate-300 shadow-2xs dark:shadow-none">
              <Tag className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              <span>Transparent Pricing</span>
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Transparent, founder-friendly listing plans
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
            Choose the plan that fits your launch goals. One-time payment, no subscriptions.
          </p>
        </div>

        {/* Three Plan Cards */}
        <div className="pt-2 space-y-4">
          <PlanCards mode="pricing" />
          <p className="text-center text-xs text-slate-500 dark:text-slate-400">
            Already listed? You can upgrade to a higher plan any time from My Submissions by paying only the difference.
          </p>
        </div>

        {/* Services & Terms Detail Card */}
        <div className="relative bg-white/90 dark:bg-white/[0.03] border border-slate-200/90 dark:border-white/10 rounded-3xl p-6 sm:p-10 shadow-xs backdrop-blur-md space-y-8 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Listing Services &amp; Fulfilment
            </h2>
            <p>
              Startup Showcase offers paid startup submission and investor enablement services to founders, entrepreneurs, and authorized representatives worldwide.
            </p>
          </section>

          <section className="space-y-3 border-t border-slate-100 dark:border-white/5 pt-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Our Three Plans
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-slate-700 dark:text-slate-300">
              <li>
                <strong>Startup Listing ($9 USD, one time):</strong> Global startup listing, company profile showcase, and global audience visibility on the platform.
              </li>
              <li>
                <strong>Investor Connect ($199 USD, one time):</strong> Everything in Startup Listing, plus investor networking support and 3 investor meetings (subject to investor availability).
              </li>
              <li>
                <strong>Investor Ready+Connect ($999 USD, one time):</strong> Everything in Investor Connect, plus investor readiness support, pitch deck, market research, financial model &amp; fundraising preparation, and 5 investor meetings (subject to investor availability).
              </li>
            </ul>
          </section>

          <section className="space-y-3 border-t border-slate-100 dark:border-white/5 pt-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              How It Works
            </h2>
            <ol className="list-decimal pl-5 space-y-2 text-slate-700 dark:text-slate-300">
              <li>Complete the startup submission form with your venture details.</li>
              <li>Choose your listing plan (Startup Listing, Investor Connect, or Investor Ready+Connect).</li>
              <li>Pay the one-time fee securely in USD via international card through Razorpay.</li>
              <li>Our team reviews your submission for platform standards.</li>
              <li>Once approved, your startup is published live. For Investor Connect and Investor Ready+Connect tiers, our team reaches out directly by email to coordinate your investor readiness and meetings.</li>
            </ol>
          </section>

          <section className="space-y-3 border-t border-slate-100 dark:border-white/5 pt-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Important Conditions
            </h2>
            <p>
              Payment does not guarantee acceptance, publication, a particular ranking, or any specific level of visibility.
            </p>
            <p>
              If a submission is rejected by our moderation team, you will receive a full refund in accordance with our{" "}
              <Link
                href="/refunds"
                className="text-brand-600 dark:text-brand-400 hover:underline font-medium focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500 rounded-sm"
              >
                Refund &amp; Cancellation Policy
              </Link>
              . For higher tiers, once our team has started delivering investor services, that portion is non-refundable.
            </p>
          </section>

          <section className="space-y-3 border-t border-slate-100 dark:border-white/5 pt-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Payment Methods
            </h2>
            <p>
              Payments are processed securely in USD via international credit/debit card powered by Razorpay. Transactions are subject to payment-provider fraud checks and verification.
            </p>
            <p>
              For assistance or questions regarding our plans, visit our{" "}
              <Link
                href="/contact"
                className="text-brand-600 dark:text-brand-400 hover:underline font-medium focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500 rounded-sm"
              >
                Contact Us page
              </Link>
              .
            </p>
          </section>

          <section className="pt-6 border-t border-slate-100 dark:border-white/5 space-y-1">
            <p>
              <strong>Service Provider:</strong> {legalName}
            </p>
            <p>
              <strong>Platform:</strong> Startup Showcase
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
