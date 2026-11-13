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
        <div className="text-center">
          <h1 className="text-[30px] sm:text-[36px] font-semibold leading-[1.15] text-slate-900 dark:text-white tracking-tight">
            Investors
          </h1>
        </div>

        {/* Subtitle and Dynamic World Map */}
        <InvestorsClient />
      </div>
    </div>
  );
}

