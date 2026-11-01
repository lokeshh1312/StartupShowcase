import React from "react";
import Link from "next/link";
import { ArrowLeft, Tag } from "lucide-react";
import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";
import { legalName } from "@/lib/company";
import { CloudBackground } from "@/components/ui/cloud-background";

export const metadata: Metadata = createMetadata({
  title: "Pricing & Services | Startup Showcase",
  description:
    "Startup Showcase offers paid startup submission services for founders, entrepreneurs, and authorized representatives worldwide.",
  path: "/pricing",
});

export default function PricingPage() {
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
            <span>Back to Home</span>
          </Link>
        </div>

        {/* Header */}
        <div className="space-y-3 pt-2">
          <div className="flex justify-start">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-semibold tracking-widest uppercase border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-white/5 text-slate-700 dark:text-slate-300 shadow-2xs dark:shadow-none">
              <Tag className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              <span>Services & Rates</span>
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Pricing &amp;{" "}
            <em className="font-serif-italic font-normal text-brand-600 dark:text-brand-400 not-italic-fallback">
              Services
            </em>
          </h1>
        </div>

        {/* Content */}
        <div className="relative bg-white/90 dark:bg-white/[0.03] border border-slate-200/90 dark:border-white/10 rounded-3xl p-6 sm:p-10 shadow-xs backdrop-blur-md space-y-8 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          <section className="space-y-3">
            <p>
              Startup Showcase offers paid startup submission services to founders, entrepreneurs, and authorized representatives who want to present their businesses on our platform.
            </p>
          </section>

          <section className="space-y-3 border-t border-slate-100 dark:border-white/5 pt-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Startup Submission
            </h2>
            <p className="font-semibold text-slate-900 dark:text-white">
              Price: one-time listing fee of Rs 999 (INR, via UPI/QR/cards/netbanking) or $10 USD (international cards) per startup submission
            </p>
            <p>
              The fee covers the submission and review of one startup profile for potential publication on Startup Showcase.
            </p>
          </section>

          <section className="space-y-3 border-t border-slate-100 dark:border-white/5 pt-6">
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

          <section className="space-y-3 border-t border-slate-100 dark:border-white/5 pt-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              How It Works
            </h2>
            <ol className="list-decimal pl-5 space-y-2 text-slate-700 dark:text-slate-300">
              <li>Complete the startup submission form.</li>
              <li>Provide accurate startup and contact information.</li>
              <li>Pay the one-time listing fee of Rs 999 (INR, via UPI/QR/cards/netbanking) or $10 USD (international cards).</li>
              <li>Our team reviews your submission.</li>
              <li>If approved, your startup profile is published on the platform.</li>
            </ol>
          </section>

          <section className="space-y-3 border-t border-slate-100 dark:border-white/5 pt-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Pricing Details
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-slate-700 dark:text-slate-300">
              <li>
                <strong>Price:</strong> one-time listing fee of Rs 999 (INR, via UPI/QR/cards/netbanking) or $10 USD (international cards) per submission.
              </li>
              <li>
                <strong>Currency:</strong> Indian Rupees (INR) or US dollars (USD), as selected on the checkout page.
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

          <section className="space-y-3 border-t border-slate-100 dark:border-white/5 pt-6">
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
                className="text-brand-600 dark:text-brand-400 hover:underline font-medium focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500 rounded-sm"
              >
                Refund &amp; Cancellation Policy
              </Link>{" "}
              (refunds are returned to the original payment method in the same currency) and applicable law.
            </p>
          </section>

          <section className="space-y-3 border-t border-slate-100 dark:border-white/5 pt-6">
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
