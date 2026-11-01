import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, Rocket, ArrowLeft } from "lucide-react";
import { getUserPublicProfile } from "@/server/startups";
import { StartupCard } from "@/components/startup/startup-card";
import { CloudBackground } from "@/components/ui/cloud-background";
import type { Metadata } from "next";

interface UserProfilePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: UserProfilePageProps): Promise<Metadata> {
  const { id } = await params;
  const data = await getUserPublicProfile(id);
  if (!data) {
    return {
      title: "User Not Found | Startup Showcase",
    };
  }
  return {
    title: `${data.profile.displayName} | Startup Showcase`,
    description: `Public profile and startups launched by ${data.profile.displayName}.`,
  };
}

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  const { id } = await params;
  const data = await getUserPublicProfile(id);

  if (!data) {
    notFound();
  }

  const { profile, startups } = data;

  return (
    <div className="relative isolate min-h-screen">
      <CloudBackground height="h-[340px] sm:h-[400px]" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        {/* Back link */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Discovery</span>
          </Link>
        </div>

        {/* Header Profile Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white/90 dark:bg-white/[0.03] border border-slate-200/90 dark:border-white/10 shadow-xs backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 border border-brand-200/60 dark:border-brand-900/40 font-extrabold text-2xl flex items-center justify-center shrink-0 shadow-xs">
              {profile.displayName?.charAt(0) || "U"}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {profile.displayName}
                </h1>
                <span className="capitalize px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-50 dark:bg-brand-950/40 border border-brand-200/60 dark:border-brand-900/40 text-brand-700 dark:text-brand-300">
                  {profile.role}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  Member since{" "}
                  {new Date(profile.createdAt).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-50/80 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 px-3.5 py-2 rounded-xl shadow-2xs">
            <Rocket className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <span>{startups.length} {startups.length === 1 ? "startup" : "startups"} launched</span>
          </div>
        </div>

        {/* Startups section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Launched Ventures
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {startups.length} {startups.length === 1 ? "project" : "projects"}
            </span>
          </div>

          {startups.length === 0 ? (
            <div className="p-12 rounded-3xl bg-white/90 dark:bg-white/[0.03] border border-slate-200/90 dark:border-white/10 text-center text-xs text-slate-500 dark:text-slate-400 shadow-xs">
              This member has not launched any approved startups yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {startups.map((startup) => (
                <StartupCard
                  key={startup.id}
                  startup={{
                    ...startup,
                    views: startup.viewsCount,
                    likes: 0,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
