import React from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw } from "lucide-react";
import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";
import { legalName, gstin, address, getContactEmail } from "@/lib/company";
import { CloudBackground } from "@/components/ui/cloud-background";

export const metadata: Metadata = createMetadata({
  title: "Refund & Cancellation Policy | Startup Showcase",
  description:
    "Refund and Cancellation Policy for startup submission services on Startup Showcase, operated by WAVERISE CONSULTANCY PRIVATE LIMITED.",
  path: "/refunds",
});

export default function RefundsPage() {
  const contactEmail = getContactEmail();

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
              <RefreshCw className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              <span>Refund Guidelines</span>
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Refund &amp;{" "}
            <em className="font-serif-italic font-normal text-brand-600 dark:text-brand-400 not-italic-fallback">
              Cancellation
            </em>{" "}
            Policy
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Effective Date: 25-10-2026
          </p>
        </div>

        {/* Content */}
        <div className="relative bg-white/90 dark:bg-white/[0.03] border border-slate-200/90 dark:border-white/10 rounded-3xl p-6 sm:p-10 shadow-xs backdrop-blur-md space-y-8 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          <section className="space-y-3">
            <p>
              This policy applies to startup submission services purchased through Startup Showcase, operated by {legalName}.
            </p>
          </section>

          <section className="space-y-3 border-t border-slate-100 dark:border-white/5 pt-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              1. Service and Price
            </h2>
            <p>
              The standard fee is a <strong>one-time listing fee of Rs 999 (INR, via UPI/QR/cards/netbanking) or $10 USD (international cards)</strong>, as displayed on the checkout page.
            </p>
            <p>
              The service includes the submission and review of one startup profile for potential publication. It is a digital service; no physical product is shipped.
            </p>
          </section>

          <section className="space-y-3 border-t border-slate-100 dark:border-white/5 pt-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              2. Refund Eligibility
            </h2>
            <p>
              You may contact us to request a refund review in circumstances including:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-700 dark:text-slate-300">
              <li>Duplicate payment for the same order.</li>
              <li>Successful payment but non-delivery of the purchased service.</li>
              <li>Our inability to provide a service that we accepted payment for.</li>
              <li>An incorrectly processed or unauthorized transaction.</li>
              <li>Any other circumstance where a refund is required by applicable law.</li>
            </ul>
            <p>
              Refund requests will be assessed based on the transaction, the service status, the reason for the request, and applicable law.
            </p>
          </section>

          <section className="space-y-3 border-t border-slate-100 dark:border-white/5 pt-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              3. Rejected Startup Submissions
            </h2>
            <p>Payment does not guarantee publication.</p>
            <p>
              If your startup submission is rejected, you are entitled to a full refund of the submission fee. Refunds are returned to the original payment method in the same currency. This does not apply where the submission was rejected because it involved fraud, spam, deliberately misleading or unlawful content, or another serious breach of our Terms &amp; Conditions.
            </p>
            <p>
              You do not need to request this separately in most cases: we will start the refund to your original payment method after rejecting the submission. If you have not received a refund, contact us with your order ID and we will review it.
            </p>
          </section>

          <section className="space-y-3 border-t border-slate-100 dark:border-white/5 pt-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              4. Cancellation Requests
            </h2>
            <p>
              If you wish to cancel a submission, contact us as soon as possible.
            </p>
            <p>
              We will review the request based on whether the service has been reviewed, published, activated, or otherwise delivered. A change of mind after service delivery may not qualify for a refund, subject to applicable law and the terms shown at checkout.
            </p>
          </section>

          <section className="space-y-3 border-t border-slate-100 dark:border-white/5 pt-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              5. Failed or Pending Payments
            </h2>
            <p>
              If an amount has been deducted but your order is not confirmed, contact us with your transaction reference.
            </p>
            <p>
              We will check the payment status and coordinate the appropriate resolution where necessary. Reversals and refunds may take additional time depending on the payment provider and bank.
            </p>
          </section>

          <section className="space-y-3 border-t border-slate-100 dark:border-white/5 pt-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              6. How to Request a Refund
            </h2>
            <p>
              Email{" "}
              <a
                href={`mailto:${contactEmail}`}
                className="text-brand-600 dark:text-brand-400 hover:underline focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500 rounded-sm"
              >
                {contactEmail}
              </a>{" "}
              with:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-700 dark:text-slate-300">
              <li>Your name and registered email address.</li>
              <li>Order ID or payment reference.</li>
              <li>Payment date and amount.</li>
              <li>Reason for your request.</li>
              <li>Relevant supporting details, if necessary.</li>
            </ul>
            <p>Never send your password, OTP, or complete card details.</p>
          </section>

          <section className="space-y-3 border-t border-slate-100 dark:border-white/5 pt-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              7. Refund Processing
            </h2>
            <p>
              If a refund is approved, we will initiate it through the applicable payment provider or payment method where possible. Refunds are returned to the original payment method in the same currency.
            </p>
            <p>
              The time required for the funds to appear in your account depends on the payment provider, bank, and payment method. We will communicate any available updates.
            </p>
          </section>

          <section className="space-y-3 border-t border-slate-100 dark:border-white/5 pt-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              8. Statutory Rights
            </h2>
            <p>
              Nothing in this policy limits any consumer, cancellation, or refund rights that cannot legally be excluded under applicable law.
            </p>
          </section>

          <section className="space-y-3 border-t border-slate-100 dark:border-white/5 pt-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              9. Contact Details
            </h2>
            <p>
              <strong>{legalName}</strong>
            </p>
            <p>
              <strong>GSTIN:</strong> {gstin}
            </p>
            <p>
              <strong>Address:</strong> {address}
            </p>
            <p>
              <strong>Email:</strong>{" "}
              <a
                href={`mailto:${contactEmail}`}
                className="text-brand-600 dark:text-brand-400 hover:underline focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500 rounded-sm"
              >
                {contactEmail}
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
