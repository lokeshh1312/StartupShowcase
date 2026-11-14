import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Thesis | Startup Showcase Global",
  description:
    "Startup Showcase aims to identify and support up to 10 promising startups with innovative ideas, strong business potential, and scalable solutions.",
  path: "/thesis",
});

export default function ThesisPage() {
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
        <div>
          <h1 className="text-[30px] sm:text-[36px] font-semibold leading-[1.15] text-slate-900 dark:text-white tracking-tight">
            Thesis
          </h1>
        </div>

        {/* Content */}
        <div className="relative bg-white/90 dark:bg-white/[0.03] border border-slate-200/90 dark:border-white/10 rounded-3xl p-6 sm:p-10 shadow-xs backdrop-blur-md space-y-8 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          <section className="space-y-3">
            <p className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">
              Backing the Next 10 Promising Startups
            </p>
            <p>
              Startup Showcase aims to identify and support up to 10 promising startups with innovative ideas, strong business potential, and scalable solutions.
            </p>
          </section>

          <section className="space-y-3 border-t border-slate-100 dark:border-white/5 pt-6">
            <h2 className="text-[22px] sm:text-[24px] font-semibold leading-snug text-slate-900 dark:text-white">
              1. Open to All Industries
            </h2>
            <p>
              We welcome startups across all sectors, including Technology, AI, SaaS, FinTech, HealthTech, EdTech, D2C, B2B, Manufacturing, Retail, Agriculture, FoodTech and more.
            </p>
            <p>
              No industry or business-model restrictions.
            </p>
          </section>

          <section className="space-y-3 border-t border-slate-100 dark:border-white/5 pt-6">
            <h2 className="text-[22px] sm:text-[24px] font-semibold leading-snug text-slate-900 dark:text-white">
              2. What We Evaluate
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-slate-700 dark:text-slate-300">
              <li>Market potential and problem-solving.</li>
              <li>Innovation and product differentiation.</li>
              <li>Business model and revenue potential.</li>
              <li>Founding team and execution.</li>
              <li>Product/service evidence.</li>
              <li>Scalability and growth potential.</li>
              <li>Financial understanding.</li>
            </ul>
          </section>

          <section className="space-y-3 border-t border-slate-100 dark:border-white/5 pt-6">
            <h2 className="text-[22px] sm:text-[24px] font-semibold leading-snug text-slate-900 dark:text-white">
              3. Product & Service Evidence
            </h2>
            <p>
              Startups may share demos, prototypes, websites, customer feedback, sample work, orders or revenue records to demonstrate progress.
            </p>
            <p>
              This is an evidence-based review, not a formal audit.
            </p>
          </section>

          <section className="space-y-3 border-t border-slate-100 dark:border-white/5 pt-6">
            <h2 className="text-[22px] sm:text-[24px] font-semibold leading-snug text-slate-900 dark:text-white">
              4. Eligible Startup Stages
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-slate-700 dark:text-slate-300">
              <li>Idea with prototype</li>
              <li>MVP or pre-revenue</li>
              <li>Early-stage</li>
              <li>Revenue-generating</li>
              <li>Growth-stage</li>
            </ul>
          </section>

          <section className="space-y-3 border-t border-slate-100 dark:border-white/5 pt-6">
            <h2 className="text-[22px] sm:text-[24px] font-semibold leading-snug text-slate-900 dark:text-white">
              5. Selection Process
            </h2>
            <ol className="list-decimal pl-5 space-y-2 text-slate-700 dark:text-slate-300">
              <li>Application Submission</li>
              <li>Initial Screening</li>
              <li>Business Evaluation</li>
              <li>Product Review</li>
              <li>Founder Interaction</li>
              <li>Final Selection</li>
            </ol>
          </section>

          <section className="space-y-3 border-t border-slate-100 dark:border-white/5 pt-6">
            <h2 className="text-[22px] sm:text-[24px] font-semibold leading-snug text-slate-900 dark:text-white">
              6. Grant Approach
            </h2>
            <p>
              Up to 10 promising startups may be selected for non-dilutive grant support to accelerate business development, innovation, and growth.
            </p>
            <p>
              Grant amounts depend on evaluation and fund availability, with additional mentorship and networking support.
            </p>
          </section>

          <section className="space-y-3 border-t border-slate-100 dark:border-white/5 pt-6">
            <h2 className="text-[22px] sm:text-[24px] font-semibold leading-snug text-slate-900 dark:text-white">
              7. Important Information
            </h2>
            <p>
              The submission fee covers application and review only. It does not guarantee selection or grant funding. All decisions are subject to evaluation, available capital, approvals and applicable regulations.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
