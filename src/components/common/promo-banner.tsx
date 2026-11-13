"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { CalendarDays, Megaphone, X } from "lucide-react";
import { isPromoBannerActive } from "@/lib/promo-banner";

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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity duration-300 motion-reduce:transition-none"
      onClick={handleClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Startup Showcase grants announcement"
        style={{
          width: "min(92vw, 760px, calc(88vh * 16 / 9))",
          aspectRatio: "16 / 9",
          containerType: "inline-size",
        }}
        className="relative bg-[#fcf6ef] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col items-center justify-center text-center select-text transition-all duration-300 ease-out motion-reduce:transition-none motion-reduce:transform-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative corner graphics: soft pale-orange quarter-circles */}
        <div
          aria-hidden="true"
          className="absolute -top-[12cqw] -left-[12cqw] w-[28cqw] h-[28cqw] rounded-full bg-[#fde3ce]/70 pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="absolute -top-[6cqw] -left-[6cqw] w-[18cqw] h-[18cqw] rounded-full bg-[#faecd6]/60 pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-[12cqw] -right-[12cqw] w-[28cqw] h-[28cqw] rounded-full bg-[#fde3ce]/70 pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-[6cqw] -right-[6cqw] w-[18cqw] h-[18cqw] rounded-full bg-[#faecd6]/60 pointer-events-none"
        />

        {/* Close button: 40x40px minimum tap target, white circle with shadow */}
        <button
          ref={closeButtonRef}
          type="button"
          onClick={handleClose}
          aria-label="Close announcement"
          className="absolute top-2.5 right-2.5 sm:top-3.5 sm:right-3.5 z-20 w-10 h-10 min-w-[40px] min-h-[40px] rounded-full bg-white text-[#12295c] shadow-md flex items-center justify-center hover:bg-slate-50 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#ff6600] cursor-pointer"
        >
          <X className="w-5 h-5" strokeWidth={2.5} />
        </button>

        {/* Top-right pill: November 2026 */}
        <div
          className="absolute z-10 inline-flex items-center rounded-full bg-white/90 border border-[#f3d7be] shadow-2xs font-semibold text-[#12295c]"
          style={{
            top: "3cqw",
            right: "max(10cqw, 56px)",
            gap: "0.8cqw",
            paddingLeft: "1.8cqw",
            paddingRight: "1.8cqw",
            paddingTop: "0.6cqw",
            paddingBottom: "0.6cqw",
            fontSize: "1.8cqw",
          }}
        >
          <CalendarDays
            style={{ width: "2.2cqw", height: "2.2cqw", color: "#ff6600" }}
          />
          <span>November 2026</span>
        </div>

        {/* Center content stack */}
        <div
          className="w-full flex flex-col items-center justify-center z-10"
          style={{
            paddingLeft: "4cqw",
            paddingRight: "4cqw",
            gap: "1.6cqw",
          }}
        >
          {/* Big Bold Navy Heading */}
          <h2
            className="font-extrabold text-[#12295c] tracking-tight text-center leading-[1.08]"
            style={{ fontSize: "5cqw" }}
          >
            <span>Top 10 Startups</span>
            <br />
            <span>Shortlisted.</span>
          </h2>

          {/* Orange rounded bar */}
          <div
            className="inline-flex items-center justify-center rounded-full font-bold text-white shadow-xs"
            style={{
              backgroundColor: "#ff6600",
              fontSize: "2.4cqw",
              paddingLeft: "3.2cqw",
              paddingRight: "3.2cqw",
              paddingTop: "0.8cqw",
              paddingBottom: "0.8cqw",
            }}
          >
            Top 5 Awarded Grants.
          </div>

          {/* Between two thin navy lines */}
          <div
            className="w-full flex flex-col items-center justify-center"
            style={{
              maxWidth: "56cqw",
              borderTop: "1px solid rgba(18, 41, 92, 0.3)",
              borderBottom: "1px solid rgba(18, 41, 92, 0.3)",
              paddingTop: "1cqw",
              paddingBottom: "1.1cqw",
            }}
          >
            <span
              className="font-extrabold text-[#12295c] leading-none tracking-tight"
              style={{ fontSize: "4.8cqw" }}
            >
              USD 10,000
            </span>
            <span
              className="font-bold text-[#12295c] leading-none"
              style={{
                fontSize: "1.6cqw",
                letterSpacing: "0.35em",
                marginTop: "0.6cqw",
                marginLeft: "0.35em",
              }}
            >
              GRANTS
            </span>
          </div>

          {/* Two outlined orange chips separated by a thin vertical divider */}
          <div
            className="flex items-center justify-center"
            style={{
              gap: "1.6cqw",
            }}
          >
            <div
              className="inline-flex items-center rounded-full font-semibold text-[#12295c] bg-white/70"
              style={{
                border: "1px solid #ff6600",
                fontSize: "1.8cqw",
                paddingLeft: "2cqw",
                paddingRight: "2cqw",
                paddingTop: "0.7cqw",
                paddingBottom: "0.7cqw",
                gap: "0.8cqw",
              }}
            >
              <CalendarDays
                style={{ width: "2.2cqw", height: "2.2cqw", color: "#ff6600" }}
              />
              <span>Deadline: 30 Nov 2026</span>
            </div>

            <div
              style={{
                width: "1px",
                height: "2.8cqw",
                backgroundColor: "rgba(255, 102, 0, 0.45)",
              }}
            />

            <div
              className="inline-flex items-center rounded-full font-semibold text-[#12295c] bg-white/70"
              style={{
                border: "1px solid #ff6600",
                fontSize: "1.8cqw",
                paddingLeft: "2cqw",
                paddingRight: "2cqw",
                paddingTop: "0.7cqw",
                paddingBottom: "0.7cqw",
                gap: "0.8cqw",
              }}
            >
              <Megaphone
                style={{ width: "2.2cqw", height: "2.2cqw", color: "#ff6600" }}
              />
              <span>Result Announcement: 10 Dec 2026</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
