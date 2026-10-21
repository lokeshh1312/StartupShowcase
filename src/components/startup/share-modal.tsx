"use client";

import React, { useState } from "react";
import { Share2, Check, Copy, X } from "lucide-react";

interface ShareModalProps {
  startupName: string;
  tagline?: string;
}

export function ShareModal({ startupName, tagline }: ShareModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareText = encodeURIComponent(`Check out ${startupName}: ${tagline || ""}`);
  const shareUrl = typeof window !== "undefined" ? encodeURIComponent(window.location.href) : "";

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        type="button"
        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs"
        aria-label="Share startup"
      >
        <Share2 className="w-4 h-4 text-slate-500" />
        <span>Share</span>
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Share {startupName}
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Spread the word and help this startup gain visibility in the global monthly leaderboard!
            </p>

            {/* Copy Link input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={typeof window !== "undefined" ? window.location.href : ""}
                className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 select-all"
              />
              <button
                onClick={handleCopy}
                className="px-3 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1 transition-colors shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>

            {/* Social Links */}
            <div className="pt-2 flex flex-col gap-2">
              <a
                href={`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`}
                target="_blank"
                rel="noreferrer noopener"
                className="w-full text-center py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              >
                Share on X / Twitter ↗
              </a>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`}
                target="_blank"
                rel="noreferrer noopener"
                className="w-full text-center py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              >
                Share on LinkedIn ↗
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function ShareButton({
  name,
  tagline,
}: {
  name: string;
  slug?: string;
  tagline?: string;
}) {
  return <ShareModal startupName={name} tagline={tagline} />;
}
