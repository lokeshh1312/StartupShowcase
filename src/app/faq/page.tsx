import React from "react";
import Link from "next/link";
import { HelpCircle, ChevronRight, ArrowRight } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Frequently Asked Questions | Startup Showcase",
  description:
    "Everything you need to know about Startup Showcase, monthly leaderboard rankings, community voting, and submitting your project.",
};

const FAQ_SECTIONS = [
  {
    category: "For Explorers & Community",
    questions: [
      {
        q: "What is Startup Showcase and how does it work?",
        a: "Startup Showcase is a global startup discovery and monthly leaderboard platform. Early-stage founders from any country submit their prototypes, MVPs, and products. Visitors discover projects, vote for their favorites, bookmark startups, and leave constructive feedback.",
      },
      {
        q: "How does the monthly leaderboard ranking work?",
        a: "Approved startups are organized by launch cohort month. Rankings are ordered by total verified community votes, with tie-breaks decided by earliest approval timestamp and alphabetical order.",
      },
      {
        q: "How does voting work?",
        a: "To maintain leaderboard integrity, votes require an authenticated user account. Each user can vote once per startup. Votes can be toggled on or off at any time.",
      },
      {
        q: "Can I save startups to track their progress?",
        a: "Yes! Click the bookmark icon on any startup card or profile page. All your saved startups are saved to your account and accessible at any time under Saved Startups.",
      },
    ],
  },
  {
    category: "For Founders & Builders",
    questions: [
      {
        q: "How do I submit my startup?",
        a: "Sign in with a Founder account, click 'Submit Startup' in the top navigation, and fill out your startup details, product problem/solution, origin country, tech stack, and founder quote.",
      },
      {
        q: "Is submitting a startup free?",
        a: "Yes. Basic submissions and discovery listings are 100% free for all early-stage teams.",
      },
      {
        q: "What happens after I submit?",
        a: "Your startup enters our admin review queue. Our team reviews submissions to verify authentic prototypes and appropriate categorization before approving it for the public monthly leaderboard.",
      },
      {
        q: "Which countries can participate?",
        a: "Startup Showcase is completely global. Founders from any country can submit their projects and showcase local innovations to the world.",
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-xs font-semibold">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Knowledge Base</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Frequently Asked Questions
        </h1>

        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
          Answers to common questions about submitting, voting, monthly cohorts, and discovering global early-stage ventures.
        </p>
      </div>

      {/* Accordion List */}
      <div className="space-y-8">
        {FAQ_SECTIONS.map((section) => (
          <div key={section.category} className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {section.category}
            </h2>

            <div className="space-y-3">
              {section.questions.map((item, idx) => (
                <details
                  key={idx}
                  className="group rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 open:shadow-xs transition-all"
                >
                  <summary className="flex items-center justify-between gap-4 font-bold text-sm text-slate-900 dark:text-white cursor-pointer list-none">
                    <span>{item.q}</span>
                    <ChevronRight className="w-4 h-4 text-slate-400 transition-transform group-open:rotate-90 shrink-0" />
                  </summary>
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {item.a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Contact Support Box */}
      <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-center space-y-4">
        <h3 className="font-bold text-base text-slate-900 dark:text-white">
          Still have questions?
        </h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Need help with your submission or moderation status? Reach out to our team directly.
        </p>
        <Link
          href="/support"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors shadow-xs"
        >
          <span>Contact Support</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
