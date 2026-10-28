import React from "react";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";
import {
  legalName,
  gstin,
  address,
  phone,
  website,
  getContactEmail,
} from "@/lib/company";

export const metadata: Metadata = createMetadata({
  title: "Contact Us | Startup Showcase",
  description:
    "Get in touch with Startup Showcase and WAVERISE CONSULTANCY PRIVATE LIMITED for support, submissions, payments, and general queries.",
  path: "/contact",
});

export default function ContactPage() {
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
          <Mail className="w-4 h-4" />
          <span>Support & Enquiries</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Contact Us
        </h1>
      </div>

      {/* Content */}
      <div className="space-y-8 text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xs">
        <section className="space-y-3">
          <p>
            Thank you for visiting Startup Showcase. We welcome questions, feedback, and support requests relating to startup submissions, payments, published profiles, and our platform.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Business Information
          </h2>
          <p>
            <strong>Platform Name:</strong> Startup Showcase
          </p>
          <p>
            <strong>Legal Entity:</strong> {legalName}
          </p>
          <p>
            <strong>GSTIN:</strong> {gstin}
          </p>
          <p>
            <strong>Business Address:</strong> {address}
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
          <p>
            <strong>Phone:</strong>{" "}
            <a
              href={`tel:${phone.replace(/\s+/g, "")}`}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              {phone}
            </a>
          </p>
          <p>
            <strong>Website:</strong>{" "}
            <a
              href={website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              {website}
            </a>
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Contact Us For
          </h2>
          <ul className="list-disc pl-5 space-y-2 text-slate-700 dark:text-slate-300">
            <li>Startup submission and publication queries.</li>
            <li>Submission status and profile corrections.</li>
            <li>Payment confirmations and transaction issues.</li>
            <li>Refund and cancellation requests.</li>
            <li>Privacy-related requests.</li>
            <li>General feedback and complaints.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Customer Support
          </h2>
          <p>
            When contacting us about a payment, please include your order ID or payment reference, registered email address, and a brief explanation of the issue.
          </p>
          <p>We aim to respond within 2 business days.</p>
          <p>
            For your security, do not share passwords, OTPs, or complete payment-card details through email or support messages.
          </p>
          <div className="pt-4">
            <p className="font-bold text-slate-900 dark:text-white">
              {legalName}
            </p>
            <p className="text-slate-600 dark:text-slate-400">
              Operator of Startup Showcase
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

