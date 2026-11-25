"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  COUNTER_LABEL,
  baseline,
  nextTickAt,
} from "@/lib/home-counter";

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

interface DigitBoxProps {
  digit: number;
  prefersReducedMotion: boolean;
}

function DigitBox({ digit, prefersReducedMotion }: DigitBoxProps) {
  const [pos, setPos] = useState(digit);
  const [animating, setAnimating] = useState(false);
  const prevDigitRef = useRef(digit);
  const posRef = useRef(digit);
  const resetTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (prevDigitRef.current === digit) {
      return;
    }
    prevDigitRef.current = digit;

    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }

    if (prefersReducedMotion) {
      posRef.current = digit;
      setPos(digit);
      setAnimating(false);
      return;
    }

    const currentBase = posRef.current % 10;
    const step = (digit - currentBase + 10) % 10;
    if (step === 0) {
      return;
    }

    const targetPos = currentBase + step;
    posRef.current = targetPos;
    setPos(targetPos);
    setAnimating(true);

    resetTimerRef.current = setTimeout(() => {
      const normalized = targetPos % 10;
      posRef.current = normalized;
      setPos(normalized);
      setAnimating(false);
    }, 450);

    return () => {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }
    };
  }, [digit, prefersReducedMotion]);

  return (
    <span
      className="relative inline-flex items-start justify-center overflow-hidden w-[18px] h-[24px] sm:w-[22px] sm:h-[28px] rounded-md bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 font-bold text-[#ff6600] text-[13px] sm:text-[17px] tabular-nums select-none shrink-0"
    >
      <span
        className="flex flex-col items-center w-full"
        style={{
          height: "2000%",
          transform: `translateY(-${pos * 5}%)`,
          transition:
            animating && !prefersReducedMotion
              ? "transform 400ms cubic-bezier(0.2, 0, 0.2, 1)"
              : "none",
        }}
      >
        {DIGITS.map((val, idx) => (
          <span
            key={idx}
            className="flex items-center justify-center w-full h-[5%] shrink-0 tabular-nums leading-none select-none"
          >
            {val}
          </span>
        ))}
      </span>
    </span>
  );
}

interface CounterState {
  count: number;
  resetEpoch: number;
}

export function HomeCounterBadge() {
  const [state, setState] = useState<CounterState | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check prefers-reduced-motion safely
    let mediaQuery: MediaQueryList | null = null;
    let handleMediaChange: ((e: MediaQueryListEvent) => void) | null = null;

    if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
      try {
        mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
        setPrefersReducedMotion(mediaQuery.matches);

        handleMediaChange = (e: MediaQueryListEvent) => {
          setPrefersReducedMotion(e.matches);
        };
        mediaQuery.addEventListener("change", handleMediaChange);
      } catch {
        // Fall back gracefully if matchMedia throws
      }
    }

    const syncToNow = () => {
      const nextCount = baseline(Date.now());
      setState((prev) => {
        if (prev === null) {
          return { count: nextCount, resetEpoch: 0 };
        }
        if (nextCount === prev.count) {
          return prev;
        }
        // On midnight reset (drop), increment resetEpoch so digit boxes remount directly without rolling
        const didDrop = nextCount < prev.count;
        return {
          count: nextCount,
          resetEpoch: didDrop ? prev.resetEpoch + 1 : prev.resetEpoch,
        };
      });
    };

    // Initialize immediately on client mount with baseline(now)
    syncToNow();

    let timeoutId: NodeJS.Timeout | null = null;
    let isCancelled = false;

    const scheduleNextTick = () => {
      if (isCancelled || document.visibilityState === "hidden") {
        return;
      }

      const now = Date.now();
      const targetTime = nextTickAt(now);
      const delay = Math.max(10, targetTime - now);

      timeoutId = setTimeout(() => {
        if (isCancelled || document.visibilityState === "hidden") return;

        syncToNow();
        scheduleNextTick();
      }, delay);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        syncToNow();
        scheduleNextTick();
      } else {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    scheduleNextTick();

    return () => {
      isCancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (mediaQuery && handleMediaChange) {
        mediaQuery.removeEventListener("change", handleMediaChange);
      }
    };
  }, []);

  // Avoid hydration mismatch: render nothing until client mount
  if (state === null) {
    return null;
  }

  const formatted = state.count.toLocaleString("en-US");
  const chars = formatted.split("");

  return (
    <div
      aria-hidden="true"
      data-testid="home-counter-badge"
      className="fixed right-4 sm:right-6 bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:bottom-[calc(1.5rem+env(safe-area-inset-bottom,0px))] z-30 pointer-events-none select-none inline-flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-2xl bg-white dark:bg-[#161616] border border-slate-200 dark:border-white/10 shadow-md dark:shadow-black/40 text-slate-700 dark:text-slate-300 transition-colors"
    >
      {/* Pulsing green dot */}
      <span className="relative flex h-2 w-2 shrink-0 items-center justify-center">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 motion-reduce:animate-none" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
      </span>

      {/* Digits & commas */}
      <div className="flex items-center gap-0.5 sm:gap-1 tabular-nums">
        {chars.map((ch, idx) => {
          const key = `${state.resetEpoch}-char-${chars.length - 1 - idx}`;
          if (ch === ",") {
            return (
              <span
                key={key}
                className="text-slate-400 dark:text-slate-500 font-semibold px-0.5 select-none self-center text-xs sm:text-sm tabular-nums"
              >
                ,
              </span>
            );
          }
          return (
            <DigitBox
              key={key}
              digit={Number(ch)}
              prefersReducedMotion={prefersReducedMotion}
            />
          );
        })}
      </div>

      {/* Label */}
      <span className="text-xs sm:text-sm font-normal text-slate-700 dark:text-slate-300 pl-0.5 select-none">
        {COUNTER_LABEL}
      </span>
    </div>
  );
}
