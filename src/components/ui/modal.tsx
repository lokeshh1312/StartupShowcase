"use client";

import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: string;
  hideOkButton?: boolean;
  showCloseButton?: boolean;
  contentClassName?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = "max-w-sm sm:max-w-md",
  hideOkButton = false,
  showCloseButton = false,
  contentClassName = "",
}: ModalProps) {
  const okButtonRef = useRef<HTMLButtonElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Focus preferred button or container on open
    const timer = setTimeout(() => {
      if (okButtonRef.current) {
        okButtonRef.current.focus();
      } else if (closeButtonRef.current) {
        closeButtonRef.current.focus();
      } else if (containerRef.current) {
        containerRef.current.focus();
      }
    }, 0);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      clearTimeout(timer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
    >
      <div
        ref={containerRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${maxWidth} bg-white dark:bg-slate-950 rounded-3xl border border-slate-200/90 dark:border-white/10 p-6 sm:p-7 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 my-auto focus:outline-none ${contentClassName}`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h3
              id="modal-title"
              className="text-[18px] font-semibold text-slate-900 dark:text-white"
            >
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {subtitle}
              </p>
            )}
          </div>
          {(showCloseButton || hideOkButton) && (
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="p-1.5 -mr-1.5 -mt-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          {children}
        </div>

        {!hideOkButton && (
          <div className="flex items-center justify-end pt-2">
            <button
              ref={okButtonRef}
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white dark:text-[#0e0d0d] text-xs sm:text-sm font-medium transition-colors cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
            >
              OK
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
