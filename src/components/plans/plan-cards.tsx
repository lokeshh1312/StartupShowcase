"use client";

import React from "react";
import Link from "next/link";
import { Check, Sparkles, ArrowRight } from "lucide-react";
import { PLANS, PLAN_DISPLAY_ORDER, type PlanKey } from "@/lib/plans";

export interface PlanCardsProps {
  onSelect?: (planKey: PlanKey) => void;
  disabled?: boolean;
  pendingPlan?: PlanKey | null;
  mode?: "checkout" | "pricing";
  selectedPlan?: PlanKey | null;
}

export function PlanCards({
  onSelect,
  disabled = false,
  pendingPlan = null,
  mode = "checkout",
  selectedPlan = null,
}: PlanCardsProps) {
  const isPricingMode = mode === "pricing";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 items-stretch w-full">
      {PLAN_DISPLAY_ORDER.map((key) => {
        const plan = PLANS[key];
        const isHighlighted = Boolean(plan.highlighted);
        const isPending = pendingPlan === key;
        const isCurrentSelected = selectedPlan === key;

        return (
          <div
            key={key}
            className={`relative rounded-2xl flex flex-col justify-between p-5 sm:p-6 transition-all backdrop-blur-md shadow-xs ${
              isHighlighted
                ? "bg-white/95 dark:bg-white/[0.05] border-2 border-brand-500/80 dark:border-brand-500/60 ring-2 ring-brand-500/20 shadow-md"
                : "bg-white/90 dark:bg-white/[0.03] border border-slate-200/90 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20"
            }`}
          >
            {/* Top Row: Plan Badge & Name */}
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2 min-h-[24px]">
                {plan.badge ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 border border-brand-200/80 dark:border-brand-800/60">
                    <Sparkles className="w-3 h-3 text-brand-600 dark:text-brand-400" />
                    <span>{plan.badge}</span>
                  </span>
                ) : (
                  <span />
                )}
                {isCurrentSelected && (
                  <span className="text-[11px] font-semibold text-brand-600 dark:text-brand-400">
                    Selected
                  </span>
                )}
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {plan.name}
                </h3>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    {plan.priceFormatted}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {plan.billingText}
                  </span>
                </div>
              </div>

              {/* Feature List */}
              <ul className="space-y-2.5 pt-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                {plan.features.map((feature, idx) => {
                  const isIncludedTier =
                    feature.startsWith("Everything in ");

                  if (isIncludedTier) {
                    return (
                      <li
                        key={idx}
                        className="py-1.5 px-2.5 rounded-lg bg-slate-100/80 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-2"
                      >
                        <Check className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    );
                  }

                  return (
                    <li key={idx} className="flex items-start gap-2.5 leading-snug">
                      <Check className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Bottom CTA */}
            <div className="pt-6 mt-4 border-t border-slate-100 dark:border-white/5">
              {isPricingMode ? (
                <Link
                  href="/submit"
                  className={`w-full py-3 px-4 rounded-xl text-center text-xs sm:text-sm font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500 ${
                    isHighlighted
                      ? "bg-brand-600 hover:bg-brand-500 text-white shadow-md hover:shadow-lg"
                      : "bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
                  }`}
                >
                  <span>Submit your startup</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => onSelect?.(key)}
                  disabled={disabled || isPending}
                  aria-label={`Choose ${plan.name} plan, ${plan.priceFormatted}`}
                  className={`w-full py-3 px-4 rounded-xl text-center text-xs sm:text-sm font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500 ${
                    isHighlighted
                      ? "bg-brand-600 hover:bg-brand-500 text-white shadow-md hover:shadow-lg"
                      : "bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
                  }`}
                >
                  {isPending ? (
                    <span>Processing...</span>
                  ) : (
                    <span>Pay {plan.priceFormatted}</span>
                  )}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

