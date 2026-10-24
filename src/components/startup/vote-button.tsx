"use client";

import React, { useState, useTransition } from "react";
import { ChevronUp } from "lucide-react";
import { voteAction } from "@/server/actions";
import { useRouter } from "next/navigation";

interface VoteButtonProps {
  startupIdOrSlug?: string;
  startupId?: string;
  initialLikes?: number;
  initialLiked?: boolean;
  size?: "sm" | "default" | "lg";
  className?: string;
  startupName?: string;
}

export function VoteButton({
  startupIdOrSlug,
  startupId,
  initialLikes = 0,
  initialLiked = false,
  size = "default",
  className = "",
  startupName = "startup",
}: VoteButtonProps) {
  const router = useRouter();
  const targetId = startupId || startupIdOrSlug || "";
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(initialLiked);
  const [isPending, startTransition] = useTransition();

  const handleVote = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Optimistic toggle
    const nextLiked = !liked;
    const nextLikes = nextLiked ? likes + 1 : Math.max(0, likes - 1);
    setLiked(nextLiked);
    setLikes(nextLikes);

    startTransition(async () => {
      const res = await voteAction(targetId);
      if (res.error === "unauthenticated") {
        // Revert optimistic state and redirect to login
        setLiked(liked);
        setLikes(likes);
        router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      } else if (res.error) {
        // Revert on failure
        setLiked(liked);
        setLikes(likes);
      } else if ("likesCount" in res && res.likesCount !== undefined) {
        setLikes(res.likesCount);
        setLiked(Boolean(res.liked));
      }
    });
  };

  const isSmall = size === "sm";
  const isLarge = size === "lg";

  return (
    <button
      onClick={handleVote}
      disabled={isPending}
      type="button"
      className={`group/vote flex items-center justify-center transition-all duration-200 select-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-95 disabled:opacity-75 ${
        isLarge
          ? "flex-col gap-1 px-5 py-3 rounded-2xl min-w-[76px]"
          : isSmall
          ? "gap-1 px-2.5 py-1 rounded-lg text-xs"
          : "flex-col gap-0.5 px-3.5 py-2 rounded-xl min-w-[58px] text-xs"
      } ${
        liked
          ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-700 shadow-xs"
          : "bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800"
      } ${className}`}
      title={liked ? "Upvoted! Click to undo" : "Upvote this startup"}
      aria-label={`Upvote ${startupName}, currently ${likes} votes`}
    >
      <ChevronUp
        className={`transition-transform duration-200 group-hover/vote:-translate-y-0.5 ${
          isLarge ? "w-5 h-5" : isSmall ? "w-3.5 h-3.5" : "w-4 h-4"
        } ${
          liked
            ? "text-blue-600 dark:text-blue-400 stroke-[2.5]"
            : "text-slate-400 dark:text-slate-500 group-hover/vote:text-slate-900 dark:group-hover/vote:text-white"
        }`}
      />
      <span
        className={`font-semibold font-mono tracking-tight ${
          isLarge ? "text-base font-bold" : isSmall ? "text-[11px]" : "text-xs"
        } ${
          liked
            ? "text-blue-600 dark:text-blue-400"
            : "text-slate-700 dark:text-slate-300 group-hover/vote:text-slate-900 dark:group-hover/vote:text-white"
        }`}
      >
        {likes}
      </span>
      {isLarge && (
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {liked ? "Upvoted" : "Vote"}
        </span>
      )}
    </button>
  );
}
