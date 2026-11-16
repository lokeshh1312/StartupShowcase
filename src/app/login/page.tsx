"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Lock, ArrowRight, ArrowLeft } from "lucide-react";
import { signInAction, resendVerificationAction } from "@/server/actions";
import { safeRedirectPath } from "@/lib/redirect";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { TurnstileWidget } from "@/components/common/turnstile";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = safeRedirectPath(searchParams.get("redirect"));
  const urlError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(urlError || "");
  const [isPending, startTransition] = useTransition();

  const [resendCountdown, setResendCountdown] = useState(0);
  const [resendPending, setResendPending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [resendError, setResendError] = useState("");
  const [resendTurnstileToken, setResendTurnstileToken] = useState("");
  const [resendResetSignal, setResendResetSignal] = useState(0);

  React.useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setTimeout(() => {
      setResendCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  const handleResend = async () => {
    const targetEmail = email.trim();
    if (!targetEmail || resendCountdown > 0 || resendPending) return;
    setResendError("");
    setResendMessage("");
    setResendPending(true);

    try {
      const res = await resendVerificationAction({
        email: targetEmail,
        captchaToken: resendTurnstileToken,
      });

      if (res?.error) {
        setResendError(res.error);
        setResendResetSignal((prev) => prev + 1);
        setResendTurnstileToken("");
      } else {
        setResendMessage(
          res?.message ||
            "If this email is registered and not yet verified, we've sent a new link."
        );
        setResendCountdown(60);
        setResendResetSignal((prev) => prev + 1);
        setResendTurnstileToken("");
      }
    } catch {
      setResendError("Something went wrong. Please try again.");
    } finally {
      setResendPending(false);
    }
  };

  React.useEffect(() => {
    const err = searchParams.get("error");
    if (err) {
      setError(err);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResendError("");
    setResendMessage("");

    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);

    startTransition(async () => {
      const res = await signInAction(formData);
      if (res?.error) {
        setError(res.error);
      } else {
        router.push(redirectTo);
        router.refresh();
      }
    });
  };

  return (
    <div className="relative isolate min-h-[85vh] flex items-center justify-center px-4 py-12">

      <div className="relative w-full max-w-md space-y-6 p-8 rounded-3xl bg-white/90 dark:bg-white/[0.03] border border-slate-200/90 dark:border-white/10 shadow-xs backdrop-blur-md">
        <div className="space-y-2 text-center">
          <h1 className="text-[30px] sm:text-[36px] font-semibold leading-[1.15] text-slate-900 dark:text-white tracking-tight">
            Welcome Back
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Sign in to vote, save startups, join discussions, or submit your company.
          </p>
        </div>

        {resendMessage && (
          <div
            role="status"
            className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 text-xs text-emerald-700 dark:text-emerald-300 font-medium"
          >
            {resendMessage}
          </div>
        )}

        {resendError && (
          <div
            role="alert"
            className="p-3.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60 text-xs text-rose-600 dark:text-rose-400 font-medium"
          >
            {resendError}
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60 text-xs text-rose-600 dark:text-rose-400 font-medium space-y-2">
            <div>{error}</div>
            {error.toLowerCase().includes("email not confirmed") && (
              <div className="pt-1 flex flex-col items-start gap-2">
                <TurnstileWidget
                  onVerify={(token) => setResendTurnstileToken(token)}
                  onExpire={() => setResendTurnstileToken("")}
                  resetSignal={resendResetSignal}
                />
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendPending || resendCountdown > 0 || !email.trim()}
                  className="text-xs font-semibold text-rose-700 dark:text-rose-300 underline hover:text-rose-800 dark:hover:text-rose-200 disabled:opacity-60 disabled:no-underline cursor-pointer disabled:cursor-not-allowed focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-rose-500 rounded-sm"
                >
                  {resendCountdown > 0
                    ? `Resend in ${resendCountdown}s`
                    : resendPending
                    ? "Sending..."
                    : "Resend verification email"}
                </button>
              </div>
            )}
          </div>
        )}

        {process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true" && (
          <div className="space-y-4">
            <GoogleSignInButton redirectPath={redirectTo} />
            <div className="flex items-center justify-center">
              <div className="flex-1 border-t border-slate-200/90 dark:border-white/10" />
              <span className="px-3 whitespace-nowrap text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">
                Or continue with email
              </span>
              <div className="flex-1 border-t border-slate-200/90 dark:border-white/10" />
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-brand-600 dark:text-brand-400 hover:underline focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500 rounded-sm"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative flex items-center">
              <Lock className="absolute left-3.5 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50/70 dark:bg-white/5 border border-slate-200/90 dark:border-white/10 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white dark:text-[#0e0d0d] font-medium text-xs transition-colors shadow-xs disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            {isPending ? (
              <span>Signing in...</span>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100 dark:border-white/5 text-center space-y-3">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Don&apos;t have an account?{" "}
            <Link
              href={
                redirectTo !== "/"
                  ? `/signup?redirect=${encodeURIComponent(redirectTo)}`
                  : "/signup"
              }
              className="font-medium text-brand-600 dark:text-brand-400 hover:underline focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500 rounded-sm"
            >
              Sign up
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
