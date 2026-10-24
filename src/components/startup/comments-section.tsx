"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { MessageSquare, Send, EyeOff } from "lucide-react";
import { addCommentAction, hideCommentAction } from "@/server/actions";
import { Badge } from "@/components/common/badge";

interface CommentItem {
  id: string;
  content: string;
  author: string;
  authorId: string;
  role: string;
  date: Date;
}

interface CommentsSectionProps {
  startupSlug: string;
  initialComments: CommentItem[];
  currentUser?: {
    id: string;
    email?: string;
    role?: string;
  } | null;
}

export function CommentsSection({
  startupSlug,
  initialComments,
  currentUser,
}: CommentsSectionProps) {
  const [comments, setComments] = useState<CommentItem[]>(initialComments);
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setError("");

    startTransition(async () => {
      const res = await addCommentAction(startupSlug, content.trim());
      if (res.error === "unauthenticated") {
        setError("Please sign in to leave a comment.");
      } else if (res.error) {
        setError(res.error);
      } else if (res.comment) {
        setComments([
          {
            id: res.comment.id,
            content: res.comment.content,
            author: res.comment.author,
            authorId: res.comment.authorId,
            role: res.comment.role,
            date: new Date(res.comment.createdAt),
          },
          ...comments,
        ]);
        setContent("");
      }
    });
  };

  const handleHideComment = async (commentId: string) => {
    if (!confirm("Are you sure you want to hide this comment? This moderation action is recorded in the audit trail.")) {
      return;
    }
    startTransition(async () => {
      const res = await hideCommentAction(commentId);
      if (res?.success) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      } else if (res?.error) {
        alert(res.error);
      }
    });
  };

  return (
    <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="font-bold text-lg text-slate-900 dark:text-white">
            Community Feedback ({comments.length})
          </h3>
        </div>
      </div>

      {/* Add Comment Form or Login Prompt */}
      {currentUser ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <p
              role="alert"
              className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-3 rounded-xl border border-rose-200 dark:border-rose-800"
            >
              {error}
            </p>
          )}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isPending}
            placeholder="Share constructive feedback, ask questions, or cheer on the founding team..."
            rows={3}
            maxLength={1000}
            className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
          />
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              {1000 - content.length} characters left
            </span>
            <button
              type="submit"
              disabled={isPending || !content.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold transition-all cursor-pointer shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isPending ? "Posting…" : "Post Comment"}</span>
            </button>
          </div>
        </form>
      ) : (
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-center space-y-2">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Sign in to share feedback, ask questions, and support this startup.
          </p>
          <Link
            href={`/login?redirect=/startup/${startupSlug}`}
            className="inline-block px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          >
            Sign in to comment
          </Link>
        </div>
      )}

      {/* Comments List */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800 pt-2">
        {comments.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">
            No comments yet. Be the first to share your thoughts!
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="py-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-[10px]">
                    {comment.author.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {comment.author}
                  </span>
                  <Badge variant="default" size="sm">
                    {comment.role}
                  </Badge>
                </div>
                <div className="flex items-center gap-3">
                  <time className="text-[11px] text-slate-400">
                    {new Date(comment.date).toLocaleDateString()}
                  </time>
                  {currentUser?.role === "admin" && (
                    <button
                      onClick={() => handleHideComment(comment.id)}
                      disabled={isPending}
                      title="Hide comment (Admin)"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 cursor-pointer px-1.5 py-0.5 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    >
                      <EyeOff className="w-3 h-3" />
                      <span>Hide</span>
                    </button>
                  )}
                </div>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed pl-8">
                {comment.content}
              </p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
