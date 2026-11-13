"use client";

import React, { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { AlertCircle, RefreshCw } from "lucide-react";
import { formatInvestorSubtitle } from "@/lib/investor-network";
import type { InvestorNetworkResponse } from "@/server/investor-network";

const InvestorWorldMap = dynamic(
  () =>
    import("@/components/investor-network/investor-world-map").then(
      (m) => m.InvestorWorldMap
    ),
  {
    ssr: false,
    loading: () => <MapPlaceholder />,
  }
);

function MapPlaceholder() {
  return (
    <div
      aria-label="Loading map"
      className="w-full h-full rounded-2xl sm:rounded-3xl bg-slate-100 dark:bg-white/5 animate-pulse border border-slate-200/90 dark:border-white/10"
    />
  );
}

interface InvestorsClientProps {
  children?: React.ReactNode;
}

export function InvestorsClient({ children }: InvestorsClientProps) {
  const [data, setData] = useState<InvestorNetworkResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    fetchData();
  }, []);

  const totalInvestors = useMemo(() => {
    if (!data?.countries || data.countries.length === 0) {
      return data?.totals?.investors ?? 0;
    }
    return data.countries.reduce((sum, c) => sum + (c.investors || 0), 0);
  }, [data]);

  const subtitleText = formatInvestorSubtitle(totalInvestors);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Subtitle Line */}
      <div className="text-center px-2">
        <p
          className="text-center font-normal font-calibri text-xl sm:text-2xl md:text-3xl text-slate-600 dark:text-slate-300 leading-tight"
          style={{
            fontFamily: "Calibri, var(--font-carlito), Arial, sans-serif",
          }}
        >
          {subtitleText}
        </p>
      </div>

      {/* Crawlable Intro Paragraph under the Subtitle */}
      {children}

      {/* World Map Container: Centred rounded box, max-w-[1150px], aspect-[960/500], NO inner scrollbars */}
      <div className="w-full flex items-center justify-center pt-2 sm:pt-4">
        <div
          className="w-full max-w-[1150px] aspect-[960/500] rounded-2xl sm:rounded-3xl overflow-hidden"
          style={{ width: "min(1150px, 100%)" }}
        >
          {loading ? (
            <MapPlaceholder />
          ) : error ? (
            <div className="w-full h-full rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] flex flex-col items-center justify-center p-6 sm:p-8 text-center space-y-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-200 dark:border-rose-900">
                <AlertCircle className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <div className="space-y-1 max-w-md">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Unable to Load Network Data
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {error}
                </p>
              </div>
              <button
                type="button"
                onClick={fetchData}
                className="inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-all shadow-xs cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Retry</span>
              </button>
            </div>
          ) : (
            <InvestorWorldMap countries={data?.countries || []} />
          )}
        </div>
      </div>
    </div>
  );
}

