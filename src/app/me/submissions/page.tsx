import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ClipboardList, Plus, ExternalLink, AlertCircle } from "lucide-react";
import { getCurrentUser } from "@/lib/supabase/server";
import { getMySubmissions } from "@/server/startups";
import { Badge, StageBadge } from "@/components/common/badge";
import { getSubmissionPriceCents, getSubmissionPriceInrPaise } from "@/server/razorpay";
import { formatMoney, formatPriceButton } from "@/lib/money";
import { SubmissionActions } from "./submission-actions";
import { CloudBackground } from "@/components/ui/cloud-background";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Submissions | Startup Showcase",
  description: "Track the review and launch status of your startup submissions.",
  robots: {
    index: false,
    follow: false,
  },
};

const statusConfig = {
  awaiting_payment: {
    label: "Awaiting Payment",
    classes: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  },
  pending: {
    label: "Under Review (Paid)",
    classes: "bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 border-brand-200 dark:border-brand-800",
  },
  approved: {
    label: "Approved & Live",
    classes: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  },
  rejected: {
    label: "Rejected",
    classes: "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800",
  },
};

export default async function MySubmissionsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?redirect=/me/submissions");
  }

  const submissionsResult = await getMySubmissions(user.id, 1, 50);
  const priceInr = formatPriceButton(getSubmissionPriceInrPaise(), "INR");
  const priceUsd = formatPriceButton(getSubmissionPriceCents(), "USD");

  return (
    <div className="relative isolate min-h-screen">
      <CloudBackground height="h-[340px] sm:h-[400px]" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200/60 dark:border-brand-900/40 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0 shadow-2xs">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                My{" "}
                <em className="font-serif-italic font-normal text-brand-600 dark:text-brand-400 not-italic-fallback">
                  Submissions
                </em>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Review history, payment status, and moderation progress for all startups you created.
              </p>
            </div>
          </div>

          <Link
            href="/submit"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs transition-colors shadow-xs cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <Plus className="w-4 h-4" />
            <span>Submit Another</span>
          </Link>
        </div>

        {/* Submissions list */}
        {submissionsResult.items.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white/90 dark:bg-white/[0.03] p-16 text-center space-y-4 shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 border border-brand-100 dark:border-brand-900/40 flex items-center justify-center mx-auto text-2xl font-bold shadow-xs">
              <ClipboardList className="w-6 h-6 text-brand-600 dark:text-brand-400" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              No submissions yet
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Ready to present your startup to the global showcase? Submit your project to get vetted and featured.
            </p>
            <div className="pt-2">
              <Link
                href="/submit"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-colors shadow-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                <span>Submit a Startup</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {submissionsResult.items.map((startup) => {
              const statusInfo =
                statusConfig[startup.status as keyof typeof statusConfig] ||
                statusConfig.pending;

              return (
                <div
                  key={startup.id}
                  className="p-6 rounded-3xl bg-white/90 dark:bg-white/[0.03] border border-slate-200/90 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs backdrop-blur-md"
                >
                  <div className="space-y-2 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-bold text-slate-900 dark:text-white">
                        {startup.name}
                      </h2>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusInfo.classes}`}
                      >
                        {statusInfo.label}
                      </span>
                      <StageBadge stage={startup.stage} />
                      <Badge variant="default">{startup.category}</Badge>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1">
                      {startup.tagline}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                      <span>
                        Submitted on{" "}
                        {new Date(startup.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      <span>•</span>
                      <span>Cohort: {startup.monthLabel}</span>
                      <span>•</span>
                      <span>
                        Payment:{" "}
                        {startup.paymentStatus === "paid" ? (
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            Paid ({formatMoney(startup.paymentAmountCents ?? 1000, startup.paymentCurrency || "USD")})
                            {startup.razorpayPaymentId ? ` • ID: ${startup.razorpayPaymentId}` : ""}
                          </span>
                        ) : startup.paymentStatus === "refunded" ? (
                          <span className="font-semibold text-slate-500">Refunded</span>
                        ) : startup.paymentStatus === "partially_refunded" ? (
                          <span className="font-semibold text-amber-600 dark:text-amber-400">
                            Partially Refunded
                            {typeof startup.paymentAmountRefundedCents === "number" && startup.paymentAmountRefundedCents > 0
                              ? ` (${formatMoney(startup.paymentAmountRefundedCents, startup.paymentCurrency || "USD")} refunded)`
                              : ""}
                          </span>
                        ) : startup.status === "awaiting_payment" ? (
                          <span className="font-semibold text-amber-600 dark:text-amber-400">
                            Unpaid (payment required)
                          </span>
                        ) : (
                          <span className="font-medium text-slate-400">Standard</span>
                        )}
                      </span>
                    </div>

                    {startup.status === "rejected" && (
                      <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-600 dark:text-red-400 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>
                          This submission was not approved for the public leaderboard at this time.
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {(startup.status === "pending" || startup.status === "awaiting_payment") && (
                      <SubmissionActions
                        startupId={startup.id}
                        startupName={startup.name}
                        slug={startup.slug}
                        status={startup.status}
                        priceInr={priceInr}
                        priceUsd={priceUsd}
                      />
                    )}
                    {startup.status === "approved" && (
                      <Link
                        href={`/startup/${startup.slug}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors border border-slate-200/60 dark:border-white/10 shadow-2xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500"
                      >
                        <span>View Live</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
