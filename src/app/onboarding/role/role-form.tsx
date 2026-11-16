"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import {
  chooseInitialRoleAction,
  chooseCommunityRoleAction,
} from "@/server/actions";
import { safeRedirectPath } from "@/lib/redirect";

type RoleOption = "founder" | "investor" | "community";

interface RoleFormProps {
  targetRedirect?: string;
}

const ROLES: Array<{
  id: RoleOption;
  label: string;
  description: string;
}> = [
  {
    id: "founder",
    label: "Founder / Builder (Submit startups)",
    description: "Submit startups, track launch performance, and connect with early adopters.",
  },
  {
    id: "investor",
    label: "Investor / Angel / Mentor",
    description: "Discover promising early-stage companies and connect with founders worldwide.",
  },
  {
    id: "community",
    label: "Community Member / Early Adopter",
    description: "Explore top product launches, cast votes, save favorites, and join discussions.",
  },
];

export function RoleForm({ targetRedirect = "/" }: RoleFormProps) {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<RoleOption>("founder");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    startTransition(async () => {
      const res =
        selectedRole === "community"
          ? await chooseCommunityRoleAction()
          : await chooseInitialRoleAction(selectedRole);

      if (res?.error) {
        setError(res.error);
      } else {
        const destination = safeRedirectPath(targetRedirect || "/");
        router.push(destination);
        router.refresh();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div
          role="alert"
          className="p-3.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60 text-xs text-rose-600 dark:text-rose-400 font-medium"
        >
          {error}
        </div>
      )}

      <fieldset className="space-y-3">
        <legend className="sr-only">Choose your account role</legend>
        {ROLES.map((role) => {
          const isSelected = selectedRole === role.id;
          return (
            <label
              key={role.id}
              htmlFor={`role-${role.id}`}
              className={`flex items-start gap-3.5 p-4 rounded-2xl border cursor-pointer transition-all ${
                isSelected
                  ? "border-brand-500 bg-brand-500/5 dark:bg-brand-500/10 ring-1 ring-brand-500"
                  : "border-slate-200/90 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] hover:border-slate-300 dark:hover:border-white/20"
              }`}
            >
              <input
                type="radio"
                id={`role-${role.id}`}
                name="role"
                value={role.id}
                checked={isSelected}
                onChange={() => setSelectedRole(role.id)}
                className="mt-1 h-4 w-4 text-brand-600 focus:ring-brand-500 border-slate-300 dark:border-white/20 cursor-pointer"
              />
              <div className="space-y-0.5 select-none">
                <span className="text-sm font-semibold text-slate-900 dark:text-white block">
                  {role.label}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 block leading-relaxed">
                  {role.description}
                </span>
              </div>
            </label>
          );
        })}
      </fieldset>

      <button
        type="submit"
        disabled={isPending}
        className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white dark:text-[#0e0d0d] font-medium text-xs transition-colors shadow-xs disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500"
      >
        {isPending ? (
          <span>Saving...</span>
        ) : (
          <>
            <span>Continue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </>
        )}
      </button>
    </form>
  );
}
