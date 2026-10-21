import React from "react";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { getCurrentUserProfile } from "@/lib/supabase/server";
import { listAdminStartups, getAdminAuditLog } from "@/server/startups";
import { AdminPanel } from "@/components/admin/admin-panel";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Moderation Console | Startup Showcase",
  description: "Review queue, audit log, and startup moderation console.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminPage() {
  const authData = await getCurrentUserProfile();

  if (!authData || authData.profile.role !== "admin") {
    redirect("/");
  }

  const { user } = authData;

  const [pendingResult, approvedResult, rejectedResult, auditLogsResult] =
    await Promise.all([
      listAdminStartups("pending", user.id, 1, 50),
      listAdminStartups("approved", user.id, 1, 50),
      listAdminStartups("rejected", user.id, 1, 50),
      getAdminAuditLog(user.id, 1, 50),
    ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Admin Moderation Console
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Review submission queue, verify authentic startups, and inspect audit activity.
          </p>
        </div>
      </div>

      <AdminPanel
        initialPending={pendingResult.items}
        initialApproved={approvedResult.items}
        initialRejected={rejectedResult.items}
        auditLogs={auditLogsResult.items}
      />
    </div>
  );
}
