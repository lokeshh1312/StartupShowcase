"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Lock, User, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { signUpAction } from "@/server/actions";
import { safeRedirectPath } from "@/lib/redirect";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { TurnstileWidget } from "@/components/common/turnstile";
import { CloudBackground } from "@/components/ui/cloud-background";

export default function SignUpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = safeRedirectPath(searchParams.get("redirect"));

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("founder");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileResetSignal, setTurnstileResetSignal] = useState(0);
  const [error, setError] = useState("");
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessNotice(null);

    if (password.length < 10) {
      setError("Password must be at least 10 characters long.");
      setTurnstileToken("");
      setTurnstileResetSignal((prev) => prev + 1);
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("password", password);
    formData.append("role", role);
    formData.append("captchaToken", turnstileToken);

    startTransition(async () => {
      const res = await signUpAction(formData);
      if (res?.error) {
        setError(res.error);
        setTurnstileToken("");
        setTurnstileResetSignal((prev) => prev + 1);
      } else if (res?.needsConfirmation) {
        setSuccessNotice(res.email || email);
      } else {
        router.push(redirectTo);
        router.refresh();
      }
    });
  };

  return (
    <div className="relative isolate min-h-[85vh] flex items-center justify-center px-4 py-12">
      <CloudBackground height="h-[340px] sm:h-[400px]" />

      <div className="relative w-full max-w-md space-y-6 p-8 rounded-3xl bg-white/90 dark:bg-white/[0.03] border border-slate-200/90 dark:border-white/10 shadow-xs backdrop-blur-md">
        <div className="space-y-2 text-center">
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-semibold tracking-widest uppercase border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-white/5 text-slate-700 dark:text-slate-300 shadow-2xs dark:shadow-none">
              <span>Join the Showcase</span>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Create an{" "}
            <em className="font-serif-italic font-normal text-brand-600 dark:text-brand-400 not-italic-fallback">
              Account
            </em>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Join the global showcase to launch, vote, and explore early-stage innovations.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60 text-xs text-rose-600 dark:text-rose-400 font-medium">
            {error}
          </div>
        )}

        {process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true" && (
          <div className="space-y-4">
            <GoogleSignInButton redirectPath={redirectTo} />
            <div className="flex items-center justify-center">
              <div className="flex-1 border-t border-slate-200/90 dark:border-white/10" />
              <span className="px-3 whitespace-nowrap text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">
                Or register with email
              </span>
              <div className="flex-1 border-t border-slate-200/90 dark:border-white/10" />
            </div>
          </div>
        )}

        {successNotice ? (
          <div className="p-6 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Check your inbox
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              We sent a confirmation link to{" "}
              <span className="font-semibold text-slate-900 dark:text-white">{successNotice}</span>.
              Please verify your email to activate your account and start submitting.
            </p>
            <div className="pt-2">
              <Link
                href={
                  redirectTo !== "/"
                    ? `/login?redirect=${encodeURIComponent(redirectTo)}`
                    : "/login"
                }
                className="inline-block px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-500 transition-colors shadow-xs cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                Go to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Full Name
              </label>
              <div className="relative flex items-center">
                <User className="absolute left-3.5 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ada Lovelace"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50/70 dark:bg-white/5 border border-slate-200/90 dark:border-white/10 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Email Address
              </label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3.5 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="founder@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50/70 dark:bg-white/5 border border-slate-200/90 dark:border-white/10 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Password
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                <input
                  type="password"
                  required
                  minLength={10}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 10 characters"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50/70 dark:bg-white/5 border border-slate-200/90 dark:border-white/10 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-colors"
                />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Must be at least 10 characters.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                I am joining as:
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50/70 dark:bg-white/5 border border-slate-200/90 dark:border-white/10 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-colors"
              >
                <option value="founder">Founder / Builder (Submit startups)</option>
                <option value="investor">Investor / Angel / Mentor</option>
                <option value="community">Community Member / Early Adopter</option>
              </select>
            </div>

            <div className="flex justify-center pt-2">
              <TurnstileWidget
                onVerify={(token) => setTurnstileToken(token)}
                onExpire={() => setTurnstileToken("")}
                resetSignal={turnstileResetSignal}
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs transition-colors shadow-xs disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              {isPending ? (
                <span>Creating Account...</span>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        )}

        <div className="pt-4 border-t border-slate-100 dark:border-white/5 text-center space-y-3">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Already have an account?{" "}
            <Link
              href={
                redirectTo !== "/"
                  ? `/login?redirect=${encodeURIComponent(redirectTo)}`
                  : "/login"
              }
              className="font-bold text-brand-600 dark:text-brand-400 hover:underline focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500 rounded-sm"
            >
              Sign in
            </Link>
          </p>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500 rounded-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Showcase</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
