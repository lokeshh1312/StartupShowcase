import React from "react";
import Link from "next/link";
import { ArrowLeft, Tag } from "lucide-react";
import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";
import { legalName } from "@/lib/company";

export const metadata: Metadata = createMetadata({
  title: "Pricing & Services | Startup Showcase",
  description:
    "Startup Showcase offers paid startup submission services for founders, entrepreneurs, and authorized representatives worldwide.",
  path: "/pricing",
});

export default function PricingPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Back button */}
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>
      </div>

      {/* Header */}
      <div className="space-y-4 mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs font-medium">
          <Tag className="w-4 h-4" />
          <span>Services & Rates</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Pricing &amp; Services
        </h1>
      </div>

      {/* Content */}
      <div className="space-y-8 text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xs">
        <section className="space-y-3">
          <p>
            Startup Showcase offers paid startup submission services to founders, entrepreneurs, and authorized representatives who want to present their businesses on our platform.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Startup Submission
          </h2>
          <p className="font-semibold text-slate-900 dark:text-white">
            Price: US$10 per startup submission
          </p>
          <p>
            The fee covers the submission and review of one startup profile for potential publication on Startup Showcase.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            What&apos;s Included?
          </h2>
          <ul className="list-disc pl-5 space-y-2 text-slate-700 dark:text-slate-300">
            <li>Submission of one startup profile.</li>
            <li>Review of the information provided.</li>
            <li>Publication on Startup Showcase if the submission is approved.</li>
            <li>A startup profile that visitors can discover on our platform.</li>
            <li>An opportunity to include relevant business information and an official website link, subject to our submission guidelines.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            How It Works
          </h2>
          <ol className="list-decimal pl-5 space-y-2 text-slate-700 dark:text-slate-300">
            <li>Complete the startup submission form.</li>
            <li>Provide accurate startup and contact information.</li>
            <li>Pay the US$10 submission fee.</li>
            <li>Our team reviews your submission.</li>
            <li>If approved, your startup profile is published on the platform.</li>
          </ol>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Pricing Details
          </h2>
          <ul className="list-disc pl-5 space-y-2 text-slate-700 dark:text-slate-300">
            <li>
              <strong>Price:</strong> US$10 per submission.
            </li>
            <li>
              <strong>Currency:</strong> US dollars (USD), as displayed on the checkout page.
            </li>
            <li>
              <strong>Service type:</strong> Digital startup submission and review.
            </li>
            <li>
              <strong>Delivery:</strong> Online.
            </li>
            <li>
              <strong>Physical shipping:</strong> Not applicable.
            </li>
          </ul>
          <p>
            Any applicable taxes or additional charges will be disclosed at checkout before payment.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Important Conditions
          </h2>
          <p>
            Payment does not guarantee acceptance, publication, a particular ranking, or any specific level of visibility.
          </p>
          <p>
            The submission fee does not guarantee investment, fundraising, customer leads, website traffic, sales, or revenue.
          </p>
          <p>
            If a submission is rejected, refund eligibility will be handled according to our{" "}
            <Link
              href="/refunds"
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              Refund &amp; Cancellation Policy
            </Link>{" "}
            and applicable law.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Payment Methods
          </h2>
          <p>
            Payments are accepted through the payment methods displayed at checkout, including Razorpay where available. Transactions are subject to payment-provider verification and processing.
          </p>
          <p>
            For assistance, visit our{" "}
            <Link
              href="/contact"
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              Contact Us page
            </Link>
            .
          </p>
        </section>

        <section className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-1">
          <p>
            <strong>Service Provider:</strong> {legalName}
          </p>
          <p>
            <strong>Platform:</strong> Startup Showcase
          </p>
        </section>
      </div>
    </div>
  );
}

