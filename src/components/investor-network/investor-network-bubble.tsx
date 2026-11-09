"use client";

import React, { useState, useRef } from "react";
import dynamic from "next/dynamic";
import { Globe } from "lucide-react";

// Dynamic import with client-only (ssr: false) so home page bundle size is untouched
const InvestorNetworkModal = dynamic(
  () =>
    import("./investor-network-modal").then((m) => m.InvestorNetworkModal),
  { ssr: false }
);

export function InvestorNetworkBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const bubbleRef = useRef<HTMLButtonElement | null>(null);

  return (
    <>
      <button
        ref={bubbleRef}
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Open Investor Network"
        className="group cursor-pointer select-none rounded-full flex flex-col items-center justify-center text-white dark:text-slate-100 bg-brand-600 hover:bg-brand-500 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border dark:border-white/15 shadow-lg shadow-brand-500/25 dark:shadow-black/60 hover:scale-[1.08] focus-visible:scale-[1.08] transition-transform duration-300 ease-out focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950 animate-float-bob fixed bottom-4 right-4 z-40 w-12 h-12 p-1 xl:static xl:bottom-auto xl:right-auto xl:z-auto xl:w-16 xl:h-16 xl:p-1.5 xl:mr-2 shrink-0"
      >
        <Globe className="w-3.5 h-3.5 xl:w-4 xl:h-4 mb-0.5 text-white dark:text-slate-200 transition-transform duration-300 group-hover:rotate-12 shrink-0" />
        <span className="text-[8px] xl:text-[9.5px] font-extrabold leading-[1.05] text-center tracking-tight text-white dark:text-slate-100">
          <span>Investor</span>
          <br />
          <span>Network</span>
        </span>
      </button>

      {/* Full-Page Window Overlay */}
      {isOpen && (
        <InvestorNetworkModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          bubbleTriggerRef={bubbleRef}
        />
      )}
    </>
  );
}
