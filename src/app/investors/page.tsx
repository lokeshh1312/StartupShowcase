import React from "react";
import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";
import { InvestorsClient } from "@/components/investor-network/investors-client";

export const metadata: Metadata = createMetadata({
  title: "Investors",
  description:
    "Explore our global angel investor network spanning active investors across the globe.",
  path: "/investors",
});

export default function InvestorsPage() {
  return (
    <div className="relative isolate min-h-screen">
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6 sm:space-y-8">
        {/* Centred Heading */}
        <div className="text-center space-y-3 pt-2">
          <h1 className="text-[30px] sm:text-[36px] font-semibold leading-[1.15] text-slate-900 dark:text-white tracking-tight">
            Investors
          </h1>
        </div>

        {/* Subtitle, Crawlable Intro, and Dynamic World Map */}
        <InvestorsClient>
          <p className="max-w-2xl mx-auto text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Investor figures are estimates based on active networks and regional partnerships. Investor meetings are subject to investor availability. We offer introductions, not funding.
          </p>
        </InvestorsClient>
      </div>
    </div>
  );
}

