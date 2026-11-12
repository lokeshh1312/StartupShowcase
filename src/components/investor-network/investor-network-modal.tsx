"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { X, Search, Globe, Users, Rocket, RefreshCw, AlertCircle } from "lucide-react";
import { CountryFlag } from "@/components/common/country-flag";
import { InvestorWorldMap } from "./investor-world-map";
import type { InvestorNetworkResponse } from "@/server/investor-network";

export interface InvestorNetworkModalProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLButtonElement | null>;
  bubbleTriggerRef?: React.RefObject<HTMLButtonElement | null>;
}

export function InvestorNetworkModal({
  isOpen,
  onClose,
  triggerRef,
  bubbleTriggerRef,
}: InvestorNetworkModalProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const countryRowRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const [data, setData] = useState<InvestorNetworkResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountryCode, setSelectedCountryCode] = useState<string | null>(null);

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

    // Focus close button or search on open
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

      // Return focus to bubble trigger
      if (triggerEl) {
        triggerEl.focus();
      }
    };
  }, [isOpen, onClose, triggerRef, bubbleTriggerRef]);

  // Filter countries by search query
  const filteredCountries = useMemo(() => {
    if (!data?.countries) return [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return data.countries;

    return data.countries.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q)
    );
  }, [data?.countries, searchQuery]);

  // Handle country selection (from list or map)
  const handleSelectCountry = (code: string) => {
    const upper = code.toUpperCase();
    setSelectedCountryCode(upper);

    // Scroll matching list row into view
    const rowEl = countryRowRefs.current.get(upper);
    if (rowEl) {
      rowEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  };

  if (!isOpen || typeof document === "undefined") return null;

  // Formatted asOf date
  const formattedAsOf = (() => {
    if (!data?.asOf) {
      return "9 Nov 2026";
    }
    try {
      const d = new Date(data.asOf);
      return new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }).format(d);
    } catch {
      return "9 Nov 2026";
    }
  })();

  const totalInvestors = data?.totals?.investors ?? 0;
  const totalStartups = data?.totals?.startups ?? 0;
  const hasInvestorRows =
    totalInvestors > 0 ||
    Boolean(data?.countries && data.countries.some((c) => c.investors > 0));

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
              Investors across the world and startups listed on Startup Showcase Global · investor figures as of{" "}
              <span className="font-medium text-slate-700 dark:text-slate-300">{formattedAsOf}</span>
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
          /* Loading Skeleton */
          <div className="flex-1 flex flex-col lg:flex-row gap-6 p-6 animate-pulse overflow-hidden">
            <div className="w-full lg:w-[430px] space-y-4 shrink-0">
              <div className="grid grid-cols-2 gap-3">
                <div className="h-20 rounded-2xl bg-slate-100 dark:bg-white/5" />
                <div className="h-20 rounded-2xl bg-slate-100 dark:bg-white/5" />
              </div>
              <div className="h-10 rounded-xl bg-slate-100 dark:bg-white/5" />
              <div className="space-y-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-14 rounded-2xl bg-slate-100 dark:bg-white/5" />
                ))}
              </div>
            </div>
            <div className="flex-1 h-full min-h-[350px] rounded-3xl bg-slate-100 dark:bg-white/5" />
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
          /* Main Layout: Desktop side-by-side / Mobile scrollable stack */
          <div className="flex-1 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden">
            {/* Left Panel (~430px on desktop) */}
            <aside className="w-full md:w-[430px] flex flex-col shrink-0 border-b md:border-b-0 md:border-r border-slate-200/90 dark:border-white/10 bg-white/70 dark:bg-[#0c0c0c]/70">
              {/* Stat Cards */}
              <div className="p-4 sm:p-5 border-b border-slate-200/90 dark:border-white/10 shrink-0 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {/* Total Investors */}
                  <div className="p-3.5 rounded-2xl bg-brand-50/70 dark:bg-white/5 border border-brand-200/80 dark:border-white/10 space-y-1">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-brand-900 dark:text-slate-300">
                      <Users className="w-3.5 h-3.5 text-brand-600 dark:text-slate-400" />
                      <span>Total Investors</span>
                    </div>
                    <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
                      {totalInvestors.toLocaleString("en-US")}
                    </div>
                  </div>

                  {/* Total Startups */}
                  <div className="p-3.5 rounded-2xl bg-brand-50/70 dark:bg-white/5 border border-brand-200/80 dark:border-white/10 space-y-1">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-brand-900 dark:text-slate-300">
                      <Rocket className="w-3.5 h-3.5 text-brand-600 dark:text-slate-400" />
                      <span>Startups Listed</span>
                    </div>
                    <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
                      {totalStartups.toLocaleString("en-US")}
                    </div>
                  </div>
                </div>

                {/* Country Search Input */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search country…"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/90 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-colors"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Small notice when investor figures are not available yet */}
              {!hasInvestorRows && (
                <div className="mx-4 sm:mx-5 mt-3 p-2.5 rounded-xl bg-slate-100/90 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-center text-xs font-medium text-slate-600 dark:text-slate-400">
                  Investor figures are not available yet
                </div>
              )}

              {/* Scrollable Country List */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-1.5">
                {filteredCountries.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
                    {searchQuery.trim() ? (
                      <>No countries found matching &quot;{searchQuery}&quot;</>
                    ) : (
                      <>No countries listed yet.</>
                    )}
                  </div>
                ) : (
                  filteredCountries.map((c) => {
                    const isSelected = selectedCountryCode === c.code.toUpperCase();

                    return (
                      <button
                        key={c.code}
                        ref={(el) => {
                          if (el) {
                            countryRowRefs.current.set(c.code.toUpperCase(), el);
                          } else {
                            countryRowRefs.current.delete(c.code.toUpperCase());
                          }
                        }}
                        type="button"
                        onClick={() => handleSelectCountry(c.code)}
                        className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500 ${
                          isSelected
                            ? "bg-brand-50/90 dark:bg-brand-950/40 border-brand-500 dark:border-brand-500/80 shadow-xs"
                            : "bg-white/80 dark:bg-white/[0.02] hover:bg-slate-50 dark:hover:bg-white/5 border-slate-200/70 dark:border-white/5"
                        }`}
                      >
                        {/* Country info */}
                        <div className="flex items-center gap-2.5 min-w-0">
                          <CountryFlag code={c.code} className="text-lg shrink-0" />
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {c.name}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              {c.startups.toLocaleString("en-US")} startups listed
                            </div>
                          </div>
                        </div>

                        {/* Investor count */}
                        <div className="text-right shrink-0">
                          <div className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                            {c.investors.toLocaleString("en-US")}
                          </div>
                          <div className="text-[10px] text-slate-400 uppercase font-mono">
                            investors
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </aside>

            {/* Right Side: World Map */}
            <main className="flex-1 h-[60vh] md:h-full p-3 sm:p-5 flex flex-col min-w-0">
              <InvestorWorldMap
                countries={data?.countries || []}
                selectedCode={selectedCountryCode}
                onSelectCountry={handleSelectCountry}
              />
            </main>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
