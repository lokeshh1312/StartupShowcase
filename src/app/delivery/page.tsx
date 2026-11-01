import React from "react";
import Link from "next/link";
import { ArrowLeft, Truck } from "lucide-react";
import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";
import { legalName, gstin, address, getContactEmail } from "@/lib/company";

export const metadata: Metadata = createMetadata({
  title: "Delivery Policy | Startup Showcase",
  description:
    "Delivery Policy for digital startup submission services on Startup Showcase, operated by WAVERISE CONSULTANCY PRIVATE LIMITED.",
  path: "/delivery",
});

export default function DeliveryPage() {
  const contactEmail = getContactEmail();

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
          <Truck className="w-4 h-4" />
          <span>Fulfillment & Delivery</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Delivery Policy
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Effective Date: 25-10-2026
        </p>
      </div>

      {/* Content */}
      <div className="space-y-8 text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xs">
        <section className="space-y-3">
          <p>
            Startup Showcase is a digital platform operated by {legalName}. Our startup submission service is delivered online. We do not ship physical goods as part of this service.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            1. What We Deliver
          </h2>
          <p>
            For a one-time listing fee of Rs 999 (INR, via UPI/QR/cards/netbanking) or $10 USD (international cards), the service includes:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-slate-700 dark:text-slate-300">
            <li>Receipt of one startup submission.</li>
            <li>Review of the information provided.</li>
            <li>Publication of the startup profile if approved.</li>
          </ul>
          <p>
            The service does not include physical products or courier delivery.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            2. Submission and Review
          </h2>
          <p>
            After completing the submission form and making a successful payment, you may receive an order or payment confirmation.
          </p>
          <p>
            Our team reviews the submitted information. Publication is subject to approval and compliance with our submission requirements.
          </p>
          <p>
            Payment confirmation alone does not mean the startup profile has been approved or published.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            3. Delivery Timeline
          </h2>
          <p>
            We will make reasonable efforts to review and process submissions within 3 business days after successful payment and receipt of all required information.
          </p>
          <p>
            If a specific timeline is displayed on the checkout page, that timeline will apply to the relevant purchase, subject to any disclosed conditions.
          </p>
          <p>
            Delays may occur if the submitted information is incomplete, inaccurate, or requires clarification.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            4. Delivery Method
          </h2>
          <p>
            The service is delivered electronically through the website and, where applicable, through email or account notifications.
          </p>
          <p>
            Once approved, the startup profile will be published on the platform according to the applicable listing format.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            5. Customer Responsibilities
          </h2>
          <p>
            You must provide accurate and complete information, including any required startup description, website, category, country, and contact information.
          </p>
          <p>
            You must also have permission to submit any logos, images, or other materials included in the profile.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            6. Delayed or Missing Service
          </h2>
          <p>
            If your startup submission has not been reviewed or delivered within the stated timeframe, contact us with your order ID and payment reference.
          </p>
          <p>
            We will investigate and provide an update or appropriate resolution in accordance with our{" "}
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
            7. Shipping Charges
          </h2>
          <p>
            No physical shipping or courier charges apply to the standard digital startup submission service.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            8. Contact Details
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
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              {contactEmail}
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}

