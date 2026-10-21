import React from "react";
import Link from "next/link";
import {
  Trophy,
  Target,
  Users,
  ArrowRight,
  Globe,
} from "lucide-react";
import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "About Startup Showcase | Global Startup Discovery",
  description:
    "Learn about Startup Showcase, our monthly leaderboard ranking system, and our mission to celebrate early-stage ventures worldwide.",
  path: "/about",
});

export default function AboutPage() {
  const pillars = [
    {
      icon: <Trophy className="w-6 h-6 text-amber-500" />,
      title: "Transparent Monthly Cohorts",
      desc: "Explore approved early-stage ideas and products. Community votes and visits highlight the most promising projects across the globe.",
    },
    {
      icon: <Target className="w-6 h-6 text-blue-600" />,
      title: "Global & Grassroots Impact",
      desc: "Spotlighting innovations tackling genuine challenges across agriculture, healthcare, clean tech, education, and frontier engineering.",
    },
    {
      icon: <Users className="w-6 h-6 text-emerald-600" />,
      title: "Early Adopter & Investor Feedback",
      desc: "Founders share their work directly with angels, mentors, and community testers who provide constructive discussions.",
    },
  ];

  const stages = [
    {
      name: "Idea Stage",
      badgeClass: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
      description:
        "Conceptual blueprint, market problem research, and architectural feasibility models seeking initial feedback and co-founders.",
    },
    {
      name: "Prototype",
      badgeClass: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
      description:
        "Working lab models, hardware breadboards, or alpha software builds validated with initial test subjects in controlled settings.",
    },
    {
      name: "MVP (Minimum Viable Product)",
      badgeClass: "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800",
      description:
        "Functional release deployed to early pilot users, demonstrating measurable retention, traction, or field efficacy.",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Hero */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-xs font-semibold">
          <Globe className="w-3.5 h-3.5" />
          <span>Our Mission</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Democratizing Early-Stage Discovery
        </h1>

        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
          Startup Showcase is a worldwide discovery and monthly-leaderboard platform built to spotlight early-stage ventures from any country, regardless of capital access.
        </p>
      </div>

      {/* Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {pillars.map((p) => (
          <div
            key={p.title}
            className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
              {p.icon}
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              {p.title}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {p.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Stages Explanation */}
      <div className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-8">
        <div className="max-w-2xl space-y-2">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Standardized Maturity Stages
          </h2>
          <p className="text-xs text-slate-500">
            Every submission is categorized by maturity so visitors and investors can evaluate progress transparently.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stages.map((stg) => (
            <div
              key={stg.name}
              className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-3"
            >
              <span
                className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${stg.badgeClass}`}
              >
                {stg.name}
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {stg.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-center space-y-5">
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Ready to showcase your company?
        </h2>
        <p className="text-xs sm:text-sm text-blue-100 max-w-lg mx-auto">
          Join thousands of founders launching their product into our global monthly cohorts.
        </p>
        <div>
          <Link
            href="/submit"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white text-blue-600 font-extrabold text-xs hover:bg-blue-50 transition-colors shadow-md"
          >
            <span>Submit a Startup</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
