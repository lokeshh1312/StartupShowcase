import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Shield, ArrowLeft } from "lucide-react";
import { createMetadata } from "@/lib/seo";
import { getContactEmail, website } from "@/lib/company";

export const metadata: Metadata = createMetadata({
  title: "Privacy Policy | Startup Showcase Global",
  description:
    "At Startup Showcase Global, we respect your privacy and are committed to protecting your personal information. Review our privacy practices.",
  path: "/privacy",
});

export default function PrivacyPage() {
  const contactEmail = getContactEmail();

  return (
    <div className="relative isolate min-h-screen">
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
              <Shield className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              <span>Data Protection</span>
            </div>
          </div>
          <h1 className="text-[30px] sm:text-[36px] font-semibold leading-[1.15] text-slate-900 dark:text-white tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Last Updated: November 2026
          </p>
        </div>

        {/* Content */}
        <div className="relative bg-white/90 dark:bg-white/[0.03] border border-slate-200/90 dark:border-white/10 rounded-3xl p-6 sm:p-10 shadow-xs backdrop-blur-md space-y-8 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          <section className="space-y-3">
            <p>
              At <strong>Startup Showcase Global</strong>, we respect your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, store, and protect your information when you visit our website or use our services.
            </p>
          </section>

          <section className="space-y-3 border-t border-slate-100 dark:border-white/5 pt-6">
            <h2 className="text-[22px] sm:text-[24px] font-semibold leading-snug text-slate-900 dark:text-white">
              1. Information We Collect
            </h2>
            <p>We may collect the following information:</p>
            <ul className="list-disc pl-5 space-y-2 text-slate-700 dark:text-slate-300">
              <li>Personal details such as name, email address, and contact number.</li>
              <li>Startup information, including company name, website, business description, and industry.</li>
              <li>Account registration and login information.</li>
              <li>Payment and transaction details.</li>
              <li>Information submitted through contact forms and customer support requests.</li>
              <li>Technical information such as IP address, browser type, and website usage data.</li>
            </ul>
          </section>

          <section className="space-y-3 border-t border-slate-100 dark:border-white/5 pt-6">
            <h2 className="text-[22px] sm:text-[24px] font-semibold leading-snug text-slate-900 dark:text-white">
              2. How We Use Your Information
            </h2>
            <p>We use collected information to:</p>
            <ul className="list-disc pl-5 space-y-2 text-slate-700 dark:text-slate-300">
              <li>Create and manage user accounts.</li>
              <li>Process startup submissions and publish approved listings.</li>
              <li>Provide startup showcase and promotional services.</li>
              <li>Facilitate investor networking and introductions.</li>
              <li>Process payments and manage transactions.</li>
              <li>Respond to enquiries and provide customer support.</li>
              <li>Improve our website, services, and user experience.</li>
              <li>Send important service updates and relevant communications.</li>
            </ul>
          </section>

          <section className="space-y-3 border-t border-slate-100 dark:border-white/5 pt-6">
            <h2 className="text-[22px] sm:text-[24px] font-semibold leading-snug text-slate-900 dark:text-white">
              3. Information Sharing
            </h2>
            <p>
              We do not sell or rent your personal information to third parties.
            </p>
            <p>
              However, we may share relevant information with trusted service providers, payment processors, technology partners, and investor networks when necessary to deliver our services.
            </p>
            <p>
              Startup information submitted for public listing may be displayed on our website and accessible to visitors.
            </p>
          </section>

          <section className="space-y-3 border-t border-slate-100 dark:border-white/5 pt-6">
            <h2 className="text-[22px] sm:text-[24px] font-semibold leading-snug text-slate-900 dark:text-white">
              4. Payment Security
            </h2>
            <p>
              Payments made through our website are processed using secure third-party payment gateways. We do not intentionally store complete payment card details on our servers.
            </p>
            <p>
              Payment processing is subject to the respective payment provider&apos;s privacy and security policies.
            </p>
          </section>

          <section className="space-y-3 border-t border-slate-100 dark:border-white/5 pt-6">
            <h2 className="text-[22px] sm:text-[24px] font-semibold leading-snug text-slate-900 dark:text-white">
              5. Cookies and Tracking
            </h2>
            <p>
              Our website may use cookies and similar technologies to improve website functionality, understand visitor activity, remember preferences, and enhance user experience.
            </p>
            <p>
              You can manage or disable cookies through your browser settings.
            </p>
          </section>

          <section className="space-y-3 border-t border-slate-100 dark:border-white/5 pt-6">
            <h2 className="text-[22px] sm:text-[24px] font-semibold leading-snug text-slate-900 dark:text-white">
              6. Data Security
            </h2>
            <p>
              We implement reasonable technical and organizational security measures to protect your information against unauthorized access, misuse, alteration, or disclosure.
            </p>
            <p>
              However, no online platform or electronic transmission can guarantee complete security.
            </p>
          </section>

          <section className="space-y-3 border-t border-slate-100 dark:border-white/5 pt-6">
            <h2 className="text-[22px] sm:text-[24px] font-semibold leading-snug text-slate-900 dark:text-white">
              7. Data Retention
            </h2>
            <p>
              We retain personal information only for as long as necessary to provide our services, fulfill business purposes, maintain records, and comply with applicable requirements.
            </p>
          </section>

          <section className="space-y-3 border-t border-slate-100 dark:border-white/5 pt-6">
            <h2 className="text-[22px] sm:text-[24px] font-semibold leading-snug text-slate-900 dark:text-white">
              8. Your Privacy Rights
            </h2>
            <p>You may request to:</p>
            <ul className="list-disc pl-5 space-y-2 text-slate-700 dark:text-slate-300">
              <li>Access your personal information.</li>
              <li>Correct inaccurate information.</li>
              <li>Update your account details.</li>
              <li>Request deletion of your personal information, subject to applicable legal and operational requirements.</li>
              <li>Opt out of promotional communications.</li>
            </ul>
            <p className="pt-2">
              For privacy-related requests, please contact our{" "}
              <Link
                href="/support"
                className="text-brand-600 dark:text-brand-400 hover:underline font-medium focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500 rounded-sm"
              >
                support team
              </Link>
              .
            </p>
          </section>

          <section className="space-y-3 border-t border-slate-100 dark:border-white/5 pt-6">
            <h2 className="text-[22px] sm:text-[24px] font-semibold leading-snug text-slate-900 dark:text-white">
              9. Third-Party Websites
            </h2>
            <p>
              Our website may contain links to external websites, including startup websites, investor platforms, and payment providers. We are not responsible for the privacy practices or content of these third-party websites.
            </p>
            <p>
              We encourage users to review their respective privacy policies.
            </p>
          </section>

          <section className="space-y-3 border-t border-slate-100 dark:border-white/5 pt-6">
            <h2 className="text-[22px] sm:text-[24px] font-semibold leading-snug text-slate-900 dark:text-white">
              10. Children&apos;s Privacy
            </h2>
            <p>
              Our services are not intended for children under the age of 14. We do not knowingly collect personal information from children.
            </p>
          </section>

          <section className="space-y-3 border-t border-slate-100 dark:border-white/5 pt-6">
            <h2 className="text-[22px] sm:text-[24px] font-semibold leading-snug text-slate-900 dark:text-white">
              11. Changes to This Privacy Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time to reflect changes in our services, practices, or applicable requirements. Any updates will be published on this page with a revised update date.
            </p>
          </section>

          <section className="space-y-3 border-t border-slate-100 dark:border-white/5 pt-6">
            <h2 className="text-[22px] sm:text-[24px] font-semibold leading-snug text-slate-900 dark:text-white">
              12. Contact Us
            </h2>
            <p>
              If you have questions, concerns, or requests regarding this Privacy Policy, please contact us:
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
            <p>
              <strong>Email:</strong>{" "}
              <a
                href={`mailto:${contactEmail}`}
                className="text-brand-600 dark:text-brand-400 hover:underline focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500 rounded-sm"
              >
                {contactEmail}
              </a>
            </p>
            <p className="pt-2 text-xs text-slate-500 dark:text-slate-400">
              By using Startup Showcase Global, you acknowledge that you have read and understood this Privacy Policy.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
