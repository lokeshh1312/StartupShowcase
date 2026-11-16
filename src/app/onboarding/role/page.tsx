import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/supabase/server";
import { safeRedirectPath } from "@/lib/redirect";
import { RoleForm } from "./role-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Welcome! Choose Your Role | Startup Showcase",
  description: "Welcome! How will you use Startup Showcase?",
};

interface OnboardingRolePageProps {
  searchParams: Promise<{ redirect?: string }>;
}

export default async function OnboardingRolePage({
  searchParams,
}: OnboardingRolePageProps) {
  const authData = await getCurrentUserProfile();

  if (!authData) {
    redirect("/login");
  }

  const { profile } = authData;

  // If already chosen or not a community user, redirect home
  if (profile.roleChosenAt || profile.role !== "community") {
    redirect("/");
  }

  const resolvedParams = await searchParams;
  const targetRedirect = safeRedirectPath(resolvedParams.redirect || "/");

  return (
    <div className="relative isolate min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="relative w-full max-w-md space-y-6 p-8 rounded-3xl bg-white/90 dark:bg-white/[0.03] border border-slate-200/90 dark:border-white/10 shadow-xs backdrop-blur-md">
        <div className="space-y-2 text-center">
          <h1 className="text-[28px] sm:text-[32px] font-semibold leading-[1.2] text-slate-900 dark:text-white tracking-tight">
            Welcome! How will you use Startup Showcase?
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Choose your account role to tailor your experience. You can change your profile anytime later.
          </p>
        </div>

        <RoleForm targetRedirect={targetRedirect} />
      </div>
    </div>
  );
}
