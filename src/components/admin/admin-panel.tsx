"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { Check, X, ShieldCheck, ExternalLink, Info } from "lucide-react";
import { moderateStartupAction } from "@/server/actions";
import { Badge, StageBadge } from "@/components/common/badge";
import { getCountryName } from "@/lib/validation";
import { formatMoney } from "@/lib/money";

interface AdminStartupItem {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  category: string;
  stage: string;
  countryCode: string;
  city?: string | null;
  region?: string | null;
  remoteFirst?: boolean | null;
  websiteUrl?: string | null;
  createdAt: Date;
  status: "pending" | "approved" | "rejected" | "awaiting_payment";
  rejectionReason?: string | null;
  monthLabel: string;
  founder?: unknown;
  paymentAmountCents?: number | null;
  paymentCurrency?: string | null;
  razorpayPaymentId?: string | null;
  paidAt?: Date | null;
  duplicateWarning?: {
    id: string;
    name: string;
    slug: string;
    reason: "domain" | "name_similarity";
    score?: number;
  } | null;
}

interface AuditLogItem {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  actorId: string | null;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

interface AdminPanelProps {
  initialPending: AdminStartupItem[];
  initialApproved: AdminStartupItem[];
  initialRejected: AdminStartupItem[];
  auditLogs: AuditLogItem[];
}

export function AdminPanel({
  initialPending,
  initialApproved,
  initialRejected,
  auditLogs,
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "rejected" | "audit">("pending");
  const [pendingItems, setPendingItems] = useState<AdminStartupItem[]>(initialPending);
  const [approvedItems, setApprovedItems] = useState<AdminStartupItem[]>(initialApproved);
  const [rejectedItems, setRejectedItems] = useState<AdminStartupItem[]>(initialRejected);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectingStartup, setRejectingStartup] = useState<AdminStartupItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleApprove = (startup: AdminStartupItem) => {
    setBusyId(startup.id);
    setError("");

    startTransition(async () => {
      const res = await moderateStartupAction(startup.id, "approved");
      setBusyId(null);
      if (res?.error) {
        setError(res.error);
      } else {
        setPendingItems((prev) => prev.filter((i) => i.id !== startup.id));
        setApprovedItems((prev) => [{ ...startup, status: "approved" }, ...prev]);
      }
    });
  };

  const handleRejectConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingStartup) return;

    setBusyId(rejectingStartup.id);
    setError("");

