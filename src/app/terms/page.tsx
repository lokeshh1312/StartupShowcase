import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { FileText, ArrowLeft } from "lucide-react";
import { createMetadata } from "@/lib/seo";
import { getContactEmail, website } from "@/lib/company";

export const metadata: Metadata = createMetadata({
  title: "Terms & Conditions | Startup Showcase Global",
  description:
    "Terms & Conditions governing access to and use of Startup Showcase Global. Please read them carefully before using our services.",
  path: "/terms",
});

export default function TermsPage() {
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
              <FileText className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              <span>Legal Agreement</span>
            </div>
          </div>
          <h1 className="text-[30px] sm:text-[36px] font-semibold leading-[1.15] text-slate-900 dark:text-white tracking-tight">
            Terms &amp; Conditions
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Last Updated: November 2026
          </p>
        </div>

        {/* Content */}
        <div className="relative bg-white/90 dark:bg-white/[0.03] border border-slate-200/90 dark:border-white/10 rounded-3xl p-6 sm:p-10 shadow-xs backdrop-blur-md space-y-8 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          <section className="space-y-3">
            <p>
              Welcome to <strong>Startup Showcase Global</strong>. By accessing or using our website (
              <a
                href={website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-600 dark:text-brand-400 hover:underline focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500 rounded-sm"
              >
                {website}
              </a>
              ), you agree to comply with these Terms &amp; Conditions. Please read them carefully before using our services.
            </p>
          </section>

          <section className="space-y-3 border-t border-slate-100 dark:border-white/5 pt-6">
            <h2 className="text-[22px] sm:text-[24px] font-semibold leading-snug text-slate-900 dark:text-white">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing our website, creating an account, submitting a startup, or purchasing any service, you agree to these Terms &amp; Conditions and our{" "}
              <Link
                href="/privacy"
                className="text-brand-600 dark:text-brand-400 hover:underline font-medium focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500 rounded-sm"
              >
                Privacy Policy
              </Link>
              .
            </p>
            <p>
              If you do not agree with these terms, please discontinue using our website and services.
            </p>
          </section>

          <section className="space-y-3 border-t border-slate-100 dark:border-white/5 pt-6">
            <h2 className="text-[22px] sm:text-[24px] font-semibold leading-snug text-slate-900 dark:text-white">
              2. Our Services
            </h2>
            <p>Startup Showcase Global provides a platform for:</p>
            <ul className="list-disc pl-5 space-y-2 text-slate-700 dark:text-slate-300">
              <li>Showcasing startups and innovative business ideas.</li>
              <li>Promoting startup visibility and online presence.</li>
              <li>Providing startup listing and promotional opportunities.</li>
              <li>Facilitating investor networking and introductions.</li>
              <li>Offering investor readiness and related support services.</li>
            </ul>
            <p>
              We reserve the right to modify, improve, or discontinue any service when necessary.
            </p>
          </section>

          <section className="space-y-3 border-t border-slate-100 dark:border-white/5 pt-6">
            <h2 className="text-[22px] sm:text-[24px] font-semibold leading-snug text-slate-900 dark:text-white">
              3. User Registration
            </h2>
            <p>
              Users must provide accurate and complete information while registering or submitting a startup.
            </p>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials and all activities performed through your account.
            </p>
            <p>
              We reserve the right to suspend or terminate accounts containing false, misleading, or inappropriate information.
            </p>
          </section>

          <section className="space-y-3 border-t border-slate-100 dark:border-white/5 pt-6">
            <h2 className="text-[22px] sm:text-[24px] font-semibold leading-snug text-slate-900 dark:text-white">
              4. Startup Submission and Approval
            </h2>
            <p>Users submitting startups must ensure that:</p>
            <ul className="list-disc pl-5 space-y-2 text-slate-700 dark:text-slate-300">
              <li>All submitted information is accurate and authentic.</li>
              <li>They have the necessary rights to submit company details, logos, images, and other materials.</li>
              <li>Their submissions do not violate intellectual property rights or applicable laws.</li>
              <li>Their startup descriptions do not contain misleading or fraudulent claims.</li>
            </ul>
            <p>
              We reserve the right to review, reject, edit, suspend, or remove any startup submission that violates our policies or quality standards.
            </p>
          </section>

          <section className="space-y-3 border-t border-slate-100 dark:border-white/5 pt-6">
            <h2 className="text-[22px] sm:text-[24px] font-semibold leading-snug text-slate-900 dark:text-white">
              5. Payments and Pricing
            </h2>
            <p>
              All paid services are subject to the prices displayed on our website at the time of purchase.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-700 dark:text-slate-300">
              <li>Payments must be completed through the available payment methods.</li>
              <li>Services will be processed after successful payment confirmation.</li>
              <li>Any applicable taxes or additional charges will be communicated during checkout.</li>
              <li>We reserve the right to update service prices and packages.</li>
            </ul>
          </section>

          <section className="space-y-3 border-t border-slate-100 dark:border-white/5 pt-6">
            <h2 className="text-[22px] sm:text-[24px] font-semibold leading-snug text-slate-900 dark:text-white">
              6. Investor Connections and Funding Disclaimer
            </h2>
            <p>
              Startup Showcase Global may facilitate introductions between startups and potential investors.
            </p>
            <p>However:</p>
            <ul className="list-disc pl-5 space-y-2 text-slate-700 dark:text-slate-300">
              <li>We do not guarantee funding, investment, or financial returns.</li>
              <li>Investor meetings are subject to investor availability and mutual agreement.</li>
              <li>Investment decisions are made independently by investors.</li>
              <li>We do not guarantee that any investor will invest in a listed startup.</li>
              <li>Founders are responsible for conducting their own due diligence before entering into investment agreements.</li>
            </ul>
            <p>
              Our platform provides networking and facilitation services and does not act as a financial advisor or investment intermediary.
            </p>
          </section>

          <section className="space-y-3 border-t border-slate-100 dark:border-white/5 pt-6">
            <h2 className="text-[22px] sm:text-[24px] font-semibold leading-snug text-slate-900 dark:text-white">
              7. Refund and Cancellation
            </h2>
            <p>
              Refunds and cancellations are governed by our separate{" "}
              <Link
                href="/refunds"
                className="text-brand-600 dark:text-brand-400 hover:underline font-medium focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500 rounded-sm"
              >
                Refund &amp; Cancellation Policy
              </Link>
              .
            </p>
            <p>
              Users are encouraged to review that policy before purchasing any service.
            </p>
          </section>

          <section className="space-y-3 border-t border-slate-100 dark:border-white/5 pt-6">
            <h2 className="text-[22px] sm:text-[24px] font-semibold leading-snug text-slate-900 dark:text-white">
              8. Intellectual Property
            </h2>
            <p>
              All website content, including branding, graphics, text, design elements, and platform materials, belongs to Startup Showcase Global or its respective content owners.
            </p>
            <p>
              Users retain ownership of their submitted startup information and intellectual property.
            </p>
            <p>
              By submitting content, you grant us a non-exclusive, worldwide, royalty-free license to display, promote, and distribute that content for providing and marketing our services.
            </p>
          </section>

          <section className="space-y-3 border-t border-slate-100 dark:border-white/5 pt-6">
            <h2 className="text-[22px] sm:text-[24px] font-semibold leading-snug text-slate-900 dark:text-white">
              9. Prohibited Activities
            </h2>
            <p>Users must not:</p>
            <ul className="list-disc pl-5 space-y-2 text-slate-700 dark:text-slate-300">
              <li>Submit false, misleading, or fraudulent information.</li>
              <li>Upload harmful, illegal, or unauthorized content.</li>
              <li>Violate the intellectual property rights of others.</li>
              <li>Attempt unauthorized access to our website or systems.</li>
              <li>Use the platform for spam, scams, or deceptive activities.</li>
              <li>Misuse investor or startup contact information.</li>
            </ul>
            <p>
              We reserve the right to restrict access or remove content in case of violations.
            </p>
          </section>

          <section className="space-y-3 border-t border-slate-100 dark:border-white/5 pt-6">
            <h2 className="text-[22px] sm:text-[24px] font-semibold leading-snug text-slate-900 dark:text-white">
              10. Limitation of Liability
            </h2>
            <p>Startup Showcase Global shall not be responsible for:</p>
            <ul className="list-disc pl-5 space-y-2 text-slate-700 dark:text-slate-300">
              <li>Business losses or missed investment opportunities.</li>
              <li>Decisions made independently by investors or startups.</li>
              <li>Inaccuracies in information submitted by users.</li>
              <li>Temporary website interruptions or technical issues.</li>
              <li>Actions, services, or content provided by third parties.</li>
            </ul>
            <p>
              To the extent permitted by applicable law, we disclaim liability for indirect, incidental, or consequential damages arising from the use of our platform.
            </p>
          </section>

          <section className="space-y-3 border-t border-slate-100 dark:border-white/5 pt-6">
            <h2 className="text-[22px] sm:text-[24px] font-semibold leading-snug text-slate-900 dark:text-white">
              11. Third-Party Services
            </h2>
            <p>
              Our website may contain links to external websites, payment gateways, or third-party services.
            </p>
            <p>
              We are not responsible for their content, availability, security, or independent policies. Users access such services at their own discretion.
            </p>
          </section>

          <section className="space-y-3 border-t border-slate-100 dark:border-white/5 pt-6">
            <h2 className="text-[22px] sm:text-[24px] font-semibold leading-snug text-slate-900 dark:text-white">
              12. Suspension and Termination
            </h2>
            <p>
              We reserve the right to suspend or terminate user accounts, remove listings, or restrict access to our services if users violate these Terms &amp; Conditions or misuse the platform.
            </p>
          </section>

          <section className="space-y-3 border-t border-slate-100 dark:border-white/5 pt-6">
            <h2 className="text-[22px] sm:text-[24px] font-semibold leading-snug text-slate-900 dark:text-white">
              13. Changes to Terms
            </h2>
            <p>
              We may update these Terms &amp; Conditions from time to time. Revised terms will be published on this page with an updated effective date.
            </p>
            <p>
              Continued use of our website after changes are published constitutes acceptance of the revised terms, to the extent permitted by applicable law.
            </p>
          </section>

          <section className="space-y-3 border-t border-slate-100 dark:border-white/5 pt-6">
            <h2 className="text-[22px] sm:text-[24px] font-semibold leading-snug text-slate-900 dark:text-white">
              14. Governing Law and Jurisdiction
            </h2>
            <p>
              These Terms &amp; Conditions shall be governed by the applicable laws of India. Any disputes arising from the use of our website or services shall be subject to the jurisdiction of the competent courts in accordance with applicable law.
            </p>
          </section>

          <section className="space-y-3 border-t border-slate-100 dark:border-white/5 pt-6">
            <h2 className="text-[22px] sm:text-[24px] font-semibold leading-snug text-slate-900 dark:text-white">
              15. Contact Us
            </h2>
            <p>
              For questions, concerns, or assistance regarding these Terms &amp; Conditions, please contact us through our website.
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
              <strong>Contact:</strong>{" "}
              <a
                href={`mailto:${contactEmail}`}
                className="text-brand-600 dark:text-brand-400 hover:underline focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500 rounded-sm"
              >
                {contactEmail}
              </a>
            </p>
            <p className="pt-2 text-xs text-slate-500 dark:text-slate-400">
              Thank you for choosing Startup Showcase Global. We look forward to supporting your startup journey.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
