"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  Rocket,
  CheckCircle2,
  Sparkles,
  Globe,
  User,
  ArrowRight,
} from "lucide-react";
import { submitStartupAction } from "@/server/actions";
import { CATEGORIES, STAGES } from "@/lib/validation";

interface SubmitFormProps {
  countries: Array<{ code: string; name: string }>;
  userDisplayName?: string;
}

export function SubmitStartupForm({ countries, userDisplayName }: SubmitFormProps) {

  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [stage, setStage] = useState<string>(STAGES[0]);
  const [countryCode, setCountryCode] = useState<string>("US");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [remoteFirst, setRemoteFirst] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [demoVideoUrl, setDemoVideoUrl] = useState("");
  const [problemStatement, setProblemStatement] = useState("");
  const [solutionDescription, setSolutionDescription] = useState("");
  const [techStackInput, setTechStackInput] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [traction, setTraction] = useState("");
  const [founderName, setFounderName] = useState(userDisplayName || "");
  const [founderRole, setFounderRole] = useState("Founder & CEO");
  const [founderQuote, setFounderQuote] = useState("");

  const [error, setError] = useState("");
  const [submittedStartup, setSubmittedStartup] = useState<{
    id: string;
    name: string;
    slug: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const techStack = techStackInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const payload = {
      name,
      tagline,
      description,
      category,
      stage,
      countryCode,
      city: city || undefined,
      region: region || undefined,
      remoteFirst,
      websiteUrl: websiteUrl || undefined,
      demoVideoUrl: demoVideoUrl || undefined,
      problemStatement: problemStatement || undefined,
      solutionDescription: solutionDescription || undefined,
      techStack: techStack.length > 0 ? techStack : undefined,
      tags: tags.length > 0 ? tags : undefined,
      traction: traction || undefined,
      founder: {
        name: founderName || userDisplayName || "Founder",
        role: founderRole || "Founder",
        quote: founderQuote || "",
      },
    };

    startTransition(async () => {
      const res = await submitStartupAction(payload);
      if (res?.error) {
        setError(res.error);
      } else if (res?.startup) {
        setSubmittedStartup(res.startup);
      }
    });
  };

  if (submittedStartup) {
    return (
      <div className="max-w-xl mx-auto bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 sm:p-10 text-center space-y-6 shadow-xs animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Submission Received!
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            <strong className="text-slate-900 dark:text-white font-bold">{submittedStartup.name}</strong> has been submitted to the queue. An administrator will review your submission before it goes live on the global leaderboard.
          </p>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/me/submissions"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-500 transition-colors"
          >
            Track in My Submissions
          </Link>
          <button
            onClick={() => {
              setSubmittedStartup(null);
              setName("");
              setTagline("");
              setDescription("");
            }}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            Submit Another Startup
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-600 dark:text-red-400 font-medium">
          {error}
        </div>
      )}

      {/* 1. Basic Info */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <Rocket className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Startup Essentials
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Startup Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acme AI, TerraVolt"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Tagline (One-liner pitch) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              minLength={10}
              maxLength={160}
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="e.g. Autonomous irrigation networks powered by edge intelligence"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Detailed Description <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              minLength={20}
              maxLength={2000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what you are building, how it works, and why it matters..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Primary Category <span className="text-red-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Maturity Stage <span className="text-red-500">*</span>
            </label>
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              {STAGES.map((stg) => (
                <option key={stg} value={stg}>
                  {stg}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 2. Location & Geography */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Geography & Origin
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Country <span className="text-red-500">*</span>
            </label>
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              {countries.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              City (Optional)
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Berlin, Austin, Tokyo"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              State / Province / Region
            </label>
            <input
              type="text"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="e.g. Bavaria, California, Kanto"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="sm:col-span-3 flex items-center gap-2">
            <input
              type="checkbox"
              id="remoteFirst"
              checked={remoteFirst}
              onChange={(e) => setRemoteFirst(e.target.checked)}
              className="w-4 h-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <label
              htmlFor="remoteFirst"
              className="text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
            >
              This is a remote-first / distributed startup
            </label>
          </div>
        </div>
      </div>

      {/* 3. Links & Deep Dive */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Links & Product Details
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Website URL
            </label>
            <input
              type="text"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Demo Video URL (YouTube / Vimeo / Loom)
            </label>
            <input
              type="text"
              value={demoVideoUrl}
              onChange={(e) => setDemoVideoUrl(e.target.value)}
              placeholder="https://youtu.be/..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Problem Statement
            </label>
            <textarea
              rows={2}
              maxLength={1000}
              value={problemStatement}
              onChange={(e) => setProblemStatement(e.target.value)}
              placeholder="What specific friction or challenge are your users dealing with?"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Solution Description
            </label>
            <textarea
              rows={2}
              maxLength={1000}
              value={solutionDescription}
              onChange={(e) => setSolutionDescription(e.target.value)}
              placeholder="How does your technology solve this uniquely?"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Technologies / Tech Stack (Comma-separated)
            </label>
            <input
              type="text"
              value={techStackInput}
              onChange={(e) => setTechStackInput(e.target.value)}
              placeholder="e.g. Next.js, PyTorch, Supabase, Rust"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Keywords / Tags (Comma-separated)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. B2B, SaaS, GenAI, Climate"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Current Traction / Milestones (Optional)
            </label>
            <input
              type="text"
              maxLength={500}
              value={traction}
              onChange={(e) => setTraction(e.target.value)}
              placeholder="e.g. 500 active beta testers, $12k ARR, closed $100k pre-seed"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* 4. Founder Profile */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Founder Details
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Founder Name
            </label>
            <input
              type="text"
              value={founderName}
              onChange={(e) => setFounderName(e.target.value)}
              placeholder="e.g. Sarah Connor"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Founder Role / Title
            </label>
            <input
              type="text"
              value={founderRole}
              onChange={(e) => setFounderRole(e.target.value)}
              placeholder="e.g. Co-Founder & CTO"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Founder Vision / Quote (Optional)
            </label>
            <input
              type="text"
              maxLength={500}
              value={founderQuote}
              onChange={(e) => setFounderQuote(e.target.value)}
              placeholder="e.g. We are building the operating system for zero-emission transit."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex items-center justify-end gap-4">
        <button
          type="submit"
          disabled={isPending}
          className="px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-60 flex items-center gap-2"
        >
          {isPending ? (
            <span>Submitting to Queue...</span>
          ) : (
            <>
              <span>Submit Startup</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
