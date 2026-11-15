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
        <h1 className="sr-only">Investors</h1>

        {/* Subtitle and Dynamic World Map */}
        <InvestorsClient />
      </div>
    </div>
  );
}

