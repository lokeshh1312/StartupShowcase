"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { CalendarDays, Megaphone, X } from "lucide-react";
import { isPromoBannerActive } from "@/lib/promo-banner";

const PRIZE_ROWS = [
  { place: "1", suffix: "st", amount: "$10K" },
  { place: "2", suffix: "nd", amount: "$10K" },
  { place: "3", suffix: "rd", amount: "$10K" },
  { place: "4", suffix: "th", amount: "$10K" },
  { place: "5", suffix: "th", amount: "$10K" },
];

export function PromoBanner() {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const hasDismissedRef = useRef(false);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  const pathname = usePathname();
  const isAdmin = Boolean(pathname?.startsWith("/admin"));

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleClose = useCallback(() => {
    hasDismissedRef.current = true;
    setIsOpen(false);
    if (
      previousActiveElementRef.current &&
      typeof previousActiveElementRef.current.focus === "function"
    ) {
      previousActiveElementRef.current.focus();
    }
  }, []);

  // Timer to open ~1.2s after mount
  useEffect(() => {
    if (!mounted || isAdmin || hasDismissedRef.current || !isPromoBannerActive()) {
      return;
    }

    const timer = setTimeout(() => {
      if (!hasDismissedRef.current && isPromoBannerActive() && !isAdmin) {
        previousActiveElementRef.current = document.activeElement as HTMLElement | null;
        setIsOpen(true);
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [mounted, isAdmin]);

  // Lock page scroll while open and restore on close
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Focus trap and Escape key listener
  useEffect(() => {
    if (!isOpen) return;

    const focusTimer = setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
        return;
      }
      if (e.key === "Tab") {
        if (dialogRef.current) {
          const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusable.length > 0) {
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (e.shiftKey && document.activeElement === first) {
              e.preventDefault();
              last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
              e.preventDefault();
              first.focus();
            }
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, handleClose]);

  if (!mounted || !isOpen || isAdmin) {
    return null;
  }

  const modalContent = (
    <div
      data-testid="promo-banner-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs transition-opacity duration-300 motion-reduce:transition-none"
      onClick={handleClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Startup Showcase grants announcement"
        style={{
          containerType: "inline-size",
        }}
        className="relative bg-[#fcf6ef] rounded-2xl sm:rounded-3xl shadow-2xl overflow-y-auto overflow-x-hidden sm:overflow-hidden flex flex-col items-center justify-start sm:justify-center text-center select-text transition-all duration-300 ease-out motion-reduce:transition-none motion-reduce:transform-none w-[92vw] max-w-[92vw] sm:max-w-none sm:w-[min(92vw,760px,calc(88vh*16/9))] max-h-[88vh] sm:max-h-none aspect-auto sm:aspect-[16/9] py-5 sm:py-0 px-3 sm:px-[3cqw]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative corner graphics: soft pale-orange quarter-circles */}
        <div
          aria-hidden="true"
          className="absolute -top-8 -left-8 sm:-top-[12cqw] sm:-left-[12cqw] w-24 h-24 sm:w-[28cqw] sm:h-[28cqw] rounded-full bg-[#fde3ce]/70 pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="absolute -top-4 -left-4 sm:-top-[6cqw] sm:-left-[6cqw] w-16 h-16 sm:w-[18cqw] sm:h-[18cqw] rounded-full bg-[#faecd6]/60 pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-8 -right-8 sm:-bottom-[12cqw] sm:-right-[12cqw] w-24 h-24 sm:w-[28cqw] sm:h-[28cqw] rounded-full bg-[#fde3ce]/70 pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-4 -right-4 sm:-bottom-[6cqw] sm:-right-[6cqw] w-16 h-16 sm:w-[18cqw] sm:h-[18cqw] rounded-full bg-[#faecd6]/60 pointer-events-none"
        />

        {/* Close button: 40x40px minimum tap target, white circle with shadow */}
        <button
          ref={closeButtonRef}
          type="button"
          onClick={handleClose}
          aria-label="Close announcement"
          className="absolute top-2.5 right-2.5 sm:top-3.5 sm:right-3.5 z-30 w-10 h-10 min-w-[40px] min-h-[40px] rounded-full bg-white text-[#12295c] shadow-md flex items-center justify-center hover:bg-slate-50 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#ff6600] cursor-pointer"
        >
          <X className="w-5 h-5" strokeWidth={2.5} />
        </button>

        {/* Center content stack */}
        <div className="w-full flex flex-col items-center justify-center z-10 gap-2.5 sm:gap-[1.1cqw]">
          {/* Top-right pill with calendar icon: November 2026 */}
          {/* On mobile: stacked at top, 13px. On desktop: positioned absolute top-right */}
          <div className="relative sm:absolute sm:top-[2.8cqw] sm:right-[max(7cqw,56px)] inline-flex items-center gap-1.5 sm:gap-[0.8cqw] rounded-full bg-white/90 border border-[#f3d7be] shadow-2xs font-semibold text-[#12295c] px-3 py-1 sm:px-[1.8cqw] sm:py-[0.5cqw] text-[13px] sm:text-[1.7cqw]">
            <CalendarDays className="w-3.5 h-3.5 sm:w-[2cqw] sm:h-[2cqw] text-[#ff6600] shrink-0" />
            <span>November 2026</span>
          </div>

          {/* Heading, big bold navy, 2 lines */}
          <h2 className="font-extrabold text-[#12295c] tracking-tight text-center text-[30px] leading-[34px] sm:text-[4cqw] sm:leading-[1.1]">
            <span>Top 10 Startups</span>
            <br />
            <span>Shortlisted.</span>
          </h2>

          {/* Orange rounded bar, white bold */}
          <div className="inline-flex flex-wrap items-center justify-center rounded-2xl sm:rounded-full font-bold text-white shadow-xs bg-[#ff6600] px-4 py-2 sm:px-[2.8cqw] sm:py-[0.6cqw] text-[17px] sm:text-[2.2cqw] leading-tight text-center max-w-[320px] sm:max-w-none">
            <span>Top 5 Startups Will Get $10,000 Grant</span>
            <span className="block sm:inline sm:ml-1.5 text-[13px] sm:text-[0.72em] font-medium sm:font-bold opacity-95 w-full sm:w-auto mt-0.5 sm:mt-0">
              (Per Startup)
            </span>
          </div>

          {/* Five outlined rounded rows */}
          <div className="w-full max-w-[300px] sm:max-w-none sm:w-[48cqw] flex flex-col items-center gap-1.5 sm:gap-[0.45cqw] my-0.5 sm:my-0">
            {PRIZE_ROWS.map((row) => (
              <div
                key={row.place}
                className="w-full flex items-center justify-between rounded-lg sm:rounded-xl border border-[#f3d7be] bg-white/70 px-3 sm:px-[1.6cqw] h-[34px] sm:h-[2.7cqw]"
              >
                <div className="flex-1 flex items-center justify-center text-[#12295c] font-semibold text-[15px] sm:text-[1.75cqw]">
                  <span>
                    {row.place}
                    <sup className="text-[12px] sm:text-[0.7em] font-semibold ml-0.5">
                      {row.suffix}
                    </sup>{" "}
                    Place
                  </span>
                </div>
                <div
                  aria-hidden="true"
                  className="w-px h-4 sm:h-[1.7cqw] bg-[#ff6600]/30 shrink-0"
                />
                <div className="flex-1 flex items-center justify-center text-[#ff6600] font-extrabold text-[18px] sm:text-[1.95cqw]">
                  <span>{row.amount}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Two outlined orange chips */}
          <div className="flex flex-col sm:flex-row items-center justify-center w-full max-w-[300px] sm:max-w-none sm:w-auto gap-2 sm:gap-[1.2cqw]">
            <div className="inline-flex items-center justify-center w-full sm:w-auto rounded-full font-semibold text-[#12295c] bg-white/70 border border-[#ff6600] text-[13px] sm:text-[1.6cqw] px-3 py-1.5 sm:px-[1.8cqw] sm:py-[0.5cqw] gap-1.5 sm:gap-[0.6cqw]">
              <CalendarDays className="w-4 h-4 sm:w-[1.9cqw] sm:h-[1.9cqw] text-[#ff6600] shrink-0" />
              <span>Deadline: 30 Nov 2026</span>
            </div>

            <div
              aria-hidden="true"
              className="hidden sm:block w-px h-[2.4cqw] bg-[#ff6600]/45 shrink-0"
            />

            <div className="inline-flex items-center justify-center w-full sm:w-auto rounded-full font-semibold text-[#12295c] bg-white/70 border border-[#ff6600] text-[13px] sm:text-[1.6cqw] px-3 py-1.5 sm:px-[1.8cqw] sm:py-[0.5cqw] gap-1.5 sm:gap-[0.6cqw]">
              <Megaphone className="w-4 h-4 sm:w-[1.9cqw] sm:h-[1.9cqw] text-[#ff6600] shrink-0" />
              <span>Result Announcement: 10 Dec 2026</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
