"use client";

import React, { useState, useTransition } from "react";
import { Heart } from "lucide-react";
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

  // Desktop container sizing and layout (>= lg)
  // Outer size/spacing kept visually balanced with inner gap/padding adjusted by 1-2px so row height does not grow
  const desktopLayoutClasses = isLarge
    ? "lg:flex-col lg:gap-1 lg:px-5 lg:py-2.5 lg:rounded-2xl lg:min-w-[76px] lg:min-h-[36px]"
    : isSmall
    ? "lg:gap-1 lg:px-2.5 lg:py-1 lg:min-h-[36px] lg:rounded-lg lg:text-xs"
    : "lg:flex-col lg:gap-0.5 lg:px-3.5 lg:py-1.5 lg:rounded-xl lg:min-w-[58px] lg:min-h-[36px] lg:text-xs";

  // Desktop themed background, border, shadow (>= lg)
  // Below lg: no container, no border, no background (not on hover or liked), no shadow, no rounded box
  const desktopThemeClasses = liked
    ? "lg:bg-rose-50 lg:dark:bg-rose-950/30 lg:text-rose-600 lg:dark:text-rose-400 lg:border lg:border-rose-300 lg:dark:border-rose-800 lg:shadow-xs"
    : "lg:bg-white/90 lg:dark:bg-white/[0.04] lg:hover:bg-slate-50 lg:dark:hover:bg-white/[0.08] lg:text-slate-700 lg:dark:text-slate-300 lg:border lg:border-slate-200/90 lg:dark:border-white/10 lg:shadow-2xs";

  // Heart icon sizing:
  // Below lg: about 24px (w-6 h-6) across all sizes
  // At/above lg: sm -> 18px (w-[18px] h-[18px]), default -> 20px (w-5 h-5), lg -> 24px (w-6 h-6)
  const heartSizeClasses = isLarge
    ? "w-6 h-6"
    : isSmall
    ? "w-6 h-6 lg:w-[18px] lg:h-[18px]"
    : "w-6 h-6 lg:w-5 lg:h-5";

  return (
    <button
      onClick={handleVote}
      disabled={isPending}
      type="button"
      className={`group/vote relative flex items-center justify-center transition-colors duration-200 select-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 lg:active:scale-95 disabled:opacity-75 w-11 h-11 lg:w-auto lg:h-auto p-0 border-0 bg-transparent shadow-none rounded-none ${desktopLayoutClasses} ${desktopThemeClasses} ${className}`}
      title={liked ? "Liked! Click to undo" : "Like this startup"}
      aria-label={`Like ${startupName}, currently ${likes} likes`}
    >
      <Heart
        className={`transition-colors duration-200 shrink-0 ${heartSizeClasses} ${
          liked
            ? "text-rose-500 dark:text-rose-400 fill-current"
            : "text-slate-400 dark:text-slate-500 fill-none group-hover/vote:text-slate-900 dark:group-hover/vote:text-white"
        }`}
      />
      <span
        className={`max-lg:hidden font-semibold font-mono tracking-tight ${
          isLarge ? "text-sm font-bold" : isSmall ? "text-[10px]" : "text-[11px]"
        } ${
          liked
            ? "text-rose-600 dark:text-rose-400"
            : "text-slate-700 dark:text-slate-300 group-hover/vote:text-slate-900 dark:group-hover/vote:text-white"
        }`}
      >
        {likes}
      </span>
      {isLarge && (
        <span
          className={`max-lg:hidden text-[10px] font-bold uppercase tracking-wider ${
            liked ? "text-rose-600 dark:text-rose-400" : "text-slate-500 dark:text-slate-400"
          }`}
        >
          {liked ? "Liked" : "Like"}
        </span>
      )}
    </button>
  );
}
