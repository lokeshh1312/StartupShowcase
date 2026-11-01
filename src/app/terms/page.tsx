import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { FileText, ArrowLeft } from "lucide-react";
import { createMetadata } from "@/lib/seo";
import { legalName, gstin, address, getContactEmail } from "@/lib/company";

export const metadata: Metadata = createMetadata({
  title: "Terms & Conditions | Startup Showcase",
  description:
    "Terms and Conditions governing access to and use of Startup Showcase, operated by WAVERISE CONSULTANCY PRIVATE LIMITED.",
  path: "/terms",
});

export default function TermsPage() {
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
          <FileText className="w-4 h-4" />
          <span>Legal Agreement</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Terms &amp; Conditions
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Effective Date: 25-10-2026
        </p>
      </div>

      {/* Content */}
      <div className="space-y-8 text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xs">
        <section className="space-y-3">
          <p>
            These Terms &amp; Conditions govern your access to and use of Startup Showcase, operated by {legalName} (&ldquo;Company&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;).
          </p>
          <p>
            By accessing our website, submitting a startup, or purchasing a service, you agree to these Terms &amp; Conditions.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            1. About Startup Showcase
          </h2>
          <p>
            Startup Showcase is an online platform for discovering startups and displaying eligible startup profiles. It allows founders and authorized representatives to submit startup information for review and potential publication.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            2. Eligibility
          </h2>
          <p>
            You must provide accurate information and have the legal authority to submit a startup profile and any associated content.
          </p>
          <p>
            If you submit information on behalf of a business, you confirm that you are authorized to do so.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            3. Startup Submissions
          </h2>
          <p>
            The standard startup submission fee is a <strong>one-time listing fee of Rs 999 (INR, via UPI/QR/cards/netbanking) or $10 USD (international cards)</strong>, as displayed on our pricing and checkout pages.
          </p>
          <p>
            Each paid submission covers one startup profile and its review for potential publication.
          </p>
          <p>
            You must provide accurate, complete, and lawful information. We may reject, request corrections to, suspend, or remove a submission if it contains misleading information, infringes third-party rights, violates applicable law, or breaches our policies.
          </p>
          <p>
            Payment does not guarantee approval or publication.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            4. Review and Publication
          </h2>
          <p>
            We review submissions according to our platform requirements. Review times may vary depending on submission volume and whether additional information is needed.
          </p>
          <p>
            We may decline a submission at our discretion where reasonably necessary to protect the integrity, safety, or lawful operation of the platform.
          </p>
          <p>
            An order confirmation or successful payment does not itself confirm publication.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            5. Payments
          </h2>
          <p>
            The applicable price will be shown before checkout. Payments may be processed through Razorpay or other payment providers made available on our website.
          </p>
          <p>
            You are responsible for reviewing the service description, amount, and applicable taxes displayed before completing payment.
          </p>
          <p>
            Payment-provider terms may also apply to your transaction.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            6. Refunds and Cancellations
          </h2>
          <p>
            Refund and cancellation requests are governed by our Refund &amp; Cancellation Policy, subject to applicable law. When approved, refunds are returned to the original payment method in the same currency.
          </p>
          <p>
            Please review that policy before purchasing a submission.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            7. User Content and Intellectual Property
          </h2>
          <p>
            You retain ownership of content you submit, subject to the rights of any third parties.
          </p>
          <p>
            By submitting content, you grant us a non-exclusive, worldwide, royalty-free licence to host, reproduce, display, format, and distribute that content as reasonably necessary to review, publish, maintain, and promote your startup profile and operate the platform.
          </p>
          <p>
            You confirm that you have the necessary rights and permissions for all submitted names, descriptions, logos, images, and other materials.
          </p>
          <p>
            Our website design, branding, and original platform materials remain the property of the Company or the applicable rights holders.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            8. Prohibited Use
          </h2>
          <p>You must not:</p>
          <ul className="list-disc pl-5 space-y-2 text-slate-700 dark:text-slate-300">
            <li>Submit false, fraudulent, or misleading information.</li>
            <li>Impersonate a person or business.</li>
            <li>Submit content that unlawfully infringes intellectual property or privacy rights.</li>
            <li>Use the platform for illegal, fraudulent, or abusive activities.</li>
            <li>Attempt unauthorized access to our systems.</li>
            <li>Interfere with website security or functionality.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            9. Third-Party Information and Links
          </h2>
          <p>
            Startup profiles may contain information supplied by third parties and links to external websites.
          </p>
          <p>
            We do not guarantee the accuracy, completeness, legitimacy, or current status of third-party information. Visitors should independently verify information before relying on it or entering into a transaction with a listed business.
          </p>
          <p>
            External websites are governed by their own terms and policies.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            10. No Investment or Business Guarantees
          </h2>
          <p>
            Startup Showcase provides startup discovery and promotional services. We do not guarantee investment, fundraising, partnerships, sales, leads, website traffic, or commercial success.
          </p>
          <p>
            The platform is not, merely by listing a startup, endorsing that startup or verifying all of its claims.
          </p>
          <p>
            Information on the platform is not investment, legal, tax, or financial advice.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            11. Availability and Limitation of Liability
          </h2>
          <p>
            We aim to maintain a useful and reliable platform but cannot guarantee uninterrupted access or that the website will always be error-free.
          </p>
          <p>
            To the extent permitted by applicable law, the Company will not be liable for indirect or consequential losses arising from the use of the platform. Nothing in these Terms excludes liability that cannot legally be excluded or restricts mandatory consumer rights.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            12. Privacy
          </h2>
          <p>
            Our collection and use of personal information are explained in our Privacy Policy.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            13. Changes to These Terms
          </h2>
          <p>
            We may update these Terms from time to time. The latest version will be published on this page with its effective date. Changes will apply as permitted by applicable law.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            14. Governing Law
          </h2>
          <p>
            These Terms are governed by the laws of India. Subject to applicable law and mandatory consumer protections, disputes will be subject to the jurisdiction of the competent courts in Bhopal, Madhya Pradesh.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            15. Contact Information
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
