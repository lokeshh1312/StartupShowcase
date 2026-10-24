"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { Edit2, Trash2 } from "lucide-react";
import { deleteStartupAction } from "@/server/actions";

interface SubmissionActionsProps {
  startupId: string;
  slug: string;
  status: string;
}

export function SubmissionActions({ startupId, slug, status }: SubmissionActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");

  if (status !== "pending") {
    return null;
  }

  const handleDelete = () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }

    startTransition(async () => {
      const res = await deleteStartupAction(startupId);
      if (res?.error) {
        setError(res.error);
        setConfirming(false);
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-xs text-red-500 font-medium">{error}</span>}
      <Link
        href={`/submit?edit=${slug}`}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors shadow-xs"
      >
        <Edit2 className="w-3.5 h-3.5" />
        <span>Edit</span>
      </Link>

      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors shadow-xs cursor-pointer ${
          confirming
            ? "bg-red-600 hover:bg-red-700 text-white"
            : "border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100"
        }`}
      >
        <Trash2 className="w-3.5 h-3.5" />
        <span>{isPending ? "Deleting..." : confirming ? "Confirm Delete?" : "Delete"}</span>
      </button>

      {confirming && !isPending && (
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="px-2 py-1 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
        >
          Cancel
        </button>
      )}
    </div>
  );
}
