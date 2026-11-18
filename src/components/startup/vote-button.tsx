"use client";

import React, { useState, useEffect, useTransition } from "react";
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setLikes(initialLikes);
  }, [initialLikes]);

  useEffect(() => {
    setLiked(initialLiked);
  }, [initialLiked]);

  useEffect(() => {
    if (!errorMessage) return;

    const timer = setTimeout(() => {
      setErrorMessage(null);
    }, 4000);

    const handleClickElsewhere = () => {
      setErrorMessage(null);
    };

    document.addEventListener("click", handleClickElsewhere);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", handleClickElsewhere);
    };
  }, [errorMessage]);

  const handleVote = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Optimistic toggle
    const prevLiked = liked;
    const prevLikes = likes;
    const nextLiked = !liked;
    const nextLikes = nextLiked ? likes + 1 : Math.max(0, likes - 1);
    setLiked(nextLiked);
    setLikes(nextLikes);
    setErrorMessage(null);

    startTransition(async () => {
      const res = await voteAction(targetId, nextLiked);
      if (res.error === "unauthenticated") {
        // Revert optimistic state and redirect to login
        setLiked(prevLiked);
        setLikes(prevLikes);
        router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      } else if (res.error) {
        // Revert on failure and display error bubble
        setLiked(prevLiked);
        setLikes(prevLikes);
        setErrorMessage(res.error);
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
      {errorMessage && (
        <div
          role="status"
          aria-live="polite"
          onClick={(e) => {
            e.stopPropagation();
            setErrorMessage(null);
          }}
          className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 whitespace-normal sm:whitespace-nowrap max-w-[220px] sm:max-w-xs rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-2.5 py-1 text-xs font-normal shadow-lg pointer-events-auto text-center"
        >
          {errorMessage}
        </div>
      )}
    </button>
  );
}
