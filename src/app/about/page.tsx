import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "About Us | Startup Showcase Global",
  description:
    "Startup Showcase Global is a global platform dedicated to discovering, showcasing, and empowering innovative startups from around the world.",
  path: "/about",
});

export default function AboutPage() {
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
            About Us
          </h1>
        </div>

        {/* Content */}
        <div className="relative bg-white/90 dark:bg-white/[0.03] border border-slate-200/90 dark:border-white/10 rounded-3xl p-6 sm:p-10 shadow-xs backdrop-blur-md space-y-8 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          <section className="space-y-3">
            <p className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">
              Empowering Startups. Connecting Opportunities. Inspiring Innovation.
            </p>
            <p>
              <strong>Startup Showcase Global</strong> is a global platform dedicated to discovering, showcasing, and empowering innovative startups from around the world. We provide a space where ambitious founders, emerging businesses, and innovative ideas can gain visibility, connect with opportunities, and become part of a growing global startup ecosystem.
            </p>
            <p>
              We believe every great business begins with an idea, and every idea deserves the opportunity to be discovered. Our mission is to bridge the gap between promising startups and the opportunities that can help them grow.
            </p>
          </section>

          <section className="space-y-3 border-t border-slate-100 dark:border-white/5 pt-6">
            <h2 className="text-[22px] sm:text-[24px] font-semibold leading-snug text-slate-900 dark:text-white">
              What We Do
            </h2>
            <p>
              We help startups take their first steps toward greater recognition by providing opportunities to:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-700 dark:text-slate-300">
              <li>
                <strong>Showcase Your Startup:</strong> Present your business, product, or innovative idea to a global audience.
              </li>
              <li>
                <strong>Increase Visibility:</strong> Build your startup&apos;s online presence and reach a wider community.
              </li>
              <li>
                <strong>Connect with Investors:</strong> Explore opportunities to connect with investors and potential funding networks.
              </li>
              <li>
                <strong>Discover Innovation:</strong> Explore emerging startups, new technologies, and innovative business ideas.
              </li>
              <li>
                <strong>Build Credibility:</strong> Establish your startup&apos;s presence within the global entrepreneurial ecosystem.
              </li>
            </ul>
          </section>

          <section className="space-y-3 border-t border-slate-100 dark:border-white/5 pt-6">
            <h2 className="text-[22px] sm:text-[24px] font-semibold leading-snug text-slate-900 dark:text-white">
              Our Mission
            </h2>
            <p>
              Our mission is to make startup discovery and growth opportunities more accessible by connecting innovative founders with a global ecosystem of entrepreneurs, investors, and industry professionals.
            </p>
            <p>
              We aim to give promising startups the visibility and opportunities they need to move forward.
            </p>
          </section>

          <section className="space-y-3 border-t border-slate-100 dark:border-white/5 pt-6">
            <h2 className="text-[22px] sm:text-[24px] font-semibold leading-snug text-slate-900 dark:text-white">
              Be Part of the Global Startup Ecosystem
            </h2>
            <p>
              Whether you&apos;re an aspiring entrepreneur, an established founder, an investor, or simply passionate about innovation, Startup Showcase Global welcomes you.
            </p>
            <p className="font-semibold text-slate-900 dark:text-white pt-2">
              Your startup deserves to be seen. Your innovation deserves to be discovered. Let&apos;s build the future together.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
