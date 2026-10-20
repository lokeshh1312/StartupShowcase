import React, { useState } from 'react';
import { X, Check, Copy, Share2, ExternalLink } from 'lucide-react';
import { TwitterIcon, LinkedinIcon } from './SocialIcons';

export const ShareModal = ({ isOpen, onClose, startup }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !startup) return null;

  const url = `${window.location.origin}/startup/${startup.slug}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out ${startup.name} on @LaunchSpace — ${startup.tagline}`)}&url=${encodeURIComponent(url)}`;
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-slate-100"
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-title"
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-teal-400" />
            <h3 id="share-title" className="font-semibold text-lg text-white">Share {startup.name}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-5 space-y-4">
          <p className="text-sm text-slate-300">
            Share this product with your fellow founders, product teams, and tech communities:
          </p>

          {/* Copy link input */}
          <div className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-950 border border-slate-800">
            <input
              type="text"
              readOnly
              value={url}
              className="flex-1 bg-transparent px-3 text-xs text-slate-300 focus:outline-none font-mono selection:bg-teal-500/30"
            />
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                copied
                  ? 'bg-emerald-500 text-white'
                  : 'bg-teal-500 hover:bg-teal-400 text-slate-950'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy
                </>
              )}
            </button>
          </div>

          {/* Social share buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <a
              href={tweetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-xs font-medium text-slate-200 hover:text-white transition-colors"
            >
              <TwitterIcon className="w-4 h-4 text-sky-400" />
              Post on X
            </a>
            <a
              href={linkedInUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-xs font-medium text-slate-200 hover:text-white transition-colors"
            >
              <LinkedinIcon className="w-4 h-4 text-blue-400" />
              Share LinkedIn
            </a>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
