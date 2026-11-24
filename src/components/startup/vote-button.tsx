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

  return (
    <button
      onClick={handleVote}
      disabled={isPending}
      type="button"
      className={`group/vote relative flex items-center justify-center w-11 h-11 p-0 transition-colors duration-200 select-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-full disabled:opacity-75 shrink-0 ${className}`}
      title={liked ? "Liked! Click to undo" : "Like this startup"}
      aria-label={`Like ${startupName}, currently ${likes} likes`}
    >
      <Heart
        className={`transition-colors duration-200 shrink-0 w-6 h-6 lg:w-7 lg:h-7 ${
          liked
            ? "text-rose-500 dark:text-rose-400 fill-current"
            : "text-slate-400 dark:text-slate-500 fill-none group-hover/vote:text-slate-900 dark:group-hover/vote:text-white"
        }`}
      />
    </button>
  );
}