    startTransition(async () => {
      const res = await moderateStartupAction(
        rejectingStartup.id,
        "rejected",
        rejectionReason
      );
      setBusyId(null);
      if (res?.error) {
        setError(res.error);
      } else {
        const updated = {
          ...rejectingStartup,
          status: "rejected" as const,
          rejectionReason,
        };
        setPendingItems((prev) => prev.filter((i) => i.id !== rejectingStartup.id));
        setApprovedItems((prev) => prev.filter((i) => i.id !== rejectingStartup.id));
        setRejectedItems((prev) => [updated, ...prev]);
        setRejectingStartup(null);
        setRejectionReason("");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200/90 dark:border-white/10 pb-3 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab("pending")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500 ${
            activeTab === "pending"
              ? "bg-brand-600 text-white shadow-xs"
              : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          Review Queue ({pendingItems.length})
        </button>
        <button
          onClick={() => setActiveTab("approved")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500 ${
            activeTab === "approved"
              ? "bg-brand-600 text-white shadow-xs"
              : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          Approved ({approvedItems.length})
        </button>
        <button
          onClick={() => setActiveTab("rejected")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500 ${
            activeTab === "rejected"
              ? "bg-brand-600 text-white shadow-xs"
              : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          Rejected ({rejectedItems.length})
        </button>
        <button
          onClick={() => setActiveTab("audit")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500 ${
            activeTab === "audit"
              ? "bg-brand-600 text-white shadow-xs"
              : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          Audit Log ({auditLogs.length})
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60 text-xs text-rose-600 dark:text-rose-400 font-medium">
          {error}
        </div>
      )}

      {/* Policy Notice for Admins */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-brand-50/70 dark:bg-brand-950/30 border border-brand-200/80 dark:border-brand-900/60 text-xs text-brand-900 dark:text-brand-200 leading-relaxed">
        <Info className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">Review &amp; Moderation Policy:</span> Paid startups can be rejected but not deleted. Abandoned unpaid drafts are cleared automatically after 7 days.
        </div>
      </div>

      {/* Tab: Pending */}
      {activeTab === "pending" && (
        <div className="space-y-4">
          {pendingItems.length === 0 ? (
            <div className="p-12 rounded-3xl bg-white/90 dark:bg-white/[0.03] border border-slate-200/90 dark:border-white/10 text-center space-y-2 backdrop-blur-md shadow-xs">
              <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Queue is clear
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                There are no pending submissions awaiting moderation.
              </p>
            </div>
          ) : (
            pendingItems.map((startup) => (
              <div
                key={startup.id}
                className="p-6 rounded-3xl bg-white/90 dark:bg-white/[0.03] border border-slate-200/90 dark:border-white/10 space-y-4 backdrop-blur-md shadow-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        {startup.name}
                      </h3>
                      <StageBadge stage={startup.stage} />
                      <Badge variant="blue">{startup.category}</Badge>
                    </div>
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      {startup.tagline}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-3xl">
                      {startup.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                      <span>Origin: {getCountryName(startup.countryCode)} ({startup.countryCode})</span>
                      <span>•</span>
                      <span>Cohort: {startup.monthLabel}</span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                        Paid: {formatMoney(startup.paymentAmountCents ?? 1000, startup.paymentCurrency || "USD")}
                        {startup.razorpayPaymentId ? ` (ID: ${startup.razorpayPaymentId})` : ""}
                      </span>
                      {startup.websiteUrl && (
                        <>
                          <span>•</span>
                          <a
                            href={startup.websiteUrl}
                            target="_blank"
                            rel="ugc nofollow noopener noreferrer"
                            className="inline-flex items-center gap-1 text-brand-600 dark:text-brand-400 hover:underline focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500 rounded-sm"
                          >
                            <span>Website</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </>
                      )}
                    </div>

                    {startup.duplicateWarning && (
                      <div className="p-3 rounded-2xl bg-amber-500/10 dark:bg-amber-950/40 border border-amber-500/30 text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2">
                        <span className="font-bold shrink-0">⚠️ Likely duplicate:</span>
                        <span>
                          Matches existing startup{" "}
                          <Link
                            href={`/startup/${startup.duplicateWarning.slug}`}
                            target="_blank"
                            className="font-bold underline text-amber-950 dark:text-amber-100 hover:text-brand-600 dark:hover:text-brand-400 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500 rounded-sm"
                          >
                            {startup.duplicateWarning.name}
                          </Link>{" "}
                          ({startup.duplicateWarning.reason === "domain"
                            ? "matching website domain"
                            : `name similarity ${Math.round((Number(startup.duplicateWarning.score ?? 0) * 100))}%`})
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setRejectingStartup(startup)}
                      disabled={busyId === startup.id || isPending}
                      className="px-3.5 py-2 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-rose-500"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                    <button
                      onClick={() => handleApprove(startup)}
                      disabled={busyId === startup.id || isPending}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-xs cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab: Approved */}
      {activeTab === "approved" && (
        <div className="space-y-4">
          {approvedItems.length === 0 ? (
            <div className="p-8 rounded-3xl bg-white/90 dark:bg-white/[0.03] border border-slate-200/90 dark:border-white/10 text-center text-xs text-slate-500 dark:text-slate-400 backdrop-blur-md shadow-xs">
              No approved startups in this view.
            </div>
          ) : (
            approvedItems.map((startup) => (
              <div
                key={startup.id}
                className="p-5 rounded-2xl bg-white/90 dark:bg-white/[0.03] border border-slate-200/90 dark:border-white/10 flex items-center justify-between gap-4 backdrop-blur-md shadow-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {startup.name}
                    </h3>
                    <Badge variant="blue">{startup.category}</Badge>
                    <span className="text-xs text-slate-400">({startup.monthLabel})</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                    {startup.tagline}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/startup/${startup.slug}`}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500"
                  >
                    <span>View</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                  <button
                    onClick={() => setRejectingStartup(startup)}
                    disabled={busyId === startup.id || isPending}
                    className="px-3.5 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-rose-500"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Reject / Unpublish</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab: Rejected */}
      {activeTab === "rejected" && (
        <div className="space-y-4">
          {rejectedItems.length === 0 ? (
            <div className="p-8 rounded-3xl bg-white/90 dark:bg-white/[0.03] border border-slate-200/90 dark:border-white/10 text-center text-xs text-slate-500 dark:text-slate-400 backdrop-blur-md shadow-xs">
              No rejected startups.
            </div>
          ) : (
            rejectedItems.map((startup) => (
              <div
                key={startup.id}
                className="p-5 rounded-2xl bg-white/90 dark:bg-white/[0.03] border border-slate-200/90 dark:border-white/10 space-y-2 backdrop-blur-md shadow-xs"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {startup.name}
                    </h3>
                    <Badge variant="blue">{startup.category}</Badge>
                  </div>
                  <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                    Rejected
                  </span>
                </div>
                {startup.rejectionReason && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50/70 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 p-2.5 rounded-xl">
                    Reason: {startup.rejectionReason}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab: Audit Log */}
      {activeTab === "audit" && (
        <div className="p-6 rounded-3xl bg-white/90 dark:bg-white/[0.03] border border-slate-200/90 dark:border-white/10 space-y-4 backdrop-blur-md shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Security & Moderation Audit Trail (Latest {auditLogs.length} Entries)
            </h3>
            <span className="text-xs text-slate-400">Append-only audit record</span>
          </div>
          {auditLogs.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">No moderation actions recorded yet.</p>
          ) : (
            <div className="space-y-2 font-mono text-xs">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="space-y-1">
                    <div>
                      <span className="font-bold text-brand-600 dark:text-brand-400">
                        {log.action}
                      </span>{" "}
                      on <span className="font-semibold text-slate-700 dark:text-slate-300">{log.targetType}</span>{" "}
                      <span className="text-slate-400 text-[11px]">({log.targetId.slice(0, 8)}...)</span>
                    </div>
                    {log.metadata && Object.keys(log.metadata).length > 0 && (() => {
                      const prevStatus = log.metadata.previous_status ?? log.metadata.previousStatus;
                      const nextStatus = log.metadata.new_status ?? log.metadata.newStatus;
                      return (
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {prevStatus && nextStatus ? (
                            <span>
                              Status transition:{" "}
                              <span className="text-rose-500 font-semibold">{String(prevStatus)}</span>
                              {" → "}
                              <span className="text-emerald-500 font-semibold">{String(nextStatus)}</span>
                            </span>
                          ) : (
                            <span>Details: {JSON.stringify(log.metadata)}</span>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                  <div className="text-slate-400 text-xs shrink-0 sm:text-right">
                    <div>{new Date(log.createdAt).toLocaleString()}</div>
                    {log.actorId && (
                      <div className="text-[10px] text-slate-500">
                        Admin: {log.actorId.slice(0, 8)}...
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Rejection Modal */}
      {rejectingStartup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 space-y-4 border border-slate-200/90 dark:border-white/10 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Reject Submission: {rejectingStartup.name}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Provide feedback to the founder regarding why this submission is not approved.
            </p>

            <form onSubmit={handleRejectConfirm} className="space-y-4">
              <textarea
                required
                rows={3}
                maxLength={500}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Please provide a working prototype demo or more specific market details."
                className="w-full p-3 rounded-xl bg-slate-50/70 dark:bg-white/5 border border-slate-200/90 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-colors"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setRejectingStartup(null);
                    setRejectionReason("");
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-rose-500 shadow-xs"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
