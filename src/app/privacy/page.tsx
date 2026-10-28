import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Shield, ArrowLeft } from "lucide-react";
import { createMetadata } from "@/lib/seo";
import { legalName, gstin, address, getContactEmail } from "@/lib/company";

export const metadata: Metadata = createMetadata({
  title: "Privacy Policy | Startup Showcase",
  description:
    "Privacy Policy explaining how WAVERISE CONSULTANCY PRIVATE LIMITED collects, uses, stores, and shares information when you use Startup Showcase.",
  path: "/privacy",
});

export default function PrivacyPage() {
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
          <Shield className="w-4 h-4" />
          <span>Data Protection</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Privacy Policy
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Effective Date: 25-10-2026
        </p>
      </div>

      {/* Content */}
      <div className="space-y-8 text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xs">
        <section className="space-y-3">
          <p>
            This Privacy Policy explains how {legalName} (&ldquo;Company&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) collects, uses, stores, and shares information when you use Startup Showcase.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            1. Information We Collect
          </h2>
          <p>
            Depending on how you use the platform, we may collect the following information.
          </p>

          <h3 className="text-base font-bold text-slate-900 dark:text-white pt-2">
            Information You Provide
          </h3>
          <ul className="list-disc pl-5 space-y-2 text-slate-700 dark:text-slate-300">
            <li>Name and email address.</li>
            <li>Account and contact information.</li>
            <li>Startup name, website, country, industry, and business description.</li>
            <li>Logos, images, and other content submitted for publication.</li>
            <li>Messages, feedback, and customer-support requests.</li>
          </ul>

          <h3 className="text-base font-bold text-slate-900 dark:text-white pt-2">
            Transaction Information
          </h3>
          <p>
            We may process order details, service purchased, payment status, transaction references, and relevant billing information.
          </p>
          <p>
            Payments may be processed by Razorpay or another payment provider. We do not intend to store complete payment-card numbers, card security codes, or payment authentication credentials on our platform.
          </p>

          <h3 className="text-base font-bold text-slate-900 dark:text-white pt-2">
            Technical Information
          </h3>
          <p>
            Depending on our website configuration, we may collect technical information such as IP address, browser type, device information, usage logs, and pages visited.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            2. How We Use Information
          </h2>
          <p>We may use information to:</p>
          <ul className="list-disc pl-5 space-y-2 text-slate-700 dark:text-slate-300">
            <li>Create and manage user accounts.</li>
            <li>Review and publish startup submissions.</li>
            <li>Deliver purchased services.</li>
            <li>Process and verify payments.</li>
            <li>Respond to questions and complaints.</li>
            <li>Maintain website security and prevent fraud.</li>
            <li>Improve website functionality and user experience.</li>
            <li>Comply with legal, accounting, tax, and regulatory requirements.</li>
            <li>Send service-related communications.</li>
            <li>Send promotional communications where permitted by law.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            3. Public Startup Information
          </h2>
          <p>
            Information submitted for publication may be visible to visitors and may be indexed by search engines or shared by third parties.
          </p>
          <p>
            Please do not submit confidential or sensitive information that you do not want publicly displayed. You are responsible for ensuring that you have permission to publish information about your startup and its representatives.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            4. Payment Providers and Other Service Providers
          </h2>
          <p>
            We may share relevant information with payment providers, including Razorpay, to process transactions, verify payments, prevent fraud, and handle disputes.
          </p>
          <p>
            We may also use hosting providers, email services, analytics tools, and other service providers to operate our platform. Information is shared as reasonably necessary for the relevant service and subject to applicable legal requirements.
          </p>
          <p>Service providers we currently use include:</p>
          <ul className="list-disc pl-5 space-y-2 text-slate-700 dark:text-slate-300">
            <li>Razorpay – payment processing.</li>
            <li>Supabase – database, user authentication, and file storage.</li>
            <li>Cloudflare Turnstile – spam and bot protection on forms; it may process your IP address and browser signals.</li>
            <li>Resend – delivery of transactional emails.</li>
            <li>Hostinger – website hosting.</li>
          </ul>
          <p>Optional analytics tools are used only if enabled on the website.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            5. Cookies and Similar Technologies
          </h2>
          <p>
            Our website may use cookies or similar technologies for essential functionality, security, preferences, and analytics where implemented.
          </p>
          <p>
            You may manage cookies through your browser settings. Disabling some cookies may affect website functionality.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            6. Data Retention
          </h2>
          <p>
            We retain information for as long as reasonably necessary to operate our platform, provide services, maintain listings, handle disputes, and meet legal and accounting obligations.
          </p>
          <p>
            When information is no longer required, we will take reasonable steps to delete or anonymize it, subject to applicable law.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            7. Data Security
          </h2>
          <p>
            We use reasonable technical and organizational measures intended to protect information against unauthorized access, loss, misuse, or disclosure. However, no internet transmission or electronic storage method can be guaranteed completely secure.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            8. International Processing
          </h2>
          <p>
            Our platform may serve users from different countries. Depending on our hosting and service providers, information may be processed or stored outside your country, subject to applicable legal requirements.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            9. Your Privacy Rights
          </h2>
          <p>
            Depending on applicable law, you may have the right to request access to, correction of, or deletion of personal information, or to raise a grievance concerning its processing.
          </p>
          <p>
            You can contact us using the details below. We may need to verify your identity before responding. Certain records may need to be retained where required by law.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            10. Third-Party Websites
          </h2>
          <p>
            Our website may link to startup websites, social media profiles, and other external services. We are not responsible for their privacy practices. Please review their privacy policies separately.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            11. Children&apos;s Privacy
          </h2>
          <p>
            Startup Showcase is designed for startup discovery and business-related use and is not specifically directed at children. If you believe a child has provided personal information inappropriately, contact us so we can review the matter.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            12. Changes to This Policy
          </h2>
          <p>
            We may update this Privacy Policy from time to time. The latest version will be published on this page with its effective date.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            13. Contact Us
          </h2>
          <p>For privacy questions or requests:</p>
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
