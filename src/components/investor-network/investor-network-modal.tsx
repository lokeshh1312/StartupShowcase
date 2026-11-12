"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { X, Globe, RefreshCw, AlertCircle } from "lucide-react";
import { InvestorWorldMap } from "./investor-world-map";
import type { InvestorNetworkResponse } from "@/server/investor-network";

export interface InvestorNetworkModalProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLButtonElement | null>;
  bubbleTriggerRef?: React.RefObject<HTMLButtonElement | null>;
}

/**
 * Computes the subtitle text from the total number of investors:
 * - If total >= 10,000: round down to the nearest 10,000 (e.g. 61,725 -> "60,000+")
 * - Else if total >= 1,000: round down to the nearest 1,000 (e.g. 4,850 -> "4,000+")
 * - Else: exact total (e.g. 500 -> "500+")
 * - If no investor data (0, null, or undefined): "Connect with a Global Network of Angel Investors."
 */
export function formatInvestorSubtitle(totalInvestors?: number | null): string {
  if (!totalInvestors || totalInvestors <= 0) {
    return "Connect with a Global Network of Angel Investors.";
  }

  let roundedCount: number;
  if (totalInvestors >= 10000) {
    roundedCount = Math.floor(totalInvestors / 10000) * 10000;
  } else if (totalInvestors >= 1000) {
    roundedCount = Math.floor(totalInvestors / 1000) * 1000;
  } else {
    roundedCount = totalInvestors;
  }

  return `Connect with a Global Network of ${roundedCount.toLocaleString("en-US")}+ Active Angel Investors.`;
}

export function InvestorNetworkModal({
  isOpen,
  onClose,
  triggerRef,
  bubbleTriggerRef,
}: InvestorNetworkModalProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  const [data, setData] = useState<InvestorNetworkResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch /api/investor-network on first open
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/investor-network", {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) {
        throw new Error(`Failed to load investor network (HTTP ${res.status})`);
      }
      const json: InvestorNetworkResponse = await res.json();
      setData(json);
    } catch (err) {
      console.error("Failed to fetch investor network:", err);
      setError("Unable to connect to the Investor Network. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !data && !loading) {
      fetchData();
    }
  }, [isOpen, data, loading]);

  // Lock body scroll and handle keyboard Esc & focus trap
  useEffect(() => {
    if (!isOpen) return;

    const triggerEl = triggerRef?.current ?? bubbleTriggerRef?.current;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Focus close button on open
    const timer = setTimeout(() => {
      if (closeButtonRef.current) {
        closeButtonRef.current.focus();
      } else if (dialogRef.current) {
        dialogRef.current.focus();
      }
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      // Basic Tab trap within dialog
      if (e.key === "Tab" && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      clearTimeout(timer);
      window.removeEventListener("keydown", handleKeyDown);

      // Return focus to trigger element
      if (triggerEl) {
        triggerEl.focus();
      }
    };
  }, [isOpen, onClose, triggerRef, bubbleTriggerRef]);

  // Calculate real total investors from data sum
  const totalInvestors = useMemo(() => {
    if (!data?.countries || data.countries.length === 0) {
      return data?.totals?.investors ?? 0;
    }
    return data.countries.reduce((sum, c) => sum + (c.investors || 0), 0);
  }, [data]);

  const subtitleText = formatInvestorSubtitle(totalInvestors);

  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="investor-network-title"
      ref={dialogRef}
      tabIndex={-1}
      className="fixed inset-0 z-[100] flex flex-col bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200 focus:outline-hidden"
    >
      {/* Full-Page Window Container */}
      <div className="relative flex flex-col w-full h-full bg-white dark:bg-[#0c0c0c] text-slate-900 dark:text-white overflow-hidden shadow-2xl">
        {/* Header */}
        <header className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-200/90 dark:border-white/10 shrink-0 bg-white/95 dark:bg-[#0c0c0c]/95 backdrop-blur-md z-30">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-brand-600 dark:text-brand-400 shrink-0" />
              <h2
                id="investor-network-title"
                className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white"
              >
                Investor Network
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {subtitleText}
            </p>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close Investor Network"
            className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Content Body */}
        {loading ? (
          /* Loading Skeleton in Centred Box */
          <div className="flex-1 flex flex-col items-center justify-center min-h-0 w-full p-0 sm:p-6">
            <div className="w-full max-w-[1320px] h-full flex-1 min-h-0 rounded-none sm:rounded-3xl bg-slate-100 dark:bg-white/5 animate-pulse border-y sm:border border-slate-200/90 dark:border-white/10" />
          </div>
        ) : error ? (
          /* Error State with Retry Button */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-3xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-200 dark:border-rose-900">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div className="space-y-1 max-w-md">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Unable to Load Network Data
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {error}
              </p>
            </div>
            <button
              type="button"
              onClick={fetchData}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-all shadow-xs cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry</span>
            </button>
          </div>
        ) : (
          /* Main Layout: Centred rounded world map box (max-w ~1320px, ~24px margin on desktop, full width on mobile) */
          <div className="flex-1 flex flex-col items-center justify-center min-h-0 w-full p-0 sm:p-6">
            <div className="w-full max-w-[1320px] h-full flex-1 min-h-0">
              <InvestorWorldMap countries={data?.countries || []} />
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
