"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { Mail, CheckCircle2, Send, ArrowLeft, ShieldCheck } from "lucide-react";
import { subscribeNewsletterAction } from "@/server/actions";
import { TurnstileWidget } from "@/components/common/turnstile";

export default function NewsletterPage() {
  const [email, setEmail] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileResetSignal, setTurnstileResetSignal] = useState(0);
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    startTransition(async () => {
      const res = await subscribeNewsletterAction(email.trim(), turnstileToken);
      if (res?.error) {
        setError(res.error);
        setTurnstileToken("");
        setTurnstileResetSignal((prev) => prev + 1);
      } else {
        setSubscribed(true);
      }
    });
  };

  const sampleEditions = [
    {
      issue: "Edition #42",
      title: "Autonomous Irrigation Grids & Edge Inference Runtimes",
      desc: "Deep dive into AgriTech sensors deployed across 8 regions and 5 newly approved developer tools.",
      reads: "24,000+ readers",
    },
    {
      issue: "Edition #41",
      title: "Next-Gen Thermal Storage and Desalination Systems",
      desc: "Spotlight on CleanTech prototypes demonstrating unprecedented unit economics and field longevity.",
      reads: "22,500+ readers",
    },
    {
      issue: "Edition #40",
      title: "Zero-Latency Collaborative Workspaces for Distributed Engineering",
      desc: "How cross-border builders are utilizing CRDTs to streamline local development.",
      reads: "21,000+ readers",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Back */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
      </div>

      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-xs font-semibold">
          <Mail className="w-3.5 h-3.5" />
          <span>Global Dispatch</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          The Early Discovery Radar
        </h1>

        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
          Join founders, angels, and early adopters reading our weekly briefing on breakthrough startups, prototypes, and cohort leaders before they hit mainstream headlines.
        </p>
      </div>

      {/* Subscription Box */}
      <div className="max-w-xl mx-auto p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
        {subscribed ? (
          <div className="space-y-3 py-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Check your inbox to confirm!
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              We&apos;ve sent a verification link to <span className="font-semibold text-slate-900 dark:text-white">{email}</span>. Click the link to complete your double opt-in subscription.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-600 dark:text-red-400 font-medium">
                {error}
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="grow px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={isPending}
                className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs transition-colors shadow-xs shrink-0 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{isPending ? "Subscribing…" : "Subscribe Free"}</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex justify-center pt-2">
              <TurnstileWidget
                onVerify={(token) => setTurnstileToken(token)}
                onExpire={() => setTurnstileToken("")}
                resetSignal={turnstileResetSignal}
              />
            </div>
            <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Zero spam. Unsubscribe with 1 click at any time.</span>
            </p>
          </form>
        )}
      </div>

      {/* Past Editions Preview */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white text-center">
          Recent Curated Dispatches
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {sampleEditions.map((ed) => (
            <div
              key={ed.issue}
              className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3"
            >
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-bold text-blue-600 dark:text-blue-400">{ed.issue}</span>
                <span>{ed.reads}</span>
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-2">
                {ed.title}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {ed.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
