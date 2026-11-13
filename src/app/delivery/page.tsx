import React from "react";
import Link from "next/link";
import { ArrowLeft, Truck } from "lucide-react";
import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Delivery Policy | Startup Showcase Global",
  description:
    "At Startup Showcase Global, we strive to deliver our services promptly and efficiently. Review our fulfillment and delivery timelines.",
  path: "/delivery",
});

export default function DeliveryPage() {
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
              <Truck className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              <span>Fulfillment &amp; Delivery</span>
            </div>
          </div>
          <h1 className="text-[30px] sm:text-[36px] font-semibold leading-[1.15] text-slate-900 dark:text-white tracking-tight">
            Delivery Policy
          </h1>
        </div>

        {/* Content */}
        <div className="relative bg-white/90 dark:bg-white/[0.03] border border-slate-200/90 dark:border-white/10 rounded-3xl p-6 sm:p-10 shadow-xs backdrop-blur-md space-y-6 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          <p>
            At Startup Showcase Global, we strive to deliver our services promptly and efficiently.
          </p>

          <p>
            Once payment is successfully completed, your startup submission or selected service will be processed within <strong>2–5 business days</strong>, subject to verification and approval.
          </p>

          <p>
            Digital services, startup listings, and promotional benefits will be delivered electronically through the website or registered email address.
          </p>

          <p>
            For investor connection services, timelines may vary depending on investor availability and scheduling.
          </p>

          <p>
            For any delivery-related queries, please contact our{" "}
            <Link
              href="/support"
              className="text-brand-600 dark:text-brand-400 hover:underline font-medium focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500 rounded-sm"
            >
              support team
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
