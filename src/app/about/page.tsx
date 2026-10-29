import React from "react";
import Link from "next/link";
import { ArrowLeft, Globe } from "lucide-react";
import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";
import { legalName, gstin, address, getContactEmail } from "@/lib/company";

export const metadata: Metadata = createMetadata({
  title: "About Us | Startup Showcase",
  description:
    "Startup Showcase is a digital platform designed to help people discover startups, explore emerging businesses, and learn about innovative products from around the world.",
  path: "/about",
});

export default function AboutPage() {
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
          <Globe className="w-4 h-4" />
          <span>Platform Overview</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          About Us
        </h1>
      </div>

      {/* Content */}
      <div className="space-y-8 text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xs">
        <section className="space-y-3">
          <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            Discover Startups. Explore Innovation.
          </p>
          <p>
            Startup Showcase is a digital platform designed to help people discover startups, explore emerging businesses, and learn about innovative products, services, and technologies from around the world.
          </p>
          <p>
            The platform is operated by <strong>{legalName}</strong>, a company incorporated in India.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Our Mission
          </h2>
          <p>
            Our mission is to make startup discovery easier by bringing startup information together in one accessible platform, helping visitors explore businesses across countries, industries, and innovation categories.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            What We Offer
          </h2>
          <p>Startup Showcase allows visitors to:</p>
          <ul className="list-disc pl-5 space-y-2 text-slate-700 dark:text-slate-300">
            <li>Discover startups from different countries and industries.</li>
            <li>Explore trending and recently submitted startups.</li>
            <li>Browse businesses by sector and geographical location.</li>
            <li>Discover startups working on innovative technologies and intellectual property.</li>
            <li>Explore startup profiles and visit their official websites.</li>
            <li>Submit a startup profile for review and potential publication.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Startup Submission
          </h2>
          <p>
            Founders, entrepreneurs, and authorized representatives can submit their startups through our website for a fee of <strong>US$10 per submission</strong>.
          </p>
          <p>
            Each submission is subject to our review process. Payment does not automatically guarantee approval or publication.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Our Business Model
          </h2>
          <p>
            We generate revenue through paid startup submissions and other services only where expressly offered on our website.
          </p>
          <p>
            Startup Showcase is a discovery and promotional platform. We do not guarantee funding, investment, customers, traffic, sales, or commercial success.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Legal Entity Details
          </h2>
          <p>
            <strong>Company Name:</strong> {legalName}
          </p>
          <p>
            <strong>Trade Name:</strong> {legalName}
          </p>
          <p>
            <strong>GSTIN:</strong> {gstin}
          </p>
          <p>
            <strong>Principal Place of Business:</strong> {address}
          </p>
          <p>
            <strong>Contact:</strong>{" "}
            <a
              href={`mailto:${contactEmail}`}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              {contactEmail}
            </a>
          </p>
          <p className="pt-2">
            Startup Showcase aims to provide a transparent and accessible platform for discovering emerging businesses and entrepreneurial ideas.
          </p>
        </section>
      </div>
    </div>
  );
}
