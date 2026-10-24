"use client";

import React, { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { safeRedirectPath } from "@/lib/redirect";

interface GoogleSignInButtonProps {
  redirectPath?: string;
  label?: string;
  className?: string;
}

export function GoogleSignInButton({
  redirectPath = "/",
  label = "Continue with Google",
  className = "",
}: GoogleSignInButtonProps) {
  const isEnabled = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isEnabled) {
    return null;
  }

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError("");
      const supabase = createClient();

      const safePath = safeRedirectPath(redirectPath);
      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL ||
        (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");

      const redirectTo = `${siteUrl.replace(/\/+$/, "")}/auth/callback?redirect=${encodeURIComponent(safePath)}`;

      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to initiate Google sign in.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-2">
      {error && (
        <p className="text-xs text-red-500 text-center font-medium">{error}</p>
      )}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={loading}
        className={`w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors shadow-xs disabled:opacity-60 cursor-pointer ${className}`}
      >
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.04h3.88c2.27-2.09 3.66-5.17 3.66-9.14z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.04c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.13C3.27 21.37 7.33 24 12 24z"
          />
          <path
            fill="#FBBC05"
            d="M5.28 14.28c-.25-.72-.38-1.49-.38-2.28s.13-1.56.38-2.28V6.59H1.25C.45 8.19 0 9.99 0 12s.45 3.81 1.25 5.41l4.03-3.13z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.27 2.63 1.25 6.59l4.03 3.13c.95-2.83 3.6-4.97 6.72-4.97z"
          />
        </svg>
        <span>{loading ? "Connecting to Google..." : label}</span>
      </button>
    </div>
  );
}
