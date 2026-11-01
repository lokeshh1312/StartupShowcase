"use client";

import React, { useState, useTransition } from "react";
import { Bookmark } from "lucide-react";
import { saveAction } from "@/server/actions";
import { useRouter } from "next/navigation";

interface SaveButtonProps {
  startupIdOrSlug?: string;
  startupId?: string;
  initialSaved?: boolean;
  size?: "sm" | "default" | "md" | "lg";
  className?: string;
  startupName?: string;
}

export function SaveButton({
  startupIdOrSlug,
  startupId,
  initialSaved = false,
  size = "default",
  className = "",
  startupName = "startup",
}: SaveButtonProps) {
  const router = useRouter();
  const targetId = startupId || startupIdOrSlug || "";
  const [saved, setSaved] = useState(initialSaved);
  const [isPending, startTransition] = useTransition();

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Optimistic toggle
    const nextSaved = !saved;
    setSaved(nextSaved);

    startTransition(async () => {
      const res = await saveAction(targetId);
      if (res.error === "unauthenticated") {
        setSaved(saved);
        router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      } else if (res.error) {
        setSaved(saved);
      } else if ("saved" in res && res.saved !== undefined) {
        setSaved(Boolean(res.saved));
      }
    });
  };

  const isSmall = size === "sm";

  return (
    <button
      onClick={handleSave}
      disabled={isPending}
      type="button"
      className={`relative inline-flex items-center justify-center rounded-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 active:scale-90 disabled:opacity-75 cursor-pointer ${
        isSmall ? "p-1.5" : "p-2"
      } ${
        saved
          ? "text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800 shadow-xs"
          : "text-slate-400 hover:text-slate-900 dark:hover:text-white bg-white/90 dark:bg-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.08] border border-slate-200/90 dark:border-white/10 shadow-2xs"
      } ${className}`}
      title={saved ? "Remove from Saved" : "Save / Bookmark startup"}
      aria-label={saved ? `Unsave ${startupName}` : `Save ${startupName}`}
    >
      <Bookmark
        className={`${isSmall ? "w-3.5 h-3.5" : "w-4 h-4"} transition-all ${
          saved ? "fill-brand-600 dark:fill-brand-400 stroke-brand-600 dark:stroke-brand-400" : "stroke-[1.8]"
        }`}
      />
    </button>
  );
}
