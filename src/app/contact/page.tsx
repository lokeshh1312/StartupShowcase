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
import { CloudBackground } from "@/components/ui/cloud-background";

export const metadata: Metadata = createMetadata({
  title: "Contact Us | Startup Showcase",
  description:
    "Get in touch with Startup Showcase and WAVERISE CONSULTANCY PRIVATE LIMITED for support, submissions, payments, and general queries.",
  path: "/contact",
});

export default function ContactPage() {
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
              <Mail className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              <span>Support & Enquiries</span>
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Contact{" "}
            <em className="font-serif-italic font-normal text-brand-600 dark:text-brand-400 not-italic-fallback">
              Us
            </em>
          </h1>
        </div>

        {/* Content */}
        <div className="relative bg-white/90 dark:bg-white/[0.03] border border-slate-200/90 dark:border-white/10 rounded-3xl p-6 sm:p-10 shadow-xs backdrop-blur-md space-y-8 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          <section className="space-y-3">
            <p>
              Thank you for visiting Startup Showcase. We welcome questions, feedback, and support requests relating to startup submissions, payments, published profiles, and our platform.
            </p>
          </section>

          <section className="space-y-3 border-t border-slate-100 dark:border-white/5 pt-6">
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
                className="text-brand-600 dark:text-brand-400 hover:underline focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500 rounded-sm"
              >
                {contactEmail}
              </a>
            </p>
            <p>
              <strong>Phone:</strong>{" "}
              <a
                href={`tel:${phone.replace(/\s+/g, "")}`}
                className="text-brand-600 dark:text-brand-400 hover:underline focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500 rounded-sm"
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
                className="text-brand-600 dark:text-brand-400 hover:underline focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500 rounded-sm"
              >
                {website}
              </a>
            </p>
          </section>

          <section className="space-y-3 border-t border-slate-100 dark:border-white/5 pt-6">
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

          <section className="space-y-3 border-t border-slate-100 dark:border-white/5 pt-6">
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
    </div>
  );
}
