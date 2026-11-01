import React from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Rocket, ShieldAlert, ArrowLeft } from "lucide-react";
import { getCurrentUserProfile } from "@/lib/supabase/server";
import { getAvailableCountries } from "@/lib/validation";
import { getStartupBySlug } from "@/server/startups";
import {
  getSubmissionPriceCents,
  formatSubmissionPriceUsd,
  getSubmissionPriceInrPaise,
} from "@/server/razorpay";
import { formatPriceButton } from "@/lib/money";
import { SubmitStartupForm } from "@/components/startup/submit-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Submit a Startup | Startup Showcase",
  description:
    "Launch your early-stage startup or tech innovation to a global audience of founders, angels, and early adopters.",
  robots: {
    index: false,
    follow: false,
  },
};

interface SubmitPageProps {
  searchParams: Promise<{ edit?: string }>;
}

export default async function SubmitPage({ searchParams }: SubmitPageProps) {
  const authData = await getCurrentUserProfile();

  if (!authData) {
    redirect("/login?redirect=/submit");
  }

  const { profile, user } = authData;
  const isFounderOrAdmin = profile.role === "founder" || profile.role === "admin";
  const countries = getAvailableCountries();
  const formattedPrice = formatSubmissionPriceUsd(getSubmissionPriceCents());
  const priceInr = formatPriceButton(getSubmissionPriceInrPaise(), "INR");
  const priceUsd = formatPriceButton(getSubmissionPriceCents(), "USD");

  const { edit: editSlug } = await searchParams;
  let editingStartup = undefined;

  if (editSlug) {
    const data = await getStartupBySlug(editSlug, user.id);
    if (data?.startup && (data.startup.ownerId === user.id || profile.role === "admin")) {
      editingStartup = data.startup;
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <Link
          href={editingStartup ? "/me/submissions" : "/"}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{editingStartup ? "Back to My Submissions" : "Back to Discovery"}</span>
        </Link>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-xs font-semibold">
          <Rocket className="w-3.5 h-3.5" />
          <span>{editingStartup ? "Edit Pending Submission" : "Global Submission Portal"}</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {editingStartup ? `Edit: ${editingStartup.name}` : "Submit Your Startup"}
        </h1>

        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          {editingStartup
            ? "Update your pending submission details. Any uploaded replacement images will automatically replace existing files."
            : "Showcase your product, prototype, or early venture. Submissions are reviewed for authenticity and placed in the upcoming monthly cohort rankings."}
        </p>
      </div>

      {!isFounderOrAdmin ? (
        <div className="p-8 rounded-3xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 space-y-4">
          <div className="flex items-center gap-3 text-amber-700 dark:text-amber-400 font-bold text-base">
            <ShieldAlert className="w-6 h-6 shrink-0" />
            <span>Founder Role Required</span>
          </div>
          <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
            Your current account role is <span className="font-bold uppercase tracking-wider">{profile.role}</span>. Only founders and builders may submit startups for review.
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-300">
            If you are a founder and registered under another role, please register or sign in with a founder account.
          </p>
        </div>
      ) : (
        <SubmitStartupForm
          countries={countries}
          userDisplayName={profile.displayName}
          initialStartup={editingStartup}
          formattedPrice={formattedPrice}
          priceInr={priceInr}
          priceUsd={priceUsd}
        />
      )}
    </div>
  );
}
